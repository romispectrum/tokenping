export const TELEGRAM_REPLIES = {
  privateChatsOnly: "Tokenping only supports private chats. Please DM the bot directly.",
  startWithoutToken:
    "Hi! To receive Aave health-factor alerts here, open Tokenping → " +
    "Notification settings → select Telegram → press 'Connect Telegram'.",
  invalidLink: "❌ Invalid link. Please generate a new one in the Tokenping app.",
  expiredLink: "❌ This link has expired or was already used. Please generate a new one in the Tokenping app.",
  linkSaveFailed: "Something went wrong saving your link. Please try again.",
  connected:
    "✅ Connected. You'll receive Aave health-factor alerts here when your position drops below your threshold.\n\n" +
    "Send /stop at any time to unsubscribe.",
  unsubscribed:
    "🔕 Unsubscribed. You won't receive any more Tokenping alerts here. " +
    "You can reconnect anytime from the Tokenping app.",
  unsubscribeFailed: "Something went wrong while unsubscribing. Please send /stop again.",
  help:
    "Tokenping notifies you when your Aave Health Factor drops below a threshold you set in the app.\n\n" +
    "Commands:\n" +
    "/start <token>: link via the Tokenping app\n" +
    "/stop: unsubscribe\n" +
    "/help: show this message",
  unknownCommand: "I only respond to /start, /stop, and /help. Open the Tokenping app to manage your alerts.",
  disconnected:
    "🔕 Tokenping disconnected from this chat. You won't receive Aave alerts here anymore. " +
    "You can reconnect anytime from the Tokenping app.",
} as const;

export type BotCommand = { name: "start"; token?: string } | { name: "stop" } | { name: "help" } | { name: "unknown" };

/** The whole first word, optionally addressed to the bot as Telegram does in groups ("/stop@tokenping_bot"). */
const COMMAND_PATTERN = /^\/(start|stop|help)(?:@\w+)?$/;

/**
 * Commands are case-sensitive and match the first word exactly ("/stopwatch" is unknown); `/start <token>` takes
 * the next whitespace-separated word as the token.
 */
export const parseCommand = (text: string): BotCommand => {
  const [word, token] = text.trim().split(/\s+/);
  const name = COMMAND_PATTERN.exec(word)?.[1];
  if (name === "start") return { name, token };
  if (name === "stop" || name === "help") return { name };
  return { name: "unknown" };
};
