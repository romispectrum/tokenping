import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping fungerer bare i private chatter. Skriv direkte til boten.",
  noUsername:
    "Telegram-kontoen din har ikke noe brukernavn ennå. Velg et i Telegram (Innstillinger, deretter Brukernavn), " +
    "skriv det inn i varselet ditt på Tokenping og send deretter /start her igjen.",
  linkSaveFailed: "Noe gikk galt da chatten skulle kobles til. Send /start igjen.",
  linked: username =>
    `@${username} er koblet til. Varsler fra Tokenping for @${username} kommer i denne chatten.\n\n` +
    "Send /stop når som helst for å stoppe dem.",
  unsubscribed: "Stoppet. Ingen flere varsler fra Tokenping kommer hit. Send /start for å få dem igjen.",
  unsubscribeFailed: "Noe gikk galt da varslene skulle stoppes. Send /stop igjen.",
  help:
    "Tokenping sender deg en melding når health factor på Aave eller Morpho faller under en terskel du setter i appen.\n\n" +
    "Skriv inn brukernavnet ditt på Telegram i varselet ditt på Tokenping, og send deretter /start her én gang.\n\n" +
    "Kommandoer:\n" +
    "/start: koble denne chatten til brukernavnet ditt\n" +
    "/stop: stopp alle varsler fra Tokenping her\n" +
    "/help: vis denne meldingen",
  unknownCommand: "Jeg svarer bare på /start, /stop og /help. Administrer varslene dine i Tokenping-appen.",
};
