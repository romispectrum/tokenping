import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoClient } from "~~/services/morpho/client";
import { readBlueMarketParams, readMidnightMarketParams } from "~~/services/morpho/params";

const ETHEREUM = getMorphoChain(1)!;
const ARBITRUM = getMorphoChain(42161)!;
const MARKET = `0x${"ab".repeat(32)}` as Hex;
const OTHER_MARKET = `0x${"cd".repeat(32)}` as Hex;
const USDC = "0x00000000000000000000000000000000000000b1" as Address;
const OETH = "0x00000000000000000000000000000000000000b2" as Address;
const ORACLE = "0x00000000000000000000000000000000000000e1" as Address;
const IRM = "0x00000000000000000000000000000000000000c1" as Address;
const PRE_A = "0x00000000000000000000000000000000000000d1" as Address;
const PRE_B = "0x00000000000000000000000000000000000000d2" as Address;
const PRE_ORACLE = "0x00000000000000000000000000000000000000e2" as Address;
const ZERO = "0x0000000000000000000000000000000000000000" as Address;

const success = (result: unknown) => ({ status: "success", result });
const failure = () => ({ status: "failure", error: new Error("reverted") });

type Call = { address: Address; functionName: string };

/** A client answering each multicall entry through `answer(call)`. */
const fakeClient = (answer: (call: Call) => unknown, readContract = vi.fn()) =>
  ({
    multicall: vi.fn(async ({ contracts }: { contracts: Call[] }) => contracts.map(answer)),
    readContract,
  }) as unknown as MorphoClient;

const tokens = (call: Call) => {
  if (call.functionName === "decimals") return success(call.address === USDC ? 6 : 18);
  if (call.functionName === "symbol") return call.address === USDC ? success("USDC") : success(" OETH ");
  return undefined;
};

const blueAnswer =
  (marketParams: unknown, pre: Record<string, { fromFactory: boolean; id: Hex }> = {}) =>
  (call: Call) => {
    const token = tokens(call);
    if (token) return token;
    if (call.functionName === "idToMarketParams") return marketParams;
    const entry = Object.entries(pre).find(([address]) => address === call.address);
    if (call.functionName === "isPreLiquidation") {
      const [address] = (call as Call & { args: [Address] }).args;
      return success(pre[address]?.fromFactory ?? false);
    }
    if (!entry) return failure();
    const [, { id }] = entry;
    if (call.functionName === "ID") return success(id);
    if (call.functionName === "preLiquidationParams")
      return success({ preLltv: 832603694978499652n, preLiquidationOracle: PRE_ORACLE });
    return failure();
  };

describe("readBlueMarketParams", () => {
  it("reads the market and keeps only pre-liquidations Morpho's factory made for it", async () => {
    const client = fakeClient(
      blueAnswer(success([USDC, OETH, ORACLE, IRM, 860000000000000000n]), {
        [PRE_A]: { fromFactory: true, id: MARKET },
        // Made by the factory, but for another market: not this one's line.
        [PRE_B]: { fromFactory: true, id: OTHER_MARKET },
      }),
    );
    const params = await readBlueMarketParams(client, ETHEREUM, MARKET, [PRE_A, PRE_B]);

    expect(params).toEqual({
      kind: "blue",
      loanToken: { address: USDC, symbol: "USDC", decimals: 6 },
      collateralToken: { address: OETH, symbol: "OETH", decimals: 18 },
      oracle: ORACLE,
      irm: IRM,
      lltv: "860000000000000000",
      preLiquidations: [{ address: PRE_A, preLltv: "832603694978499652", oracle: PRE_ORACLE }],
    });
  });

  it("drops a pre-liquidation contract the factory does not know, whatever it claims", async () => {
    const client = fakeClient(
      blueAnswer(success([USDC, OETH, ORACLE, IRM, 860000000000000000n]), {
        [PRE_A]: { fromFactory: false, id: MARKET },
      }),
    );
    expect((await readBlueMarketParams(client, ETHEREUM, MARKET, [PRE_A]))?.preLiquidations).toEqual([]);
  });

  it("returns null for a market that does not exist or cannot hold a borrow", async () => {
    for (const marketParams of [
      failure(),
      success([ZERO, ZERO, ZERO, ZERO, 0n]),
      success([USDC, ZERO, ZERO, ZERO, 0n]),
      success([USDC, OETH, ORACLE, IRM, 0n]),
    ]) {
      expect(await readBlueMarketParams(fakeClient(blueAnswer(marketParams)), ETHEREUM, MARKET)).toBe(null);
    }
  });

  it("shows a short address for a token without a readable symbol, but needs its decimals", async () => {
    const noSymbol = fakeClient(call =>
      call.functionName === "idToMarketParams"
        ? success([USDC, OETH, ORACLE, IRM, 860000000000000000n])
        : call.functionName === "symbol"
          ? failure()
          : success(18),
    );
    expect((await readBlueMarketParams(noSymbol, ETHEREUM, MARKET))?.collateralToken.symbol).toBe("0x0000…00b2");

    const noDecimals = fakeClient(call =>
      call.functionName === "idToMarketParams" ? success([USDC, OETH, ORACLE, IRM, 860000000000000000n]) : failure(),
    );
    expect(await readBlueMarketParams(noDecimals, ETHEREUM, MARKET)).toBe(null);
  });
});

describe("readMidnightMarketParams", () => {
  const market = {
    loanToken: USDC,
    collateralParams: [
      { token: USDC, lltv: 980000000000000000n, oracle: ORACLE },
      { token: OETH, lltv: 915000000000000000n, oracle: PRE_ORACLE },
    ],
    maturity: 1_793_372_400n,
  };

  it("reads the loan token, every collateral in the market's order and the maturity", async () => {
    const params = await readMidnightMarketParams(
      fakeClient(
        tokens,
        vi.fn(async () => market),
      ),
      ETHEREUM,
      MARKET,
    );

    expect(params).toEqual({
      kind: "midnight",
      loanToken: { address: USDC, symbol: "USDC", decimals: 6 },
      collaterals: [
        { token: { address: USDC, symbol: "USDC", decimals: 6 }, lltv: "980000000000000000", oracle: ORACLE },
        { token: { address: OETH, symbol: "OETH", decimals: 18 }, lltv: "915000000000000000", oracle: PRE_ORACLE },
      ],
      maturity: 1_793_372_400,
    });
  });

  it("returns null for an unknown market or a chain without Midnight", async () => {
    const reverts = vi.fn(async () => {
      throw new Error("MarketNotCreated");
    });
    expect(await readMidnightMarketParams(fakeClient(tokens, reverts), ETHEREUM, MARKET)).toBe(null);
    expect(
      await readMidnightMarketParams(
        fakeClient(
          tokens,
          vi.fn(async () => market),
        ),
        ARBITRUM,
        MARKET,
      ),
    ).toBe(null);
  });
});
