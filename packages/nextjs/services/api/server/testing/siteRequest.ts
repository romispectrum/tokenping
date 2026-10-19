import { sessionCookieName } from "~~/services/api/server/session";
import { createSessionToken, getSessionSecret } from "~~/services/auth/sessionToken";

/** The origin of the route tests' URLs (http://localhost/...), as the site's own pages send it. */
export const TEST_ORIGIN = "http://localhost";

/** A Cookie header pair carrying a valid session for `wallet`. */
export const sessionCookie = (wallet: string) => {
  const secret = getSessionSecret();
  if (!secret) throw new Error("No session secret: tests run outside production, where a random one stands in");
  return `${sessionCookieName()}=${createSessionToken(wallet, secret)}`;
};

type SiteRequestOptions = {
  method?: string;
  /** A string is sent as is (malformed JSON), anything else as JSON. */
  body?: unknown;
  /** The signed-in wallet; null or omitted sends no session. */
  wallet?: string | null;
  /** Added last; undefined removes a default header. */
  headers?: Record<string, string | undefined>;
};

/**
 * A request as the site's own page sends it: a session cookie for `wallet`, and for anything but GET the page's
 * Origin and a JSON Content-Type.
 */
export const siteRequest = (url: string, { method = "GET", body, wallet, headers = {} }: SiteRequestOptions = {}) => {
  const merged: Record<string, string | undefined> = {
    ...(method === "GET" ? {} : { origin: TEST_ORIGIN, "content-type": "application/json" }),
    ...(wallet ? { cookie: sessionCookie(wallet) } : {}),
    ...headers,
  };
  return new Request(url, {
    method,
    headers: Object.fromEntries(Object.entries(merged).filter((entry): entry is [string, string] => !!entry[1])),
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
};
