import "server-only";
import type { Address } from "viem";
import { V3_MARKET_ID, marketKey } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { formatDecimal } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { NOTIFICATION_MESSAGES } from "~~/i18n/messages/notifications";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";
import { sendEmail } from "~~/services/email/sendEmail";
import {
  type EnabledConfigRow,
  findEnabledConfigs,
  rowChannelLocale,
  rowMarket,
  rowProtocol,
} from "~~/services/notifications/configRepository";
import { type Delivery, redactRecipients, shortenAddress } from "~~/services/notifications/redact";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { type TelegramSendErrorCode, sendTelegramMessage } from "~~/services/telegram/sendTelegram";
import { deleteTelegramChat, getChatIdsByUsername } from "~~/services/telegram/telegramChats";
import type { NotificationService } from "~~/types/notifications";
import { getErrorMessage } from "~~/utils/errors";
import { formatUtcTimestamp } from "~~/utils/format";
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

/** The alert's text (Signal, Telegram and the email's plain part) in `locale`, English by default. */
export const buildAlertText = ({ chainName, healthFactor, threshold, timestamp }: Alert, locale: Locale = "en") =>
  NOTIFICATION_MESSAGES[locale].alertText({
    chainName,
    healthFactor: formatDecimal(locale, healthFactor),
    threshold: formatDecimal(locale, threshold),
    timestamp,
  });

/** The alert email's subject and html in `locale`, English by default. */
export const buildAlertEmail = ({ chainName, healthFactor, threshold, timestamp }: Alert, locale: Locale = "en") => {
  const t = NOTIFICATION_MESSAGES[locale];
  return {
    subject: t.alertSubject(chainName),
    html: t.alertHtml({
      chainName,
      healthFactor: formatDecimal(locale, healthFactor),
      threshold: formatDecimal(locale, threshold),
      timestamp,
    }),
  };
};

/**
 * The channels a config can deliver to right now, in send order (email, Signal, Telegram), with trimmed recipients.
 * Telegram goes to the chat its username pressed Start in (`chatIdsByUsername`); a username that has not pressed
 * Start yet has no chat, so Telegram is skipped for it until it does.
 */
export const getDeliverableChannels = (row: EnabledConfigRow, chatIdsByUsername: Map<string, string>): Delivery[] => {
  const { services } = row;
  if (!Array.isArray(services)) return [];

  const deliveries: Delivery[] = [];
  const email = row.email?.trim();
  if (services.includes("email") && email) deliveries.push({ channel: "email", recipient: email });
  const signalRecipient = row.signal_recipient?.trim();
  if (services.includes("signal") && signalRecipient)
    deliveries.push({ channel: "signal", recipient: signalRecipient });
  const telegramUsername = row.telegram_username?.trim();
  const chatId = telegramUsername ? chatIdsByUsername.get(telegramUsername) : undefined;
  if (services.includes("telegram") && chatId?.trim()) deliveries.push({ channel: "telegram", recipient: chatId });
  return deliveries;
};

/** How each channel sends a message; also used by the test messages (app/api/notifications/test). */
export const ALERT_SENDERS: Record<NotificationService, AlertSender> = {
  email: (to, { subject, text, html }) => sendEmail({ to, subject, text, html }),
  signal: (to, { text }) => sendSignalMessage({ to, message: text }),
  telegram: (chatId, { text }) => sendTelegramMessage({ chatId, message: text }),
};

/**
 * One cron pass: loads the enabled configs, reads each wallet's Aave health factor in the config's market (the
 * chain's V3 Pool or a V4 Spoke) and, when
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

    const { chatIdsByUsername, error: chatsError } = await getChatIdsByUsername();
    if (chatsError) {
      recordError(`telegram: chats query failed, Telegram alerts skipped this run: ${chatsError.message}`);
    }

    // Aave only: a Morpho market id read as an Aave market would check another position.
    const configs = rows.filter(
      row => rowProtocol(row) === "aave" && getDeliverableChannels(row, chatIdsByUsername).length > 0,
    );
    const sent: Record<NotificationService, number> = { email: 0, signal: 0, telegram: 0 };

    for (const config of configs) {
      const { user_id: userId, chain_id: chainId } = config;
      const market = rowMarket(config);
      // How errors name the market: the chain id for V3, as before V4, else "chain:spoke".
      const marketId = market === V3_MARKET_ID ? String(chainId) : marketKey(chainId, market);
      // Computed per config: a dead Telegram chat removed below is skipped for every later config that names it.
      const deliveries = getDeliverableChannels(config, chatIdsByUsername);

      try {
        const threshold = normalizeThreshold(config.health_factor_threshold);

        const reading = await getHealthFactorForWallet(userId as Address, chainId, market);
        if (!reading) {
          recordError(`healthFactor:${userId}:${marketId}: could not read the health factor`, { wallet: userId });
          continue;
        }
        // Compared exactly, not as the rounded display value (1.4996 must alert against a 1.5 threshold).
        if (!(reading.healthFactorValue < threshold)) continue;

        // Each channel in its own language (the config's when it has none), each language built once.
        const now = new Date();
        const buildMessage = (locale: Locale): AlertMessage => {
          const alert = { ...reading, threshold, timestamp: formatUtcTimestamp(now, locale) };
          return { text: buildAlertText(alert, locale), ...buildAlertEmail(alert, locale) };
        };
        const messages: Partial<Record<Locale, AlertMessage>> = {};

        for (const delivery of deliveries) {
          const { channel, recipient } = delivery;
          const locale = rowChannelLocale(config, channel);
          const result = await ALERT_SENDERS[channel](recipient, (messages[locale] ??= buildMessage(locale)));
          if (result.success) {
            sent[channel]++;
            continue;
          }

          recordError(`${channel}:${recipient}: ${result.error}`, { deliveries: [delivery] });
          if (channel === "telegram" && result.code && DEAD_CHAT_CODES.includes(result.code)) {
            // Its owner gets alerts again by sending /start to the bot.
            const deleteError = await deleteTelegramChat(recipient);
            if (deleteError) {
              console.error(`Notification check: could not remove the dead Telegram chat ${recipient}`, deleteError);
            }
            for (const [username, chatId] of chatIdsByUsername) {
              if (chatId === recipient) chatIdsByUsername.delete(username);
            }
          }
        }
      } catch (e) {
        recordError(`config:${userId}:${marketId}: ${getErrorMessage(e)}`, { wallet: userId, deliveries });
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
