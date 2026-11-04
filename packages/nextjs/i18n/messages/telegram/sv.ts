import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping fungerar bara i privata chattar. Skriv direkt till boten.",
  noUsername:
    "Ditt Telegram-konto har inget användarnamn än. Välj ett i Telegram (Inställningar, sedan Användarnamn), " +
    "skriv in det i ditt larm på Tokenping och skicka sedan /start här igen.",
  linkSaveFailed: "Något gick fel när chatten skulle kopplas. Skicka /start igen.",
  linked: username =>
    `@${username} är kopplat. Larm från Tokenping för @${username} kommer till den här chatten.\n\n` +
    "Skicka /stop när som helst för att stoppa dem.",
  unsubscribed: "Stoppat. Inga fler larm från Tokenping kommer hit. Skicka /start för att få dem igen.",
  unsubscribeFailed: "Något gick fel när larmen skulle stoppas. Skicka /stop igen.",
  help:
    "Tokenping skickar ett meddelande när din health factor på Aave eller Morpho sjunker under ett tröskelvärde som du ställer in i appen.\n\n" +
    "Skriv in ditt användarnamn på Telegram i ditt larm på Tokenping och skicka sedan /start här en gång.\n\n" +
    "Kommandon:\n" +
    "/start: koppla den här chatten till ditt användarnamn\n" +
    "/stop: stoppa alla larm från Tokenping här\n" +
    "/help: visa det här meddelandet",
  unknownCommand: "Jag svarar bara på /start, /stop och /help. Hantera dina larm i Tokenping-appen.",
};
