import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";

/** Telegram language codes (IETF tags such as "cs" or "pt-br") answered in Czech; Slovak readers get Czech too. */
const CZECH_LANGUAGES = new Set(["cs", "sk"]);

/** The reply language for a Telegram user: Czech for Czech and Slovak apps, English otherwise. */
export const telegramLocale = (languageCode: unknown): Locale => {
  const language = typeof languageCode === "string" ? languageCode.split("-")[0].toLowerCase() : "";
  return CZECH_LANGUAGES.has(language) ? "cs" : DEFAULT_LOCALE;
};

export type BotCommand = { name: "start"; token?: string } | { name: "stop" } | { name: "help" } | { name: "unknown" };

/** The whole first word, optionally addressed to the bot as Telegram does in groups ("/stop@tokenping_bot"). */
const COMMAND_PATTERN = /^\/(start|stop|help)(?:@\w+)?$/;

/**
 * Commands are case-sensitive and match the first word exactly ("/stopwatch" is unknown); `/start <token>` takes
 * the next whitespace-separated word as the token.
 */
export const parseCommand = (text: string): BotCommand => {
  const [word, token] = text.trim().split(/\s+/);
  const name = COMMAND_PATTERN.exec(word)?.[1];
  if (name === "start") return { name, token };
  if (name === "stop" || name === "help") return { name };
  return { name: "unknown" };
};
