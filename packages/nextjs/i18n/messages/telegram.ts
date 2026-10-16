import type { Localized } from "~~/i18n/locales";

// The Telegram bot's replies. The webhook answers in the language of the sender's Telegram app (telegramLocale in
// app/api/telegram/bot.ts); the farewell sent on disconnect uses the site language the user disconnected from.
// The Czech replies name the alerts UI labels („Nastavení upozornění“, „Připojit Telegram“): keep them in sync.

type TelegramReplies = {
  privateChatsOnly: string;
  startWithoutToken: string;
  invalidLink: string;
  expiredLink: string;
  linkSaveFailed: string;
  connected: string;
  unsubscribed: string;
  unsubscribeFailed: string;
  help: string;
  unknownCommand: string;
  disconnected: string;
};

export const TELEGRAM_REPLIES: Localized<TelegramReplies> = {
  en: {
    privateChatsOnly: "Tokenping only supports private chats. Please DM the bot directly.",
    startWithoutToken:
      "Hi! To receive Aave health-factor alerts here, open Tokenping → " +
      "Notification settings → select Telegram → press 'Connect Telegram'.",
    invalidLink: "❌ Invalid link. Please generate a new one in the Tokenping app.",
    expiredLink: "❌ This link has expired or was already used. Please generate a new one in the Tokenping app.",
    linkSaveFailed: "Something went wrong saving your link. Please try again.",
    connected:
      "✅ Connected. You'll receive Aave health-factor alerts here when your position drops below your threshold.\n\n" +
      "Send /stop at any time to unsubscribe.",
    unsubscribed:
      "🔕 Unsubscribed. You won't receive any more Tokenping alerts here. " +
      "You can reconnect anytime from the Tokenping app.",
    unsubscribeFailed: "Something went wrong while unsubscribing. Please send /stop again.",
    help:
      "Tokenping notifies you when your Aave Health Factor drops below a threshold you set in the app.\n\n" +
      "Commands:\n" +
      "/start <token>: link via the Tokenping app\n" +
      "/stop: unsubscribe\n" +
      "/help: show this message",
    unknownCommand: "I only respond to /start, /stop, and /help. Open the Tokenping app to manage your alerts.",
    disconnected:
      "🔕 Tokenping disconnected from this chat. You won't receive Aave alerts here anymore. " +
      "You can reconnect anytime from the Tokenping app.",
  },
  cs: {
    privateChatsOnly: "Tokenping funguje jen v soukromých chatech. Napište prosím botovi přímo.",
    startWithoutToken:
      "Dobrý den! Pokud sem chcete dostávat upozornění na health factor Aave, otevřete Tokenping → " +
      "Nastavení upozornění → vyberte Telegram → stiskněte „Připojit Telegram“.",
    invalidLink: "❌ Neplatný odkaz. Vygenerujte si prosím nový v aplikaci Tokenping.",
    expiredLink: "❌ Platnost odkazu vypršela nebo už byl použit. Vygenerujte si prosím nový v aplikaci Tokenping.",
    linkSaveFailed: "Při ukládání propojení se něco pokazilo. Zkuste to prosím znovu.",
    connected:
      "✅ Připojeno. Když health factor vaší pozice na Aave klesne pod váš práh, pošleme vám sem upozornění.\n\n" +
      "Odběr můžete kdykoli zrušit příkazem /stop.",
    unsubscribed:
      "🔕 Odběr zrušen. Další upozornění od Tokenpingu sem už nepřijdou. " +
      "Znovu se můžete kdykoli připojit v aplikaci Tokenping.",
    unsubscribeFailed: "Při rušení odběru se něco pokazilo. Pošlete prosím /stop znovu.",
    help:
      "Tokenping vás upozorní, když váš health factor na Aave klesne pod práh, který si nastavíte v aplikaci.\n\n" +
      "Příkazy:\n" +
      "/start <token>: propojit přes aplikaci Tokenping\n" +
      "/stop: zrušit odběr\n" +
      "/help: zobrazit tuto zprávu",
    unknownCommand: "Reaguji jen na /start, /stop a /help. Svá upozornění spravujte v aplikaci Tokenping.",
    disconnected:
      "🔕 Tokenping byl od tohoto chatu odpojen. Upozornění na Aave sem už nepřijdou. " +
      "Znovu se můžete kdykoli připojit v aplikaci Tokenping.",
  },
};
