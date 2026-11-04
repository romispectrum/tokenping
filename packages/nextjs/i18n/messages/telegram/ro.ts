import type { TelegramReplies } from "./shared";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping funcționează doar în chaturi private. Scrie-i direct botului.",
  noUsername:
    "Contul tău de Telegram nu are încă un nume de utilizator. Setează unul în Telegram (Setări, apoi Nume de " +
    "utilizator), scrie-l în alerta ta pe Tokenping, apoi trimite din nou /start aici.",
  linkSaveFailed: "Ceva nu a mers la conectarea acestui chat. Trimite din nou /start.",
  linked: username =>
    `@${username} este conectat. Alertele Tokenping pentru @${username} vor ajunge în acest chat.\n\n` +
    "Trimite /stop oricând ca să le oprești.",
  unsubscribed: "Oprit. Aici nu mai ajung alerte Tokenping. Trimite /start ca să le primești din nou.",
  unsubscribeFailed: "Ceva nu a mers la oprirea alertelor. Trimite din nou /stop.",
  help:
    "Tokenping îți trimite un mesaj când health factor-ul tău pe Aave sau Morpho scade sub un prag setat de tine în aplicație.\n\n" +
    "Scrie numele tău de utilizator Telegram în alerta ta pe Tokenping, apoi trimite o dată /start aici.\n\n" +
    "Comenzi:\n" +
    "/start: conectează acest chat la numele tău de utilizator\n" +
    "/stop: oprește aici toate alertele Tokenping\n" +
    "/help: afișează acest mesaj",
  unknownCommand: "Răspund doar la /start, /stop și /help. Gestionează-ți alertele în aplicația Tokenping.",
};
