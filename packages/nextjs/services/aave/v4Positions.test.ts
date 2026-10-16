import {
  type Address,
  type Hex,
  HttpRequestError,
  decodeFunctionData,
  encodeFunctionResult,
  formatUnits,
  maxUint256,
} from "viem";
import * as chains from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_V4_SPOKES, type AaveV4Spoke, ERC20_ABI, arc } from "~~/config/aaveConfig";
import type { NetworkPosition, TokenPosition } from "~~/services/aave/positions";
import { fetchAaveV4Positions, hasOpenV4Position, toV4NetworkPosition } from "~~/services/aave/v4Positions";

type AccountData = {
  riskPremium: bigint;
  avgCollateralFactor: bigint;
  healthFactor: bigint;
  totalCollateralValue: bigint;
  totalDebtValueRay: bigint;
  activeCollateralCount: bigint;
  borrowCount: bigint;
};
type FakeReserve = {
  underlying: Address;
  decimals: number;
  supplied: bigint;
  debt: bigint;
  // (supply enabled as collateral, borrowing)
  status: readonly [boolean, boolean];
  // Reverts getReserve for this reserve.
  failsMetadata?: boolean;
};
type FakeSpoke = {
  accountData?: AccountData;
  // By reserve id; undefined makes getReserveCount revert.
  reserves?: FakeReserve[];
  // Rejects every read of the Spoke with this error.
  failure?: unknown;
};
type ReadCall = { address: Address; functionName: string; args?: readonly unknown[] };
type RawCall = { to: Address; data: Hex };
type ClientOptions = { chain: { id: number }; transport: unknown; batch?: unknown };

const network = vi.hoisted(() => ({
  spokes: new Map<string, FakeSpoke>(),
  symbols: new Map<string, string>(),
  clients: [] as ClientOptions[],
  calls: [] as { chainId: number; address: string; functionName: string; args: readonly unknown[] }[],
}));

const read = async (chainId: number, { address, functionName, args = [] }: ReadCall) => {
  network.calls.push({ chainId, address, functionName, args });
  // A Spoke without a fake answers like one the user never used.
  const spoke = network.spokes.get(address) ?? { accountData: v4Account(0n, 0n, maxUint256), reserves: [] };
  if (spoke.failure) throw spoke.failure;
  const reserve = spoke.reserves?.[Number(args[0])];
  const value = {
    getUserAccountData: spoke.accountData,
    getReserveCount: spoke.reserves && BigInt(spoke.reserves.length),
    getUserSuppliedAssets: reserve?.supplied,
    getUserTotalDebt: reserve?.debt,
    getUserReserveStatus: reserve?.status,
    getReserve:
      reserve && !reserve.failsMetadata ? { underlying: reserve.underlying, decimals: reserve.decimals } : undefined,
  }[functionName];
  if (value === undefined) throw new Error(`${functionName} reverted on ${chainId}`);
  return value;
};

// symbol() is read as raw return data, so the fake answers like a node with an ABI-encoded string.
const rawCall = async (chainId: number, { to, data }: RawCall) => {
  const { functionName } = decodeFunctionData({ abi: ERC20_ABI, data });
  network.calls.push({ chainId, address: to, functionName, args: [] });
  const symbol = network.symbols.get(to);
  if (functionName !== "symbol" || symbol === undefined) throw new Error(`${functionName} reverted on ${chainId}`);
  return { data: encodeFunctionResult({ abi: ERC20_ABI, functionName: "symbol", result: symbol }) };
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

const USER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const spokeNamed = (name: string, spokeName: string) =>
  AAVE_V4_SPOKES.find(spoke => spoke.name === name && spoke.spokeName === spokeName)!;
const LIDO = spokeNamed("Ethereum", "Lido");
const ARC_MAIN = spokeNamed("Arc", "Main");
const LIDO_ID = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";

function v4Account(totalCollateralValue: bigint, totalDebtValueRay: bigint, healthFactor: bigint): AccountData {
  return {
    riskPremium: 0n,
    avgCollateralFactor: 0n,
    healthFactor,
    totalCollateralValue,
    totalDebtValueRay,
    activeCollateralCount: totalCollateralValue > 0n ? 1n : 0n,
    borrowCount: totalDebtValueRay > 0n ? 1n : 0n,
  };
}

// A real position on the Lido Spoke: USD values with 26 decimals, the debt also scaled by a ray.
const COLLATERAL_VALUE = 8_541_843_717_924_562_324_000_000_000_000n;
const DEBT_VALUE_RAY = 3_285_204_483_889_379_377_087_998_150_128_251_409_273_619_386_240_000_000_000n;
const HEALTH_FACTOR = 2_028_074_091_781_711_275n;
const LIDO_ACCOUNT = v4Account(COLLATERAL_VALUE, DEBT_VALUE_RAY, HEALTH_FACTOR);

const LIDO_SUMMARY = {
  key: `1:${LIDO_ID}`,
  version: 4,
  marketId: LIDO_ID,
  marketName: "Ethereum (V4 Lido)",
  chainId: chains.mainnet.id,
  chainName: "Ethereum",
  totalCollateralUSD: "85418.44",
  totalDebtUSD: "32852.04",
  healthFactor: "2.03",
  netWorthUSD: "52566.39",
  hasPosition: true,
};

const WSTETH_RESERVE: FakeReserve = {
  underlying: WSTETH,
  decimals: 18,
  supplied: 25_000_000_000_000_000_000n,
  debt: 0n,
  status: [true, false],
};
const EMPTY_RESERVE: FakeReserve = { underlying: USDC, decimals: 6, supplied: 0n, debt: 0n, status: [true, false] };
const WETH_RESERVE: FakeReserve = {
  underlying: WETH,
  decimals: 18,
  supplied: 0n,
  debt: 9_000_000_000_000_000_000n,
  status: [false, true],
};

const WSTETH_TOKEN: TokenPosition = {
  asset: WSTETH,
  symbol: "wstETH",
  decimals: 18,
  aTokenBalance: 25_000_000_000_000_000_000n,
  stableDebt: 0n,
  variableDebt: 0n,
  usageAsCollateralEnabled: true,
  supplyApy: null,
};
const WETH_TOKEN: TokenPosition = {
  asset: WETH,
  symbol: "WETH",
  decimals: 18,
  aTokenBalance: 0n,
  stableDebt: 0n,
  variableDebt: 9_000_000_000_000_000_000n,
  usageAsCollateralEnabled: false,
  supplyApy: null,
};

const withoutPosition = (spoke: AaveV4Spoke): NetworkPosition => {
  const marketId = spoke.spoke.toLowerCase();
  return {
    key: `${spoke.chain.id}:${marketId}`,
    version: 4,
    marketId,
    marketName: `${spoke.name} (V4 ${spoke.spokeName})`,
    chainId: spoke.chain.id,
    chainName: spoke.name,
    totalCollateralUSD: "0.00",
    totalDebtUSD: "0.00",
    healthFactor: "∞",
    netWorthUSD: "0.00",
    tokens: [],
    hasPosition: false,
  };
};

describe("hasOpenV4Position", () => {
  it("is true when there is collateral or debt", () => {
    expect(hasOpenV4Position(v4Account(1n, 0n, maxUint256))).toBe(true);
    expect(hasOpenV4Position(v4Account(0n, 1n, 0n))).toBe(true);
    expect(hasOpenV4Position(v4Account(0n, 0n, maxUint256))).toBe(false);
  });
});

describe("toV4NetworkPosition", () => {
  it("converts the Spoke's 26-decimal collateral and ray-scaled debt to USD", () => {
    // The exact values behind the rounded ones, so the scaling cannot drift unnoticed.
    expect(formatUnits(COLLATERAL_VALUE, 26)).toBe("85418.43717924562324");
    expect(formatUnits(DEBT_VALUE_RAY, 53)).toBe("32852.0448388937937708799815012825140927361938624");

    const tokens = [WSTETH_TOKEN];
    expect(toV4NetworkPosition(LIDO, LIDO_ACCOUNT, tokens)).toEqual({ ...LIDO_SUMMARY, tokens });
  });

  it("reports an empty Spoke with an infinite health factor", () => {
    expect(toV4NetworkPosition(ARC_MAIN, v4Account(0n, 0n, maxUint256), [])).toEqual(withoutPosition(ARC_MAIN));
  });

  it("reports a negative net worth as-is", () => {
    expect(toV4NetworkPosition(LIDO, v4Account(0n, 10n ** 55n, 0n), [])).toMatchObject({
      totalCollateralUSD: "0.00",
      totalDebtUSD: "100.00",
      netWorthUSD: "-100.00",
      healthFactor: "0.00",
      hasPosition: true,
    });
  });
});

describe("fetchAaveV4Positions", () => {
  beforeEach(() => {
    network.spokes = new Map();
    network.symbols = new Map([
      [WSTETH, "wstETH"],
      [WETH, "WETH"],
      [USDC, "USDC"],
    ]);
    network.clients = [];
    network.calls = [];
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const callsOn = (spoke: Address) => network.calls.filter(call => call.address === spoke);
  const givenLidoPosition = (overrides: Partial<FakeSpoke> = {}) =>
    network.spokes.set(LIDO.spoke, {
      accountData: LIDO_ACCOUNT,
      reserves: [WSTETH_RESERVE, EMPTY_RESERVE, WETH_RESERVE],
      ...overrides,
    });

  it("returns every Spoke in AAVE_V4_SPOKES order, with or without a position", async () => {
    givenLidoPosition();

    await expect(fetchAaveV4Positions(USER)).resolves.toEqual(
      AAVE_V4_SPOKES.map(spoke =>
        spoke === LIDO ? { ...LIDO_SUMMARY, tokens: [WSTETH_TOKEN, WETH_TOKEN] } : withoutPosition(spoke),
      ),
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("creates one client per chain with the shared fallback transport and multicall batching", async () => {
    await fetchAaveV4Positions(USER);

    expect(network.clients).toEqual(
      [chains.mainnet, chains.avalanche, arc, chains.base].map(chain => ({
        chain,
        transport: { fallbackFor: chain.id },
        batch: { multicall: true },
      })),
    );
  });

  it("reads every Spoke's account data for the user on the Spoke's chain", async () => {
    await fetchAaveV4Positions(USER);

    expect(network.calls).toEqual(
      AAVE_V4_SPOKES.map(({ chain, spoke }) => ({
        chainId: chain.id,
        address: spoke,
        functionName: "getUserAccountData",
        args: [USER],
      })),
    );
  });

  it("reads the reserve count and every reserve's user data, then metadata only for reserves with a balance", async () => {
    givenLidoPosition();

    await fetchAaveV4Positions(USER);

    const calls = callsOn(LIDO.spoke).map(({ functionName, args }) => [functionName, ...args]);
    expect(calls.slice(0, 2)).toEqual([["getUserAccountData", USER], ["getReserveCount"]]);
    expect(calls.slice(2, 11)).toEqual(
      [0n, 1n, 2n].flatMap(id => [
        ["getUserSuppliedAssets", id, USER],
        ["getUserTotalDebt", id, USER],
        ["getUserReserveStatus", id, USER],
      ]),
    );
    // The empty reserve 1 gets no getReserve, and its token no symbol().
    expect(calls.slice(11)).toEqual([
      ["getReserve", 0n],
      ["getReserve", 2n],
    ]);
    expect(network.calls.filter(({ functionName }) => functionName === "symbol").map(({ address }) => address)).toEqual(
      [WSTETH, WETH],
    );
  });

  it("reads no reserves for a Spoke without a position", async () => {
    network.spokes.set(LIDO.spoke, {
      accountData: v4Account(0n, 0n, maxUint256),
      reserves: [WSTETH_RESERVE],
    });

    const positions = await fetchAaveV4Positions(USER);

    expect(positions.find(({ marketId }) => marketId === LIDO_ID)).toEqual(withoutPosition(LIDO));
    expect(callsOn(LIDO.spoke).map(({ functionName }) => functionName)).toEqual(["getUserAccountData"]);
    expect(network.calls.every(({ functionName }) => functionName === "getUserAccountData")).toBe(true);
  });

  it("keeps the summary when the reserve count cannot be read", async () => {
    givenLidoPosition({ reserves: undefined });

    const positions = await fetchAaveV4Positions(USER);

    expect(positions.find(({ marketId }) => marketId === LIDO_ID)).toEqual({ ...LIDO_SUMMARY, tokens: [] });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    ["its reserve data", { ...WETH_RESERVE, failsMetadata: true }],
    ["its token's symbol", { ...WETH_RESERVE, underlying: USDC }],
  ])("drops a reserve when %s cannot be read", async (_, failing) => {
    network.symbols.delete(USDC);
    givenLidoPosition({ reserves: [WSTETH_RESERVE, failing] });

    const positions = await fetchAaveV4Positions(USER);

    expect(positions.find(({ marketId }) => marketId === LIDO_ID)?.tokens).toEqual([WSTETH_TOKEN]);
  });

  it("warns about a Spoke it cannot read and leaves it out", async () => {
    network.spokes.set(LIDO.spoke, { failure: new Error("execution reverted") });

    const positions = await fetchAaveV4Positions(USER);

    expect(positions.map(({ marketId }) => marketId)).toEqual(
      AAVE_V4_SPOKES.filter(spoke => spoke !== LIDO).map(({ spoke }) => spoke.toLowerCase()),
    );
    expect(vi.mocked(console.warn).mock.calls).toEqual([
      ["Failed to read Aave positions on Ethereum (V4 Lido) (chain 1): execution reverted"],
    ]);
  });

  it("warns with viem's short message, not the request body it carries", async () => {
    const calldata = `0x${"ab".repeat(2_000)}`;
    network.spokes.set(ARC_MAIN.spoke, {
      failure: new HttpRequestError({
        url: "https://rpc.example",
        body: { params: [{ data: calldata }] },
        status: 429,
      }),
    });

    await fetchAaveV4Positions(USER);

    expect(vi.mocked(console.warn).mock.calls).toEqual([
      [`Failed to read Aave positions on Arc (V4 Main) (chain ${arc.id}): HTTP request failed.`],
    ]);
  });

  it("resolves an empty list, without rejecting, when no Spoke can be read", async () => {
    for (const { spoke } of AAVE_V4_SPOKES) network.spokes.set(spoke, { failure: new Error("down") });

    await expect(fetchAaveV4Positions(USER)).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledTimes(AAVE_V4_SPOKES.length);
  });
});
