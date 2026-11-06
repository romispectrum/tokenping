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
import { clearAlertSends, getLastAlertSends, isAlertDue, recordAlertSends } from "~~/services/notifications/alertSends";
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
import { readWithinBudget } from "~~/services/notifications/readWithinBudget";
import { type Delivery, redactRecipients, shortenAddress } from "~~/services/notifications/redact";
import { sendSignalMessage } from "~~/services/signal/sendSignal";
import { type TelegramSendErrorCode, chatHoldsUsername, sendTelegramMessage } from "~~/services/telegram/sendTelegram";
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

/**
 * The same for the Aave reads, which follow, chains in parallel: a chain whose RPCs hang costs this much at most, not its
 * 10-second timeouts one config after another.
 */
export const AAVE_READ_BUDGET_MS = 40_000;

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
 * alert, a Midnight maturity reminder or alert). Then the Aave configs, read together the same way: the wallet's health
 * factor in the config's market (the chain's V3 Pool or a V4 Spoke), alerted when below the threshold. An alert repeats
 * every ALERT_REPEAT_MINUTES per channel while the position stays below it (alertSends.ts). A failing config is recorded
 * in `errors` without stopping the others; a protocol this version does not know is left alone.
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

    const { lastSends, error: sendsError } = await getLastAlertSends();
    if (sendsError) {
      recordError(`alert sends: query failed, the repeat limit is off this run: ${sendsError.message}`);
    }

    const configs = rows.filter(
      row => rowProtocol(row) !== null && getDeliverableChannels(row, chatIdsByUsername).length > 0,
    );
    const sent: Record<NotificationService, number> = { email: 0, signal: 0, telegram: 0 };

    /** Removes a chat for good; its owner gets alerts again by sending /start to the bot. */
    const forgetChat = async (chatId: string) => {
      const deleteError = await deleteTelegramChat(chatId);
      if (deleteError) console.error(`Notification check: could not remove the Telegram chat ${chatId}`, deleteError);
      for (const [username, linkedChatId] of chatIdsByUsername) {
        if (linkedChatId === chatId) chatIdsByUsername.delete(username);
      }
    };

    /**
     * Sends the message on each delivery, in the channel's own language (the config's when it has none), each language
     * built once. Returns the channels it reached. A Telegram chat whose owner gave the username up is unlinked
     * instead of messaged: the alert belongs to whoever holds the username now.
     */
    const deliver = async (
      config: EnabledConfigRow,
      deliveries: readonly Delivery[],
      buildMessage: (locale: Locale) => AlertMessage,
    ) => {
      const messages: Partial<Record<Locale, AlertMessage>> = {};
      const delivered: NotificationService[] = [];
      for (const delivery of deliveries) {
        const { channel, recipient } = delivery;
        if (channel === "telegram" && !(await chatHoldsUsername(recipient, config.telegram_username))) {
          recordError(`telegram:${recipient}: the chat no longer holds the alert's username`, {
            deliveries: [delivery],
          });
          await forgetChat(recipient);
          continue;
        }
        const locale = rowChannelLocale(config, channel);
        const result = await ALERT_SENDERS[channel](recipient, (messages[locale] ??= buildMessage(locale)));
        if (result.success) {
          sent[channel]++;
          delivered.push(channel);
          continue;
        }

        recordError(`${channel}:${recipient}: ${result.error}`, { deliveries: [delivery] });
        if (channel === "telegram" && result.code && DEAD_CHAT_CODES.includes(result.code)) await forgetChat(recipient);
      }
      return delivered;
    };

    /** A health or matured alert: only the channels due, remembering which ones it reached. */
    const deliverRepeating = async (
      config: EnabledConfigRow,
      deliveries: readonly Delivery[],
      buildMessage: (locale: Locale) => AlertMessage,
    ) => {
      const now = new Date();
      const due = deliveries.filter(({ channel }) => isAlertDue(lastSends, config.id, channel, now.getTime()));
      const delivered = await deliver(config, due, buildMessage);
      if (delivered.length === 0) return;
      const error = await recordAlertSends(config.id, delivered, now);
      if (error) {
        const { user_id: userId } = config;
        recordError(`alert sends:${userId}: could not record a send: ${error.message}`, { wallet: userId });
      }
    };

    /** The position no longer calls for an alert, so its next dip alerts at once. */
    const clearRepeat = async ({ id, user_id: userId }: EnabledConfigRow) => {
      if (!lastSends.has(id)) return;
      const error = await clearAlertSends(id);
      if (error) recordError(`alert sends:${userId}: could not clear: ${error.message}`, { wallet: userId });
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
        const notices = morphoNotices(params, reading, threshold);
        if (!notices.some(notice => notice.kind === "health" || notice.stage === "matured")) await clearRepeat(config);
        for (const notice of notices) {
          if (notice.kind === "health") {
            await deliverRepeating(config, deliveries, locale => buildMorphoAlert({ ...input, threshold, locale }));
            continue;
          }
          const message = (locale: Locale) => buildMaturityMessage({ ...input, stage: notice.stage, locale });
          if (notice.stage === "matured") {
            await deliverRepeating(config, deliveries, message);
            continue;
          }
          // Each reminder once per loan: claimed before the send, given back when no channel took it.
          const sentAt = await claimMaturityReminder(config.id, notice.stage, notice.maturity);
          if (!sentAt) continue;
          let delivered: NotificationService[] = [];
          try {
            delivered = await deliver(config, deliveries, message);
          } finally {
            if (delivered.length === 0) {
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

    const aaveConfigs = configs.filter(row => rowProtocol(row) === "aave");
    const aaveReadings = await readWithinBudget(
      aaveConfigs,
      config => config.chain_id,
      config =>
        getHealthFactorForWallet(config.user_id as Address, config.chain_id, rowMarket(config)).catch(
          (error: unknown) => ({ failed: getErrorMessage(error) }),
        ),
      Date.now() + AAVE_READ_BUDGET_MS,
    );

    for (const [index, config] of aaveConfigs.entries()) {
      const { user_id: userId, chain_id: chainId } = config;
      const market = rowMarket(config);
      // How errors name the market: the chain id for V3, as before V4, else "chain:spoke".
      const marketId = market === V3_MARKET_ID ? String(chainId) : marketKey(chainId, market);
      // Computed per config: a dead Telegram chat removed below is skipped for every later config that names it.
      const deliveries = getDeliverableChannels(config, chatIdsByUsername);
      const reading = aaveReadings[index];

      try {
        const threshold = normalizeThreshold(config.health_factor_threshold);

        if (reading === TIMED_OUT) {
          recordError(`healthFactor:${userId}:${marketId}: not read within this run's time limit`, { wallet: userId });
          continue;
        }
        if (reading && "failed" in reading) throw new Error(reading.failed);
        if (!reading) {
          recordError(`healthFactor:${userId}:${marketId}: could not read the health factor`, { wallet: userId });
          continue;
        }
        // Compared exactly, not as the rounded display value (1.4996 must alert against a 1.5 threshold).
        if (!(reading.healthFactorValue < threshold)) {
          await clearRepeat(config);
          continue;
        }

        const now = new Date();
        await deliverRepeating(config, deliveries, locale => {
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
