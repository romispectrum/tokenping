/**
 * POST /api/attribution
 *
 * Stores the optional "How did you hear about Tokenping?" answer the settings card offers once after an alert is saved.
 * POST only, on purpose: there is no GET, and no other route reads the answers back (see attributionRepository).
 *
 * Auth model: the answer is stored for the signed-in wallet (the session cookie from Sign-in with Ethereum, 401
 * without one), which must have the same paid access as config writes. A `userId` an older client still sends must
 * name that wallet (403 otherwise). Only the first answer per wallet is kept, so a second browser or a second prompt
 * never replaces it.
 *
 * Errors: the details go to the server log, never to the caller, so a response reveals nothing about the table.
 */
import { NextResponse } from "next/server";
import { requireActiveAccess } from "~~/services/api/server/access";
import { jsonError, readJsonObject, rejectCrossSiteRequest } from "~~/services/api/server/http";
import { requireSessionWallet } from "~~/services/api/server/session";
import { parseAttributionAnswer } from "~~/services/notifications/attributionInput";
import { saveAttributionAnswer } from "~~/services/notifications/attributionRepository";

const LOG_PREFIX = "POST /api/attribution:";

export async function POST(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const body = await readJsonObject(request);

    const session = requireSessionWallet(request, body.userId);
    if (session.response) return session.response;
    const userId = session.wallet;

    const parsed = parseAttributionAnswer(body.answer);
    if ("error" in parsed) return jsonError(parsed.error, 400);

    const denied = await requireActiveAccess(userId, "Active paid access required to send an answer");
    if (denied) return denied;

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
