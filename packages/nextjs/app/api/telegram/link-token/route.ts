/**
 * POST /api/telegram/link-token
 *
 * Issues a one-shot, time-limited token the user embeds in the deep-link
 * `https://t.me/<bot>?start=<token>`. When the user presses Start in Telegram,
 * our webhook receives `/start <token>`, consumes it atomically, and links
 * their chat_id to the wallet.
 *
 * Auth model:
 *   Matches the existing `/api/notifications/config` PUT/DELETE pattern —
 *   `isAccessActive(userId)` (paid-access gate). This pattern does NOT verify
 *   that the caller controls the wallet — a known limitation across the existing
 *   API surface. Hardening to SIWE / signed sessions is tracked as a separate
 *   security task. See the security review in commit history for blast-radius.
 */
import { NextResponse } from "next/server";
import { isAccessActive } from "~~/services/payments/checkAccess";
import { createLinkToken } from "~~/services/telegram/telegramLinks";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json({ error: "Missing or invalid userId" }, { status: 400 });
    }

    const trimmed = userId.trim();

    const active = await isAccessActive(trimmed);
    if (!active) {
      return NextResponse.json({ error: "Active paid access required to connect Telegram" }, { status: 403 });
    }

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername || !process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram is not configured on this server" }, { status: 503 });
    }

    const { token, expiresAt } = await createLinkToken(trimmed);

    return NextResponse.json({
      token,
      botUsername,
      expiresAt,
      deepLink: `https://t.me/${botUsername}?start=${token}`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
