import type { Localized } from "~~/i18n/locales";

// The Telegram bot's replies, in the language of the sender's Telegram app (telegramLocale in app/api/telegram/bot.ts).
// The Czech replies name the alerts UI label („uživatelské jméno na Telegramu“): keep them in sync with alerts.ts.

type TelegramReplies = {
  privateChatsOnly: string;
  /** /start from an account without a username: there is nothing an alert could name. */
  noUsername: string;
  linkSaveFailed: string;
  /** /start linked `username` to this chat. */
  linked: (username: string) => string;
  unsubscribed: string;
  unsubscribeFailed: string;
  help: string;
  unknownCommand: string;
};

export const TELEGRAM_REPLIES: Localized<TelegramReplies> = {
  en: {
    privateChatsOnly: "Tokenping only supports private chats. Please message the bot directly.",
    noUsername:
      "Your Telegram account has no username yet. Set one in Telegram (Settings, then Username), type it into " +
      "your alert on Tokenping, then send /start here again.",
    linkSaveFailed: "Something went wrong linking this chat. Please send /start again.",
    linked: username =>
      `Linked @${username}. Tokenping alerts that name @${username} will arrive in this chat.\n\n` +
      "Send /stop at any time to stop them.",
    unsubscribed: "Stopped. No more Tokenping alerts will arrive here. Send /start to receive them again.",
    unsubscribeFailed: "Something went wrong while stopping alerts. Please send /stop again.",
    help:
      "Tokenping messages you when your Aave or Morpho health factor drops below a threshold you set in the app.\n\n" +
      "Type your Telegram username into your alert on Tokenping, then send /start here once.\n\n" +
      "Commands:\n" +
      "/start: link this chat to your username\n" +
      "/stop: stop all Tokenping alerts here\n" +
      "/help: show this message",
    unknownCommand: "I only respond to /start, /stop and /help. Manage your alerts in the Tokenping app.",
  },
  cs: {
    privateChatsOnly: "Tokenping funguje jen v soukromých chatech. Napište prosím botovi přímo.",
    noUsername:
      "Váš účet na Telegramu zatím nemá uživatelské jméno. Nastavte si ho v Telegramu (Nastavení, Uživatelské " +
      "jméno), zadejte ho do upozornění na Tokenpingu a potom sem znovu pošlete /start.",
    linkSaveFailed: "Při propojování chatu se něco pokazilo. Pošlete prosím /start znovu.",
    linked: username =>
      `Propojeno: @${username}. Upozornění z Tokenpingu, která uvádějí @${username}, budou chodit sem.\n\n` +
      "Kdykoli je zastavíte příkazem /stop.",
    unsubscribed: "Zastaveno. Další upozornění od Tokenpingu sem nepřijdou. Příkazem /start je znovu zapnete.",
    unsubscribeFailed: "Při zastavování upozornění se něco pokazilo. Pošlete prosím /stop znovu.",
    help:
      "Tokenping vám napíše, když váš health factor na Aave nebo Morpho klesne pod práh, který si nastavíte v aplikaci.\n\n" +
      "Zadejte své uživatelské jméno na Telegramu do upozornění na Tokenpingu a potom sem jednou pošlete /start.\n\n" +
      "Příkazy:\n" +
      "/start: propojit tento chat s vaším uživatelským jménem\n" +
      "/stop: zastavit všechna upozornění od Tokenpingu\n" +
      "/help: zobrazit tuto zprávu",
    unknownCommand: "Reaguji jen na /start, /stop a /help. Svá upozornění spravujte v aplikaci Tokenping.",
  },
};
