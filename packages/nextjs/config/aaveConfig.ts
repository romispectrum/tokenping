import { type Address, type Chain, defineChain } from "viem";
import * as chains from "viem/chains";
import type { Protocol } from "~~/config/protocols";

// Chains viem 2.39 has no definition for. The RPCs are the ones chainlist (and, for Arc, Aave's V4 API) list, and
// Multicall3 sits at its usual address on each.

/** Circle's Arc mainnet, which hosts Aave V4. viem ships only its testnet. */
export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.quicknode.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://www.arcexplorer.org" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

export const megaEth = defineChain({
  id: 4326,
  name: "MegaETH",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.megaeth.com/rpc"] } },
  blockExplorers: { default: { name: "MegaETH Explorer", url: "https://mega.etherscan.io" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

export const monad = defineChain({
  id: 143,
  name: "Monad",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "MonadVision", url: "https://monadvision.com" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

/**
 * Which market on a chain a position or an alert belongs to: "v3" for the chain's main Aave V3 market (its only one
 * before October 2026), otherwise the lowercased address of the V3 Pool or the V4 Spoke. Stored in
 * notification_configs.market.
 */
export type MarketId = string;

export const V3_MARKET_ID: MarketId = "v3";

/**
 * A market by its chain and its id within the chain: what an alert config is stored under. Without a protocol it is an
 * Aave market, as every market was before Morpho (config/protocols.ts).
 */
export type MarketRef = { chainId: number; market: MarketId; protocol?: Protocol };

export const addressMarketId = (address: Address): MarketId => address.toLowerCase();

export const isMarketId = (value: unknown): value is MarketId =>
  typeof value === "string" && (value === V3_MARKET_ID || /^0x[0-9a-f]{40}$/.test(value));

/** The one string that names a market across chains: "1:v3", "1:0x94e7...". Keys configs and the dashboard's selection. */
export const marketKey = (chainId: number, marketId: MarketId) => `${chainId}:${marketId}`;

/** An Aave V3 market: one Pool. A network has one, Ethereum several. */
export type AaveMarket = {
  chain: Chain;
  pool: Address;
  dataProvider: Address;
  /** The network's name. */
  name: string;
  /** Aave's name for the market on a network with several ("Core", "Prime"); undefined on a network with one. */
  marketName?: string;
  marketId: MarketId;
};

/** The network's main market: V3_MARKET_ID, as every alert saved before October 2026 is keyed. */
const v3Market = (
  chain: Chain,
  name: string,
  pool: Address,
  dataProvider: Address,
  marketName?: string,
): AaveMarket => ({
  chain,
  pool,
  dataProvider,
  name,
  marketName,
  marketId: V3_MARKET_ID,
});

/** A further market on a network, keyed by its Pool address like a V4 Spoke is by its address. */
const v3SecondaryMarket = (
  chain: Chain,
  name: string,
  marketName: string,
  pool: Address,
  dataProvider: Address,
): AaveMarket => ({ chain, pool, dataProvider, name, marketName, marketId: addressMarketId(pool) });

// Every Aave V3 market on a mainnet, from bgd-labs/aave-address-book (checked 16 Oct 2026; each Pool and
// PoolDataProvider answered on chain), in the order the dashboard lists them: the markets read before October 2026
// first, then by launch. Harmony is left out: frozen since 2022, with fixed price feeds since Chainlink left the chain,
// so a health factor there never moves. Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave
// governance: ZKsync, Metis and Soneium frozen by AIP 451 (Feb 2026), Scroll by AIP 470 (Apr 2026), and all five,
// Sonic included, under the July 2026 ARFC by AIP 521 (Sep 2026). Their open positions can still be liquidated, so they
// stay until they are empty (content/blog/aave-market-wind-down.mdx).
export const AAVE_MARKETS: readonly AaveMarket[] = [
  v3Market(
    chains.mainnet,
    "Ethereum",
    "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    "0x0a16f2FCC0D44FaE41cc54e079281D84A363bECD",
    "Core",
  ),
  v3SecondaryMarket(
    chains.mainnet,
    "Ethereum",
    "Prime",
    "0x4e033931ad43597d96D6bcc25c280717730B58B1",
    "0xB85B2bFEbeC4F5f401dbf92ac147A3076391fCD5",
  ),
  v3SecondaryMarket(
    chains.mainnet,
    "Ethereum",
    "EtherFi",
    "0x0AA97c284e98396202b6A04024F5E2c65026F3c0",
    "0x7c8509591f9693D21280d96e149a08A3bf69Cd0c",
  ),
  v3SecondaryMarket(
    chains.mainnet,
    "Ethereum",
    "Horizon",
    "0xAe05Cd22df81871bc7cC2a04BeCfb516bFe332C8",
    "0x53519c32f73fE1797d10210c4950fFeBa3b21504",
  ),
  v3Market(
    chains.polygon,
    "Polygon",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x243Aa95cAC2a25651eda86e80bEe66114413c43b",
  ),
  v3Market(
    chains.arbitrum,
    "Arbitrum",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x243Aa95cAC2a25651eda86e80bEe66114413c43b",
  ),
  v3Market(
    chains.optimism,
    "Optimism",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x243Aa95cAC2a25651eda86e80bEe66114413c43b",
  ),
  v3Market(
    chains.base,
    "Base",
    "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    "0x0F43731EB8d45A581f4a36DD74F5f358bc90C73A",
  ),
  v3Market(
    chains.avalanche,
    "Avalanche",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    "0x243Aa95cAC2a25651eda86e80bEe66114413c43b",
  ),
  v3Market(
    chains.gnosis,
    "Gnosis",
    "0xb50201558B00496A145fE76f7424749556E326D8",
    "0xF1F5acB596568895393cB5E4D0452D6592A2fA70",
  ),
  v3Market(
    chains.metis,
    "Metis",
    "0x90df02551bB792286e8D4f13E0e357b4Bf1D6a57",
    "0x602BeF1d4c381e5a29f0C562A310416A73D8Be19",
  ),
  v3Market(
    chains.bsc,
    "BNB Chain",
    "0x6807dc923806fE8Fd134338EABCA509979a7e0cB",
    "0xc90Df74A7c16245c5F5C5870327Ceb38Fe5d5328",
  ),
  v3Market(
    chains.scroll,
    "Scroll",
    "0x11fCfe756c05AD438e312a7fd934381537D3cFfe",
    "0xBEa2B648f05887eCbF1d115da8b7E4A317975A51",
  ),
  v3Market(
    chains.zksync,
    "ZKsync",
    "0x78e30497a3c7527d953c6B1E3541b021A98Ac43c",
    "0x9057ac7b2D35606F8AD5aE2FCBafcD94E58D9927",
  ),
  v3Market(
    chains.linea,
    "Linea",
    "0xc47b8C00b0f69a36fa203Ffeac0334874574a8Ac",
    "0x47cd4b507B81cB831669c71c7077f4daF6762FF4",
  ),
  v3Market(
    chains.sonic,
    "Sonic",
    "0x5362dBb1e601abF3a4c14c22ffEdA64042E5eAA3",
    "0xc0a344397cfa89dF1e1d3e4fb330834D789cF2CD",
  ),
  v3Market(
    chains.celo,
    "Celo",
    "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402",
    "0x2e0f8D3B1631296cC7c56538D6Eb6032601E15ED",
  ),
  v3Market(
    chains.soneium,
    "Soneium",
    "0xDd3d7A7d03D9fD9ef45f3E587287922eF65CA38B",
    "0x4a24b44b252db149B5B9BCec4dc3c2752807d626",
  ),
  v3Market(
    chains.plasma,
    "Plasma",
    "0x925a2A7214Ed92428B5b1B090F80b25700095e12",
    "0xf2D6E38B407e31E7E7e4a16E6769728b76c7419F",
  ),
  v3Market(
    chains.ink,
    "Ink",
    "0x2816cf15F6d2A220E789aA011D5EE4eB6c47FEbA",
    "0x96086C25d13943C80Ff9a19791a40Df6aFC08328",
  ),
  v3Market(
    megaEth,
    "MegaETH",
    "0x7e324AbC5De01d112AfC03a584966ff199741C28",
    "0x9588b453A4EE24a420830CB3302195cA7aA3b403",
  ),
  v3Market(
    chains.mantle,
    "Mantle",
    "0x458F293454fE0d67EC0655f3672301301DD51422",
    "0x487c5c669D9eee6057C44973207101276cf73b68",
  ),
  v3Market(
    chains.xLayer,
    "X Layer",
    "0xE3F3Caefdd7180F884c01E57f65Df979Af84f116",
    "0x6C505C31714f14e8af2A03633EB2Cdfb4959138F",
  ),
  v3Market(monad, "Monad", "0x69a5F9AD4f96ebf0a0C792dD42a01cC5C0102fef", "0xB65A68B98274ef7D9a60E0C0747dD1BEc3D32fad"),
];

/** The V3 market stored as (chain, market id): by default the chain's main market. */
export const getAaveMarket = (chainId: number, marketId: MarketId = V3_MARKET_ID) =>
  AAVE_MARKETS.find(market => market.chain.id === chainId && market.marketId === marketId);

/**
 * An Aave V4 Spoke. V4 keeps a separate position, with its own health factor and liquidation, in every Spoke, so each
 * Spoke is a market of its own. `name` is the network's name, `spokeName` Aave's name for the Spoke.
 */
export type AaveV4Spoke = {
  chain: Chain;
  spoke: Address;
  name: string;
  spokeName: string;
};

const v4Spokes = (chain: Chain, name: string, spokes: Record<string, Address>): AaveV4Spoke[] =>
  Object.entries(spokes).map(([spokeName, spoke]) => ({ chain, spoke, name, spokeName }));

// Every Aave V4 Spoke on a mainnet, from Aave's V4 API (api.v4.aave.com, `spokes`, checked 16 Oct 2026; each one
// answered getReserveCount on chain). Main first on each network, then alphabetical.
export const AAVE_V4_SPOKES: readonly AaveV4Spoke[] = [
  ...v4Spokes(chains.mainnet, "Ethereum", {
    Main: "0x94e7A5dCbE816e498b89aB752661904E2F56c485",
    Bluechip: "0x973a023A77420ba610f06b3858aD991Df6d85A08",
    "Ethena Correlated": "0x58131E79531caB1d52301228d1f7b842F26B9649",
    "Ethena Ecosystem": "0xba1B3D55D249692b669A164024A838309B7508AF",
    Etherfi: "0xbF10BDfE177dE0336aFD7fcCF80A904E15386219",
    Forex: "0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1",
    Gold: "0x65407b940966954b23dfA3caA5C0702bB42984DC",
    Kelp: "0x3131FE68C4722e726fe6B2819ED68e514395B9a4",
    Lido: "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd",
    Lombard: "0x7EC68b5695e803e98a21a9A05d744F28b0a7753D",
    "Maple SyrupUSDG": "0x774b9655413c34809c1f1b16b654465A89EBE989",
    "PAXG Gold": "0xAD75cE6354f87F3135cE10621d385d8D1e2562C2",
    "USDG Pendle": "0x956d8e0A89cfa3744428C4641b5a53B56167a7f9",
  }),
  ...v4Spokes(chains.avalanche, "Avalanche", {
    Main: "0x435272CefF93a1E657E8ABfdf0A13e95900A3a56",
    "AVAX Correlated": "0x3b517594277c67307CF2d7CBE6FE1D4399B68c41",
    Forex: "0x6a37776B5E026dBdF043b4F933c323C84DD1B514",
  }),
  ...v4Spokes(arc, "Arc", {
    Main: "0xB843bdC3a87A05E77E07Df9FE48928b3A34b134d",
    Forex: "0x4164EBCAF74670aa74C8D4F59de6157c0780F1bB",
    "Maple SyrupUSDC": "0x18Dde098d25722C14e09842a6Fa7db6aAFC395a2",
  }),
  ...v4Spokes(chains.base, "Base", {
    "Coinbase Stocks": "0x17905Db0e4A3514467539956c084180616AE7B8D",
  }),
];

export const getAaveV4Spoke = (chainId: number, marketId: MarketId) =>
  AAVE_V4_SPOKES.find(spoke => spoke.chain.id === chainId && addressMarketId(spoke.spoke) === marketId);

/**
 * How a market is named in the dashboard and in alerts, in every language: the network for a network's only V3
 * market ("Polygon"), the network and the market where it has several ("Ethereum (Core)"), the network and the Spoke
 * for V4 ("Ethereum (V4 Lido)").
 */
export const marketLabel = (market: AaveMarket | AaveV4Spoke) => {
  if ("spokeName" in market) return `${market.name} (V4 ${market.spokeName})`;
  return market.marketName ? `${market.name} (${market.marketName})` : market.name;
};

/** Resolves a stored (chain, market) pair to its V3 market or V4 Spoke; undefined when the app does not read it. */
export const resolveMarket = (chainId: number, marketId: MarketId) =>
  getAaveMarket(chainId, marketId) ?? getAaveV4Spoke(chainId, marketId);

/**
 * The Aave V3 networks in dashboard order, each with the names of its markets: ["Core", "Prime", "EtherFi",
 * "Horizon"] on Ethereum, [] on a network whose one market has no name of its own.
 */
export const AAVE_V3_NETWORKS: readonly { chain: Chain; name: string; marketNames: readonly string[] }[] = [
  ...new Map(
    AAVE_MARKETS.map(({ chain, name }) => [
      chain.id,
      {
        chain,
        name,
        marketNames: AAVE_MARKETS.filter(market => market.chain.id === chain.id).flatMap(({ marketName }) =>
          marketName ? [marketName] : [],
        ),
      },
    ]),
  ).values(),
];

/** Every chain with an Aave market Tokenping reads, each once: the V3 chains in dashboard order, then the V4-only ones. */
export const AAVE_CHAINS: readonly { chain: Chain; name: string }[] = [
  ...new Map([...AAVE_MARKETS, ...AAVE_V4_SPOKES].map(({ chain, name }) => [chain.id, { chain, name }])).values(),
];

/** The networks' names, in AAVE_CHAINS order. */
export const AAVE_NETWORK_NAMES: readonly string[] = AAVE_CHAINS.map(({ name }) => name);

/** The networks Aave V4 runs on, in AAVE_V4_SPOKES order. */
export const AAVE_V4_NETWORK_NAMES: readonly string[] = [...new Set(AAVE_V4_SPOKES.map(({ name }) => name))];

export const AAVE_POOL_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReservesList",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const AAVE_POOL_DATA_PROVIDER_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "user", type: "address" },
    ],
    name: "getUserReserveData",
    outputs: [
      { name: "currentATokenBalance", type: "uint256" },
      { name: "currentStableDebt", type: "uint256" },
      { name: "currentVariableDebt", type: "uint256" },
      { name: "principalStableDebt", type: "uint256" },
      { name: "scaledVariableDebt", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "stableRateLastUpdated", type: "uint40" },
      { name: "usageAsCollateralEnabled", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// The parts of Aave V4's ISpoke the dashboard and the cron read (aave/aave-v4, src/spoke/interfaces/ISpoke.sol).
// Values are USD with 26 decimals ("1e26 represents 1 USD"); the debt value is also scaled by a ray. The health
// factor is a wad, and type(uint256).max without debt, as on V3.
export const AAVE_V4_SPOKE_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "riskPremium", type: "uint256" },
          { name: "avgCollateralFactor", type: "uint256" },
          { name: "healthFactor", type: "uint256" },
          { name: "totalCollateralValue", type: "uint256" },
          { name: "totalDebtValueRay", type: "uint256" },
          { name: "activeCollateralCount", type: "uint256" },
          { name: "borrowCount", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReserveCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "reserveId", type: "uint256" }],
    name: "getReserve",
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "underlying", type: "address" },
          { name: "hub", type: "address" },
          { name: "assetId", type: "uint16" },
          { name: "decimals", type: "uint8" },
          { name: "collateralRisk", type: "uint24" },
          { name: "flags", type: "uint8" },
          { name: "dynamicConfigKey", type: "uint32" },
        ],
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "reserveId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getUserSuppliedAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "reserveId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getUserTotalDebt",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    // (supply enabled as collateral, borrowing)
    inputs: [
      { name: "reserveId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getUserReserveStatus",
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Tokens that predate the ERC-20 string convention, such as MKR, return symbol() as a NUL-padded bytes32.
export const ERC20_BYTES32_SYMBOL_ABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
