import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping radi samo u privatnim razgovorima. Piši botu direktno.",
  noUsername:
    "Tvoj Telegram nalog još nema korisničko ime. Podesi ga u Telegramu (Podešavanja, zatim Korisničko ime), upiši ga " +
    "u svoje upozorenje na Tokenpingu, pa ovde ponovo pošalji /start.",
  linkSaveFailed: "Nešto nije u redu pri povezivanju ovog razgovora. Pošalji /start ponovo.",
  linked: username =>
    `Povezano: @${username}. Upozorenja sa Tokenpinga koja navode @${username} stizaće u ovaj razgovor.\n\n` +
    "Pošalji /stop kad god želiš da ih zaustaviš.",
  unsubscribed: "Zaustavljeno. Upozorenja sa Tokenpinga više neće stizati ovde. Pošalji /start da ih opet primaš.",
  unsubscribeFailed: "Nešto nije u redu pri zaustavljanju upozorenja. Pošalji /stop ponovo.",
  help:
    "Tokenping ti šalje poruku kad tvoj health factor na protokolu Aave ili Morpho padne ispod praga koji podesiš u aplikaciji.\n\n" +
    "Upiši svoje korisničko ime sa Telegrama u upozorenje na Tokenpingu, pa ovde jednom pošalji /start.\n\n" +
    "Komande:\n" +
    "/start: poveži ovaj razgovor sa svojim korisničkim imenom\n" +
    "/stop: zaustavi sva upozorenja sa Tokenpinga ovde\n" +
    "/help: prikaži ovu poruku",
  unknownCommand: "Odgovaram samo na /start, /stop i /help. Upozorenjima upravljaš u aplikaciji Tokenping.",
};
