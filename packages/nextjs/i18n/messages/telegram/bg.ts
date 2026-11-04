import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping работи само в лични чатове. Моля, пишете директно на бота.",
  noUsername:
    "Вашият акаунт в Telegram все още няма потребителско име. Задайте го в Telegram (Настройки, после Потребителско " +
    "име), въведете го в известието си в Tokenping и после изпратете отново /start тук.",
  linkSaveFailed: "Нещо се обърка при свързването на този чат. Моля, изпратете /start отново.",
  linked: username =>
    `Свързано: @${username}. Известията от Tokenping, които посочват @${username}, ще пристигат в този чат.\n\n` +
    "Изпратете /stop по всяко време, за да ги спрете.",
  unsubscribed:
    "Спряно. Известия от Tokenping повече няма да пристигат тук. Изпратете /start, за да ги получавате отново.",
  unsubscribeFailed: "Нещо се обърка при спирането на известията. Моля, изпратете /stop отново.",
  help:
    "Tokenping ви пише, когато вашият health factor в Aave или Morpho падне под прага, който сте задали в приложението.\n\n" +
    "Въведете потребителското си име в Telegram в известието си в Tokenping и после изпратете веднъж /start тук.\n\n" +
    "Команди:\n" +
    "/start: свързва този чат с вашето потребителско име\n" +
    "/stop: спира всички известия от Tokenping тук\n" +
    "/help: показва това съобщение",
  unknownCommand: "Отговарям само на /start, /stop и /help. Управлявайте известията си в приложението Tokenping.",
};
