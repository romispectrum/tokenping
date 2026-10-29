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

// How each language writes a channel in running text, where it differs from English.
const CHANNEL_NAMES: Partial<Record<Locale, Record<string, string>>> = {
  cs: { email: "e-mail" },
  es: { email: "correo electrónico" },
  hi: { email: "ईमेल" },
};

/**
 * The alert channels named in a language, for running text: "Signal nebo e-mail", "Signal, Telegram a e-mail",
 * "Signal, Telegram y correo electrónico", "Signal, Telegram और ईमेल".
 */
export const formatAlertChannelsIn = (locale: Locale, type: "conjunction" | "disjunction" = "disjunction") =>
  joinList(
    locale,
    getAlertChannelNames().map(name => CHANNEL_NAMES[locale]?.[name] ?? name),
    type,
  );
