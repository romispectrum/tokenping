import { NextResponse } from "next/server";
import { getAddress } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NONCE_COOKIE,
  clearNonceCookie,
  clearSessionCookie,
  getSessionWallet,
  readCookie,
  requireSessionWallet,
  sessionCookieName,
  setNonceCookie,
  setSessionCookie,
} from "~~/services/api/server/session";
import { sessionCookie } from "~~/services/api/server/testing/siteRequest";

const WALLET = `0x${"ab".repeat(20)}`;
const CHECKSUMMED = getAddress(WALLET);
const withCookie = (cookie?: string) =>
  new Request("http://localhost/api", { headers: cookie === undefined ? {} : { cookie } });
const read = async (res: Response) => ({ status: res.status, body: await res.json() });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("readCookie", () => {
  it.each([
    ["the only cookie", "a=1", "a", "1"],
    ["one of several, with spaces", "x=0; a=1 ; b=2", "a", "1"],
    ["a value with = signs", "a=v1.x=.y", "a", "v1.x=.y"],
    ["an empty value", "a=", "a", ""],
    ["a name that is only a prefix of another", "ab=1", "a", undefined],
    ["no Cookie header", undefined, "a", undefined],
  ])("reads %s", (_label, header, name, expected) => {
    expect(readCookie(withCookie(header), name)).toBe(expected);
  });
});

describe("requireSessionWallet", () => {
  it("returns the signed-in wallet in its EIP-55 form", () => {
    expect(requireSessionWallet(withCookie(sessionCookie(WALLET)))).toEqual({ wallet: CHECKSUMMED });
  });

  it.each([
    ["no cookie", undefined],
    ["another cookie", "theme=dark"],
    ["a forged session", `${sessionCookieName()}=v1.e30.AAAA`],
  ])("answers 401 with %s", async (_label, cookie) => {
    const { response } = requireSessionWallet(withCookie(cookie));
    expect(await read(response!)).toEqual({ status: 401, body: { error: "Sign in with your wallet first" } });
  });

  it.each([
    ["the lowercase form", WALLET],
    ["the EIP-55 form, padded", ` ${CHECKSUMMED} `],
    ["an uppercase form", WALLET.toUpperCase().replace("0X", "0x")],
  ])("accepts a claimed userId that is the signed-in wallet in %s", (_label, userId) => {
    expect(requireSessionWallet(withCookie(sessionCookie(WALLET)), userId)).toEqual({ wallet: CHECKSUMMED });
  });

  it.each([undefined, null, "", "   ", 5, ["x"], { id: WALLET }])("ignores a claimed userId of %j", userId => {
    expect(requireSessionWallet(withCookie(sessionCookie(WALLET)), userId)).toEqual({ wallet: CHECKSUMMED });
  });

  it.each([
    ["another wallet", `0x${"cd".repeat(20)}`],
    ["a name", "vitalik.eth"],
  ])("answers 403 when the claimed userId is %s", async (_label, userId) => {
    const { response } = requireSessionWallet(withCookie(sessionCookie(WALLET)), userId);
    expect(await read(response!)).toEqual({
      status: 403,
      body: { error: "userId does not match the signed-in wallet" },
    });
  });

  it("answers 503 and logs in production without SESSION_SECRET, even with a cookie", async () => {
    const cookie = sessionCookie(WALLET);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { response } = requireSessionWallet(withCookie(cookie));
    expect(await read(response!)).toEqual({ status: 503, body: { error: "Sign-in is not available on this server" } });
    expect(String(errors.mock.calls[0][0])).toContain("SESSION_SECRET is not set");
  });
});

describe("getSessionWallet", () => {
  it("returns the lowercased wallet, or null without a valid session", () => {
    expect(getSessionWallet(withCookie(sessionCookie(WALLET)))).toBe(WALLET);
    expect(getSessionWallet(withCookie())).toBeNull();
  });
});

describe("the cookies", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-19T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setCookie = (apply: (response: NextResponse) => void) => {
    const response = NextResponse.json({});
    apply(response);
    return response.headers.get("set-cookie");
  };

  it("sets the session HttpOnly, SameSite=Lax, on every path, for seven days; not Secure on plain-HTTP dev", () => {
    expect(setCookie(response => setSessionCookie(response, "v1.a.b"))).toBe(
      "tokenping-session=v1.a.b; Path=/; Expires=Mon, 26 Oct 2026 12:00:00 GMT; Max-Age=604800; HttpOnly; SameSite=lax",
    );
  });

  it("in production names the session __Host- and makes both cookies Secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(setCookie(response => setSessionCookie(response, "v1.a.b"))).toBe(
      "__Host-tokenping-session=v1.a.b; Path=/; Expires=Mon, 26 Oct 2026 12:00:00 GMT; Max-Age=604800; Secure; HttpOnly; SameSite=lax",
    );
    expect(setCookie(response => setNonceCookie(response, "abc"))).toBe(
      `${NONCE_COOKIE}=abc; Path=/api/auth; Expires=Mon, 19 Oct 2026 12:05:00 GMT; Max-Age=300; Secure; HttpOnly; SameSite=strict`,
    );
  });

  it("keeps the nonce for five minutes, for the sign-in routes only, SameSite=Strict", () => {
    expect(setCookie(response => setNonceCookie(response, "abc"))).toBe(
      `${NONCE_COOKIE}=abc; Path=/api/auth; Expires=Mon, 19 Oct 2026 12:05:00 GMT; Max-Age=300; HttpOnly; SameSite=strict`,
    );
  });

  it("clears each cookie on its own path", () => {
    expect(setCookie(clearSessionCookie)).toBe("tokenping-session=; Path=/; Max-Age=0; HttpOnly; SameSite=lax");
    expect(setCookie(clearNonceCookie)).toBe(`${NONCE_COOKIE}=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=strict`);
  });
});
