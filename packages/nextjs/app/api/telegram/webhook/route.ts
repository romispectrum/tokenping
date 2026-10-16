/**
 * POST /api/telegram/webhook
 *
 * Telegram delivers bot updates here. Currently we handle:
 *   /start <token>: consume the deep-link token and attach chat_id to a wallet
 *   /start:         instructions if user opened the bot without a token
 *   /stop:          unlink the bot from this chat (and the wallet behind it)
 *   /help:          short help message
 *
 * Replies are in Czech when the sender's Telegram app is set to Czech or Slovak (message.from.language_code), in
 * English otherwise.
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
import { parseCommand, telegramLocale } from "~~/app/api/telegram/bot";
import type { Locale } from "~~/i18n/locales";
import { TELEGRAM_REPLIES } from "~~/i18n/messages/telegram";
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

async function handleStart(chatId: string, username: string | null, token: string | undefined, t: Replies) {
  if (!token) return reply(chatId, t.startWithoutToken);
  if (!isValidStartParam(token)) return reply(chatId, t.invalidLink);

  const consumed = await consumeLinkToken(token);
  if (!consumed) return reply(chatId, t.expiredLink);

  const linked = await upsertUserTelegramLink({ userId: consumed.userId, chatId, username });
  reply(chatId, linked ? t.connected : t.linkSaveFailed);
}

/** Unlinks whichever wallet is bound to this chat. */
async function handleStop(chatId: string, t: Replies) {
  const error = await deleteLinkByChatId(chatId);
  if (error) {
    console.error("telegram /stop: failed to delete the link", error);
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
  const username = msg.from?.username ?? msg.chat.username ?? null;
  const command = parseCommand(msg.text);

  try {
    if (command.name === "start") await handleStart(chatId, username, command.token, t);
    else if (command.name === "stop") await handleStop(chatId, t);
    else if (command.name === "help") reply(chatId, t.help);
    else reply(chatId, t.unknownCommand);
  } catch (e) {
    console.warn("telegram webhook handler error", e);
  }
  return ok();
}
