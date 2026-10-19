import type { EIP1193RequestFn } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyWalletSignature } from "~~/services/auth/verifySignature";
import { getFallbackTransport } from "~~/utils/rpc";

/** What the RPC answers to eth_call: the validator's result, or a failure (the RPC is down). */
const rpc = vi.hoisted(() => ({ answer: "down" as "down" | "valid" | "invalid", calls: [] as string[] }));

vi.mock("~~/utils/rpc", async () => {
  const { custom } = await import("viem");
  return {
    getFallbackTransport: vi.fn(() =>
      custom({
        request: (async ({ method }: { method: string }) => {
          rpc.calls.push(method);
          if (rpc.answer === "down") throw new Error("fetch failed");
          return `0x${(rpc.answer === "valid" ? "1" : "0").padStart(64, "0")}`;
        }) as EIP1193RequestFn,
      }),
    ),
  };
});

const MESSAGE = "tokenping.xyz wants you to sign in with your Ethereum account: ...";
const account = privateKeyToAccount(generatePrivateKey());
const stranger = privateKeyToAccount(generatePrivateKey());
/** A smart wallet: a contract, so no key recovers to its address. */
const SMART_WALLET = "0x1111111111111111111111111111111111111111";

beforeEach(() => {
  rpc.answer = "down";
  rpc.calls = [];
  vi.mocked(getFallbackTransport).mockClear();
});

describe("verifyWalletSignature", () => {
  it("checks on the message's chain, without retries, through an eth_call (ERC-1271 and ERC-6492)", async () => {
    rpc.answer = "valid";
    const signature = await account.signMessage({ message: MESSAGE });
    expect(await verifyWalletSignature({ chain: base, address: account.address, message: MESSAGE, signature })).toBe(
      true,
    );
    expect(vi.mocked(getFallbackTransport).mock.calls).toEqual([[base, { retryCount: 0 }]]);
    expect(rpc.calls).toEqual(["eth_call"]);
  });

  it("accepts a smart wallet whose contract says the signature is its own", async () => {
    rpc.answer = "valid";
    expect(
      await verifyWalletSignature({ chain: base, address: SMART_WALLET, message: MESSAGE, signature: "0x1234" }),
    ).toBe(true);
  });

  it("refuses a smart wallet whose contract says it is not", async () => {
    rpc.answer = "invalid";
    const signature = await stranger.signMessage({ message: MESSAGE });
    expect(await verifyWalletSignature({ chain: base, address: SMART_WALLET, message: MESSAGE, signature })).toBe(
      false,
    );
  });

  it("still signs an ordinary wallet in while the RPC is down (ECDSA recovery)", async () => {
    const signature = await account.signMessage({ message: MESSAGE });
    expect(await verifyWalletSignature({ chain: base, address: account.address, message: MESSAGE, signature })).toBe(
      true,
    );
  });

  it("refuses another key's signature, and a signature of another message, while the RPC is down", async () => {
    const strangers = await stranger.signMessage({ message: MESSAGE });
    expect(
      await verifyWalletSignature({ chain: base, address: account.address, message: MESSAGE, signature: strangers }),
    ).toBe(false);
    const otherMessage = await account.signMessage({ message: `${MESSAGE} (another)` });
    expect(
      await verifyWalletSignature({ chain: base, address: account.address, message: MESSAGE, signature: otherMessage }),
    ).toBe(false);
  });
});
