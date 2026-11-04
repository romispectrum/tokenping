import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping работает только в личных чатах. Напишите боту напрямую.",
  noUsername:
    "У вашего аккаунта Telegram пока нет имени пользователя. Задайте его в Telegram («Настройки», затем «Имя пользователя»), " +
    "введите его в своё оповещение в Tokenping, а затем снова отправьте сюда /start.",
  linkSaveFailed: "Не удалось привязать этот чат. Отправьте /start ещё раз.",
  linked: username =>
    `Подключено: @${username}. Оповещения Tokenping, в которых указан @${username}, будут приходить в этот чат.\n\n` +
    "Отправьте /stop в любой момент, чтобы их остановить.",
  unsubscribed: "Остановлено. Оповещения Tokenping сюда больше не придут. Отправьте /start, чтобы снова их получать.",
  unsubscribeFailed: "Не удалось остановить оповещения. Отправьте /stop ещё раз.",
  help:
    "Tokenping присылает вам сообщение, когда ваш health factor в Aave или Morpho опускается ниже порога, который вы задали в приложении.\n\n" +
    "Введите своё имя пользователя Telegram в оповещение в Tokenping, а затем один раз отправьте сюда /start.\n\n" +
    "Команды:\n" +
    "/start: привязать этот чат к вашему имени пользователя\n" +
    "/stop: остановить здесь все оповещения Tokenping\n" +
    "/help: показать это сообщение",
  unknownCommand: "Я отвечаю только на /start, /stop и /help. Управлять оповещениями можно в приложении Tokenping.",
};
