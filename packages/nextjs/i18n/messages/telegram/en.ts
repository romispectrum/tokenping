import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping only supports private chats. Please message the bot directly.",
  noUsername:
    "Your Telegram account has no username yet. Set one in Telegram (Settings, then Username), type it into " +
    "your alert on Tokenping, then send /start here again.",
  linkSaveFailed: "Something went wrong linking this chat. Please send /start again.",
  linked: username =>
    `Linked @${username}. Tokenping alerts that name @${username} will arrive in this chat.\n\n` +
    "Send /stop at any time to stop them.",
  unsubscribed: "Stopped. No more Tokenping alerts will arrive here. Send /start to receive them again.",
  unsubscribeFailed: "Something went wrong while stopping alerts. Please send /stop again.",
  help:
    "Tokenping messages you when your Aave or Morpho health factor drops below a threshold you set in the app.\n\n" +
    "Type your Telegram username into your alert on Tokenping, then send /start here once.\n\n" +
    "Commands:\n" +
    "/start: link this chat to your username\n" +
    "/stop: stop all Tokenping alerts here\n" +
    "/help: show this message",
  unknownCommand: "I only respond to /start, /stop and /help. Manage your alerts in the Tokenping app.",
};
