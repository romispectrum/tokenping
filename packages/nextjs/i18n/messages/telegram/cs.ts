import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
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
};
