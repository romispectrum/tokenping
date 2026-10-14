import "server-only";
import type { Address } from "viem";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { sendEmail } from "~~/services/email/sendEmail";
import { type EnabledConfigRow, findEnabledConfigs } from "~~/services/notifications/configRepository";
import { type Delivery, redactRecipients, shortenAddress } from "~~/services/notifications/redact";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { type TelegramSendErrorCode, sendTelegramMessage } from "~~/services/telegram/sendTelegram";
import { deleteLinkByChatId, getChatIdsByUser } from "~~/services/telegram/telegramLinks";
import type { NotificationService } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";
import { getErrorMessage } from "~~/utils/errors";
import { formatUtcTimestamp } from "~~/utils/format";
import { isBelowThreshold } from "~~/utils/healthFactor";
import { normalizeThreshold } from "~~/utils/notifications/threshold";

export type NotificationCheckResult = {
  success: true;
  /** Response contract: keeps its CONSTANT_CASE key. */
  CRON_INTERVAL_MINUTES: number;
  configsChecked: number;
  emailsSent: number;
  signalSent: number;
  telegramSent: number;
  /** Recipients are masked and wallets shortened; the full detail is only logged. */
  errors?: string[];
};

type Alert = { chainName: string; healthFactor: string; threshold: number; timestamp: string };

type AlertMessage = { text: string; subject: string; html: string };

type AlertSender = (
  recipient: string,
  message: AlertMessage,
) => Promise<{ success: true } | { success: false; error: string; code?: TelegramSendErrorCode }>;

/** The chat is gone for good: the link is deleted so the cron stops failing on it every run. */
const DEAD_CHAT_CODES: readonly TelegramSendErrorCode[] = ["bot_blocked", "chat_not_found"];

export const buildAlertText = ({ chainName, healthFactor, threshold, timestamp }: Alert) =>
  `Your Aave Health Factor on ${chainName} is ${healthFactor}, ` +
  `which is below your threshold of ${threshold}. ` +
  `Consider adding collateral or repaying debt to avoid liquidation.\n\nSent at: ${timestamp}`;

/** The html footer says "Created at" where the text says "Sent at". */
export const buildAlertEmail = ({ chainName, healthFactor, threshold, timestamp }: Alert) => ({
  subject: `Aave Health Factor Alert – ${chainName}`,
  html:
    `<p>Your Aave Health Factor on <strong>${chainName}</strong> is ` +
    `<strong>${healthFactor}</strong>, which is below your threshold of ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Consider adding collateral or repaying debt to avoid liquidation.</p>` +
    `<p><small>Created at: ${timestamp}</small></p>`,
});

/**
 * The channels a config can deliver to right now, in send order (email, Signal, Telegram), with trimmed recipients.
 * `chatIdsByUser` is keyed by normalized user id, so legacy checksummed rows still find their Telegram link.
 */
export const getDeliverableChannels = (row: EnabledConfigRow, chatIdsByUser: Map<string, string>): Delivery[] => {
  const { services } = row;
  if (!Array.isArray(services)) return [];

  const deliveries: Delivery[] = [];
  const email = row.email?.trim();
  if (services.includes("email") && email) deliveries.push({ channel: "email", recipient: email });
  const signalRecipient = row.signal_recipient?.trim();
  if (services.includes("signal") && signalRecipient)
    deliveries.push({ channel: "signal", recipient: signalRecipient });
  const chatId = chatIdsByUser.get(normalizeAddress(row.user_id));
  if (services.includes("telegram") && chatId?.trim()) deliveries.push({ channel: "telegram", recipient: chatId });
  return deliveries;
};

const ALERT_SENDERS: Record<NotificationService, AlertSender> = {
  email: (to, { subject, text, html }) => sendEmail({ to, subject, text, html }),
  signal: (to, { text }) => sendSignalMessage({ to, message: text }),
  telegram: (chatId, { text }) => sendTelegramMessage({ chatId, message: text }),
};

/**
 * One cron pass: loads the enabled configs, reads each wallet's Aave health factor on the config's chain and, when
 * it is below the threshold, alerts every deliverable channel. Configs are processed one after another, and a
 * failing config is recorded in `errors` without stopping the others.
 */
export async function runNotificationCheck(): Promise<NotificationCheckResult | { success: false; error: string }> {
  try {
    const { data: rows, error } = await findEnabledConfigs();
    if (error) {
      return { success: false, error: error.message };
    }

    const errors: string[] = [];
    /** Logs the full detail; the response gets it with the wallet shortened and the recipients masked. */
    const recordError = (
      detail: string,
      { wallet, deliveries = [] }: { wallet?: string; deliveries?: readonly Delivery[] } = {},
    ) => {
      const shortened = wallet ? detail.split(wallet).join(shortenAddress(wallet)) : detail;
      errors.push(redactRecipients(shortened, deliveries));
      console.error(`Notification check: ${detail}`);
    };

    const { chatIdsByUser, error: linksError } = await getChatIdsByUser();
    if (linksError) {
      recordError(`telegram: links query failed, Telegram alerts skipped this run: ${linksError.message}`);
    }

    const configs = rows.filter(row => getDeliverableChannels(row, chatIdsByUser).length > 0);
    const sent: Record<NotificationService, number> = { email: 0, signal: 0, telegram: 0 };

    for (const config of configs) {
      const { user_id: userId, chain_id: chainId } = config;
      // Computed per config: a dead Telegram chat removed below is skipped for the user's remaining configs.
      const deliveries = getDeliverableChannels(config, chatIdsByUser);

      try {
        const threshold = normalizeThreshold(config.health_factor_threshold);

        const reading = await getHealthFactorForWallet(userId as Address, chainId);
        if (!reading) {
          recordError(`healthFactor:${userId}:${chainId}: could not read the health factor`, { wallet: userId });
          continue;
        }
        if (!isBelowThreshold(reading.healthFactor, threshold)) continue;

        const alert = { ...reading, threshold, timestamp: formatUtcTimestamp(new Date()) };
        const message = { text: buildAlertText(alert), ...buildAlertEmail(alert) };

        for (const delivery of deliveries) {
          const { channel, recipient } = delivery;
          const result = await ALERT_SENDERS[channel](recipient, message);
          if (result.success) {
            sent[channel]++;
            continue;
          }

          recordError(`${channel}:${recipient}: ${result.error}`, { deliveries: [delivery] });
          if (channel === "telegram" && result.code && DEAD_CHAT_CODES.includes(result.code)) {
            // The user can re-link from the UI.
            const deleteError = await deleteLinkByChatId(recipient);
            if (deleteError) {
              console.error(`Notification check: could not remove the dead Telegram link ${recipient}`, deleteError);
            }
            chatIdsByUser.delete(normalizeAddress(userId));
          }
        }
      } catch (e) {
        recordError(`config:${userId}:${chainId}: ${getErrorMessage(e)}`, { wallet: userId, deliveries });
      }
    }

    return {
      success: true,
      CRON_INTERVAL_MINUTES: NOTIFICATION_CHECK_INTERVAL_MINUTES,
      configsChecked: configs.length,
      emailsSent: sent.email,
      signalSent: sent.signal,
      telegramSent: sent.telegram,
      ...(errors.length > 0 && { errors }),
    };
  } catch (e) {
    return { success: false, error: getErrorMessage(e) };
  }
}
