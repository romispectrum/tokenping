import { type Address, type Hex, getAddress } from "viem";
import { describe, expect, it, vi } from "vitest";
import { getMorphoChain } from "~~/config/morpho";
import type { MorphoClient } from "~~/services/morpho/client";
import {
  readBlueMarketParams,
  readListedMarketParams,
  readMidnightMarketParams,
  refreshMarketParams,
} from "~~/services/morpho/params";
import type { BlueMarketParams } from "~~/services/morpho/types";

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

/** Morpho's API answering a Blue market's listing (GraphQL) or a Midnight one's (REST). */
const listingFetch = (listing: { listed: boolean; preLiquidations?: Address[] } | null | Error) =>
  vi.fn(async (input: string | URL | Request) => {
    if (listing instanceof Error) throw listing;
    const json = (body: unknown) => new Response(JSON.stringify(body));
    if (String(input).endsWith("/graphql")) {
      return json({
        data: {
          marketById: listing && {
            marketId: MARKET,
            listed: listing.listed,
            preLiquidations: { items: (listing.preLiquidations ?? []).map(address => ({ address })) },
          },
        },
      });
    }
    return json({ data: listing ? [{ market_id: MARKET, chain_id: 1, listed: listing.listed }] : [] });
  }) as unknown as typeof fetch;

// The API's addresses come back checksummed, and the contract is called at that address.
const PRE_A_API = getAddress(PRE_A);

const BLUE_CLIENT = () =>
  fakeClient(
    blueAnswer(success([USDC, OETH, ORACLE, IRM, 860000000000000000n]), {
      [PRE_A_API]: { fromFactory: true, id: MARKET },
    }),
  );

describe("readListedMarketParams", () => {
  it("reads a listed Blue market with the pre-liquidation contracts the API names", async () => {
    const params = await readListedMarketParams(
      BLUE_CLIENT(),
      ETHEREUM,
      "morpho-blue",
      MARKET,
      listingFetch({ listed: true, preLiquidations: [PRE_A] }),
    );
    expect(params).toMatchObject({ kind: "blue", preLiquidations: [{ address: PRE_A_API }] });
  });

  it("reads a listed Midnight market", async () => {
    const client = fakeClient(
      tokens,
      vi.fn(async () => ({ loanToken: USDC, collateralParams: [], maturity: 1_793_372_400n })),
    );
    const params = await readListedMarketParams(
      client,
      ETHEREUM,
      "morpho-midnight",
      MARKET,
      listingFetch({ listed: true }),
    );
    expect(params).toMatchObject({ kind: "midnight", maturity: 1_793_372_400 });
  });

  it("returns null without reading the chain for a market the API does not list or know", async () => {
    for (const listing of [{ listed: false }, null]) {
      const client = BLUE_CLIENT();
      expect(await readListedMarketParams(client, ETHEREUM, "morpho-blue", MARKET, listingFetch(listing))).toBe(null);
      expect(client.multicall).not.toHaveBeenCalled();
    }
  });

  it("throws MorphoApiError when the API cannot answer", async () => {
    await expect(
      readListedMarketParams(BLUE_CLIENT(), ETHEREUM, "morpho-blue", MARKET, listingFetch(new TypeError("offline"))),
    ).rejects.toThrow("Morpho API unreachable");
  });
});

describe("refreshMarketParams", () => {
  const STORED: BlueMarketParams = {
    kind: "blue",
    loanToken: { address: USDC, symbol: "USDC", decimals: 6 },
    collateralToken: { address: OETH, symbol: "OETH", decimals: 18 },
    oracle: ORACLE,
    irm: IRM,
    lltv: "860000000000000000",
    preLiquidations: [],
  };

  it("picks up a pre-liquidation contract added since, even on a market delisted since", async () => {
    const params = await refreshMarketParams(
      BLUE_CLIENT(),
      ETHEREUM,
      MARKET,
      STORED,
      listingFetch({ listed: false, preLiquidations: [PRE_A] }),
    );
    expect(params).toEqual({
      ...STORED,
      preLiquidations: [{ address: PRE_A_API, preLltv: "832603694978499652", oracle: PRE_ORACLE }],
    });
  });

  it("keeps the stored parameters when the API or the chain cannot answer", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await refreshMarketParams(BLUE_CLIENT(), ETHEREUM, MARKET, STORED, listingFetch(new Error("down")))).toBe(
      STORED,
    );
    expect(consoleError).toHaveBeenCalledOnce();
    expect(await refreshMarketParams(BLUE_CLIENT(), ETHEREUM, MARKET, STORED, listingFetch(null))).toBe(STORED);
    const broken = fakeClient(() => failure());
    expect(
      await refreshMarketParams(broken, ETHEREUM, MARKET, STORED, listingFetch({ listed: true, preLiquidations: [] })),
    ).toBe(STORED);
    consoleError.mockRestore();
  });

  it("never asks about a Midnight market, whose parameters cannot change", async () => {
    const stored = { kind: "midnight" as const, loanToken: STORED.loanToken, collaterals: [], maturity: 1 };
    const fetchImpl = listingFetch({ listed: true });
    expect(await refreshMarketParams(BLUE_CLIENT(), ETHEREUM, MARKET, stored, fetchImpl)).toBe(stored);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
