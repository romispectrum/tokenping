import "server-only";
import type { Address } from "viem";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD, NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { sendEmail } from "~~/services/email/sendEmail";
import { type EnabledConfigRow, findEnabledConfigs } from "~~/services/notifications/configRepository";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { type TelegramSendErrorCode, sendTelegramMessage } from "~~/services/telegram/sendTelegram";
import { deleteLinkByChatId, getChatIdsByUser } from "~~/services/telegram/telegramLinks";
import type { NotificationService } from "~~/types/notifications";
import { getErrorMessage } from "~~/utils/errors";
import { formatUtcTimestamp } from "~~/utils/format";
import { isBelowThreshold } from "~~/utils/healthFactor";

export type NotificationCheckResult = {
  success: true;
  /** Response contract: keeps its CONSTANT_CASE key. */
  CRON_INTERVAL_MINUTES: number;
  configsChecked: number;
  emailsSent: number;
  signalSent: number;
  telegramSent: number;
  errors?: string[];
};

type Alert = { chainName: string; healthFactor: string; threshold: number; timestamp: string };

type AlertMessage = { text: string; subject: string; html: string };

type Delivery = { channel: NotificationService; recipient: string };

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
 * BUG(B3.13): `chatIdsByUser` holds lowercased user ids but is looked up with the raw config user_id, so legacy
 * checksummed rows never get Telegram alerts.
 * BUG(unlisted): Telegram counts once the user has a link, even with an empty chat id, which is never sent to.
 */
export const getDeliverableChannels = (row: EnabledConfigRow, chatIdsByUser: Map<string, string>): Delivery[] => {
  const { services } = row;
  if (!Array.isArray(services)) return [];

  const deliveries: Delivery[] = [];
  if (services.includes("email") && row.email?.trim()) {
    deliveries.push({ channel: "email", recipient: String(row.email).trim() });
  }
  if (services.includes("signal") && row.signal_recipient?.trim()) {
    deliveries.push({ channel: "signal", recipient: String(row.signal_recipient).trim() });
  }
  const chatId = chatIdsByUser.get(String(row.user_id));
  if (services.includes("telegram") && chatId !== undefined) {
    deliveries.push({ channel: "telegram", recipient: chatId });
  }
  return deliveries;
};

const ALERT_SENDERS: Record<NotificationService, AlertSender> = {
  email: (to, { subject, text, html }) => sendEmail({ to, subject, text, html }),
  signal: (to, { text }) => sendSignalMessage({ to, message: text }),
  telegram: (chatId, { text }) => sendTelegramMessage({ chatId, message: text }),
};

/**
 * One cron pass: loads the enabled configs, reads each wallet's Aave health factor on the config's chain and, when
 * it is below the threshold, alerts every deliverable channel. Configs are processed one after another.
 */
export async function runNotificationCheck(): Promise<NotificationCheckResult | { success: false; error: string }> {
  try {
    const { data: rows, error } = await findEnabledConfigs();
    if (error) {
      return { success: false, error: error.message };
    }

    const chatIdsByUser = await getChatIdsByUser();
    const configs = (rows ?? []).filter(row => getDeliverableChannels(row, chatIdsByUser).length > 0);

    const sent: Record<NotificationService, number> = { email: 0, signal: 0, telegram: 0 };
    const errors: string[] = [];

    for (const config of configs) {
      // BUG(B3.12): a falsy threshold (0, null, unparseable) silently becomes the default.
      const threshold = Number(config.health_factor_threshold) || DEFAULT_HEALTH_FACTOR_THRESHOLD;

      // BUG(B3.12): a failed read (null) is skipped without an errors[] entry.
      const reading = await getHealthFactorForWallet(config.user_id as Address, config.chain_id);
      if (!reading || !isBelowThreshold(reading.healthFactor, threshold)) continue;

      const alert = { ...reading, threshold, timestamp: formatUtcTimestamp(new Date()) };
      const message = { text: buildAlertText(alert), ...buildAlertEmail(alert) };

      // Recomputed per config: a dead Telegram chat removed below is skipped for the user's remaining configs.
      for (const { channel, recipient } of getDeliverableChannels(config, chatIdsByUser)) {
        // Only an empty Telegram chat id gets here; it is skipped without an errors[] entry.
        if (!recipient) continue;

        const result = await ALERT_SENDERS[channel](recipient, message);
        if (result.success) {
          sent[channel]++;
          continue;
        }

        errors.push(`${channel}:${recipient}: ${result.error}`);
        if (channel === "telegram" && result.code && DEAD_CHAT_CODES.includes(result.code)) {
          // The user can re-link from the UI.
          await deleteLinkByChatId(recipient);
          chatIdsByUser.delete(String(config.user_id));
        }
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
