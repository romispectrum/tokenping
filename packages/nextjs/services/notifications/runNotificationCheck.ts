import "server-only";
import type { Address } from "viem";
import { V3_MARKET_ID, marketKey } from "~~/config/aaveConfig";
import { isMorphoProtocol, marketRefKey } from "~~/config/protocols";
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
import { claimMaturityReminder, releaseMaturityReminder } from "~~/services/notifications/maturityReminders";
import {
  type MorphoAlert,
  TIMED_OUT,
  morphoNotices,
  readMorphoPositions,
  toMorphoAlert,
} from "~~/services/notifications/morphoAlerts";
import { buildMaturityMessage, buildMorphoAlert } from "~~/services/notifications/morphoMessages";
import { type Delivery, redactRecipients, shortenAddress } from "~~/services/notifications/redact";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { type TelegramSendErrorCode, sendTelegramMessage } from "~~/services/telegram/sendTelegram";
import { deleteTelegramChat, getChatIdsByUsername } from "~~/services/telegram/telegramChats";
import type { NotificationService } from "~~/types/notifications";
import { getErrorMessage } from "~~/utils/errors";
import { formatUtcTimestamp } from "~~/utils/format";
import { MORPHO_THRESHOLD_RANGE, normalizeThreshold } from "~~/utils/notifications/threshold";

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

/**
 * How long one run may spend reading Morpho positions, all chains together. A position not read by then is recorded
 * in `errors` and read on the next run, so a slow chain cannot hold up the Aave alerts that follow.
 */
export const MORPHO_READ_BUDGET_MS = 20_000;

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
 * One cron pass: loads the enabled configs and alerts every deliverable channel of each one that calls for it. Morpho
 * configs come first: their positions are read together (readMorphoPositions), then each reading is acted on (a health
 * alert, a Midnight maturity reminder or alert). Then each Aave config, one after another: the wallet's health factor
 * in the config's market (the chain's V3 Pool or a V4 Spoke), alerted when below the threshold. A failing config is
 * recorded in `errors` without stopping the others; a protocol this version does not know is left alone.
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

    const configs = rows.filter(
      row => rowProtocol(row) !== null && getDeliverableChannels(row, chatIdsByUsername).length > 0,
    );
    const sent: Record<NotificationService, number> = { email: 0, signal: 0, telegram: 0 };

    /**
     * Sends the message on each delivery, in the channel's own language (the config's when it has none), each language
     * built once. Returns how many channels it reached.
     */
    const deliver = async (
      config: EnabledConfigRow,
      deliveries: readonly Delivery[],
      buildMessage: (locale: Locale) => AlertMessage,
    ) => {
      const messages: Partial<Record<Locale, AlertMessage>> = {};
      let delivered = 0;
      for (const delivery of deliveries) {
        const { channel, recipient } = delivery;
        const locale = rowChannelLocale(config, channel);
        const result = await ALERT_SENDERS[channel](recipient, (messages[locale] ??= buildMessage(locale)));
        if (result.success) {
          sent[channel]++;
          delivered++;
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
      return delivered;
    };

    const morphoAlerts: MorphoAlert<EnabledConfigRow>[] = [];
    for (const config of configs.filter(row => isMorphoProtocol(rowProtocol(row)))) {
      const alert = toMorphoAlert(config);
      if (alert) morphoAlerts.push(alert);
      else {
        const { user_id: userId, protocol, chain_id: chainId, market } = config;
        recordError(`config:${userId}:${protocol}:${chainId}:${market}: unreadable Morpho alert`, { wallet: userId });
      }
    }
    const readings = await readMorphoPositions(morphoAlerts, Date.now() + MORPHO_READ_BUDGET_MS);

    for (const [index, { row: config, protocol, chain, marketId: market, params }] of morphoAlerts.entries()) {
      const { user_id: userId, chain_id: chainId } = config;
      const marketId = marketRefKey({ protocol, chainId, market });
      const deliveries = getDeliverableChannels(config, chatIdsByUsername);
      const reading = readings[index];
      if (reading === TIMED_OUT) {
        recordError(`healthFactor:${userId}:${marketId}: not read within this run's time limit`, { wallet: userId });
        continue;
      }
      if (!reading) {
        recordError(`healthFactor:${userId}:${marketId}: could not read the health factor`, { wallet: userId });
        continue;
      }

      try {
        const threshold = normalizeThreshold(config.health_factor_threshold, MORPHO_THRESHOLD_RANGE);
        const now = new Date();
        const input = { chainName: chain.name, params, reading, now };
        for (const notice of morphoNotices(params, reading, threshold)) {
          if (notice.kind === "health") {
            await deliver(config, deliveries, locale => buildMorphoAlert({ ...input, threshold, locale }));
            continue;
          }
          const message = (locale: Locale) => buildMaturityMessage({ ...input, stage: notice.stage, locale });
          if (notice.stage === "matured") {
            await deliver(config, deliveries, message);
            continue;
          }
          // Each reminder once per loan: claimed before the send, given back when no channel took it.
          const sentAt = await claimMaturityReminder(config.id, notice.stage, notice.maturity);
          if (!sentAt) continue;
          let delivered = 0;
          try {
            delivered = await deliver(config, deliveries, message);
          } finally {
            if (delivered === 0) {
              const releaseError = await releaseMaturityReminder(config.id, notice.stage, notice.maturity, sentAt);
              if (releaseError) {
                recordError(`reminder:${userId}:${marketId}: could not give back the ${notice.stage} reminder`, {
                  wallet: userId,
                });
              }
            }
          }
        }
      } catch (e) {
        recordError(`config:${userId}:${marketId}: ${getErrorMessage(e)}`, { wallet: userId, deliveries });
      }
    }

    for (const config of configs) {
      if (rowProtocol(config) !== "aave") continue;
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

        const now = new Date();
        await deliver(config, deliveries, locale => {
          const alert = { ...reading, threshold, timestamp: formatUtcTimestamp(now, locale) };
          return { text: buildAlertText(alert, locale), ...buildAlertEmail(alert, locale) };
        });
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
