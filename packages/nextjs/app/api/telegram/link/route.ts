/**
 * GET    /api/telegram/link?userId=0x...   — read current Telegram link (uncached, used for handshake polling)
 * DELETE /api/telegram/link                — disconnect Telegram for a user (UI "Disconnect" button)
 *
 * NOT cached, intentionally: the UI polls this during the handshake and needs
 * to see the new chat_id immediately after the webhook writes it.
 */
import { NextResponse } from "next/server";
import { invalidateUserConfigCache } from "~~/services/notifications/configCache";
import { isAccessActive } from "~~/services/payments/checkAccess";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";
import { deleteLinkByUserId, getLinkByUserId, normalizeUserId } from "~~/services/telegram/telegramLinks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    const link = await getLinkByUserId(userId);
    if (!link) return NextResponse.json({ linked: false });

    return NextResponse.json({
      linked: true,
      chatId: link.chatId,
      username: link.username,
      linkedAt: link.linkedAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    const trimmed = userId.trim();
    const active = await isAccessActive(trimmed);
    if (!active) {
      return NextResponse.json({ error: "Active paid access required" }, { status: 403 });
    }

    // Look up the current chat_id BEFORE deletion so we can send a farewell.
    const existing = await getLinkByUserId(trimmed);
    await deleteLinkByUserId(trimmed);
    invalidateUserConfigCache(normalizeUserId(trimmed));

    if (existing?.chatId) {
      // Best-effort farewell message; failures are silent (see replyToTelegramChat).
      void replyToTelegramChat(
        existing.chatId,
        "🔕 Tokenping disconnected from this chat. You won't receive Aave alerts here anymore. " +
          "You can reconnect anytime from the Tokenping app.",
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
