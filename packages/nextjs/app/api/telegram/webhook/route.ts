/**
 * POST /api/telegram/webhook
 *
 * Telegram delivers bot updates here. Currently we handle:
 *   /start: remember this chat under the sender's username, so alerts that name the username reach it. Anything
 *           after the command (an old deep-link token) is ignored. A sender without a username is told to set one.
 *   /stop:  forget this chat, which stops every alert to it
 *   /help:  short help message
 *
 * Replies are in Czech when the sender's Telegram app is set to Czech or Slovak (message.from.language_code), in
 * Spanish when it is set to any Spanish, in English otherwise.
 *
 * Security:
 *   - Verify the secret_token via the X-Telegram-Bot-Api-Secret-Token header
 *     using a timing-safe comparison.
 *   - Restrict to private chats only (`msg.chat.type === "private"`) in v1.
 *     Group chats expose alerts to every member and complicate the unlink flow.
 *   - The chat is stored under the username Telegram reports for the sender, never one taken from the message
 *     text, so only the account that owns a username can link it (see telegramChats.ts).
 *
 * Reliability:
 *   - Telegram retries any update that does not get a 2xx, so malformed bodies, ignored updates and errors thrown
 *     by a command handler (logged with console.warn) are all answered 200. An update of the wrong shape (a JSON
 *     null, a non-string text) still throws before the handler runs and gets a 500.
 */
import { NextResponse, after } from "next/server";
import { parseCommand, telegramLocale } from "~~/app/api/telegram/bot";
import type { Locale } from "~~/i18n/locales";
import { TELEGRAM_REPLIES } from "~~/i18n/messages/telegram";
import { safeEqual } from "~~/services/api/server/auth";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import { deleteTelegramChat, linkTelegramChat } from "~~/services/telegram/telegramChats";
import { TELEGRAM_USERNAME_REGEX, normalizeTelegramUsername } from "~~/utils/notifications/validation";

type TelegramMessage = {
  message_id: number;
  from?: { id: number; username?: string; is_bot?: boolean; language_code?: string };
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

type Replies = (typeof TELEGRAM_REPLIES)[Locale];

/** Links this chat to the sender's username; a sender without one (or with one Telegram should never issue) is told why. */
async function handleStart(chatId: string, rawUsername: string | null, t: Replies) {
  const username = rawUsername ? normalizeTelegramUsername(rawUsername) : "";
  if (!TELEGRAM_USERNAME_REGEX.test(username)) return reply(chatId, t.noUsername);

  const error = await linkTelegramChat({ chatId, username });
  if (error) {
    console.error("telegram /start: failed to link the chat", error);
    return reply(chatId, t.linkSaveFailed);
  }
  reply(chatId, t.linked(username));
}

/** Forgets this chat: no alert reaches it until it sends /start again. */
async function handleStop(chatId: string, t: Replies) {
  const error = await deleteTelegramChat(chatId);
  if (error) {
    console.error("telegram /stop: failed to delete the chat", error);
    return reply(chatId, t.unsubscribeFailed);
  }
  reply(chatId, t.unsubscribed);
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
  const t = TELEGRAM_REPLIES[telegramLocale(msg.from?.language_code)];

  // Private chats only in v1 (checked before the bot filter, so bots in groups get the reply too).
  if (msg.chat.type !== "private") {
    reply(String(msg.chat.id), t.privateChatsOnly);
    return ok();
  }
  if (msg.from?.is_bot) return ok();

  const chatId = String(msg.chat.id);
  // In a private chat the sender is the chat, so its username is the sender's.
  const username = msg.from?.username ?? msg.chat.username ?? null;
  const command = parseCommand(msg.text);

  try {
    if (command.name === "start") await handleStart(chatId, username, t);
    else if (command.name === "stop") await handleStop(chatId, t);
    else if (command.name === "help") reply(chatId, t.help);
    else reply(chatId, t.unknownCommand);
  } catch (e) {
    console.warn("telegram webhook handler error", e);
  }
  return ok();
}
