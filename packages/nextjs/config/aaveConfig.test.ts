import { decodeFunctionResult, encodeFunctionResult, getAddress } from "viem";
import * as chains from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  AAVE_MARKETS,
  AAVE_NETWORK_NAMES,
  AAVE_V4_NETWORK_NAMES,
  AAVE_V4_SPOKES,
  AAVE_V4_SPOKE_ABI,
  V3_MARKET_ID,
  arc,
  getAaveMarket,
  getAaveV4Spoke,
  isMarketId,
  marketKey,
  marketLabel,
  resolveMarket,
  v4MarketId,
} from "~~/config/aaveConfig";

// Verbatim copies of the parallel maps AAVE_MARKETS replaced.
const LEGACY_POOL_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  [chains.polygon.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.arbitrum.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.optimism.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.base.id]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  [chains.avalanche.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.gnosis.id]: "0xb50201558B00496A145fE76f7424749556E326D8",
};

const LEGACY_POOL_DATA_PROVIDER_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
  [chains.polygon.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.arbitrum.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.optimism.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.base.id]: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac",
  [chains.avalanche.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.gnosis.id]: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
};

// Ethereum's Lido Spoke and its market id.
const LIDO = AAVE_V4_SPOKES.find(({ spokeName, name }) => name === "Ethereum" && spokeName === "Lido")!;
const LIDO_ID = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";

const LEGACY_SUPPORTED_CHAINS = [
  chains.mainnet,
  chains.polygon,
  chains.arbitrum,
  chains.optimism,
  chains.base,
  chains.avalanche,
  chains.gnosis,
];

const LEGACY_CHAIN_METADATA: Record<number, { name: string }> = {
  [chains.mainnet.id]: { name: "Ethereum" },
  [chains.polygon.id]: { name: "Polygon" },
  [chains.arbitrum.id]: { name: "Arbitrum" },
  [chains.optimism.id]: { name: "Optimism" },
  [chains.base.id]: { name: "Base" },
  [chains.avalanche.id]: { name: "Avalanche" },
  [chains.gnosis.id]: { name: "Gnosis" },
};

describe("AAVE_MARKETS", () => {
  it("lists the same chains in the same order", () => {
    expect(AAVE_MARKETS.map(market => market.chain)).toEqual(LEGACY_SUPPORTED_CHAINS);
  });

  it("keeps each chain's pool, data provider and display name", () => {
    expect(
      AAVE_MARKETS.map(({ chain, pool, dataProvider, name }) => ({
        chainId: chain.id,
        pool,
        dataProvider,
        name,
      })),
    ).toEqual(
      LEGACY_SUPPORTED_CHAINS.map(chain => ({
        chainId: chain.id,
        pool: LEGACY_POOL_ADDRESSES[chain.id],
        dataProvider: LEGACY_POOL_DATA_PROVIDER_ADDRESSES[chain.id],
        ...LEGACY_CHAIN_METADATA[chain.id],
      })),
    );
  });
});

describe("getAaveMarket", () => {
  it("finds a market by chain id", () => {
    expect(getAaveMarket(chains.base.id)?.name).toBe("Base");
  });

  it("returns undefined for chains without an Aave market", () => {
    expect(getAaveMarket(chains.bsc.id)).toBeUndefined();
    expect(getAaveMarket(chains.hardhat.id)).toBeUndefined();
  });
});

describe("arc", () => {
  it("is Arc mainnet with Multicall3 at its usual address", () => {
    expect(arc).toMatchObject({
      id: 5042,
      name: "Arc",
      rpcUrls: { default: { http: ["https://rpc.quicknode.mainnet.arc.io"] } },
      contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
    });
  });
});

describe("AAVE_V4_SPOKES", () => {
  it("lists 20 Spokes, Main first on each network", () => {
    expect(AAVE_V4_SPOKES).toHaveLength(20);
    expect(AAVE_V4_SPOKES.map(({ name, spokeName }) => `${name} ${spokeName}`)).toEqual([
      "Ethereum Main",
      "Ethereum Bluechip",
      "Ethereum Ethena Correlated",
      "Ethereum Ethena Ecosystem",
      "Ethereum Etherfi",
      "Ethereum Forex",
      "Ethereum Gold",
      "Ethereum Kelp",
      "Ethereum Lido",
      "Ethereum Lombard",
      "Ethereum Maple SyrupUSDG",
      "Ethereum PAXG Gold",
      "Ethereum USDG Pendle",
      "Avalanche Main",
      "Avalanche AVAX Correlated",
      "Avalanche Forex",
      "Arc Main",
      "Arc Forex",
      "Arc Maple SyrupUSDC",
      "Base Coinbase Stocks",
    ]);
  });

  it("puts each Spoke on its network's chain", () => {
    const chainIds = Object.fromEntries(AAVE_V4_SPOKES.map(({ name, chain }) => [name, chain.id]));
    expect(chainIds).toEqual({
      Ethereum: chains.mainnet.id,
      Avalanche: chains.avalanche.id,
      Arc: arc.id,
      Base: chains.base.id,
    });
  });

  it("keeps every address checksummed and unique", () => {
    for (const { spoke } of AAVE_V4_SPOKES) expect(getAddress(spoke)).toBe(spoke);
    expect(new Set(AAVE_V4_SPOKES.map(({ spoke }) => spoke.toLowerCase())).size).toBe(AAVE_V4_SPOKES.length);
  });

  it("keeps the Spoke addresses apart from every V3 Pool and data provider", () => {
    const v3 = AAVE_MARKETS.flatMap(({ pool, dataProvider }) => [pool, dataProvider]);
    expect(AAVE_V4_SPOKES.filter(({ spoke }) => v3.includes(spoke))).toEqual([]);
  });
});

describe("market ids", () => {
  it("names the V3 market v3 and a V4 Spoke by its lowercased address", () => {
    expect(V3_MARKET_ID).toBe("v3");
    expect(v4MarketId(LIDO.spoke)).toBe(LIDO_ID);
  });

  it.each([
    ["v3", true],
    [LIDO_ID, true],
    [`0x${"0".repeat(40)}`, true],
    // Any well-formed address, whether or not it is a Spoke the app reads.
    [`0x${"12".repeat(20)}`, true],
    ["V3", false],
    ["v4", false],
    ["", false],
    [LIDO.spoke, false],
    [LIDO_ID.slice(0, -1), false],
    [`${LIDO_ID}0`, false],
    [` ${LIDO_ID}`, false],
    [LIDO_ID.slice(2), false],
    [3, false],
    [null, false],
    [undefined, false],
  ])("isMarketId(%j) is %s", (value, expected) => {
    expect(isMarketId(value)).toBe(expected);
  });

  it("keys a market by chain id and market id", () => {
    expect(marketKey(1, "v3")).toBe("1:v3");
    expect(marketKey(1, LIDO_ID)).toBe(`1:${LIDO_ID}`);
  });
});

describe("getAaveV4Spoke", () => {
  it("finds a Spoke by chain id and market id", () => {
    expect(getAaveV4Spoke(chains.mainnet.id, LIDO_ID)).toBe(LIDO);
  });

  it.each([
    ["the checksummed address", chains.mainnet.id, LIDO.spoke],
    ["another chain", chains.base.id, LIDO_ID],
    ["the V3 market", chains.mainnet.id, "v3"],
    ["an address that is no Spoke", chains.mainnet.id, `0x${"12".repeat(20)}`],
  ])("returns undefined for %s", (_, chainId, marketId) => {
    expect(getAaveV4Spoke(chainId, marketId)).toBeUndefined();
  });
});

describe("marketLabel", () => {
  it("names a V3 market by its network and a V4 Spoke by its network and Spoke", () => {
    expect(marketLabel(getAaveMarket(chains.mainnet.id)!)).toBe("Ethereum");
    expect(marketLabel(LIDO)).toBe("Ethereum (V4 Lido)");
    expect(AAVE_V4_SPOKES.map(marketLabel)).toContain("Base (V4 Coinbase Stocks)");
  });
});

describe("resolveMarket", () => {
  it("resolves v3 to the chain's V3 market and a Spoke id to its Spoke", () => {
    expect(resolveMarket(chains.mainnet.id, "v3")).toBe(getAaveMarket(chains.mainnet.id));
    expect(resolveMarket(chains.mainnet.id, LIDO_ID)).toBe(LIDO);
    expect(resolveMarket(arc.id, v4MarketId("0xB843bdC3a87A05E77E07Df9FE48928b3A34b134d"))?.name).toBe("Arc");
  });

  it.each([
    ["v3 on a V4-only chain", arc.id, "v3"],
    ["v3 on a chain without Aave", chains.bsc.id, "v3"],
    ["a Spoke on another chain", chains.polygon.id, LIDO_ID],
    ["an address that is no Spoke", chains.mainnet.id, `0x${"12".repeat(20)}`],
  ])("returns undefined for %s", (_, chainId, marketId) => {
    expect(resolveMarket(chainId, marketId)).toBeUndefined();
  });
});

describe("network names", () => {
  it("lists every network once, the V3 ones in dashboard order, then the V4-only ones", () => {
    expect(AAVE_NETWORK_NAMES).toEqual([
      "Ethereum",
      "Polygon",
      "Arbitrum",
      "Optimism",
      "Base",
      "Avalanche",
      "Gnosis",
      "Arc",
    ]);
  });

  it("lists the networks Aave V4 runs on once each, in Spoke order", () => {
    expect(AAVE_V4_NETWORK_NAMES).toEqual(["Ethereum", "Avalanche", "Arc", "Base"]);
  });
});

describe("AAVE_V4_SPOKE_ABI", () => {
  it("decodes getUserAccountData as a struct with the health factor by name", () => {
    const account = {
      riskPremium: 1n,
      avgCollateralFactor: 2n,
      healthFactor: 2_028_074_091_781_711_275n,
      totalCollateralValue: 8_541_843_717_924_562_324_000_000_000_000n,
      totalDebtValueRay: 3n,
      activeCollateralCount: 4n,
      borrowCount: 5n,
    };
    const data = encodeFunctionResult({ abi: AAVE_V4_SPOKE_ABI, functionName: "getUserAccountData", result: account });

    expect(decodeFunctionResult({ abi: AAVE_V4_SPOKE_ABI, functionName: "getUserAccountData", data })).toEqual(account);
  });

  it("decodes getUserReserveStatus as (collateral, borrowing)", () => {
    const data = encodeFunctionResult({
      abi: AAVE_V4_SPOKE_ABI,
      functionName: "getUserReserveStatus",
      result: [true, false],
    });

    expect(decodeFunctionResult({ abi: AAVE_V4_SPOKE_ABI, functionName: "getUserReserveStatus", data })).toEqual([
      true,
      false,
    ]);
  });
});
