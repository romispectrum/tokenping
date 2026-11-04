import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping deluje samo v zasebnih klepetih. Piši botu neposredno.",
  noUsername:
    "Tvoj račun Telegram še nima uporabniškega imena. Nastavi ga v aplikaciji Telegram (Nastavitve, nato Uporabniško ime), " +
    "vnesi ga v svoje opozorilo v aplikaciji Tokenping in nato sem znova pošlji /start.",
  linkSaveFailed: "Pri povezovanju tega klepeta je prišlo do napake. Znova pošlji /start.",
  linked: username =>
    `Uporabniško ime @${username} je povezano. Opozorila Tokenping za @${username} bodo prihajala v ta klepet.\n\n` +
    "Kadar koli pošlji /stop, da jih ustaviš.",
  unsubscribed:
    "Ustavljeno. Sem ne bo več prišlo nobeno opozorilo Tokenping. Pošlji /start, če jih želiš spet prejemati.",
  unsubscribeFailed: "Pri ustavljanju opozoril je prišlo do napake. Znova pošlji /stop.",
  help:
    "Tokenping ti pošlje sporočilo, ko tvoj health factor v Aave ali Morpho pade pod prag, ki ga nastaviš v aplikaciji.\n\n" +
    "Vnesi svoje uporabniško ime Telegram v svoje opozorilo v aplikaciji Tokenping, nato sem enkrat pošlji /start.\n\n" +
    "Ukazi:\n" +
    "/start: poveže ta klepet s tvojim uporabniškim imenom\n" +
    "/stop: ustavi vsa opozorila Tokenping v tem klepetu\n" +
    "/help: pokaže to sporočilo",
  unknownCommand: "Odzivam se samo na /start, /stop in /help. Opozorila upravljaš v aplikaciji Tokenping.",
};
