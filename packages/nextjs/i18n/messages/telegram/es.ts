import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping solo funciona en chats privados. Escríbele directamente al bot.",
  noUsername:
    "Tu cuenta de Telegram todavía no tiene nombre de usuario (alias). Crea uno en Telegram (Ajustes, luego " +
    "Alias), escríbelo en tu alerta de Tokenping y vuelve a enviar /start aquí.",
  linkSaveFailed: "Algo salió mal al vincular este chat. Vuelve a enviar /start.",
  linked: username =>
    `Vinculado: @${username}. Las alertas de Tokenping que indiquen @${username} llegarán a este chat.\n\n` +
    "Envía /stop en cualquier momento para detenerlas.",
  unsubscribed: "Alertas detenidas. No llegarán más alertas de Tokenping aquí. Envía /start para volver a recibirlas.",
  unsubscribeFailed: "Algo salió mal al detener las alertas. Vuelve a enviar /stop.",
  help:
    "Tokenping te escribe cuando tu factor de salud en Aave o Morpho cae por debajo de un umbral que fijas en la aplicación.\n\n" +
    "Escribe tu nombre de usuario de Telegram en tu alerta de Tokenping y luego envía /start aquí una vez.\n\n" +
    "Comandos:\n" +
    "/start: vincular este chat con tu nombre de usuario\n" +
    "/stop: detener aquí todas las alertas de Tokenping\n" +
    "/help: mostrar este mensaje",
  unknownCommand: "Solo respondo a /start, /stop y /help. Gestiona tus alertas en la aplicación de Tokenping.",
};
