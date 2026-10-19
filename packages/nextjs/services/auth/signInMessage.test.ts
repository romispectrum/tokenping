import { getAddress } from "viem";
import { arbitrum, base, mainnet, polygon } from "viem/chains";
import { parseSiweMessage } from "viem/siwe";
import { describe, expect, it } from "vitest";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import {
  SIGN_IN_CHAINS,
  SIGN_IN_TTL_SECONDS,
  buildSignInMessage,
  getSignInChain,
  signInChainId,
} from "~~/services/auth/signInMessage";

const WALLET = `0x${"ab".repeat(20)}`;
const NONCE = "0123456789abcdef0123456789abcdef";
const NOW = new Date("2026-10-19T12:00:00.000Z");

describe("SIGN_IN_CHAINS", () => {
  it("covers the site's network, Ethereum and every Aave chain, each once", () => {
    const ids = SIGN_IN_CHAINS.map(({ id }) => id);
    expect(ids).toContain(arbitrum.id);
    expect(ids).toContain(mainnet.id);
    for (const { chain } of AAVE_CHAINS) expect(ids).toContain(chain.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds a chain by id, and nothing for an unknown or missing one", () => {
    expect(getSignInChain(base.id)?.name).toBe(base.name);
    expect(getSignInChain(31337)).toBeUndefined();
    expect(getSignInChain(undefined)).toBeUndefined();
  });
});

describe("signInChainId", () => {
  it("keeps the wallet's chain when signatures can be checked there", () => {
    expect(signInChainId(polygon.id)).toBe(polygon.id);
  });

  it.each([undefined, 31337, 0])("falls back to the site's network for %j", chainId => {
    expect(signInChainId(chainId)).toBe(arbitrum.id);
  });
});

describe("buildSignInMessage", () => {
  const message = buildSignInMessage({
    address: WALLET,
    chainId: base.id,
    nonce: NONCE,
    statement: "Sign in to Tokenping to see and edit your health factor alerts.",
    origin: "https://tokenping.xyz",
    now: NOW,
  });

  it("writes an EIP-4361 message for the origin, the EIP-55 address and the nonce, valid for five minutes", () => {
    expect(message).toBe(
      "tokenping.xyz wants you to sign in with your Ethereum account:\n" +
        `${getAddress(WALLET)}\n\n` +
        "Sign in to Tokenping to see and edit your health factor alerts.\n\n" +
        "URI: https://tokenping.xyz\n" +
        "Version: 1\n" +
        "Chain ID: 8453\n" +
        `Nonce: ${NONCE}\n` +
        "Issued At: 2026-10-19T12:00:00.000Z\n" +
        "Expiration Time: 2026-10-19T12:05:00.000Z",
    );
    expect(SIGN_IN_TTL_SECONDS).toBe(300);
  });

  it("parses back to the same fields", () => {
    expect(parseSiweMessage(message)).toMatchObject({
      domain: "tokenping.xyz",
      address: getAddress(WALLET),
      uri: "https://tokenping.xyz",
      version: "1",
      chainId: base.id,
      nonce: NONCE,
      issuedAt: NOW,
    });
  });

  it("keeps a local port in the domain", () => {
    const local = buildSignInMessage({
      address: WALLET,
      chainId: arbitrum.id,
      nonce: NONCE,
      statement: "Sign in.",
      origin: "http://localhost:3000",
      now: NOW,
    });
    expect(local.startsWith("localhost:3000 wants you to sign in")).toBe(true);
    expect(local).toContain("\nURI: http://localhost:3000\n");
  });
});
