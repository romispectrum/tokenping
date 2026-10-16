import { decodeFunctionResult, encodeFunctionResult, getAddress } from "viem";
import * as chains from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  AAVE_CHAINS,
  AAVE_MARKETS,
  AAVE_NETWORK_NAMES,
  AAVE_V3_NETWORKS,
  AAVE_V4_NETWORK_NAMES,
  AAVE_V4_SPOKES,
  AAVE_V4_SPOKE_ABI,
  type AaveMarket,
  V3_MARKET_ID,
  addressMarketId,
  arc,
  getAaveMarket,
  getAaveV4Spoke,
  isMarketId,
  marketKey,
  marketLabel,
  megaEth,
  monad,
  resolveMarket,
} from "~~/config/aaveConfig";

// Ethereum's Lido Spoke and its market id.
const LIDO = AAVE_V4_SPOKES.find(({ spokeName, name }) => name === "Ethereum" && spokeName === "Lido")!;
const LIDO_ID = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";

// Ethereum's Prime market: a V3 Pool that is not the chain's main market, so its market id is its address.
const PRIME_POOL = "0x4e033931ad43597d96D6bcc25c280717730B58B1";
const PRIME_ID = "0x4e033931ad43597d96d6bcc25c280717730b58b1";
const ETHERFI_ID = "0x0aa97c284e98396202b6a04024f5e2c65026f3c0";
const HORIZON_ID = "0xae05cd22df81871bc7cc2a04becfb516bfe332c8";

// The Pool and data provider most of Aave's early L2 markets share.
const SHARED_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
const SHARED_DATA_PROVIDER = "0x243Aa95cAC2a25651eda86e80bEe66114413c43b";

const V3_NETWORK_NAMES = [
  "Ethereum",
  "Polygon",
  "Arbitrum",
  "Optimism",
  "Base",
  "Avalanche",
  "Gnosis",
  "Metis",
  "BNB Chain",
  "Scroll",
  "ZKsync",
  "Linea",
  "Sonic",
  "Celo",
  "Soneium",
  "Plasma",
  "Ink",
  "MegaETH",
  "Mantle",
  "X Layer",
  "Monad",
];

describe("AAVE_MARKETS", () => {
  const row = ({ chain, name, marketName, marketId, pool, dataProvider }: AaveMarket) => [
    chain.id,
    name,
    marketName,
    marketId,
    pool,
    dataProvider,
  ];

  it("lists the 24 V3 markets of bgd-labs/aave-address-book in dashboard order", () => {
    expect(AAVE_MARKETS.map(row)).toEqual([
      [
        1,
        "Ethereum",
        "Core",
        "v3",
        "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
        "0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD",
      ],
      [1, "Ethereum", "Prime", PRIME_ID, PRIME_POOL, "0xB85B2bFEbeC4F5f401dbf92ac147A3076391fCD5"],
      [
        1,
        "Ethereum",
        "EtherFi",
        ETHERFI_ID,
        "0x0AA97c284e98396202b6A04024F5E2c65026F3c0",
        "0x7c8509591f9693D21280d96e149a08A3bf69Cd0c",
      ],
      [
        1,
        "Ethereum",
        "Horizon",
        HORIZON_ID,
        "0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8",
        "0x53519c32f73fE1797d10210c4950fFeBa3b21504",
      ],
      [137, "Polygon", undefined, "v3", SHARED_POOL, SHARED_DATA_PROVIDER],
      [42161, "Arbitrum", undefined, "v3", SHARED_POOL, SHARED_DATA_PROVIDER],
      [10, "Optimism", undefined, "v3", SHARED_POOL, SHARED_DATA_PROVIDER],
      [
        8453,
        "Base",
        undefined,
        "v3",
        "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
        "0x0F43731EB8d45A581f4a36DD74F5f358bc90C73A",
      ],
      [43114, "Avalanche", undefined, "v3", SHARED_POOL, SHARED_DATA_PROVIDER],
      [
        100,
        "Gnosis",
        undefined,
        "v3",
        "0xb50201558B00496A145fE76f7424749556E326D8",
        "0xF1F5acB596568895393cB5E4D0452D6592A2fA70",
      ],
      [
        1088,
        "Metis",
        undefined,
        "v3",
        "0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57",
        "0x602BeF1d4c381e5a29f0C562A310416A73D8Be19",
      ],
      [
        56,
        "BNB Chain",
        undefined,
        "v3",
        "0x6807dc923806fE8Fd134338EABCA509979a7e0cB",
        "0xc90Df74A7c16245c5F5C5870327Ceb38Fe5d5328",
      ],
      [
        534352,
        "Scroll",
        undefined,
        "v3",
        "0x11fCfe756c05AD438e312a7fd934381537D3cFfe",
        "0xBEa2B648f05887eCbF1d115da8b7E4A317975A51",
      ],
      [
        324,
        "ZKsync",
        undefined,
        "v3",
        "0x78e30497a3c7527d953c6B1E3541b021A98Ac43c",
        "0x9057ac7b2D35606F8AD5aE2FCBafcD94E58D9927",
      ],
      [
        59144,
        "Linea",
        undefined,
        "v3",
        "0xc47b8C00b0f69a36fa203Ffeac0334874574a8Ac",
        "0x47cd4b507B81cB831669c71c7077f4daF6762FF4",
      ],
      [
        146,
        "Sonic",
        undefined,
        "v3",
        "0x5362dBb1e601abF3a4c14c22ffEdA64042E5eAA3",
        "0xc0a344397cfa89dF1e1d3e4fb330834D789cF2CD",
      ],
      [
        42220,
        "Celo",
        undefined,
        "v3",
        "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402",
        "0x2e0f8D3B1631296cC7c56538D6Eb6032601E15ED",
      ],
      [
        1868,
        "Soneium",
        undefined,
        "v3",
        "0xDd3d7A7d03D9fD9ef45f3E587287922eF65CA38B",
        "0x4a24b44b252db149B5B9BCec4dc3c2752807d626",
      ],
      [
        9745,
        "Plasma",
        undefined,
        "v3",
        "0x925a2A7214Ed92428B5b1B090F80b25700095e12",
        "0xf2D6E38B407e31E7E7e4a16E6769728b76c7419F",
      ],
      [
        57073,
        "Ink",
        undefined,
        "v3",
        "0x2816cf15F6d2A220E789aA011D5EE4eB6c47FEbA",
        "0x96086C25d13943C80Ff9a19791a40Df6aFC08328",
      ],
      [
        4326,
        "MegaETH",
        undefined,
        "v3",
        "0x7e324AbC5De01d112AfC03a584966ff199741C28",
        "0x9588b453A4EE24a420830CB3302195cA7aA3b403",
      ],
      [
        5000,
        "Mantle",
        undefined,
        "v3",
        "0x458F293454fE0d67EC0655f3672301301DD51422",
        "0x487c5c669D9eee6057C44973207101276cf73b68",
      ],
      [
        196,
        "X Layer",
        undefined,
        "v3",
        "0xE3F3Caefdd7180F884c01E57f65Df979Af84f116",
        "0x6C505C31714f14e8af2A03633EB2Cdfb4959138F",
      ],
      [
        143,
        "Monad",
        undefined,
        "v3",
        "0x69a5F9AD4f96ebf0a0C792dD42a01cC5C0102fef",
        "0xB65A68B98274ef7D9a60E0C0747dD1BEc3D32fad",
      ],
    ]);
  });

  it("puts each market on its viem chain, or on the chain defined here where viem has none", () => {
    expect(AAVE_MARKETS.map(({ chain }) => chain)).toEqual([
      chains.mainnet,
      chains.mainnet,
      chains.mainnet,
      chains.mainnet,
      chains.polygon,
      chains.arbitrum,
      chains.optimism,
      chains.base,
      chains.avalanche,
      chains.gnosis,
      chains.metis,
      chains.bsc,
      chains.scroll,
      chains.zksync,
      chains.linea,
      chains.sonic,
      chains.celo,
      chains.soneium,
      chains.plasma,
      chains.ink,
      megaEth,
      chains.mantle,
      chains.xLayer,
      monad,
    ]);
  });

  it("keeps every Pool and data provider checksummed", () => {
    for (const { pool, dataProvider } of AAVE_MARKETS) {
      expect(getAddress(pool)).toBe(pool);
      expect(getAddress(dataProvider)).toBe(dataProvider);
    }
  });

  it("gives every market its own key", () => {
    const keys = AAVE_MARKETS.map(({ chain, marketId }) => marketKey(chain.id, marketId));
    expect(new Set(keys).size).toBe(AAVE_MARKETS.length);
  });

  it("names the main market v3 and every further market on a chain by its lowercased Pool", () => {
    for (const market of AAVE_MARKETS) {
      const [main] = AAVE_MARKETS.filter(({ chain }) => chain.id === market.chain.id);
      expect(market.marketId).toBe(market === main ? V3_MARKET_ID : addressMarketId(market.pool));
    }
  });

  it("leaves Harmony out", () => {
    expect(AAVE_MARKETS.some(({ chain }) => chain.id === chains.harmonyOne.id)).toBe(false);
  });
});

describe("chains viem has no definition for", () => {
  it("is Arc mainnet with Multicall3 at its usual address", () => {
    expect(arc).toMatchObject({
      id: 5042,
      name: "Arc",
      rpcUrls: { default: { http: ["https://rpc.quicknode.mainnet.arc.io"] } },
      contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
    });
  });

  it("is MegaETH mainnet with Multicall3 at its usual address", () => {
    expect(megaEth).toMatchObject({
      id: 4326,
      name: "MegaETH",
      nativeCurrency: { symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: ["https://mainnet.megaeth.com/rpc"] } },
      contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
    });
  });

  it("is Monad mainnet with Multicall3 at its usual address", () => {
    expect(monad).toMatchObject({
      id: 143,
      name: "Monad",
      nativeCurrency: { symbol: "MON", decimals: 18 },
      rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
      contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
    });
  });

  it("does not collide with any viem chain", () => {
    const viemIds = new Set<number>(Object.values(chains).map(chain => chain.id));
    for (const chain of [arc, megaEth, monad]) expect(viemIds.has(chain.id), chain.name).toBe(false);
  });
});

describe("getAaveMarket", () => {
  it("finds a chain's main market by chain id alone, or as v3", () => {
    expect(getAaveMarket(chains.base.id)?.name).toBe("Base");
    expect(getAaveMarket(chains.bsc.id)?.name).toBe("BNB Chain");
    expect(getAaveMarket(chains.mainnet.id)).toBe(AAVE_MARKETS[0]);
    expect(getAaveMarket(chains.mainnet.id, "v3")).toBe(AAVE_MARKETS[0]);
  });

  it("finds a further market on a chain by its lowercased Pool address", () => {
    expect(getAaveMarket(chains.mainnet.id, PRIME_ID)).toBe(AAVE_MARKETS[1]);
    expect(getAaveMarket(chains.mainnet.id, ETHERFI_ID)?.marketName).toBe("EtherFi");
    expect(getAaveMarket(chains.mainnet.id, HORIZON_ID)?.marketName).toBe("Horizon");
  });

  it.each([
    ["the checksummed Pool address", chains.mainnet.id, PRIME_POOL],
    ["a Pool on another chain", chains.polygon.id, PRIME_ID],
    ["a V4 Spoke", chains.mainnet.id, LIDO_ID],
    ["a chain's main Pool as an address", chains.polygon.id, SHARED_POOL.toLowerCase()],
  ])("returns undefined for %s", (_, chainId, marketId) => {
    expect(getAaveMarket(chainId, marketId)).toBeUndefined();
  });

  it("returns undefined for chains without an Aave V3 market", () => {
    expect(getAaveMarket(arc.id)).toBeUndefined();
    expect(getAaveMarket(chains.harmonyOne.id)).toBeUndefined();
    expect(getAaveMarket(chains.hardhat.id)).toBeUndefined();
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
  it("names the main V3 market v3 and any other market by its lowercased address", () => {
    expect(V3_MARKET_ID).toBe("v3");
    expect(addressMarketId(LIDO.spoke)).toBe(LIDO_ID);
    expect(addressMarketId(PRIME_POOL)).toBe(PRIME_ID);
    expect(addressMarketId(PRIME_ID)).toBe(PRIME_ID);
  });

  it.each([
    ["v3", true],
    [LIDO_ID, true],
    [PRIME_ID, true],
    [`0x${"0".repeat(40)}`, true],
    // Any well-formed address, whether or not it is a market the app reads.
    [`0x${"12".repeat(20)}`, true],
    ["V3", false],
    ["v4", false],
    ["", false],
    [LIDO.spoke, false],
    [PRIME_POOL, false],
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
    expect(marketKey(1, PRIME_ID)).toBe(`1:${PRIME_ID}`);
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
    ["a V3 Pool", chains.mainnet.id, PRIME_ID],
    ["an address that is no Spoke", chains.mainnet.id, `0x${"12".repeat(20)}`],
  ])("returns undefined for %s", (_, chainId, marketId) => {
    expect(getAaveV4Spoke(chainId, marketId)).toBeUndefined();
  });
});

describe("marketLabel", () => {
  it("names a network's only V3 market by the network alone", () => {
    expect(marketLabel(getAaveMarket(chains.polygon.id)!)).toBe("Polygon");
    expect(marketLabel(getAaveMarket(chains.bsc.id)!)).toBe("BNB Chain");
  });

  it("names a V3 market on a network with several by the network and the market", () => {
    expect(marketLabel(getAaveMarket(chains.mainnet.id)!)).toBe("Ethereum (Core)");
    expect(marketLabel(getAaveMarket(chains.mainnet.id, PRIME_ID)!)).toBe("Ethereum (Prime)");
  });

  it("names a V4 Spoke by its network and Spoke", () => {
    expect(marketLabel(LIDO)).toBe("Ethereum (V4 Lido)");
    expect(AAVE_V4_SPOKES.map(marketLabel)).toContain("Base (V4 Coinbase Stocks)");
  });

  it("gives every market the app reads a label of its own", () => {
    const labels = [...AAVE_MARKETS, ...AAVE_V4_SPOKES].map(marketLabel);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("resolveMarket", () => {
  it("resolves v3 to the chain's main V3 market and a Spoke id to its Spoke", () => {
    expect(resolveMarket(chains.mainnet.id, "v3")).toBe(getAaveMarket(chains.mainnet.id));
    expect(resolveMarket(chains.mainnet.id, LIDO_ID)).toBe(LIDO);
    expect(resolveMarket(arc.id, addressMarketId("0xB843bdC3a87A05E77E07Df9FE48928b3A34b134d"))?.name).toBe("Arc");
  });

  it("resolves a further V3 market by its Pool address, like a Spoke", () => {
    expect(resolveMarket(chains.mainnet.id, PRIME_ID)).toBe(AAVE_MARKETS[1]);
    expect(resolveMarket(chains.mainnet.id, HORIZON_ID)).toBe(getAaveMarket(chains.mainnet.id, HORIZON_ID));
  });

  it.each([
    ["v3 on a V4-only chain", arc.id, "v3"],
    ["v3 on a chain without Aave", chains.harmonyOne.id, "v3"],
    ["a Spoke on another chain", chains.polygon.id, LIDO_ID],
    ["a V3 Pool on another chain", chains.polygon.id, PRIME_ID],
    ["a checksummed V3 Pool", chains.mainnet.id, PRIME_POOL],
    ["an address that is no market", chains.mainnet.id, `0x${"12".repeat(20)}`],
  ])("returns undefined for %s", (_, chainId, marketId) => {
    expect(resolveMarket(chainId, marketId)).toBeUndefined();
  });
});

describe("AAVE_V3_NETWORKS", () => {
  it("lists the 21 V3 networks once each, in dashboard order", () => {
    expect(AAVE_V3_NETWORKS.map(({ name }) => name)).toEqual(V3_NETWORK_NAMES);
    expect(AAVE_V3_NETWORKS.map(({ chain }) => chain.id)).toEqual([
      ...new Set(AAVE_MARKETS.map(({ chain }) => chain.id)),
    ]);
  });

  it("names Ethereum's markets and leaves a network with one unnamed market empty", () => {
    const marketNames = Object.fromEntries(AAVE_V3_NETWORKS.map(({ name, marketNames }) => [name, marketNames]));
    expect(marketNames).toEqual({
      Ethereum: ["Core", "Prime", "EtherFi", "Horizon"],
      ...Object.fromEntries(V3_NETWORK_NAMES.filter(name => name !== "Ethereum").map(name => [name, []])),
    });
  });

  it("uses the markets' chain objects", () => {
    for (const { chain, name } of AAVE_V3_NETWORKS) {
      expect(getAaveMarket(chain.id)?.chain, name).toBe(chain);
      expect(getAaveMarket(chain.id)?.name, name).toBe(name);
    }
  });
});

describe("AAVE_CHAINS", () => {
  it("lists 22 chains once each: the V3 networks in dashboard order, then Arc", () => {
    expect(AAVE_CHAINS).toHaveLength(22);
    expect(new Set(AAVE_CHAINS.map(({ chain }) => chain.id)).size).toBe(22);
    expect(AAVE_CHAINS.map(({ name }) => name)).toEqual([...V3_NETWORK_NAMES, "Arc"]);
    expect(AAVE_CHAINS.at(-1)?.chain).toBe(arc);
  });

  it("covers every chain with a V3 market or a V4 Spoke, and no other", () => {
    const ids = new Set(AAVE_CHAINS.map(({ chain }) => chain.id));
    expect(ids).toEqual(new Set([...AAVE_MARKETS, ...AAVE_V4_SPOKES].map(({ chain }) => chain.id)));
    expect(ids.has(chains.harmonyOne.id)).toBe(false);
  });

  it("names each chain as its markets do", () => {
    for (const { chain, name } of AAVE_CHAINS) {
      const market = AAVE_MARKETS.find(market => market.chain.id === chain.id);
      const spoke = AAVE_V4_SPOKES.find(spoke => spoke.chain.id === chain.id);
      expect((market ?? spoke)?.name, name).toBe(name);
      expect((market ?? spoke)?.chain, name).toBe(chain);
    }
  });
});

describe("network names", () => {
  it("lists every network once, the V3 ones in dashboard order, then the V4-only ones", () => {
    expect(AAVE_NETWORK_NAMES).toEqual([...V3_NETWORK_NAMES, "Arc"]);
    expect(AAVE_NETWORK_NAMES).toEqual(AAVE_CHAINS.map(({ name }) => name));
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
