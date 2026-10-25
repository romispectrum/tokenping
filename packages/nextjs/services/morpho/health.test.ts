import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoClient } from "~~/services/morpho/client";
import { readBlueHealth, readMidnightHealth } from "~~/services/morpho/health";
import { NO_DEBT_HEALTH_FACTOR } from "~~/services/morpho/math";
import type { BlueMarketParams, MidnightMarketParams } from "~~/services/morpho/types";

const ETHEREUM = getMorphoChain(1)!;
const BASE = getMorphoChain(8453)!;
const MARKET = `0x${"ab".repeat(32)}` as Hex;
const USER = "0x00000000000000000000000000000000000000aa" as Address;
const TOKEN = { address: "0x00000000000000000000000000000000000000b1" as Address, symbol: "USDC", decimals: 6 };
const COLLATERAL = { address: "0x00000000000000000000000000000000000000b2" as Address, symbol: "OETH", decimals: 18 };
const IRM = "0x00000000000000000000000000000000000000c1" as Address;
const PRE = "0x00000000000000000000000000000000000000d1" as Address;

type Call = { functionName: string };
const success = (result: unknown) => ({ status: "success", result });
const failure = () => ({ status: "failure", error: new Error("reverted") });

/** A client whose multicall answers each call by function name, in call order, and whose readContract is spied. */
const fakeClient = (
  answers: Record<string, unknown[]>,
  borrowRate: bigint | Error = 1268391679n,
): MorphoClient & { readContract: ReturnType<typeof vi.fn> } => {
  const queues = Object.fromEntries(Object.entries(answers).map(([name, values]) => [name, [...values]]));
  return {
    chain: ETHEREUM.chain,
    multicall: vi.fn(async ({ contracts }: { contracts: Call[] }) =>
      contracts.map(({ functionName }) => queues[functionName]?.shift() ?? failure()),
    ),
    readContract: vi.fn(async () => {
      if (borrowRate instanceof Error) throw borrowRate;
      return borrowRate;
    }),
  } as unknown as MorphoClient & { readContract: ReturnType<typeof vi.fn> };
};

const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: TOKEN,
  collateralToken: COLLATERAL,
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: IRM,
  lltv: "860000000000000000",
  preLiquidations: [
    { address: PRE, preLltv: "832603694978499652", oracle: "0x00000000000000000000000000000000000000e2" },
  ],
};

// The Ethereum OETH/USDC position of the math tests, with the market 14,892 seconds past its last update.
const PRICE = 2331889241809637124747709854n;
const blueAnswers = (overrides: Record<string, unknown[]> = {}) => ({
  position: [success([0n, 52320744392661477n, 35355274053588173700n])],
  market: [success([0n, 0n, 9242731482802n, 8774564129419866574n, 1_792_000_000n, 0n])],
  price: [success(PRICE), success(PRICE)],
  getCurrentBlockTimestamp: [success(1_792_014_892n)],
  isAuthorized: [success(false)],
  ...overrides,
});

describe("readBlueHealth", () => {
  it("accrues interest to the block and measures against the LLTV", async () => {
    const client = fakeClient(blueAnswers());
    const reading = await readBlueHealth(client, ETHEREUM, MARKET, USER, BLUE);

    expect(reading).toEqual({
      healthFactor: 1286481888882701105n,
      line: "lltv",
      debt: 55113361618n,
      collateralValue: 82444583206n,
      timestamp: 1_792_014_892,
    });
    expect(client.readContract).toHaveBeenCalledTimes(1);
  });

  it("measures against an authorised pre-liquidation when it is the lower line", async () => {
    const reading = await readBlueHealth(
      fakeClient(blueAnswers({ isAuthorized: [success(true)] })),
      ETHEREUM,
      MARKET,
      USER,
      BLUE,
    );

    expect(reading).toMatchObject({ healthFactor: 1245499504889228330n, line: "pre-liquidation" });
  });

  it("reads no interest rate for a market without an IRM", async () => {
    const client = fakeClient(blueAnswers());
    const reading = await readBlueHealth(client, ETHEREUM, MARKET, USER, {
      ...BLUE,
      irm: "0x0000000000000000000000000000000000000000",
    });

    expect(client.readContract).not.toHaveBeenCalled();
    expect(reading?.debt).toBe(55112320598n);
  });

  it("reports no debt without needing a price", async () => {
    const reading = await readBlueHealth(
      fakeClient(blueAnswers({ position: [success([5n, 0n, 1000n])], price: [failure(), failure()] })),
      ETHEREUM,
      MARKET,
      USER,
      BLUE,
    );

    expect(reading).toMatchObject({ healthFactor: NO_DEBT_HEALTH_FACTOR, debt: 0n });
  });

  it("returns nothing, never a number, when the price, the position or the rate cannot be read", async () => {
    expect(await readBlueHealth(fakeClient(blueAnswers({ price: [failure()] })), ETHEREUM, MARKET, USER, BLUE)).toBe(
      null,
    );
    expect(await readBlueHealth(fakeClient(blueAnswers({ position: [failure()] })), ETHEREUM, MARKET, USER, BLUE)).toBe(
      null,
    );
    expect(await readBlueHealth(fakeClient(blueAnswers(), new Error("rpc")), ETHEREUM, MARKET, USER, BLUE)).toBe(null);
  });
});

const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: TOKEN,
  collaterals: [
    { token: TOKEN, lltv: "980000000000000000", oracle: "0x00000000000000000000000000000000000000f1" },
    {
      token: { ...COLLATERAL, symbol: "savUSD" },
      lltv: "915000000000000000",
      oracle: "0x00000000000000000000000000000000000000f2",
    },
  ],
  maturity: 1_793_372_400,
};

const midnightAnswers = (overrides: Record<string, unknown[]> = {}) => ({
  debt: [success(501010136638n)],
  collateralBitmap: [success(2n)],
  getCurrentBlockTimestamp: [success(1_792_014_892n)],
  collateral: [success(500000000000000000000000n)],
  price: [success(1211194030207801131939870n)],
  ...overrides,
});

describe("readMidnightHealth", () => {
  it("sums the collaterals the bitmap marks, each at its own oracle and LLTV", async () => {
    const reading = await readMidnightHealth(fakeClient(midnightAnswers()), BASE, MARKET, USER, MIDNIGHT);

    expect(reading).toEqual({
      healthFactor: 1106008099032485108n,
      line: "lltv",
      debt: 501010136638n,
      collateralValue: 605597015103n,
      timestamp: 1_792_014_892,
    });
  });

  it("reports no debt without reading collateral or prices", async () => {
    const client = fakeClient(midnightAnswers({ debt: [success(0n)] }));
    const reading = await readMidnightHealth(client, BASE, MARKET, USER, MIDNIGHT);

    expect(reading).toMatchObject({ healthFactor: NO_DEBT_HEALTH_FACTOR, debt: 0n });
    expect(client.multicall).toHaveBeenCalledTimes(1);
  });

  it("returns nothing when a price fails or the bitmap names a collateral the stored market does not have", async () => {
    expect(
      await readMidnightHealth(fakeClient(midnightAnswers({ price: [failure()] })), BASE, MARKET, USER, MIDNIGHT),
    ).toBe(null);
    expect(
      await readMidnightHealth(
        fakeClient(midnightAnswers({ collateralBitmap: [success(4n)] })),
        BASE,
        MARKET,
        USER,
        MIDNIGHT,
      ),
    ).toBe(null);
  });

  it("returns nothing on a chain without Midnight", async () => {
    const arbitrum = getMorphoChain(42161)!;
    expect(await readMidnightHealth(fakeClient(midnightAnswers()), arbitrum, MARKET, USER, MIDNIGHT)).toBe(null);
  });
});
