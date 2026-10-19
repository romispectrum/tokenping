import { getAddress } from "viem";
import { arbitrum, base } from "viem/chains";
import { createSiweMessage } from "viem/siwe";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSignInMessage, isSignInOrigin } from "~~/services/auth/checkSignInMessage";
import { buildSignInMessage } from "~~/services/auth/signInMessage";

const WALLET = `0x${"ab".repeat(20)}`;
const NONCE = "0123456789abcdef0123456789abcdef";
const ORIGIN = "https://tokenping.xyz";
const NOW = new Date("2026-10-19T12:00:00.000Z");
const at = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);

const EXPIRED = { error: "This sign-in request has expired. Sign in again." };
const FOREIGN = { error: "This sign-in message is for another site" };

/** The message the site writes, with any field changed. */
const message = (fields: Partial<Parameters<typeof createSiweMessage>[0]> = {}) =>
  createSiweMessage({
    domain: "tokenping.xyz",
    uri: ORIGIN,
    address: getAddress(WALLET),
    chainId: base.id,
    nonce: NONCE,
    statement: "Sign in to Tokenping to see and edit your health factor alerts.",
    version: "1",
    issuedAt: NOW,
    expirationTime: at(300),
    ...fields,
  });

const check = (text: string, expected: { origin?: string; nonce?: string; now?: Date } = {}) =>
  checkSignInMessage(text, { origin: ORIGIN, nonce: NONCE, now: NOW, ...expected });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkSignInMessage", () => {
  it("accepts the site's own message and returns the signer and the chain to verify on", () => {
    const signIn = buildSignInMessage({
      address: WALLET,
      chainId: base.id,
      nonce: NONCE,
      statement: "Sign in.",
      origin: ORIGIN,
      now: NOW,
    });
    expect(check(signIn)).toEqual({ address: getAddress(WALLET), chain: expect.objectContaining({ id: base.id }) });
  });

  it("accepts it on localhost during development", () => {
    const local = message({ domain: "localhost:3000", uri: "http://localhost:3000" });
    expect(check(local, { origin: "http://localhost:3000" })).toMatchObject({ chain: { id: base.id } });
  });

  it.each([
    ["random text", "hello"],
    ["an empty message", ""],
    ["a message without an address", message().replace(/\n0x[0-9a-fA-F]{40}\n/, "\n\n")],
    ["another version", message().replace("Version: 1", "Version: 2")],
    // EIP-4361 requires Issued At; viem's parser reads nothing past the statement without it.
    ["a message without Issued At", message().replace(/\nIssued At: [^\n]+/, "")],
  ])("refuses %s as not a sign-in message", (_label, text) => {
    expect(check(text)).toEqual({ error: "Not a sign-in message" });
  });

  it.each([
    ["another domain", message({ domain: "evil.example" })],
    ["a subdomain", message({ domain: "app.tokenping.xyz" })],
    ["another port", message({ domain: "tokenping.xyz:8443" })],
    ["a URI on another site", message({ uri: "https://evil.example/login" })],
    ["a URI over plain HTTP", message({ uri: "http://tokenping.xyz" })],
    ["a URI that is not a URL", message().replace(`URI: ${ORIGIN}`, "URI: tokenping")],
    ["the http scheme", message({ scheme: "http" })],
  ])("refuses a message for %s", (_label, text) => {
    expect(check(text)).toEqual(FOREIGN);
  });

  it("accepts a path on the site as the URI and the https scheme", () => {
    expect(check(message({ uri: `${ORIGIN}/aave`, scheme: "https" }))).toMatchObject({ chain: { id: base.id } });
  });

  it("refuses a chain the server cannot verify on", () => {
    expect(check(message({ chainId: 31337 }))).toEqual({ error: "Sign-in is not supported on this chain" });
  });

  it.each([
    ["another nonce", message({ nonce: "ffffffffffffffffffffffffffffffff" })],
    ["an unreadable Issued At", message().replace(/Issued At: [^\n]+/, "Issued At: yesterday")],
    ["an Issued At over a minute ahead", message({ issuedAt: at(61), expirationTime: at(400) })],
    ["an Issued At five minutes old", message({ issuedAt: at(-300), expirationTime: at(60) })],
    ["an Expiration Time that has passed", message({ expirationTime: at(0) })],
    ["an unreadable Expiration Time", message().replace(/Expiration Time: [^\n]+/, "Expiration Time: soon")],
    ["a Not Before still ahead", message({ notBefore: at(30) })],
  ])("refuses a message with %s as expired", (_label, text) => {
    expect(check(text)).toEqual(EXPIRED);
  });

  it("accepts a little clock skew and a message without an Expiration Time", () => {
    expect(check(message({ issuedAt: at(60), expirationTime: at(360) }))).toMatchObject({ chain: { id: base.id } });
    expect(check(message({ issuedAt: at(-299), expirationTime: undefined }))).toMatchObject({
      address: getAddress(WALLET),
    });
  });

  it("returns the signer in its EIP-55 form whatever the message's casing", () => {
    const lower = message().replace(getAddress(WALLET), WALLET);
    expect(check(lower)).toMatchObject({ address: getAddress(WALLET) });
  });

  it("checks each chain the site supports", () => {
    expect(check(message({ chainId: arbitrum.id }))).toMatchObject({ chain: { id: arbitrum.id } });
  });
});

describe("checkSignInMessage in production", () => {
  it("accepts the site's own origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(check(message())).toMatchObject({ address: getAddress(WALLET) });
  });

  // A phishing page has the wallet sign a message for its own domain, then sends it with headers that name that domain.
  it("refuses a message for another domain even when the request's headers name that domain", () => {
    vi.stubEnv("NODE_ENV", "production");
    const phishing = message({ domain: "evil.example", uri: "https://evil.example" });
    expect(check(phishing, { origin: "https://evil.example" })).toEqual(FOREIGN);
  });
});

describe("isSignInOrigin", () => {
  it("accepts any origin outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isSignInOrigin("http://192.168.1.20:3000")).toBe(true);
  });

  it("in production accepts the site URL, NEXT_PUBLIC_APP_URL and the deployment's Vercel URLs only", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com/");
    vi.stubEnv("VERCEL_URL", "tokenping-abc123.vercel.app");
    vi.stubEnv("VERCEL_BRANCH_URL", "tokenping-git-main.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(
      [
        "https://tokenping.xyz",
        "https://app.example.com",
        "https://tokenping-abc123.vercel.app",
        "https://tokenping-git-main.vercel.app",
        "http://localhost:3000",
        "https://evil.example",
        "http://tokenping.xyz",
      ].map(isSignInOrigin),
    ).toEqual([true, true, true, true, false, false, false]);
  });

  it("ignores a NEXT_PUBLIC_APP_URL that is not a URL", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not a url");
    expect(isSignInOrigin("https://tokenping.xyz")).toBe(true);
  });
});
