import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getSessionSecret,
  readSessionToken,
} from "~~/services/auth/sessionToken";

const SECRET = "a".repeat(64);
const WALLET = `0x${"ab".repeat(20)}`;
const NOW = new Date("2026-10-19T12:00:00.000Z");
const seconds = (n: number) => new Date(NOW.getTime() + n * 1000);

const base64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSessionToken / readSessionToken", () => {
  it("round-trips the wallet, lowercased", () => {
    const token = createSessionToken(WALLET.toUpperCase().replace("0X", "0x"), SECRET, NOW);
    expect(token).toMatch(/^v1\.[\w-]+\.[\w-]+$/);
    expect(readSessionToken(token, SECRET, NOW)).toBe(WALLET);
  });

  it("carries the wallet and the session's issue and end times", () => {
    const [, payload] = createSessionToken(WALLET, SECRET, NOW).split(".");
    const issuedAt = NOW.getTime() / 1000;
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toEqual({
      sub: WALLET,
      iat: issuedAt,
      exp: issuedAt + SESSION_MAX_AGE_SECONDS,
    });
  });

  it("lasts seven days, to the second", () => {
    const token = createSessionToken(WALLET, SECRET, NOW);
    expect(readSessionToken(token, SECRET, seconds(SESSION_MAX_AGE_SECONDS - 1))).toBe(WALLET);
    expect(readSessionToken(token, SECRET, seconds(SESSION_MAX_AGE_SECONDS))).toBeNull();
  });

  it("refuses a token issued more than a minute in the future", () => {
    expect(readSessionToken(createSessionToken(WALLET, SECRET, seconds(60)), SECRET, NOW)).toBe(WALLET);
    expect(readSessionToken(createSessionToken(WALLET, SECRET, seconds(61)), SECRET, NOW)).toBeNull();
  });

  it("refuses a token signed with another secret", () => {
    expect(readSessionToken(createSessionToken(WALLET, "b".repeat(64), NOW), SECRET, NOW)).toBeNull();
  });

  it("refuses a token whose wallet was swapped, keeping the old signature", () => {
    const [version, , signature] = createSessionToken(WALLET, SECRET, NOW).split(".");
    const forged = base64url({ sub: `0x${"cd".repeat(20)}`, iat: NOW.getTime() / 1000, exp: 9e9 });
    expect(readSessionToken(`${version}.${forged}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["two parts", "v1.abc"],
    ["four parts", "v1.a.b.c"],
    ["another version", createSessionToken(WALLET, SECRET, NOW).replace(/^v1/, "v2")],
  ])("refuses a %s token", (_label, token) => {
    expect(readSessionToken(token, SECRET, NOW)).toBeNull();
  });

  it.each([
    ["not JSON", "not json"],
    ["a wallet that is not a lowercase address", { sub: WALLET.toUpperCase(), iat: 1, exp: 9e9 }],
    ["a name instead of a wallet", { sub: "vitalik.eth", iat: 1, exp: 9e9 }],
    ["no end time", { sub: WALLET, iat: 1 }],
    ["a fractional end time", { sub: WALLET, iat: 1, exp: 9e9 + 0.5 }],
    ["null", null],
  ])("refuses a correctly signed payload that is %s", async (_label, payload) => {
    const { createHmac } = await import("crypto");
    const body = `v1.${typeof payload === "string" ? Buffer.from(payload).toString("base64url") : base64url(payload)}`;
    const token = `${body}.${createHmac("sha256", SECRET).update(body).digest("base64url")}`;
    expect(readSessionToken(token, SECRET, NOW)).toBeNull();
  });
});

describe("getSessionSecret", () => {
  it("returns SESSION_SECRET, trimmed, when it has at least 32 characters", () => {
    vi.stubEnv("SESSION_SECRET", ` ${"s".repeat(32)} `);
    expect(getSessionSecret()).toBe("s".repeat(32));
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["31 characters", "s".repeat(31)],
  ])("fails closed in production when SESSION_SECRET is %s", (_label, secret) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", secret);
    expect(getSessionSecret()).toBeNull();
  });

  it("stands in a random secret outside production, the same one for every call in the process", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SESSION_SECRET", "");
    const secret = getSessionSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(getSessionSecret()).toBe(secret);
  });
});
