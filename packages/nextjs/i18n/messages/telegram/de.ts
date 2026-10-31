import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping funktioniert nur in privaten Chats. Schreib dem Bot bitte direkt.",
  noUsername:
    "Dein Telegram-Konto hat noch keinen Benutzernamen. Leg in Telegram einen an (Einstellungen, dann " +
    "Benutzername), trag ihn in deinen Alert bei Tokenping ein und sende dann hier noch einmal /start.",
  linkSaveFailed: "Beim Verknüpfen dieses Chats ist etwas schiefgelaufen. Sende bitte noch einmal /start.",
  linked: username =>
    `Verknüpft: @${username}. Tokenping-Alerts, die @${username} nennen, kommen in diesem Chat an.\n\n` +
    "Sende jederzeit /stop, um sie zu beenden.",
  unsubscribed: "Gestoppt. Hier kommen keine Tokenping-Alerts mehr an. Sende /start, um sie wieder zu erhalten.",
  unsubscribeFailed: "Beim Stoppen der Alerts ist etwas schiefgelaufen. Sende bitte noch einmal /stop.",
  help:
    "Tokenping schreibt dir, wenn dein Health Factor auf Aave oder Morpho unter einen Schwellenwert fällt, den du in der App festlegst.\n\n" +
    "Trag deinen Telegram-Benutzernamen in deinen Alert bei Tokenping ein und sende dann hier einmal /start.\n\n" +
    "Befehle:\n" +
    "/start: diesen Chat mit deinem Benutzernamen verknüpfen\n" +
    "/stop: alle Tokenping-Alerts hier stoppen\n" +
    "/help: diese Nachricht anzeigen",
  unknownCommand: "Ich reagiere nur auf /start, /stop und /help. Verwalte deine Alerts in der Tokenping-App.",
};
