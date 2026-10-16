import { isTelegramConfigured } from "~~/constants/notifications";
import { joinList } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";

/**
 * Alert channels to name in site copy, in reading order. Telegram is listed only when the bot username is configured,
 * the same env var that gates the Telegram option in the alert settings. Names are sentence case ("email"), for use
 * inside running text.
 */
export const getAlertChannelNames = (): string[] =>
  isTelegramConfigured() ? ["Signal", "Telegram", "email"] : ["Signal", "email"];

/** "Signal or email", "Signal, Telegram or email" (no serial comma, matching the site copy). */
export const formatAlertChannels = (conjunction: "or" | "and" = "or", names = getAlertChannelNames()) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} ${conjunction} ${names[names.length - 1]}`;

const CHANNEL_NAMES_CS: Record<string, string> = { Signal: "Signal", Telegram: "Telegram", email: "e-mail" };

/** The alert channels named in a language, for running text: "Signal nebo e-mail", "Signal, Telegram a e-mail". */
export const formatAlertChannelsIn = (locale: Locale, type: "conjunction" | "disjunction" = "disjunction") => {
  const names = getAlertChannelNames();
  return joinList(locale, locale === "cs" ? names.map(name => CHANNEL_NAMES_CS[name] ?? name) : names, type);
};
