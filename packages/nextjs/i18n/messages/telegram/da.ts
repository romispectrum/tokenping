import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping virker kun i private chats. Skriv direkte til botten.",
  noUsername:
    "Din Telegram-konto har endnu ikke et brugernavn. Vælg et i Telegram (Indstillinger og derefter Brugernavn), " +
    "skriv det i din alarm på Tokenping, og send derefter /start her igen.",
  linkSaveFailed: "Noget gik galt, da chatten skulle forbindes. Send /start igen.",
  linked: username =>
    `@${username} er forbundet. Alarmer fra Tokenping for @${username} kommer i denne chat.\n\n` +
    "Send /stop når som helst for at stoppe dem.",
  unsubscribed: "Stoppet. Der kommer ikke flere alarmer fra Tokenping her. Send /start for at få dem igen.",
  unsubscribeFailed: "Noget gik galt, da alarmerne skulle stoppes. Send /stop igen.",
  help:
    "Tokenping sender dig en besked, når din health factor på Aave eller Morpho falder under en tærskel, som du sætter i appen.\n\n" +
    "Skriv dit brugernavn på Telegram i din alarm på Tokenping, og send derefter /start her én gang.\n\n" +
    "Kommandoer:\n" +
    "/start: forbind denne chat med dit brugernavn\n" +
    "/stop: stop alle alarmer fra Tokenping her\n" +
    "/help: vis denne besked",
  unknownCommand: "Jeg svarer kun på /start, /stop og /help. Administrer dine alarmer i Tokenping-appen.",
};
