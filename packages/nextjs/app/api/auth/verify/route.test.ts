import type { EIP1193RequestFn } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "~~/app/api/auth/verify/route";
import { GET as getConfig } from "~~/app/api/notifications/config/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";
import { buildSignInMessage } from "~~/services/auth/signInMessage";

/*
 * The route against the real message check, session token and signature check. The nonce table is the fake Supabase
 * client. Ordinary wallets' signatures are recovered locally; the app's own RPC, asked only for anything else, is down.
 */

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/utils/rpc", async () => {
  const { custom } = await import("viem");
  const down = (async () => {
    throw new Error("fetch failed");
  }) as EIP1193RequestFn;
  return { getConfiguredTransport: () => custom({ request: down }) };
});

const ROUTE_URL = "http://localhost/api/auth/verify";
const ORIGIN = "http://localhost";
const NOW = "2026-10-19T12:00:00.000Z";
const NONCE = "0123456789abcdef0123456789abcdef";
const ARBITRUM = 42161;
const TAKE = `auth_nonces.delete().eq("nonce","${NONCE}").gt("expires_at","${NOW}").select("nonce")`;
const EXPIRED = "This sign-in request has expired. Sign in again.";
const CLEARED_NONCE = "tokenping-sign-in-nonce=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=strict";

const account = privateKeyToAccount(generatePrivateKey());
const WALLET = account.address.toLowerCase();

const signInMessage = (fields: Partial<Parameters<typeof buildSignInMessage>[0]> = {}) =>
  buildSignInMessage({
    address: account.address,
    chainId: ARBITRUM,
    nonce: NONCE,
    statement: "Sign in to Tokenping to see and edit your health factor alerts.",
    origin: ORIGIN,
    now: new Date(NOW),
    ...fields,
  });

const verify = (body: unknown, { nonceCookie = NONCE as string | null, headers = {} as Record<string, string> } = {}) =>
  POST(
    siteRequest(ROUTE_URL, {
      method: "POST",
      body,
      headers: { ...(nonceCookie === null ? {} : { cookie: `tokenping-sign-in-nonce=${nonceCookie}` }), ...headers },
    }),
  );

const signed = async (message = signInMessage(), signer = account) => ({
  message,
  signature: await signer.signMessage({ message }),
});

const read = async (res: Response) => ({ status: res.status, body: await res.json() });
const cookiesOf = (res: Response) => res.headers.getSetCookie();
const sessionCookieOf = (res: Response) => cookiesOf(res).find(cookie => cookie.startsWith("tokenping-session="));

let consoleErrors: unknown[][];

beforeEach(() => {
  fakeSupabase.reset();
  // The nonce exists and has not been taken.
  fakeSupabase.respondByQuery({ [TAKE]: { data: [{ nonce: NONCE }] } });
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/auth/verify", () => {
  it("signs the wallet in: takes the nonce, sets the session cookie and drops the nonce cookie", async () => {
    const res = await verify(await signed());

    expect(await read(res)).toEqual({ status: 200, body: { address: WALLET } });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(sessionCookieOf(res)).toMatch(
      /^tokenping-session=v1\.[\w-]+\.[\w-]+; Path=\/; Expires=Mon, 26 Oct 2026 12:00:00 GMT; Max-Age=604800; HttpOnly; SameSite=lax$/,
    );
    expect(cookiesOf(res)).toContain(CLEARED_NONCE);
    expect(fakeSupabase.log()).toEqual([TAKE]);
  });

  it("issues a session the alert API accepts for that wallet", async () => {
    const session = sessionCookieOf(await verify(await signed()))!.split(";")[0];
    fakeSupabase.reset();
    const res = await getConfig(
      siteRequest("http://localhost/api/notifications/config", { headers: { cookie: session } }),
    );
    expect(res.status).toBe(200);
    expect(fakeSupabase.log()[0]).toBe(`notification_configs.select("*").eq("user_id","${WALLET}")`);
  });

  it("signs a wallet in that signed with a lowercase address line", async () => {
    const message = signInMessage().replace(account.address, WALLET);
    expect((await verify(await signed(message))).status).toBe(200);
  });

  it.each([
    ["another site's Origin", { origin: "https://evil.example" }, 403, "Cross-site request refused"],
    ["a text/plain body", { "content-type": "text/plain" }, 415, "Content-Type must be application/json"],
  ])("refuses %s before anything else", async (_label, headers, status, error) => {
    const res = await verify(await signed(), { headers });
    expect(await read(res)).toEqual({ status, body: { error } });
    expect(sessionCookieOf(res)).toBeUndefined();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["no message", { signature: "0x12" }, "Missing or invalid message"],
    ["an empty message", { message: "", signature: "0x12" }, "Missing or invalid message"],
    ["a message that is not text", { message: 5, signature: "0x12" }, "Missing or invalid message"],
    ["an overlong message", { message: "a".repeat(2001), signature: "0x12" }, "Missing or invalid message"],
    ["no signature", { message: "hi" }, "Missing or invalid signature"],
    ["a signature that is not hex", { message: "hi", signature: "zz" }, "Missing or invalid signature"],
    ["an overlong signature", { message: "hi", signature: `0x${"ab".repeat(10_000)}` }, "Missing or invalid signature"],
  ])("answers 400 for %s, without touching the nonce", async (_label, body, error) => {
    expect(await read(await verify(body))).toEqual({ status: 400, body: { error } });
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("answers 401 without this browser's nonce cookie, without touching the nonce", async () => {
    const res = await verify(await signed(), { nonceCookie: null });
    expect(await read(res)).toEqual({ status: 401, body: { error: EXPIRED } });
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("answers 401 when the message carries another browser's nonce", async () => {
    const res = await verify(await signed(), { nonceCookie: "ffffffffffffffffffffffffffffffff" });
    expect(await read(res)).toEqual({ status: 401, body: { error: EXPIRED } });
    expect(cookiesOf(res)).toContain(CLEARED_NONCE);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["another site", signInMessage({ origin: "https://evil.example" }), "This sign-in message is for another site"],
    [
      "a chain the server cannot verify on",
      signInMessage({ chainId: 31337 }),
      "Sign-in is not supported on this chain",
    ],
    ["a message written six minutes ago", signInMessage({ now: new Date("2026-10-19T11:54:00.000Z") }), EXPIRED],
  ])("answers 401 for a message for %s, keeping the nonce", async (_label, message, error) => {
    const res = await verify(await signed(message));
    expect(await read(res)).toEqual({ status: 401, body: { error } });
    expect(sessionCookieOf(res)).toBeUndefined();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("answers 401 for a nonce already taken (a replayed message), without checking the signature", async () => {
    fakeSupabase.respondByQuery({ [TAKE]: { data: [] } });
    const res = await verify(await signed());
    expect(await read(res)).toEqual({ status: 401, body: { error: EXPIRED } });
    expect(sessionCookieOf(res)).toBeUndefined();
  });

  it("works once: the same signed message is refused the second time", async () => {
    const body = await signed();
    // Like the table: the first DELETE ... RETURNING gets the row, later ones find nothing.
    let rows = [{ nonce: NONCE }];
    fakeSupabase.respond(() => {
      const data = rows;
      rows = [];
      return { data };
    });
    expect((await verify(body)).status).toBe(200);
    expect(await read(await verify(body))).toEqual({ status: 401, body: { error: EXPIRED } });
  });

  it.each([
    ["another key's signature", async () => signed(signInMessage(), privateKeyToAccount(generatePrivateKey()))],
    [
      "a signature of another message",
      async () => ({
        message: signInMessage(),
        signature: await account.signMessage({ message: signInMessage({ statement: "Something else." }) }),
      }),
    ],
  ])("answers 401 for %s, using up the nonce", async (_label, body) => {
    const res = await verify(await body());
    expect(await read(res)).toEqual({ status: 401, body: { error: "The signature does not match this wallet" } });
    expect(sessionCookieOf(res)).toBeUndefined();
    expect(cookiesOf(res)).toContain(CLEARED_NONCE);
    expect(fakeSupabase.log()).toEqual([TAKE]);
  });

  it("answers 500 and logs when the nonce cannot be checked", async () => {
    fakeSupabase.respondByQuery({ [TAKE]: { error: { message: "timeout" } } });
    expect(await read(await verify(await signed()))).toEqual({ status: 500, body: { error: "Could not sign you in" } });
    expect(String(consoleErrors[0][0])).toBe("POST /api/auth/verify: failed");
  });

  it("answers 503 in production without SESSION_SECRET, before reading the body", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(await read(await verify(await signed()))).toEqual({
      status: 503,
      body: { error: "Sign-in is not available on this server" },
    });
    expect(fakeSupabase.queries).toHaveLength(0);
  });
});
