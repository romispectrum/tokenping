import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";

/**
 * Telegram language codes (IETF tags such as "cs", "es-mx" or "pt-br"), by their language, answered in a language the
 * site has: Czech for Czech, and for Slovak readers too; Spanish for every Spanish.
 */
const REPLY_LANGUAGES: Record<string, Locale> = { cs: "cs", sk: "cs", es: "es" };

/** The reply language for a Telegram user: Czech for Czech and Slovak apps, Spanish for Spanish ones, else English. */
export const telegramLocale = (languageCode: unknown): Locale => {
  const language = typeof languageCode === "string" ? languageCode.split("-")[0].toLowerCase() : "";
  return REPLY_LANGUAGES[language] ?? DEFAULT_LOCALE;
};

export type BotCommand = { name: "start"; token?: string } | { name: "stop" } | { name: "help" } | { name: "unknown" };

/** The whole first word, optionally addressed to the bot as Telegram does in groups ("/stop@tokenping_bot"). */
const COMMAND_PATTERN = /^\/(start|stop|help)(?:@\w+)?$/;

/**
 * Commands are case-sensitive and match the first word exactly ("/stopwatch" is unknown). `/start <token>` keeps the
 * next whitespace-separated word as the token: Telegram sends it for a t.me/<bot>?start=<token> link. The webhook
 * links by username and ignores it, so old deep links still work as a plain /start.
 */
export const parseCommand = (text: string): BotCommand => {
  const [word, token] = text.trim().split(/\s+/);
  const name = COMMAND_PATTERN.exec(word)?.[1];
  if (name === "start") return { name, token };
  if (name === "stop" || name === "help") return { name };
  return { name: "unknown" };
};
