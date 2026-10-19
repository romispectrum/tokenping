import type { Address, EIP1193RequestFn, Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyWalletSignature } from "~~/services/auth/verifySignature";
import { getConfiguredTransport } from "~~/utils/rpc";

/** What the app's own endpoint answers to eth_call (undefined: the chain has none), and every call it got. */
const rpc = vi.hoisted(() => ({
  configured: "valid" as "down" | "valid" | "invalid" | undefined,
  calls: [] as string[],
}));

vi.mock("~~/utils/rpc", async () => {
  const { custom } = await import("viem");
  const transport = () =>
    custom({
      request: (async ({ method }: { method: string }) => {
        rpc.calls.push(method);
        if (rpc.configured === "down") throw new Error("fetch failed");
        return `0x${(rpc.configured === "valid" ? "1" : "0").padStart(64, "0")}`;
      }) as EIP1193RequestFn,
    });
  return { getConfiguredTransport: vi.fn(() => (rpc.configured === undefined ? undefined : transport())) };
});

const MESSAGE = "tokenping.xyz wants you to sign in with your Ethereum account: ...";
const account = privateKeyToAccount(generatePrivateKey());
const stranger = privateKeyToAccount(generatePrivateKey());
/** A smart wallet: a contract, so no key recovers to its address. */
const SMART_WALLET = "0x1111111111111111111111111111111111111111";

const verify = (address: Address, signature: Hex) =>
  verifyWalletSignature({ chain: base, address, message: MESSAGE, signature });

let consoleErrors: unknown[][];

beforeEach(() => {
  rpc.configured = "valid";
  rpc.calls = [];
  vi.mocked(getConfiguredTransport).mockClear();
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyWalletSignature: an ordinary wallet", () => {
  it("is checked locally, asking no RPC", async () => {
    expect(await verify(account.address, await account.signMessage({ message: MESSAGE }))).toBe(true);
    expect(rpc.calls).toEqual([]);
  });

  it("is refused when another key signed", async () => {
    rpc.configured = "invalid";
    expect(await verify(account.address, await stranger.signMessage({ message: MESSAGE }))).toBe(false);
  });

  // No public RPC is ever asked, so one that answers "valid" to everything cannot sign anyone in.
  it("is refused when another key signed on a chain without an RPC of the app's own, asking no RPC", async () => {
    rpc.configured = undefined;
    expect(await verify(account.address, await stranger.signMessage({ message: MESSAGE }))).toBe(false);
    expect(rpc.calls).toEqual([]);
  });

  it("is refused for a signature of another message", async () => {
    rpc.configured = "invalid";
    const otherMessage = await account.signMessage({ message: `${MESSAGE} (another)` });
    expect(await verify(account.address, otherMessage)).toBe(false);
  });
});

describe("verifyWalletSignature: a smart wallet", () => {
  it("is checked with an eth_call on the message's chain, through the app's own endpoint, without retries", async () => {
    expect(await verify(SMART_WALLET, "0x1234")).toBe(true);
    expect(vi.mocked(getConfiguredTransport).mock.calls).toEqual([[base.id, { retryCount: 0 }]]);
    expect(rpc.calls).toEqual(["eth_call"]);
  });

  it("is refused when its contract says the signature is not its own", async () => {
    rpc.configured = "invalid";
    expect(await verify(SMART_WALLET, await stranger.signMessage({ message: MESSAGE }))).toBe(false);
  });

  it("is refused, and logged, on a chain without an RPC of the app's own", async () => {
    rpc.configured = undefined;
    expect(await verify(SMART_WALLET, "0x1234")).toBe(false);
    expect(String(consoleErrors[0][0])).toContain("no RPC of the app's own on chain 8453");
  });

  it("is refused while the RPC is down", async () => {
    rpc.configured = "down";
    expect(await verify(SMART_WALLET, await stranger.signMessage({ message: MESSAGE }))).toBe(false);
  });
});
