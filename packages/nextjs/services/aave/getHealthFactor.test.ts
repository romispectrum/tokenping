import { HttpRequestError, maxUint256 } from "viem";
import { base, bsc, harmonyOne, mainnet, polygon } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_MARKETS, AAVE_V3_NETWORKS, AAVE_V4_SPOKES, arc } from "~~/config/aaveConfig";
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

// Ethereum's Lido Spoke and Arc's Main Spoke, as market ids.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const ARC_MAIN_SPOKE = "0xb843bdc3a87a05e77e07df9fe48928b3a34b134d";

// Ethereum's Prime market: a V3 Pool beside the chain's main one, stored by its address like a Spoke.
const PRIME_POOL = "0x4e033931ad43597d96D6bcc25c280717730B58B1";
const PRIME_ID = "0x4e033931ad43597d96d6bcc25c280717730b58b1";

const accountData = (healthFactor: bigint) => [100n, 50n, 10n, 8250n, 8000n, healthFactor] as const;

// A V4 Spoke returns its account data as a struct; the values beside the health factor do not matter here.
const v4AccountData = (healthFactor: bigint) => ({
  riskPremium: 0n,
  avgCollateralFactor: 0n,
  healthFactor,
  totalCollateralValue: 1n,
  totalDebtValueRay: 1n,
  activeCollateralCount: 1n,
  borrowCount: 1n,
});

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
      healthFactorValue: 1.535,
      chainName: "Ethereum (Core)",
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

  it("names a network's only market by the network alone", async () => {
    rpc.readContract.mockResolvedValue(accountData(1_534_999_999_999_999_999n));

    await expect(getHealthFactorForWallet(WALLET, bsc.id)).resolves.toEqual({
      healthFactor: "1.53",
      healthFactorValue: 1.535,
      chainName: "BNB Chain",
    });
    expect(rpc.clients.map(({ chain }) => chain)).toEqual([bsc]);
    expect(rpc.readContract.mock.calls[0][0].address).toBe("0x6807dc923806fE8Fd134338EABCA509979a7e0cB");
  });

  it("reads a further V3 market's Pool by its address and names it with its market", async () => {
    rpc.readContract.mockResolvedValue(accountData(1_534_999_999_999_999_999n));

    await expect(getHealthFactorForWallet(WALLET, mainnet.id, PRIME_ID)).resolves.toEqual({
      healthFactor: "1.53",
      healthFactorValue: 1.535,
      chainName: "Ethereum (Prime)",
    });
    expect(rpc.clients.map(({ chain }) => chain)).toEqual([mainnet]);
    expect(rpc.readContract).toHaveBeenCalledTimes(1);
    expect(rpc.readContract.mock.calls[0][0]).toMatchObject({
      address: PRIME_POOL,
      functionName: "getUserAccountData",
      args: [WALLET],
    });
  });

  it("reports an infinite health factor when there is no debt", async () => {
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await expect(getHealthFactorForWallet(WALLET, base.id)).resolves.toEqual({
      healthFactor: "∞",
      healthFactorValue: Infinity,
      chainName: "Base",
    });
    expect(rpc.readContract.mock.calls[0][0].address).toBe("0xA238Dd80C259a72e81d7e4664a9801593F98d1c5");
  });

  it("rounds the displayed health factor down and keeps the exact value for comparisons", async () => {
    rpc.readContract.mockResolvedValue(accountData(1_499_600_000_000_000_000n));

    await expect(getHealthFactorForWallet(WALLET, mainnet.id)).resolves.toEqual({
      healthFactor: "1.49",
      healthFactorValue: 1.4996,
      chainName: "Ethereum (Core)",
    });
  });

  it("resolves null without any RPC call for a chain without an Aave market", async () => {
    // Harmony's frozen market is deliberately left out of AAVE_MARKETS.
    await expect(getHealthFactorForWallet(WALLET, harmonyOne.id)).resolves.toBeNull();
    expect(rpc.clients).toHaveLength(0);
  });

  it("reads the chain's main V3 Pool for the explicit v3 market", async () => {
    rpc.readContract.mockResolvedValue(accountData(maxUint256));

    await expect(getHealthFactorForWallet(WALLET, mainnet.id, "v3")).resolves.toMatchObject({
      chainName: "Ethereum (Core)",
    });
    expect(rpc.readContract.mock.calls[0][0].address).toBe("0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2");
  });

  it("reads getUserAccountData from a V4 Spoke and names the market with its Spoke", async () => {
    rpc.readContract.mockResolvedValue(v4AccountData(2_028_074_091_781_711_275n));

    await expect(getHealthFactorForWallet(WALLET, mainnet.id, LIDO_SPOKE)).resolves.toEqual({
      healthFactor: "2.02",
      healthFactorValue: 2.028074091781711275,
      chainName: "Ethereum (V4 Lido)",
    });
    expect(rpc.clients.map(({ chain }) => chain)).toEqual([mainnet]);
    expect(rpc.readContract).toHaveBeenCalledTimes(1);
    expect(rpc.readContract.mock.calls[0][0]).toMatchObject({
      address: "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd",
      functionName: "getUserAccountData",
      args: [WALLET],
    });
  });

  it("reports an infinite health factor for a V4 Spoke without debt", async () => {
    rpc.readContract.mockResolvedValue(v4AccountData(maxUint256));

    await expect(getHealthFactorForWallet(WALLET, arc.id, ARC_MAIN_SPOKE)).resolves.toEqual({
      healthFactor: "∞",
      healthFactorValue: Infinity,
      chainName: "Arc (V4 Main)",
    });
    expect(rpc.clients).toEqual([{ chain: arc, transport: { fallbackFor: arc.id }, batch: { multicall: true } }]);
  });

  it.each([
    ["a chain without an Aave market", harmonyOne.id, "v3"],
    ["a V3 market on a V4-only chain", arc.id, "v3"],
    ["an address that is no market", mainnet.id, `0x${"12".repeat(20)}`],
    ["a Spoke on another chain", base.id, LIDO_SPOKE],
    ["a V3 Pool on another chain", polygon.id, PRIME_ID],
    ["a checksummed Spoke address", mainnet.id, "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd"],
    ["a checksummed V3 Pool address", mainnet.id, PRIME_POOL],
  ])("resolves null without any RPC call for %s", async (_, chainId, market) => {
    await expect(getHealthFactorForWallet(WALLET, chainId, market)).resolves.toBeNull();
    expect(rpc.clients).toHaveLength(0);
    expect(rpc.readContract).not.toHaveBeenCalled();
  });

  it("resolves null and logs the market and chain when the read fails", async () => {
    rpc.readContract.mockRejectedValue(new Error("rpc down"));

    await expect(getHealthFactorForWallet(WALLET, polygon.id)).resolves.toBeNull();
    await expect(getHealthFactorForWallet(WALLET, mainnet.id, LIDO_SPOKE)).resolves.toBeNull();
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ["Failed to read the Aave health factor on Polygon (chain 137): rpc down"],
      ["Failed to read the Aave health factor on Ethereum (V4 Lido) (chain 1): rpc down"],
    ]);
  });

  it("logs only viem's short message, not the request body it carries", async () => {
    const calldata = `0x${"ab".repeat(2_000)}`;
    rpc.readContract.mockRejectedValue(
      new HttpRequestError({ url: "https://rpc.example", body: { params: [{ data: calldata }] }, status: 429 }),
    );

    await expect(getHealthFactorForWallet(WALLET, polygon.id)).resolves.toBeNull();
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ["Failed to read the Aave health factor on Polygon (chain 137): HTTP request failed."],
    ]);
  });

  it.each(AAVE_V3_NETWORKS.map(({ name, chain }) => [name, chain] as const))(
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

  it("shares the chain's client between every V3 Pool and every V4 Spoke on it", async () => {
    const ethereumMarkets = AAVE_MARKETS.filter(({ chain }) => chain.id === mainnet.id);
    const ethereumSpokes = AAVE_V4_SPOKES.filter(({ chain }) => chain.id === mainnet.id);
    rpc.readContract.mockImplementation(({ address }) =>
      Promise.resolve(
        ethereumMarkets.some(({ pool }) => pool === address) ? accountData(maxUint256) : v4AccountData(maxUint256),
      ),
    );

    for (const { marketId } of ethereumMarkets) await getHealthFactorForWallet(WALLET, mainnet.id, marketId);
    for (const { spoke } of ethereumSpokes) await getHealthFactorForWallet(WALLET, mainnet.id, spoke.toLowerCase());

    expect(ethereumMarkets).toHaveLength(4);
    expect(rpc.clients.map(({ chain }) => chain.id)).toEqual([mainnet.id]);
    expect(rpc.readContract.mock.calls.map(([{ address }]) => address)).toEqual([
      ...ethereumMarkets.map(({ pool }) => pool),
      ...ethereumSpokes.map(({ spoke }) => spoke),
    ]);
  });
});
