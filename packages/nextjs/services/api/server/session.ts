import type { NextResponse } from "next/server";
import "server-only";
import { type Address, getAddress } from "viem";
import { jsonError, parseUserId } from "~~/services/api/server/http";
import { SESSION_MAX_AGE_SECONDS, getSessionSecret, readSessionToken } from "~~/services/auth/sessionToken";
import { SIGN_IN_TTL_SECONDS } from "~~/services/auth/signInMessage";
import { normalizeAddress } from "~~/utils/address";

// The cookies behind sign-in: the session (which wallet signed in) and, for the few minutes between asking for a
// nonce and sending the signed message, that nonce. Both are HttpOnly, so page scripts never see them.

export const SIGN_IN_REQUIRED = "Sign in with your wallet first";

const isProduction = () => process.env.NODE_ENV === "production";

/**
 * In production the cookies are Secure, and the session's __Host- prefix makes the browser refuse one set by a
 * subdomain or over plain HTTP. `next dev` serves plain HTTP, where a Secure cookie is not stored everywhere.
 */
export const sessionCookieName = () => (isProduction() ? "__Host-tokenping-session" : "tokenping-session");
export const NONCE_COOKIE = "tokenping-sign-in-nonce";
/** The nonce cookie only goes back to the sign-in routes. */
const NONCE_COOKIE_PATH = "/api/auth";

/** A cookie's value from the request's Cookie header. Values here are base64url and hex, so nothing is decoded. */
export const readCookie = (request: Request, name: string) => {
  for (const pair of (request.headers.get("cookie") ?? "").split(";")) {
    const separator = pair.indexOf("=");
    if (separator !== -1 && pair.slice(0, separator).trim() === name) return pair.slice(separator + 1).trim();
  }
  return undefined;
};

export const setSessionCookie = (response: NextResponse, token: string) =>
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

export const clearSessionCookie = (response: NextResponse) =>
  response.cookies.set(sessionCookieName(), "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

export const setNonceCookie = (response: NextResponse, nonce: string) =>
  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    path: NONCE_COOKIE_PATH,
    maxAge: SIGN_IN_TTL_SECONDS,
  });

export const clearNonceCookie = (response: NextResponse) =>
  response.cookies.set(NONCE_COOKIE, "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "strict",
    path: NONCE_COOKIE_PATH,
    maxAge: 0,
  });

/** 503 for a production server without SESSION_SECRET: no session can be issued or trusted, so none is. */
export const sessionSecretMissing = () => {
  console.error("SESSION_SECRET is not set (or shorter than 32 characters): sign-in and the alert API are disabled.");
  return jsonError("Sign-in is not available on this server", 503);
};

/** The signed-in wallet (lowercased), or null without a valid session. Null as well when no secret is configured. */
export const getSessionWallet = (request: Request) => {
  const secret = getSessionSecret();
  return secret ? readSessionToken(readCookie(request, sessionCookieName()), secret) : null;
};

type SessionCheck = { wallet: Address; response?: never } | { wallet?: never; response: Response };

/**
 * The wallet the request acts for: always the signed-in one, as an EIP-55 address (userIdForms then also finds rows
 * stored with checksummed casing). 401 without a session, 503 without SESSION_SECRET in production. A `claimedUserId`
 * from an older client is only compared: 403 when it names another wallet.
 */
export const requireSessionWallet = (request: Request, claimedUserId?: unknown): SessionCheck => {
  const secret = getSessionSecret();
  if (!secret) return { response: sessionSecretMissing() };

  const wallet = readSessionToken(readCookie(request, sessionCookieName()), secret);
  if (!wallet) return { response: jsonError(SIGN_IN_REQUIRED, 401) };

  const claimed = parseUserId(claimedUserId);
  if (claimed !== null && normalizeAddress(claimed) !== wallet) {
    return { response: jsonError("userId does not match the signed-in wallet", 403) };
  }
  return { wallet: getAddress(wallet) };
};
