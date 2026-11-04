import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping werkt alleen in privéchats. Stuur de bot rechtstreeks een bericht.",
  noUsername:
    "Je Telegram-account heeft nog geen gebruikersnaam. Stel er een in via Telegram (Instellingen, dan " +
    "Gebruikersnaam), vul hem in bij je alert op Tokenping en stuur hier dan opnieuw /start.",
  linkSaveFailed: "Er ging iets mis bij het koppelen van deze chat. Stuur opnieuw /start.",
  linked: username =>
    `@${username} is gekoppeld. Tokenping-alerts voor @${username} komen in deze chat binnen.\n\n` +
    "Stuur op elk moment /stop om ze te stoppen.",
  unsubscribed: "Gestopt. Hier komen geen Tokenping-alerts meer binnen. Stuur /start om ze weer te krijgen.",
  unsubscribeFailed: "Er ging iets mis bij het stoppen van de alerts. Stuur opnieuw /stop.",
  help:
    "Tokenping stuurt je een bericht als je health factor op Aave of Morpho onder een drempel zakt die je in de app instelt.\n\n" +
    "Vul je Telegram-gebruikersnaam in bij je alert op Tokenping en stuur hier dan één keer /start.\n\n" +
    "Commando's:\n" +
    "/start: deze chat koppelen aan je gebruikersnaam\n" +
    "/stop: alle Tokenping-alerts hier stoppen\n" +
    "/help: dit bericht tonen",
  unknownCommand: "Ik reageer alleen op /start, /stop en /help. Beheer je alerts in de Tokenping-app.",
};
