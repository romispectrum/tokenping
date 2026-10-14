import { maxUint256 } from "viem";
import { avalanche, base, bsc, gnosis, mainnet, polygon } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getHealthFactorForWallet } from "~~/services/aave/getHealthFactor";

const rpc = vi.hoisted(() => ({
  clients: [] as { chain: { id: number }; transport: { url: string } }[],
  readContract: vi.fn(),
}));

vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  http: (url: string) => ({ url }),
  createPublicClient: (options: { chain: { id: number }; transport: { url: string } }) => {
    rpc.clients.push(options);
    return { readContract: rpc.readContract };
  },
}));

const WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const ALCHEMY_KEY = "test-alchemy-key";

const accountData = (healthFactor: bigint) => [100n, 50n, 10n, 8250n, 8000n, healthFactor] as const;

describe("getHealthFactorForWallet", () => {
  beforeEach(() => {
    rpc.clients = [];
    rpc.readContract.mockReset();
    vi.stubEnv("NEXT_PUBLIC_ALCHEMY_API_KEY", "");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
    const error = new Error("rpc down");
    rpc.readContract.mockRejectedValue(error);

    await expect(getHealthFactorForWallet(WALLET, polygon.id)).resolves.toBeNull();
    expect(console.warn).toHaveBeenCalledWith("Failed to read the Aave health factor on chain 137:", error);
  });

  it.each([
    [mainnet.id, "https://eth.llamarpc.com"],
    [polygon.id, "https://polygon.llamarpc.com"],
    [42161, "https://arb1.arbitrum.io/rpc"],
    [10, "https://mainnet.optimism.io"],
    [base.id, "https://mainnet.base.org"],
    [avalanche.id, "https://api.avax.network/ext/bc/C/rpc"],
    [gnosis.id, "https://rpc.gnosischain.com"],
  ])("uses the public RPC for chain %i without an Alchemy key", async (chainId, url) => {
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await getHealthFactorForWallet(WALLET, chainId);

    expect(rpc.clients[0].transport.url).toBe(url);
  });

  it.each([
    [mainnet.id, "eth-mainnet"],
    [polygon.id, "polygon-mainnet"],
    [42161, "arb-mainnet"],
    [10, "opt-mainnet"],
    [base.id, "base-mainnet"],
    [avalanche.id, "avax-mainnet"],
    [gnosis.id, "gnosis-mainnet"],
  ])("uses Alchemy for chain %i when the env key is set", async (chainId, network) => {
    vi.stubEnv("NEXT_PUBLIC_ALCHEMY_API_KEY", ALCHEMY_KEY);
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await getHealthFactorForWallet(WALLET, chainId);

    expect(rpc.clients[0].transport.url).toBe(`https://${network}.g.alchemy.com/v2/${ALCHEMY_KEY}`);
  });
});
