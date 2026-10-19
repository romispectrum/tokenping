/**
 * POST /api/auth/nonce: starts a sign-in. Answers `{ nonce }` for the EIP-4361 message the wallet signs, and sets the
 * same nonce in an HttpOnly cookie, so only this browser can finish the sign-in with it. The nonce is stored in
 * auth_nonces and works once, for SIGN_IN_TTL_SECONDS. POST rather than GET, because it writes a row: a cross-site
 * <img> or link cannot call it.
 */
import { NextResponse } from "next/server";
import { jsonError, rejectCrossSiteRequest } from "~~/services/api/server/http";
import { sessionSecretMissing, setNonceCookie } from "~~/services/api/server/session";
import { createNonce, storeNonce } from "~~/services/auth/nonceStore";
import { getSessionSecret } from "~~/services/auth/sessionToken";

export async function POST(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request, { json: false });
    if (refused) return refused;
    // A sign-in could never end in a session, so do not start one.
    if (!getSessionSecret()) return sessionSecretMissing();

    const nonce = createNonce();
    const error = await storeNonce(nonce);
    if (error) {
      console.error("POST /api/auth/nonce: storing the nonce failed", { message: error.message });
      return jsonError("Sign-in is not available right now", 503);
    }

    const response = NextResponse.json({ nonce }, { headers: { "Cache-Control": "no-store" } });
    setNonceCookie(response, nonce);
    return response;
  } catch (e) {
    console.error("POST /api/auth/nonce failed", e);
    return jsonError("Sign-in is not available right now", 500);
  }
}
