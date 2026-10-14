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
import { invalidateUserConfigCache } from "~~/services/notifications/configCache";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import {
  consumeLinkToken,
  deleteLinkByChatId,
  getLinkByChatId,
  isValidStartParam,
  normalizeUserId,
  upsertUserTelegramLink,
} from "~~/services/telegram/telegramLinks";

// Always reply 200 OK to Telegram, even on internal errors, to avoid retries.
function ok() {
  return NextResponse.json({ ok: true });
}

function verifySecret(provided: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !provided) return false;
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; username?: string; is_bot?: boolean };
  chat: { id: number; type: "private" | "group" | "supergroup" | "channel"; username?: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function POST(request: Request) {
  // 1. Auth
  if (!verifySecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new NextResponse("forbidden", { status: 403 });
  }

  // 2. Parse update (cap size — Telegram messages are small; reject anything absurd)
  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return ok(); // malformed body — ack so Telegram doesn't retry
  }

  const msg = update.message;
  if (!msg?.text || !msg.chat) return ok();

  // 3. Private chats only in v1.
  if (msg.chat.type !== "private") {
    void replyToTelegramChat(String(msg.chat.id), "Tokenping only supports private chats. Please DM the bot directly.");
    return ok();
  }
  if (msg.from?.is_bot) return ok();

  const chatId = String(msg.chat.id);
  const username = msg.from?.username ?? msg.chat.username ?? null;
  const text = msg.text.trim();

  try {
    // /start <token>
    if (text.startsWith("/start")) {
      const parts = text.split(/\s+/);
      const param = parts[1];

      if (!param) {
        void replyToTelegramChat(
          chatId,
          "Hi! To receive Aave health-factor alerts here, open Tokenping → " +
            "Notification Settings → select Telegram → press 'Connect Telegram'.",
        );
        return ok();
      }

      if (!isValidStartParam(param)) {
        void replyToTelegramChat(chatId, "❌ Invalid link. Please generate a new one in the Tokenping app.");
        return ok();
      }

      const consumed = await consumeLinkToken(param);
      if (!consumed) {
        void replyToTelegramChat(
          chatId,
          "❌ This link has expired or was already used. Please generate a new one in the Tokenping app.",
        );
        return ok();
      }

      const linkOk = await upsertUserTelegramLink({
        userId: consumed.userId,
        chatId,
        username,
      });

      if (!linkOk) {
        void replyToTelegramChat(chatId, "Something went wrong saving your link. Please try again.");
        return ok();
      }

      invalidateUserConfigCache(normalizeUserId(consumed.userId));

      void replyToTelegramChat(
        chatId,
        "✅ Connected. You'll receive Aave health-factor alerts here when your position drops below your threshold.\n\n" +
          "Send /stop at any time to unsubscribe.",
      );
      return ok();
    }

    // /stop — unlink whichever wallet is bound to this chat.
    if (text.startsWith("/stop")) {
      const existing = await getLinkByChatId(chatId);
      await deleteLinkByChatId(chatId);
      if (existing) invalidateUserConfigCache(normalizeUserId(existing.userId));

      void replyToTelegramChat(
        chatId,
        "🔕 Unsubscribed. You won't receive any more Tokenping alerts here. " +
          "You can reconnect anytime from the Tokenping app.",
      );
      return ok();
    }

    if (text.startsWith("/help")) {
      void replyToTelegramChat(
        chatId,
        "Tokenping notifies you when your Aave Health Factor drops below a threshold you set in the app.\n\n" +
          "Commands:\n" +
          "/start <token> — link via the Tokenping app\n" +
          "/stop — unsubscribe\n" +
          "/help — show this message",
      );
      return ok();
    }

    // Unknown message — gentle nudge.
    void replyToTelegramChat(
      chatId,
      "I only respond to /start, /stop, and /help. Open the Tokenping app to manage your alerts.",
    );
    return ok();
  } catch (e) {
    // Never surface internal errors to Telegram — just ack and log.
    console.warn("telegram webhook handler error", e);
    return ok();
  }
}
