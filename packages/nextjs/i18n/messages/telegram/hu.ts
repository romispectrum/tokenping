import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "A Tokenping csak privát csevegésekben működik. Írj közvetlenül a botnak.",
  noUsername:
    "A Telegram-fiókodnak még nincs felhasználóneve. Állíts be egyet a Telegramban (Beállítások, majd Felhasználónév), " +
    "írd be a Tokenpingen a riasztásodba, majd küldd el ide újra a /start parancsot.",
  linkSaveFailed: "Hiba történt a csevegés összekapcsolásakor. Küldd el újra a /start parancsot.",
  linked: username =>
    `@${username} összekapcsolva. A @${username} nevet tartalmazó Tokenping-riasztások ebbe a csevegésbe érkeznek.\n\n` +
    "Bármikor leállíthatod őket a /stop paranccsal.",
  unsubscribed: "Leállítva. Ide több Tokenping-riasztás nem érkezik. Ha újra kéred őket, küldd el a /start parancsot.",
  unsubscribeFailed: "Hiba történt a riasztások leállításakor. Küldd el újra a /stop parancsot.",
  help:
    "A Tokenping üzenetet küld, ha az Aave vagy Morpho health factorod az alkalmazásban beállított küszöbérték alá esik.\n\n" +
    "Írd be a Telegram-felhasználónevedet a Tokenpingen a riasztásodba, majd küldd el ide egyszer a /start parancsot.\n\n" +
    "Parancsok:\n" +
    "/start: összekapcsolja ezt a csevegést a felhasználóneveddel\n" +
    "/stop: leállít itt minden Tokenping-riasztást\n" +
    "/help: megjeleníti ezt az üzenetet",
  unknownCommand:
    "Csak a /start, a /stop és a /help parancsra válaszolok. A riasztásaidat a Tokenping alkalmazásban kezelheted.",
};
