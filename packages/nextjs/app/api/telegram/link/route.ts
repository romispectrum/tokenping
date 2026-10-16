/**
 * GET    /api/telegram/link?userId=0x...: read current Telegram link (uncached, used for handshake polling)
 * DELETE /api/telegram/link:              disconnect Telegram for a user (UI "Disconnect" button). The body's
 *                                         optional `locale` ("en" | "cs", the site language) picks the farewell's
 *                                         language; anything else is English.
 *
 * NOT cached, intentionally: the UI polls this during the handshake and needs
 * to see the new chat_id immediately after the webhook writes it.
 */
import { NextResponse, after } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "~~/i18n/locales";
import { TELEGRAM_REPLIES } from "~~/i18n/messages/telegram";
import { requireActiveAccess } from "~~/services/api/server/access";
import { MISSING_USER_ID, internalError, jsonError, parseUserId, readJsonObject } from "~~/services/api/server/http";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import { deleteLinkByUserId, getLinkByUserId } from "~~/services/telegram/telegramLinks";
import type { TelegramLinkStatus } from "~~/types/notifications";

export async function GET(request: Request) {
  try {
    const userId = parseUserId(new URL(request.url).searchParams.get("userId"));
    if (!userId) return jsonError(MISSING_USER_ID, 400);

    // A failed lookup throws and answers 500, which clients read as "status unknown" rather than "not linked".
    const link = await getLinkByUserId(userId);
    if (!link) return NextResponse.json<TelegramLinkStatus>({ linked: false });

    return NextResponse.json<TelegramLinkStatus>({
      linked: true,
      chatId: link.chatId,
      username: link.username,
      linkedAt: link.linkedAt,
    });
  } catch (e) {
    return internalError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await readJsonObject(request);
    const userId = parseUserId(body.userId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);
    // The farewell is best effort, so an unexpected locale falls back to English instead of failing the disconnect.
    const locale = isLocale(body.locale) ? body.locale : DEFAULT_LOCALE;

    const denied = await requireActiveAccess(userId, "Active paid access required");
    if (denied) return denied;

    // Look up the current chat_id BEFORE deletion so we can send a farewell. The farewell is best effort, so a failed
    // lookup only skips it and never blocks the disconnect.
    const existing = await getLinkByUserId(userId).catch(e => {
      console.warn("telegram disconnect: no farewell, the link lookup failed", e);
      return null;
    });
    const error = await deleteLinkByUserId(userId);
    if (error) return jsonError(error.message, 502);

    if (existing?.chatId) {
      const { chatId } = existing;
      // Sent once the response is out; after() keeps serverless alive until it is delivered.
      after(() => replyToTelegramChat(chatId, TELEGRAM_REPLIES[locale].disconnected));
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return internalError(e);
  }
}
