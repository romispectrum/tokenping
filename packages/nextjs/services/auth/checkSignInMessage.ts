import "server-only";
import { type Address, type Chain, getAddress, isAddress } from "viem";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { SIGN_IN_TTL_SECONDS, getSignInChain } from "~~/services/auth/signInMessage";
import { SITE_URL } from "~~/utils/seo";

type Expected = {
  /** The site's origin as the request reached it (requestOrigin). */
  origin: string;
  /** The nonce this browser was given (its nonce cookie). */
  nonce: string;
  now: Date;
};

export type SignInMessageCheck = { address: Address; chain: Chain } | { error: string };

/** Clock skew tolerated between the browser that wrote Issued At and this server. */
const SKEW_MS = 60_000;

const originOfUrl = (url: string | undefined) => {
  try {
    return url ? [new URL(url).origin] : [];
  } catch {
    return [];
  }
};

/**
 * The origins a sign-in may be for in production: the site's own URL (NEXT_PUBLIC_SITE_URL), NEXT_PUBLIC_APP_URL, and
 * the deployment's own Vercel URLs. The origin a request names comes from its Host and x-forwarded-* headers, which
 * only the hosting proxy can vouch for, so a message for another domain is refused even when a forged header would
 * match it. Development accepts the origin the request names (localhost, a LAN address).
 */
export const isSignInOrigin = (origin: string) => {
  if (process.env.NODE_ENV !== "production") return true;
  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  const allowed = [SITE_URL, process.env.NEXT_PUBLIC_APP_URL, ...vercelHosts.map(host => host && `https://${host}`)];
  return allowed.flatMap(originOfUrl).includes(origin);
};

const isValidDate = (date: Date | undefined) => date === undefined || !Number.isNaN(date.getTime());

/**
 * Checks everything in an EIP-4361 message except the signature: it must be for this site (one of its own origins,
 * with domain = the host, URI on this origin, scheme if given), name a chain the server can verify on, carry this
 * browser's nonce, and be fresh (issued in the last SIGN_IN_TTL_SECONDS, not expired, not before its Not Before).
 * Returns the signer to verify.
 */
export const checkSignInMessage = (message: string, { origin, nonce, now }: Expected): SignInMessageCheck => {
  const parsed = parseSiweMessage(message);
  if (!parsed.address || !isAddress(parsed.address, { strict: false }) || parsed.version !== "1") {
    return { error: "Not a sign-in message" };
  }

  const site = new URL(origin);
  const sameSite =
    isSignInOrigin(site.origin) &&
    parsed.domain === site.host &&
    originOfUrl(parsed.uri)[0] === site.origin &&
    (parsed.scheme === undefined || `${parsed.scheme}:` === site.protocol);
  if (!sameSite) return { error: "This sign-in message is for another site" };

  const chain = getSignInChain(parsed.chainId);
  if (!chain) return { error: "Sign-in is not supported on this chain" };

  const issuedAt = parsed.issuedAt?.getTime();
  const fresh =
    issuedAt !== undefined &&
    issuedAt <= now.getTime() + SKEW_MS &&
    issuedAt > now.getTime() - SIGN_IN_TTL_SECONDS * 1000 &&
    isValidDate(parsed.expirationTime) &&
    isValidDate(parsed.notBefore);
  // validateSiweMessage compares the nonce and the Expiration Time and Not Before with `now`.
  if (!fresh || !validateSiweMessage({ message: parsed, nonce, time: now })) {
    return { error: "This sign-in request has expired. Sign in again." };
  }

  return { address: getAddress(parsed.address), chain };
};
