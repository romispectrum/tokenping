import { createHmac, randomBytes } from "crypto";
import "server-only";
import { safeEqual } from "~~/services/api/server/auth";

// The session cookie's value: the signed-in wallet (lowercased) and when the session ends, signed with HMAC-SHA256
// under SESSION_SECRET. Signed, not encrypted: it only names the wallet its holder proved they control.
//   v1.<base64url JSON { sub, iat, exp }>.<base64url HMAC of "v1.<payload>">
// Rotating SESSION_SECRET signs every wallet out.

/** How long a sign-in lasts. */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** 32 random bytes as hex is 64 characters; anything shorter than 32 is too guessable to sign sessions with. */
export const MIN_SESSION_SECRET_LENGTH = 32;

const VERSION = "v1";
const WALLET_PATTERN = /^0x[0-9a-f]{40}$/;
/** Clock skew tolerated on a token's issue time. */
const SKEW_SECONDS = 60;

type SessionPayload = { sub: string; iat: number; exp: number };

const devSecretHolder = globalThis as typeof globalThis & { tokenpingDevSessionSecret?: string };

/**
 * SESSION_SECRET when it is long enough. In production there is no fallback: without it this returns null and every
 * route that needs a session answers 503 (fail closed). Elsewhere a random secret per process stands in, kept on
 * globalThis so `next dev` reloads keep sessions, which are lost on restart.
 */
export const getSessionSecret = (): string | null => {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= MIN_SESSION_SECRET_LENGTH) return secret;
  if (process.env.NODE_ENV === "production") return null;
  devSecretHolder.tokenpingDevSessionSecret ??= randomBytes(32).toString("hex");
  return devSecretHolder.tokenpingDevSessionSecret;
};

const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

const nowSeconds = (now: Date) => Math.floor(now.getTime() / 1000);

/** A session token for `wallet` (any casing; stored lowercased), valid for SESSION_MAX_AGE_SECONDS from `now`. */
export const createSessionToken = (wallet: string, secret: string, now = new Date()) => {
  const iat = nowSeconds(now);
  const payload: SessionPayload = { sub: wallet.toLowerCase(), iat, exp: iat + SESSION_MAX_AGE_SECONDS };
  const body = `${VERSION}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  return `${body}.${sign(body, secret)}`;
};

const isPayload = (value: unknown): value is SessionPayload => {
  if (typeof value !== "object" || value === null) return false;
  const { sub, iat, exp } = value as Record<string, unknown>;
  return typeof sub === "string" && WALLET_PATTERN.test(sub) && Number.isInteger(iat) && Number.isInteger(exp);
};

/** The lowercased wallet a token was issued for, or null when it is missing, forged, malformed or expired. */
export const readSessionToken = (token: string | undefined, secret: string, now = new Date()): string | null => {
  const parts = token?.split(".");
  if (parts?.length !== 3 || parts[0] !== VERSION) return null;
  const body = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(parts[2], sign(body, secret))) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isPayload(payload)) return null;
  const time = nowSeconds(now);
  return payload.exp > time && payload.iat <= time + SKEW_SECONDS ? payload.sub : null;
};
