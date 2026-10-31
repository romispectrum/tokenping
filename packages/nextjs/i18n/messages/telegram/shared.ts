export type TelegramReplies = {
  privateChatsOnly: string;
  /** /start from an account without a username: there is nothing an alert could name. */
  noUsername: string;
  linkSaveFailed: string;
  /** /start linked `username` to this chat. */
  linked: (username: string) => string;
  unsubscribed: string;
  unsubscribeFailed: string;
  help: string;
  unknownCommand: string;
};
