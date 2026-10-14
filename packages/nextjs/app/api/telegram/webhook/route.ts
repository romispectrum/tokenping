/**
 * POST /api/telegram/webhook
 *
 * Telegram delivers bot updates here. Currently we handle:
 *   /start <token>  — consume the deep-link token and attach chat_id to a wallet
 *   /start          — instructions if user opened the bot without a token
 *   /stop           — unlink the bot from this chat (and the wallet behind it)
 *   /help           — short help message
 *
 * Security:
 *   - Verify the secret_token via the X-Telegram-Bot-Api-Secret-Token header
 *     using a timing-safe comparison.
 *   - Restrict to private chats only (`msg.chat.type === "private"`) in v1.
 *     Group chats expose alerts to every member and complicate the unlink flow.
 *   - Token consumption is a single atomic UPDATE ... RETURNING (see telegramLinks.ts).
 *
 * Reliability:
 *   - Telegram retries any update that does not get a 2xx, so malformed bodies, ignored updates and errors thrown
 *     by a command handler (logged with console.warn) are all answered 200. An update of the wrong shape (a JSON
 *     null, a non-string text) still throws before the handler runs and gets a 500.
 */
import { NextResponse, after } from "next/server";
import { TELEGRAM_REPLIES, parseCommand } from "~~/app/api/telegram/bot";
import { safeEqual } from "~~/services/api/server/auth";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import {
  consumeLinkToken,
  deleteLinkByChatId,
  isValidStartParam,
  upsertUserTelegramLink,
} from "~~/services/telegram/telegramLinks";

type TelegramMessage = {
  message_id: number;
  from?: { id: number; username?: string; is_bot?: boolean };
  chat: { id: number; type: "private" | "group" | "supergroup" | "channel"; username?: string };
  text?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

const ok = () => NextResponse.json({ ok: true });

/** Queued with after(): the 200 goes out first, and the serverless function stays alive until the reply is sent. */
const reply = (chatId: string, text: string) => {
  after(() => replyToTelegramChat(chatId, text));
};

function verifySecret(provided: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  return Boolean(expected && provided && safeEqual(provided, expected));
}

async function handleStart(chatId: string, username: string | null, token: string | undefined) {
  if (!token) return reply(chatId, TELEGRAM_REPLIES.startWithoutToken);
  if (!isValidStartParam(token)) return reply(chatId, TELEGRAM_REPLIES.invalidLink);

  const consumed = await consumeLinkToken(token);
  if (!consumed) return reply(chatId, TELEGRAM_REPLIES.expiredLink);

  const linked = await upsertUserTelegramLink({ userId: consumed.userId, chatId, username });
  reply(chatId, linked ? TELEGRAM_REPLIES.connected : TELEGRAM_REPLIES.linkSaveFailed);
}

/** Unlinks whichever wallet is bound to this chat. */
async function handleStop(chatId: string) {
  const error = await deleteLinkByChatId(chatId);
  if (error) {
    console.error("telegram /stop: failed to delete the link", error);
    return reply(chatId, TELEGRAM_REPLIES.unsubscribeFailed);
  }
  reply(chatId, TELEGRAM_REPLIES.unsubscribed);
}

export async function POST(request: Request) {
  if (!verifySecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new NextResponse("forbidden", { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return ok();
  }

  const msg = update.message;
  if (!msg?.text || !msg.chat) return ok();

  // Private chats only in v1 (checked before the bot filter, so bots in groups get the reply too).
  if (msg.chat.type !== "private") {
    reply(String(msg.chat.id), TELEGRAM_REPLIES.privateChatsOnly);
    return ok();
  }
  if (msg.from?.is_bot) return ok();

  const chatId = String(msg.chat.id);
  const username = msg.from?.username ?? msg.chat.username ?? null;
  const command = parseCommand(msg.text);

  try {
    if (command.name === "start") await handleStart(chatId, username, command.token);
    else if (command.name === "stop") await handleStop(chatId);
    else if (command.name === "help") reply(chatId, TELEGRAM_REPLIES.help);
    else reply(chatId, TELEGRAM_REPLIES.unknownCommand);
  } catch (e) {
    console.warn("telegram webhook handler error", e);
  }
  return ok();
}
