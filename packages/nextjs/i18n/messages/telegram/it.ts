import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping funziona solo nelle chat private. Scrivi direttamente al bot.",
  noUsername:
    "Il tuo account Telegram non ha ancora un nome utente. Impostalo in Telegram (Impostazioni, poi Nome utente), " +
    "inseriscilo nel tuo avviso su Tokenping, poi invia di nuovo /start qui.",
  linkSaveFailed: "Qualcosa è andato storto nel collegare questa chat. Invia di nuovo /start.",
  linked: username =>
    `@${username} collegato. Gli avvisi di Tokenping che indicano @${username} arriveranno in questa chat.\n\n` +
    "Invia /stop quando vuoi per fermarli.",
  unsubscribed: "Fatto. Qui non arriveranno più avvisi di Tokenping. Invia /start per riceverli di nuovo.",
  unsubscribeFailed: "Qualcosa è andato storto nel fermare gli avvisi. Invia di nuovo /stop.",
  help:
    "Tokenping ti scrive quando il tuo fattore di salute su Aave o Morpho scende sotto una soglia che imposti nell'app.\n\n" +
    "Inserisci il tuo nome utente Telegram nel tuo avviso su Tokenping, poi invia /start qui una volta.\n\n" +
    "Comandi:\n" +
    "/start: collega questa chat al tuo nome utente\n" +
    "/stop: ferma qui tutti gli avvisi di Tokenping\n" +
    "/help: mostra questo messaggio",
  unknownCommand: "Rispondo solo a /start, /stop e /help. Gestisci i tuoi avvisi nell'app Tokenping.",
};
