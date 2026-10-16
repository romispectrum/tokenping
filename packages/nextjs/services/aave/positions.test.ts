import {
  type Address,
  type Hex,
  HttpRequestError,
  decodeFunctionData,
  encodeFunctionResult,
  formatUnits,
  maxUint256,
  stringToHex,
} from "viem";
import * as chains from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_MARKETS, type AaveMarket, ERC20_ABI, arc, getAaveMarket, marketLabel } from "~~/config/aaveConfig";
import {
  type NetworkPosition,
  type TokenPosition,
  fetchAavePositions,
  hasOpenPosition,
  hasReserveBalance,
  sumUsd,
  toNetworkPosition,
  toSupplyApy,
  toTokenPosition,
} from "~~/services/aave/positions";
import { fetchAaveV4Positions } from "~~/services/aave/v4Positions";

type AccountData = readonly [bigint, bigint, bigint, bigint, bigint, bigint];
type ReserveData = readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, number, boolean];
type ReadCall = { address: Address; functionName: string; args?: readonly Address[] };
type RawCall = { to: Address; data: Hex };

// One market's Pool and data provider, and the token contracts on its chain. A market without a fake reverts.
type FakeMarket = {
  accountData?: AccountData;
  reserves?: Address[];
  reserveData?: Record<Address, ReserveData>;
  symbols?: Record<Address, string>;
  // Tokens whose symbol() returns bytes32, which does not decode as a string.
  bytes32Symbols?: Record<Address, Hex>;
  decimals?: Record<Address, number>;
  // Rejects every read of the market's Pool and data provider with this error.
  failure?: unknown;
};

type ClientOptions = { chain: { id: number }; transport: unknown; batch?: unknown };

const network = vi.hoisted(() => ({
  markets: new Map<AaveMarket, FakeMarket>(),
  clients: [] as ClientOptions[],
  calls: [] as { chainId: number; address: string; functionName: string }[],
}));

// The market whose Pool or data provider a read is addressed to.
const marketAt = (chainId: number, address: Address) =>
  AAVE_MARKETS.find(
    market => market.chain.id === chainId && (market.pool === address || market.dataProvider === address),
  );

// Token contracts belong to the chain, not to a market, so any fake market on the chain may describe them.
const tokenOn = (chainId: number, address: Address) => {
  const fakes = [...network.markets].filter(([market]) => market.chain.id === chainId).map(([, fake]) => fake);
  return {
    symbol: fakes.map(fake => fake.symbols?.[address]).find(symbol => symbol !== undefined),
    bytes32Symbol: fakes.map(fake => fake.bytes32Symbols?.[address]).find(symbol => symbol !== undefined),
    decimals: fakes.map(fake => fake.decimals?.[address]).find(decimals => decimals !== undefined),
  };
};

const read = async (chainId: number, { address, functionName, args = [] }: ReadCall) => {
  network.calls.push({ chainId, address, functionName });
  const market = marketAt(chainId, address);
  const fake = market && network.markets.get(market);
  if (fake?.failure) throw fake.failure;
  const value = {
    getUserAccountData: address === market?.pool ? fake?.accountData : undefined,
    getReservesList: address === market?.pool ? fake?.reserves : undefined,
    getUserReserveData: address === market?.dataProvider ? fake?.reserveData?.[args[0]] : undefined,
    decimals: tokenOn(chainId, address).decimals,
  }[functionName];
  if (value === undefined) throw new Error(`${functionName} reverted on ${chainId}`);
  return value;
};

// symbol() is read as raw return data, so the fake answers like a node: an ABI-encoded string, or raw bytes32.
const rawCall = async (chainId: number, { to, data }: RawCall) => {
  const { functionName } = decodeFunctionData({ abi: ERC20_ABI, data });
  network.calls.push({ chainId, address: to, functionName });
  const { symbol, bytes32Symbol } = tokenOn(chainId, to);
  const returnData =
    bytes32Symbol ??
    (symbol === undefined
      ? undefined
      : encodeFunctionResult({ abi: ERC20_ABI, functionName: "symbol", result: symbol }));
  if (functionName !== "symbol" || returnData === undefined) throw new Error(`${functionName} reverted on ${chainId}`);
  return { data: returnData };
};

vi.mock("viem", async importOriginal => ({
  ...(await importOriginal<typeof import("viem")>()),
  createPublicClient: (options: ClientOptions) => {
    network.clients.push(options);
    return {
      readContract: (request: ReadCall) => read(options.chain.id, request),
      call: (request: RawCall) => rawCall(options.chain.id, request),
    };
  },
}));

vi.mock("~~/utils/rpc", () => ({ getFallbackTransport: (chain: { id: number }) => ({ fallbackFor: chain.id }) }));

// The V4 Spokes have their own tests (v4Positions.test.ts); here they are a list fetchAavePositions appends.
vi.mock("~~/services/aave/v4Positions", () => ({ fetchAaveV4Positions: vi.fn() }));

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const MKR = "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2";

// Ethereum's Core market (the chain's main one) and its Prime market, keyed by its Pool address.
const PRIME_ID = "0x4e033931ad43597d96d6bcc25c280717730b58b1";
const MAINNET = getAaveMarket(chains.mainnet.id)!;
const PRIME = getAaveMarket(chains.mainnet.id, PRIME_ID)!;
const BASE = getAaveMarket(chains.base.id)!;
const ETHEREUM_MARKETS = AAVE_MARKETS.filter(({ chain }) => chain.id === chains.mainnet.id);
// Every V3 chain once, in AAVE_MARKETS order: one client each.
const V3_CHAINS = [...new Map(AAVE_MARKETS.map(({ chain }) => [chain.id, chain])).values()];

// 0.035 ray, i.e. a 3.5% APR.
const RATE_3_5_PERCENT = 35_000_000_000_000_000_000_000_000n;

// The supply APY formula from Aave's docs, compounding the per-second rate over a year.
const SECONDS_PER_YEAR = 31_536_000;
const aaveSupplyApy = (apr: number) => ((1 + apr / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1) * 100;

const reserve = (
  aTokenBalance: bigint,
  stableDebt: bigint,
  variableDebt: bigint,
  liquidityRate = 0n,
  usageAsCollateralEnabled = false,
): ReserveData => [
  aTokenBalance,
  stableDebt,
  variableDebt,
  1n,
  2n,
  3n,
  liquidityRate,
  1_700_000_000,
  usageAsCollateralEnabled,
];

const account = (collateral: bigint, debt: bigint, healthFactor: bigint): AccountData => [
  collateral,
  debt,
  777n,
  8250n,
  8000n,
  healthFactor,
];

const USDC_TOKEN: TokenPosition = {
  asset: USDC,
  symbol: "USDC",
  decimals: 6,
  aTokenBalance: 1_000_000_000n,
  stableDebt: 0n,
  variableDebt: 0n,
  usageAsCollateralEnabled: true,
  supplyApy: aaveSupplyApy(0.035),
};

const DAI_TOKEN: TokenPosition = {
  asset: DAI,
  symbol: "DAI",
  decimals: 18,
  aTokenBalance: 0n,
  stableDebt: 0n,
  variableDebt: 500_000_000_000_000_000_000n,
  usageAsCollateralEnabled: false,
  supplyApy: 0,
};

const MAINNET_ACCOUNT = account(1_234_567_890_123n, 250_000_000_000n, 3_950_000_000_000_000_000n);

const mainnetWithReserves = (overrides: Partial<FakeMarket> = {}): FakeMarket => ({
  accountData: MAINNET_ACCOUNT,
  reserves: [USDC, WBTC, DAI],
  reserveData: {
    [USDC]: reserve(1_000_000_000n, 0n, 0n, RATE_3_5_PERCENT, true),
    [WBTC]: reserve(0n, 0n, 0n),
    [DAI]: reserve(0n, 0n, 500_000_000_000_000_000_000n),
  },
  symbols: { [USDC]: "USDC", [WBTC]: "WBTC", [DAI]: "DAI" },
  decimals: { [USDC]: 6, [WBTC]: 8, [DAI]: 18 },
  ...overrides,
});

const MAINNET_SUMMARY = {
  key: "1:v3",
  version: 3,
  marketId: "v3",
  marketName: "Ethereum (Core)",
  chainId: chains.mainnet.id,
  chainName: "Ethereum",
  totalCollateralUSD: "12345.68",
  totalDebtUSD: "2500.00",
  healthFactor: "3.95",
  netWorthUSD: "9845.68",
  hasPosition: true,
};

const BASE_WITHOUT_POSITION: NetworkPosition = {
  key: "8453:v3",
  version: 3,
  marketId: "v3",
  marketName: "Base",
  chainId: chains.base.id,
  chainName: "Base",
  totalCollateralUSD: "0.00",
  totalDebtUSD: "0.00",
  healthFactor: "∞",
  netWorthUSD: "0.00",
  tokens: [],
  hasPosition: false,
};

const PRIME_WITHOUT_POSITION: NetworkPosition = {
  ...BASE_WITHOUT_POSITION,
  key: `1:${PRIME_ID}`,
  marketId: PRIME_ID,
  marketName: "Ethereum (Prime)",
  chainId: chains.mainnet.id,
  chainName: "Ethereum",
};

// Verbatim copies of the inline formatting from the original hooks/custom/useAavePositions.ts.
const legacyNetworkFormat = (accountData: AccountData) => {
  const [totalCollateralBase, totalDebtBase, , , , healthFactor] = accountData;
  const totalCollateralUSD = formatUnits(totalCollateralBase, 8);
  const totalDebtUSD = formatUnits(totalDebtBase, 8);
  const netWorthUSD = (parseFloat(totalCollateralUSD) - parseFloat(totalDebtUSD)).toFixed(2);
  const healthFactorFormatted =
    healthFactor >= BigInt("0xffffffffffffffffffffffffffffffff")
      ? "∞"
      : parseFloat(formatUnits(healthFactor, 18)).toFixed(2);
  return {
    totalCollateralUSD: parseFloat(totalCollateralUSD).toFixed(2),
    totalDebtUSD: parseFloat(totalDebtUSD).toFixed(2),
    healthFactor: healthFactorFormatted,
    netWorthUSD,
    hasPosition: totalCollateralBase > 0n || totalDebtBase > 0n,
  };
};
const legacyTotal = (values: string[]) => values.reduce((sum, value) => sum + parseFloat(value), 0).toFixed(2);

const withUsd = (netWorthUSD: string, totalCollateralUSD = "0.00", totalDebtUSD = "0.00"): NetworkPosition => ({
  ...BASE_WITHOUT_POSITION,
  netWorthUSD,
  totalCollateralUSD,
  totalDebtUSD,
});

describe("hasReserveBalance", () => {
  it("is false for a reserve the user neither supplies nor borrows", () => {
    expect(hasReserveBalance(reserve(0n, 0n, 0n, RATE_3_5_PERCENT, true))).toBe(false);
  });

  it.each([
    ["a supply balance", reserve(1n, 0n, 0n)],
    ["only stable debt", reserve(0n, 1n, 0n)],
    ["only variable debt", reserve(0n, 0n, 1n)],
  ])("is true for %s", (_, userData) => {
    expect(hasReserveBalance(userData)).toBe(true);
  });
});

describe("toTokenPosition", () => {
  it("keeps the balances, collateral flag and the supply APY in percent", () => {
    expect(toTokenPosition(USDC, reserve(1_000_000_000n, 0n, 0n, RATE_3_5_PERCENT, true), "USDC", 6)).toEqual(
      USDC_TOKEN,
    );
  });

  it("keeps stable and variable debt apart", () => {
    expect(toTokenPosition(DAI, reserve(0n, 1n, 0n), "DAI", 18)).toMatchObject({ stableDebt: 1n, variableDebt: 0n });
    expect(toTokenPosition(DAI, reserve(0n, 0n, 1n), "DAI", 18)).toMatchObject({ stableDebt: 0n, variableDebt: 1n });
  });
});

describe("toSupplyApy", () => {
  it.each([
    [0n, 0],
    [1n, 1e-27],
    [RATE_3_5_PERCENT, 0.035],
    [123_456_789_012_345_678_901_234_567n, 0.12345678901234568],
    [10n ** 27n, 1],
  ])("compounds the liquidityRate %s (APR %s) per second into an APY in percent", (liquidityRate, apr) => {
    expect(toSupplyApy(liquidityRate)).toBe(aaveSupplyApy(apr));
  });

  it("shows a 3.5% APR as a 3.56% APY", () => {
    // B1.4: the APR used to be shown as "3.50% APY".
    expect(toSupplyApy(RATE_3_5_PERCENT).toFixed(2)).toBe("3.56");
  });

  it("approaches continuous compounding, e^APR - 1", () => {
    expect(toSupplyApy(10n ** 27n)).toBeCloseTo((Math.E - 1) * 100, 4);
  });
});

describe("toNetworkPosition", () => {
  it("formats the account summary for display", () => {
    const tokens = [USDC_TOKEN];
    expect(toNetworkPosition(MAINNET, MAINNET_ACCOUNT, tokens)).toEqual({
      ...MAINNET_SUMMARY,
      tokens,
    });
  });

  it("keys a further market on a chain by its Pool address and names it with its market", () => {
    expect(toNetworkPosition(PRIME, account(0n, 0n, maxUint256), [])).toEqual(PRIME_WITHOUT_POSITION);
  });

  it("reports a negative net worth and an infinite health factor as-is", () => {
    expect(toNetworkPosition(BASE, account(0n, 10_000_000_000n, maxUint256), [])).toMatchObject({
      totalCollateralUSD: "0.00",
      totalDebtUSD: "100.00",
      netWorthUSD: "-100.00",
      healthFactor: "∞",
      hasPosition: true,
    });
  });

  it.each<[AccountData]>([
    [account(0n, 0n, maxUint256)],
    [account(1n, 0n, maxUint256)],
    [account(0n, 1n, 0n)],
    [account(99_999_999_999n, 12_345_678n, 1_005_000_000_000_000_000n)],
    [account(123_456_789_012_345n, 98_765_432_109_876n, 999_999_999_999_999_999n)],
    [account(50n, 49n, 2n ** 128n - 2n)],
  ])("matches the original formatting for %s", accountData => {
    expect(toNetworkPosition(BASE, accountData, [])).toEqual({
      key: "8453:v3",
      version: 3,
      marketId: "v3",
      marketName: "Base",
      chainId: chains.base.id,
      chainName: "Base",
      tokens: [],
      ...legacyNetworkFormat(accountData),
    });
  });
});

describe("hasOpenPosition", () => {
  it("is true when there is collateral or debt", () => {
    expect(hasOpenPosition(account(1n, 0n, maxUint256))).toBe(true);
    expect(hasOpenPosition(account(0n, 1n, 0n))).toBe(true);
    expect(hasOpenPosition(account(0n, 0n, maxUint256))).toBe(false);
  });
});

describe("sumUsd", () => {
  it("returns 0.00 for no positions", () => {
    expect(sumUsd([], "netWorthUSD")).toBe("0.00");
  });

  it.each([[["0.10", "0.20"]], [["9845.68", "0.00", "-250.50"]], [["1.005", "2.005"]], [["12345678.91", "0.01"]]])(
    "sums %j like the original totals",
    values => {
      const positions = values.map(value => withUsd(value, value, value));

      expect(sumUsd(positions, "netWorthUSD")).toBe(legacyTotal(values));
      expect(sumUsd(positions, "totalCollateralUSD")).toBe(legacyTotal(values));
      expect(sumUsd(positions, "totalDebtUSD")).toBe(legacyTotal(values));
    },
  );

  it("reads only the requested field", () => {
    const positions = [withUsd("1.00", "5.00", "4.00"), withUsd("2.00", "3.00", "1.00")];

    expect([
      sumUsd(positions, "netWorthUSD"),
      sumUsd(positions, "totalCollateralUSD"),
      sumUsd(positions, "totalDebtUSD"),
    ]).toEqual(["3.00", "8.00", "5.00"]);
  });
});

describe("fetchAavePositions", () => {
  beforeEach(() => {
    network.markets = new Map();
    network.clients = [];
    network.calls = [];
    vi.mocked(fetchAaveV4Positions).mockReset();
    vi.mocked(fetchAaveV4Positions).mockResolvedValue([]);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A market's reads: on its Pool, its data provider and its reserves' tokens, not on the chain's other markets.
  const callsOn = (market: AaveMarket) => {
    const others = AAVE_MARKETS.filter(other => other.chain.id === market.chain.id && other !== market).flatMap(
      ({ pool, dataProvider }): string[] => [pool, dataProvider],
    );
    return network.calls.filter(call => call.chainId === market.chain.id && !others.includes(call.address));
  };

  it("returns reachable markets in market order with the user's non-empty reserves", async () => {
    network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });
    network.markets.set(MAINNET, mainnetWithReserves());

    await expect(fetchAavePositions(USER)).resolves.toEqual([
      { ...MAINNET_SUMMARY, tokens: [USDC_TOKEN, DAI_TOKEN] },
      BASE_WITHOUT_POSITION,
    ]);
  });

  it("creates one client per chain, not per market, with the shared fallback transport and multicall batching", async () => {
    // B1.3, B1.5: the same RPC resolution as the alert cron; S1.17: parallel reads share multicalls.
    network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });

    await fetchAavePositions(USER);

    expect(V3_CHAINS.length).toBeLessThan(AAVE_MARKETS.length);
    expect(network.clients).toEqual(
      V3_CHAINS.map(chain => ({
        chain,
        transport: { fallbackFor: chain.id },
        batch: { multicall: true },
      })),
    );
  });

  it("reads every market on a chain through its one client, each from its own Pool", async () => {
    network.markets.set(MAINNET, mainnetWithReserves());
    network.markets.set(PRIME, { accountData: account(0n, 0n, maxUint256) });

    await expect(fetchAavePositions(USER)).resolves.toEqual([
      { ...MAINNET_SUMMARY, tokens: [USDC_TOKEN, DAI_TOKEN] },
      PRIME_WITHOUT_POSITION,
    ]);
    expect(network.clients.filter(({ chain }) => chain.id === chains.mainnet.id)).toHaveLength(1);
    expect(
      network.calls
        .filter(call => call.chainId === chains.mainnet.id && call.functionName === "getUserAccountData")
        .map(({ address }) => address),
    ).toEqual(ETHEREUM_MARKETS.map(({ pool }) => pool));
  });

  it("reads the account data, the reserve list and every reserve's user data, then token metadata only for reserves with a balance", async () => {
    // S1.17: WBTC is empty, so its symbol() and decimals() are not read.
    network.markets.set(MAINNET, mainnetWithReserves());

    await fetchAavePositions(USER);

    expect(callsOn(MAINNET)).toEqual([
      { chainId: chains.mainnet.id, address: MAINNET.pool, functionName: "getUserAccountData" },
      { chainId: chains.mainnet.id, address: MAINNET.pool, functionName: "getReservesList" },
      ...[USDC, WBTC, DAI].map(() => ({
        chainId: chains.mainnet.id,
        address: MAINNET.dataProvider,
        functionName: "getUserReserveData",
      })),
      ...[USDC, DAI].flatMap(asset => [
        { chainId: chains.mainnet.id, address: asset, functionName: "symbol" },
        { chainId: chains.mainnet.id, address: asset, functionName: "decimals" },
      ]),
    ]);
  });

  it("skips the reserve list for a market without a position", async () => {
    network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256), reserves: [USDC] });

    await fetchAavePositions(USER);

    expect(callsOn(BASE).map(call => call.functionName)).toEqual(["getUserAccountData"]);
  });

  it("keeps the summary when the reserve list cannot be read", async () => {
    network.markets.set(MAINNET, mainnetWithReserves({ reserves: undefined }));

    await expect(fetchAavePositions(USER)).resolves.toEqual([{ ...MAINNET_SUMMARY, tokens: [] }]);
  });

  it("keeps a reserve whose symbol() returns bytes32, like MKR", async () => {
    // B1.0: MKR's row used to disappear while the totals still included it.
    network.markets.set(
      MAINNET,
      mainnetWithReserves({
        reserves: [MKR, USDC],
        reserveData: { [MKR]: reserve(5n, 0n, 0n), [USDC]: reserve(1_000_000_000n, 0n, 0n, RATE_3_5_PERCENT, true) },
        bytes32Symbols: { [MKR]: stringToHex("MKR", { size: 32 }) },
        decimals: { [MKR]: 18, [USDC]: 6 },
      }),
    );

    await expect(fetchAavePositions(USER)).resolves.toEqual([
      {
        ...MAINNET_SUMMARY,
        tokens: [
          {
            asset: MKR,
            symbol: "MKR",
            decimals: 18,
            aTokenBalance: 5n,
            stableDebt: 0n,
            variableDebt: 0n,
            usageAsCollateralEnabled: false,
            supplyApy: 0,
          },
          USDC_TOKEN,
        ],
      },
    ]);
    expect(callsOn(MAINNET).filter(({ functionName }) => functionName === "symbol")).toEqual([
      { chainId: chains.mainnet.id, address: MKR, functionName: "symbol" },
      { chainId: chains.mainnet.id, address: USDC, functionName: "symbol" },
    ]);
  });

  it("drops a reserve whose token metadata cannot be read", async () => {
    network.markets.set(MAINNET, mainnetWithReserves({ decimals: { [USDC]: 6 } }));

    await expect(fetchAavePositions(USER)).resolves.toEqual([{ ...MAINNET_SUMMARY, tokens: [USDC_TOKEN] }]);
  });

  it("warns about each market it leaves out, by its label", async () => {
    network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });

    await expect(fetchAavePositions(USER)).resolves.toEqual([BASE_WITHOUT_POSITION]);

    const failedMarkets = AAVE_MARKETS.filter(market => market !== BASE);
    expect(vi.mocked(console.warn).mock.calls).toEqual(
      failedMarkets.map(market => [
        `Failed to read Aave positions on ${marketLabel(market)} (chain ${market.chain.id}): getUserAccountData reverted on ${market.chain.id}`,
      ]),
    );
    expect(vi.mocked(console.warn).mock.calls.flat()).toContain(
      "Failed to read Aave positions on Ethereum (Prime) (chain 1): getUserAccountData reverted on 1",
    );
  });

  it("warns with viem's short message, not the request body it carries", async () => {
    const calldata = `0x${"ab".repeat(2_000)}`;
    network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });
    network.markets.set(MAINNET, {
      failure: new HttpRequestError({
        url: "https://rpc.example",
        body: { params: [{ data: calldata }] },
        status: 429,
      }),
    });

    await fetchAavePositions(USER);

    expect(vi.mocked(console.warn).mock.calls).toContainEqual([
      `Failed to read Aave positions on Ethereum (Core) (chain ${chains.mainnet.id}): HTTP request failed.`,
    ]);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(calldata);
  });

  it("rejects when every market fails and no V4 Spoke can be read", async () => {
    // B1.2: a total outage used to look like "no positions" instead of an error.
    await expect(fetchAavePositions(USER)).rejects.toThrow(
      "Could not reach any Aave network. Check your connection and try again.",
    );
    expect(network.clients).toHaveLength(V3_CHAINS.length);
    expect(console.warn).toHaveBeenCalledTimes(AAVE_MARKETS.length);
  });

  describe("with Aave V4", () => {
    const LIDO_POSITION: NetworkPosition = {
      ...BASE_WITHOUT_POSITION,
      key: "1:0xe1900480ac69f0b296841cd01cc37546d92f35cd",
      version: 4,
      marketId: "0xe1900480ac69f0b296841cd01cc37546d92f35cd",
      marketName: "Ethereum (V4 Lido)",
      chainId: chains.mainnet.id,
      chainName: "Ethereum",
    };
    const ARC_POSITION: NetworkPosition = {
      ...LIDO_POSITION,
      key: "5042:0xb843bdc3a87a05e77e07df9fe48928b3a34b134d",
      marketId: "0xb843bdc3a87a05e77e07df9fe48928b3a34b134d",
      marketName: "Arc (V4 Main)",
      chainId: 5042,
      chainName: "Arc",
    };

    it("reads the V4 Spokes for the same user and lists them after every V3 market", async () => {
      network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });
      network.markets.set(MAINNET, mainnetWithReserves());
      vi.mocked(fetchAaveV4Positions).mockResolvedValue([LIDO_POSITION, ARC_POSITION]);

      await expect(fetchAavePositions(USER)).resolves.toEqual([
        { ...MAINNET_SUMMARY, tokens: [USDC_TOKEN, DAI_TOKEN] },
        BASE_WITHOUT_POSITION,
        LIDO_POSITION,
        ARC_POSITION,
      ]);
      expect(fetchAaveV4Positions).toHaveBeenCalledExactlyOnceWith(USER, expect.any(Function));
    });

    it("hands the V4 Spokes the clients the V3 markets used, so a chain's markets and Spokes share one", async () => {
      network.markets.set(MAINNET, { accountData: account(0n, 0n, maxUint256) });

      await fetchAavePositions(USER);

      const clientFor = vi.mocked(fetchAaveV4Positions).mock.calls[0][1]!;
      const created = network.clients.length;
      expect(clientFor(chains.mainnet)).toBe(clientFor(chains.mainnet));
      expect(network.clients).toHaveLength(created);
      clientFor(arc);
      expect(network.clients).toHaveLength(created + 1);
      expect(network.clients.at(-1)).toEqual({
        chain: arc,
        transport: { fallbackFor: arc.id },
        batch: { multicall: true },
      });
    });

    it("resolves with the V4 Spokes alone when no V3 market can be read", async () => {
      vi.mocked(fetchAaveV4Positions).mockResolvedValue([ARC_POSITION]);

      await expect(fetchAavePositions(USER)).resolves.toEqual([ARC_POSITION]);
      expect(console.warn).toHaveBeenCalledTimes(AAVE_MARKETS.length);
    });

    it("resolves with the V3 markets alone when no V4 Spoke can be read", async () => {
      network.markets.set(BASE, { accountData: account(0n, 0n, maxUint256) });

      await expect(fetchAavePositions(USER)).resolves.toEqual([BASE_WITHOUT_POSITION]);
    });
  });
});
