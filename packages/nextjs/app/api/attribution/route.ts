/**
 * POST /api/attribution
 *
 * Stores the optional "How did you hear about Tokenping?" answer the settings card offers once after an alert is saved.
 * POST only, on purpose: there is no GET, and no other route reads the answers back (see attributionRepository).
 *
 * Auth model: the same paid-access gate as config writes (`isAccessActive(userId)`). Like the rest of the API it does
 * not prove the caller controls the wallet (no SIWE yet).
 *
 * Accepted risk: paying wallets are public (PaymentReceived events), so anyone can send an answer for any wallet with
 * active access. Only the first answer per wallet is kept, so a spoofed answer can never replace a real one, but it
 * can pre-empt a wallet that has not answered yet: the real answer is then dropped while the user is still thanked.
 * Latest-wins would let anyone overwrite every real answer at any time, and a cap of a few rows per wallet only means
 * a spoofer sends a few more requests, so neither helps without wallet signatures. The answers are marketing input
 * only; read them as indicative (bulk spoofing shows up as many rows with near-identical created_at).
 *
 * Errors: the details go to the server log, never to the caller, so a response reveals nothing about the table.
 */
import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { requireActiveAccess } from "~~/services/api/server/access";
import { MISSING_USER_ID, jsonError, parseUserId, readJsonObject } from "~~/services/api/server/http";
import { parseAttributionAnswer } from "~~/services/notifications/attributionInput";
import { canStoreAttribution, saveAttributionAnswer } from "~~/services/notifications/attributionRepository";

const LOG_PREFIX = "POST /api/attribution:";

export async function POST(request: Request) {
  try {
    const body = await readJsonObject(request);

    // A real address only (viem's strict check also rejects a wrong EIP-55 checksum), so nothing else is stored.
    const userId = parseUserId(body.userId);
    if (!userId || !isAddress(userId)) return jsonError(MISSING_USER_ID, 400);

    const parsed = parseAttributionAnswer(body.answer);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to send an answer");
    if (denied) return denied;

    // Checked after the access gate, like Telegram's configuration, so wallets without access still get 403.
    if (!canStoreAttribution()) {
      console.error(
        `${LOG_PREFIX} SUPABASE_SERVICE_ROLE_KEY is not set. user_attribution accepts service-role writes only, so no answer can be stored.`,
      );
      return jsonError("Answers are not collected on this server", 503);
    }

    const error = await saveAttributionAnswer(userId, parsed.value);
    if (error) {
      // Code and message only: a constraint violation's details would repeat the wallet and the answer.
      console.error(`${LOG_PREFIX} insert failed`, { code: error.code, message: error.message });
      return jsonError("Could not save your answer", 502);
    }

    // The same response whether the answer was stored or the wallet already had one, so it reveals nothing.
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(`${LOG_PREFIX} failed`, e);
    return jsonError("Could not save your answer", 500);
  }
}
