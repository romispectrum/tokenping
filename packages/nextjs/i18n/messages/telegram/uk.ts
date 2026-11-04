import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping працює лише в приватних чатах. Напишіть боту напряму.",
  noUsername:
    "У вашого акаунта Telegram ще немає імені користувача. Задайте його в Telegram (Налаштування, потім Ім'я " +
    "користувача), введіть його у своєму сповіщенні в Tokenping, а потім знову надішліть сюди /start.",
  linkSaveFailed: "Не вдалося підключити цей чат. Надішліть /start ще раз.",
  linked: username =>
    `Підключено @${username}. Сповіщення Tokenping, у яких указано @${username}, надходитимуть у цей чат.\n\n` +
    "Щоб зупинити їх, будь-коли надішліть /stop.",
  unsubscribed:
    "Зупинено. Сповіщення Tokenping більше не надходитимуть сюди. Щоб отримувати їх знову, надішліть /start.",
  unsubscribeFailed: "Не вдалося зупинити сповіщення. Надішліть /stop ще раз.",
  help:
    "Tokenping пише вам, коли ваш health factor в Aave або Morpho падає нижче порогу, який ви встановили в застосунку.\n\n" +
    "Введіть своє ім'я користувача Telegram у сповіщенні в Tokenping, а потім один раз надішліть сюди /start.\n\n" +
    "Команди:\n" +
    "/start: підключити цей чат до вашого імені користувача\n" +
    "/stop: зупинити тут усі сповіщення Tokenping\n" +
    "/help: показати це повідомлення",
  unknownCommand: "Я відповідаю лише на /start, /stop і /help. Керуйте сповіщеннями в застосунку Tokenping.",
};
