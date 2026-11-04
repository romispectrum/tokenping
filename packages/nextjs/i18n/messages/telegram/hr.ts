import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping radi samo u privatnim razgovorima. Piši botu izravno.",
  noUsername:
    "Tvoj Telegram račun još nema korisničko ime. Postavi ga u Telegramu (Postavke, zatim Korisničko ime), upiši ga " +
    "u svoje upozorenje na Tokenpingu, a zatim ovdje ponovno pošalji /start.",
  linkSaveFailed: "Nešto je pošlo po zlu pri povezivanju ovog razgovora. Pošalji /start ponovno.",
  linked: username =>
    `Povezano: @${username}. Upozorenja s Tokenpinga koja navode @${username} stizat će u ovaj razgovor.\n\n` +
    "Pošalji /stop kad god ih želiš zaustaviti.",
  unsubscribed: "Zaustavljeno. Upozorenja s Tokenpinga više neće stizati ovamo. Pošalji /start da ih opet primaš.",
  unsubscribeFailed: "Nešto je pošlo po zlu pri zaustavljanju upozorenja. Pošalji /stop ponovno.",
  help:
    "Tokenping ti šalje poruku kad tvoj health factor na Aaveu ili Morphu padne ispod praga koji postaviš u aplikaciji.\n\n" +
    "Upiši svoje korisničko ime na Telegramu u upozorenje na Tokenpingu, a zatim ovdje jednom pošalji /start.\n\n" +
    "Naredbe:\n" +
    "/start: poveži ovaj razgovor sa svojim korisničkim imenom\n" +
    "/stop: zaustavi sva upozorenja s Tokenpinga ovdje\n" +
    "/help: prikaži ovu poruku",
  unknownCommand: "Odgovaram samo na /start, /stop i /help. Upozorenjima upravljaš u aplikaciji Tokenping.",
};
