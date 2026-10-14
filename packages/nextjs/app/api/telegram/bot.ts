export const TELEGRAM_REPLIES = {
  privateChatsOnly: "Tokenping only supports private chats. Please DM the bot directly.",
  startWithoutToken:
    "Hi! To receive Aave health-factor alerts here, open Tokenping → " +
    "Notification Settings → select Telegram → press 'Connect Telegram'.",
  invalidLink: "❌ Invalid link. Please generate a new one in the Tokenping app.",
  expiredLink: "❌ This link has expired or was already used. Please generate a new one in the Tokenping app.",
  linkSaveFailed: "Something went wrong saving your link. Please try again.",
  connected:
    "✅ Connected. You'll receive Aave health-factor alerts here when your position drops below your threshold.\n\n" +
    "Send /stop at any time to unsubscribe.",
  unsubscribed:
    "🔕 Unsubscribed. You won't receive any more Tokenping alerts here. " +
    "You can reconnect anytime from the Tokenping app.",
  help:
    "Tokenping notifies you when your Aave Health Factor drops below a threshold you set in the app.\n\n" +
    "Commands:\n" +
    "/start <token> — link via the Tokenping app\n" +
    "/stop — unsubscribe\n" +
    "/help — show this message",
  unknownCommand: "I only respond to /start, /stop, and /help. Open the Tokenping app to manage your alerts.",
  disconnected:
    "🔕 Tokenping disconnected from this chat. You won't receive Aave alerts here anymore. " +
    "You can reconnect anytime from the Tokenping app.",
} as const;

export type BotCommand = { name: "start"; token?: string } | { name: "stop" } | { name: "help" } | { name: "unknown" };

/**
 * Commands are case-sensitive; `/start <token>` takes the first whitespace-separated word after the command.
 * BUG(S3.21): matching is by prefix, so "/stopwatch" counts as /stop and "/startabc" as /start without a token.
 */
export const parseCommand = (text: string): BotCommand => {
  const trimmed = text.trim();
  if (trimmed.startsWith("/start")) return { name: "start", token: trimmed.split(/\s+/)[1] };
  if (trimmed.startsWith("/stop")) return { name: "stop" };
  if (trimmed.startsWith("/help")) return { name: "help" };
  return { name: "unknown" };
};
