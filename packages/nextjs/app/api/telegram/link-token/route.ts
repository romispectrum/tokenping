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
import { requireActiveAccess } from "~~/services/api/server/access";
import { MISSING_USER_ID, internalError, jsonError, parseUserId, readJsonObject } from "~~/services/api/server/http";
import { isTelegramConfigured } from "~~/services/telegram/sendTelegram";
import { createLinkToken } from "~~/services/telegram/telegramLinks";

export async function POST(request: Request) {
  try {
    const userId = parseUserId((await readJsonObject(request)).userId);
    if (!userId) return jsonError(MISSING_USER_ID, 400);

    // Checked before the configuration, so unconfigured servers still answer 403 to wallets without access.
    const denied = await requireActiveAccess(userId, "Active paid access required to connect Telegram");
    if (denied) return denied;

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername || !isTelegramConfigured()) {
      return jsonError("Telegram is not configured on this server", 503);
    }

    const { token, expiresAt } = await createLinkToken(userId);

    return NextResponse.json({
      token,
      botUsername,
      expiresAt,
      deepLink: `https://t.me/${botUsername}?start=${token}`,
    });
  } catch (e) {
    return internalError(e);
  }
}
