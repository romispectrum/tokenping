import { HttpRequestError, maxUint256 } from "viem";
import { base, bsc, mainnet, polygon } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import type { getHealthFactorForWallet as GetHealthFactorForWallet } from "~~/services/aave/getHealthFactor";

const rpc = vi.hoisted(() => ({
  clients: [] as { chain: { id: number }; transport: unknown; batch?: unknown }[],
  readContract: vi.fn(),
  getFallbackTransport: vi.fn((chain: { id: number }) => ({ fallbackFor: chain.id })),
}));

vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: (options: (typeof rpc.clients)[number]) => {
    rpc.clients.push(options);
    return { readContract: rpc.readContract };
  },
}));

vi.mock("~~/utils/rpc", () => ({ getFallbackTransport: rpc.getFallbackTransport }));

const WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const OTHER_WALLET = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const accountData = (healthFactor: bigint) => [100n, 50n, 10n, 8250n, 8000n, healthFactor] as const;

describe("getHealthFactorForWallet", () => {
  let getHealthFactorForWallet: typeof GetHealthFactorForWallet;

  beforeEach(async () => {
    // The service keeps its clients for the life of the module, so every test imports a fresh one.
    vi.resetModules();
    ({ getHealthFactorForWallet } = await import("~~/services/aave/getHealthFactor"));
    rpc.clients = [];
    rpc.readContract.mockReset();
    rpc.getFallbackTransport.mockClear();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads getUserAccountData from the chain's Aave pool and formats the health factor", async () => {
    rpc.readContract.mockResolvedValue(accountData(1_534_999_999_999_999_999n));

    await expect(getHealthFactorForWallet(WALLET, mainnet.id)).resolves.toEqual({
      healthFactor: "1.53",
      chainName: "Ethereum",
    });
    expect(rpc.clients).toHaveLength(1);
    expect(rpc.clients[0].chain).toBe(mainnet);
    expect(rpc.readContract).toHaveBeenCalledTimes(1);
    expect(rpc.readContract.mock.calls[0][0]).toMatchObject({
      address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
      functionName: "getUserAccountData",
      args: [WALLET],
    });
  });

  it("reports an infinite health factor when there is no debt", async () => {
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await expect(getHealthFactorForWallet(WALLET, base.id)).resolves.toEqual({ healthFactor: "∞", chainName: "Base" });
    expect(rpc.readContract.mock.calls[0][0].address).toBe("0xA238Dd80C259a72e81d7e4664a9801593F98d1c5");
  });

  it("resolves null without any RPC call for a chain without an Aave market", async () => {
    await expect(getHealthFactorForWallet(WALLET, bsc.id)).resolves.toBeNull();
    expect(rpc.clients).toHaveLength(0);
  });

  it("resolves null and logs the chain when the read fails", async () => {
    rpc.readContract.mockRejectedValue(new Error("rpc down"));

    await expect(getHealthFactorForWallet(WALLET, polygon.id)).resolves.toBeNull();
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ["Failed to read the Aave health factor on chain 137: rpc down"],
    ]);
  });

  it("logs only viem's short message, not the request body it carries", async () => {
    const calldata = `0x${"ab".repeat(2_000)}`;
    rpc.readContract.mockRejectedValue(
      new HttpRequestError({ url: "https://rpc.example", body: { params: [{ data: calldata }] }, status: 429 }),
    );

    await expect(getHealthFactorForWallet(WALLET, polygon.id)).resolves.toBeNull();
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ["Failed to read the Aave health factor on chain 137: HTTP request failed."],
    ]);
  });

  it.each(AAVE_MARKETS.map(({ chain }) => [chain.name, chain] as const))(
    "reads %s through the shared fallback transport with multicall batching and one retry",
    async (_, chain) => {
      // B1.3, B1.5: the same RPC resolution as the dashboard, ending with the chain's public RPC.
      rpc.readContract.mockResolvedValue(accountData(maxUint256));

      await getHealthFactorForWallet(WALLET, chain.id);

      expect(rpc.getFallbackTransport).toHaveBeenCalledWith(chain, { retryCount: 1 });
      expect(rpc.clients).toEqual([{ chain, transport: { fallbackFor: chain.id }, batch: { multicall: true } }]);
    },
  );

  it("creates one client per chain and reuses it for every later wallet, so overlapping reads share a multicall", async () => {
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await getHealthFactorForWallet(WALLET, mainnet.id);
    await getHealthFactorForWallet(OTHER_WALLET, mainnet.id);
    await getHealthFactorForWallet(WALLET, polygon.id);

    expect(rpc.clients.map(({ chain }) => chain.id)).toEqual([mainnet.id, polygon.id]);
    expect(rpc.getFallbackTransport).toHaveBeenCalledTimes(2);
    expect(rpc.readContract.mock.calls.map(([{ args }]) => args)).toEqual([[WALLET], [OTHER_WALLET], [WALLET]]);
  });
});
