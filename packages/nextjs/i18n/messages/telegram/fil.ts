import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Private chat lang ang sinusuportahan ng Tokenping. Mag-message nang direkta sa bot.",
  noUsername:
    "Wala pang username ang Telegram account mo. Gumawa ng isa sa Telegram (Settings, tapos Username), i-type ito sa " +
    "alerto mo sa Tokenping, tapos ipadala ulit ang /start dito.",
  linkSaveFailed: "Nagkaproblema sa pag-link ng chat na ito. Ipadala ulit ang /start.",
  linked: username =>
    `Naka-link na ang @${username}. Darating sa chat na ito ang mga alerto ng Tokenping na nakapangalan sa @${username}.\n\n` +
    "Ipadala ang /stop anumang oras para itigil ang mga ito.",
  unsubscribed:
    "Itinigil na. Wala nang alerto ng Tokenping na darating dito. Ipadala ang /start para makatanggap ulit ng mga ito.",
  unsubscribeFailed: "Nagkaproblema habang itinitigil ang mga alerto. Ipadala ulit ang /stop.",
  help:
    "Pinapadalhan ka ng Tokenping ng mensahe kapag bumaba ang health factor mo sa Aave o Morpho sa threshold na itinakda mo sa app.\n\n" +
    "I-type ang Telegram username mo sa alerto mo sa Tokenping, tapos ipadala ang /start dito nang isang beses.\n\n" +
    "Mga command:\n" +
    "/start: i-link ang chat na ito sa username mo\n" +
    "/stop: itigil ang lahat ng alerto ng Tokenping dito\n" +
    "/help: ipakita ang mensaheng ito",
  unknownCommand: "Sa /start, /stop at /help lang ako sumasagot. Pamahalaan ang mga alerto mo sa Tokenping app.",
};
