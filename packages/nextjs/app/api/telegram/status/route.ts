/**
 * GET /api/telegram/status?username=alice_eth: whether that Telegram username has pressed Start in the bot, so the
 * alert form can say "linked" or "press Start once". Not cached: the form asks again while it waits for the Start.
 *
 * It answers only yes or no, never a chat id. Anyone can ask about any username, which tells them whether that
 * account has started the Tokenping bot.
 */
import { NextResponse } from "next/server";
import { internalError, jsonError } from "~~/services/api/server/http";
import { isTelegramUsernameLinked } from "~~/services/telegram/telegramChats";
import type { TelegramUsernameStatus } from "~~/types/notifications";
import { isValidTelegramUsername, normalizeTelegramUsername } from "~~/utils/notifications/validation";

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("username") ?? "";
    if (!isValidTelegramUsername(raw)) return jsonError("Missing or invalid Telegram username", 400);

    // A failed lookup throws and answers 500, which the form reads as "status unknown" rather than "not linked".
    const linked = await isTelegramUsernameLinked(normalizeTelegramUsername(raw));
    return NextResponse.json<TelegramUsernameStatus>({ linked }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return internalError(e);
  }
}
