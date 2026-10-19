/**
 * POST /api/auth/verify { message, signature }: finishes a sign-in. `message` is the EIP-4361 text the wallet signed,
 * with the nonce from POST /api/auth/nonce. It must be for this site, name a supported chain, be fresh, and carry the
 * nonce of this browser's nonce cookie; the nonce is then taken (it never works twice) and the signature checked with
 * viem's verifyMessage, which also accepts smart wallets (ERC-1271, ERC-6492). Success sets the session cookie for
 * the signer and answers `{ address }`, lowercased.
 *
 * Responses: 200; 400 a malformed body; 401 an expired, reused or foreign message, or a signature that does not match;
 * 403 cross-site; 415 not JSON; 503 sign-in not configured or the nonce store unavailable.
 */
import { NextResponse } from "next/server";
import { isHex } from "viem";
import { jsonError, readJsonObject, rejectCrossSiteRequest, requestOrigin } from "~~/services/api/server/http";
import {
  NONCE_COOKIE,
  clearNonceCookie,
  readCookie,
  sessionSecretMissing,
  setSessionCookie,
} from "~~/services/api/server/session";
import { checkSignInMessage } from "~~/services/auth/checkSignInMessage";
import { takeNonce } from "~~/services/auth/nonceStore";
import { createSessionToken, getSessionSecret } from "~~/services/auth/sessionToken";
import { verifyWalletSignature } from "~~/services/auth/verifySignature";

const LOG_PREFIX = "POST /api/auth/verify:";
/** A sign-in message is a few hundred characters; the cap keeps parsing cheap. */
const MAX_MESSAGE_LENGTH = 2_000;
/** ERC-6492 signatures carry the wallet's deployment calldata, so they run to a few kilobytes. */
const MAX_SIGNATURE_LENGTH = 20_000;

/** A 401 that also drops the nonce cookie: whatever went wrong, the next attempt starts with a new nonce. */
const refuse = (message: string) => {
  const response = jsonError(message, 401);
  clearNonceCookie(response);
  return response;
};

export async function POST(request: Request) {
  try {
    const refused = rejectCrossSiteRequest(request);
    if (refused) return refused;
    const secret = getSessionSecret();
    if (!secret) return sessionSecretMissing();

    const { message, signature } = await readJsonObject(request);
    if (typeof message !== "string" || !message || message.length > MAX_MESSAGE_LENGTH) {
      return jsonError("Missing or invalid message", 400);
    }
    if (typeof signature !== "string" || !isHex(signature) || signature.length > MAX_SIGNATURE_LENGTH) {
      return jsonError("Missing or invalid signature", 400);
    }

    const nonce = readCookie(request, NONCE_COOKIE);
    if (!nonce) return refuse("This sign-in request has expired. Sign in again.");

    const checked = checkSignInMessage(message, { origin: requestOrigin(request), nonce, now: new Date() });
    if ("error" in checked) return refuse(checked.error);

    // Taken before the signature check, so a replayed message never reaches the RPC.
    if (!(await takeNonce(nonce))) return refuse("This sign-in request has expired. Sign in again.");

    const valid = await verifyWalletSignature({ chain: checked.chain, address: checked.address, message, signature });
    if (!valid) return refuse("The signature does not match this wallet");

    const address = checked.address.toLowerCase();
    const response = NextResponse.json({ address }, { headers: { "Cache-Control": "no-store" } });
    setSessionCookie(response, createSessionToken(address, secret));
    clearNonceCookie(response);
    return response;
  } catch (e) {
    console.error(`${LOG_PREFIX} failed`, e);
    return jsonError("Could not sign you in", 500);
  }
}
