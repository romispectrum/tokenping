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
 *   - Always return 200 quickly so Telegram doesn't retry. Internal failures
 *     are swallowed after a logged warning.
 */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { TELEGRAM_REPLIES, parseCommand } from "~~/app/api/telegram/bot";
import { invalidateUserConfigCache } from "~~/services/notifications/configCache";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import {
  consumeLinkToken,
  deleteLinkByChatId,
  getLinkByChatId,
  isValidStartParam,
  upsertUserTelegramLink,
} from "~~/services/telegram/telegramLinks";
import { normalizeAddress } from "~~/utils/address";

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

// Always reply 200 OK to Telegram, even on internal errors, to avoid retries.
const ok = () => NextResponse.json({ ok: true });

/** Not awaited, so Telegram gets its 200 quickly. BUG(B3.4): serverless may drop a reply once the response is sent. */
const reply = (chatId: string, text: string) => {
  void replyToTelegramChat(chatId, text);
};

const UTF8 = new TextEncoder();

function verifySecret(provided: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  const providedBytes = UTF8.encode(provided);
  const expectedBytes = UTF8.encode(expected);
  // timingSafeEqual throws on a length mismatch, so lengths are compared first.
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

async function handleStart(chatId: string, username: string | null, token: string | undefined) {
  if (!token) return reply(chatId, TELEGRAM_REPLIES.startWithoutToken);
  if (!isValidStartParam(token)) return reply(chatId, TELEGRAM_REPLIES.invalidLink);

  const consumed = await consumeLinkToken(token);
  if (!consumed) return reply(chatId, TELEGRAM_REPLIES.expiredLink);

  const linked = await upsertUserTelegramLink({ userId: consumed.userId, chatId, username });
  if (!linked) return reply(chatId, TELEGRAM_REPLIES.linkSaveFailed);

  invalidateUserConfigCache(normalizeAddress(consumed.userId));
  reply(chatId, TELEGRAM_REPLIES.connected);
}

/** Unlinks whichever wallet is bound to this chat. */
async function handleStop(chatId: string) {
  const existing = await getLinkByChatId(chatId);
  await deleteLinkByChatId(chatId);
  if (existing) invalidateUserConfigCache(normalizeAddress(existing.userId));
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
    return ok(); // malformed body — ack so Telegram doesn't retry
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
    // Never surface internal errors to Telegram — just ack and log.
    console.warn("telegram webhook handler error", e);
  }
  return ok();
}
