import { type Address, type Chain, defineChain } from "viem";
import * as chains from "viem/chains";

/**
 * Circle's Arc mainnet, which hosts Aave V4. viem ships only its testnet; the RPC is the one Aave's V4 API lists for
 * the chain, and Multicall3 sits at its usual address there.
 */
export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.quicknode.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://www.arcexplorer.org" } },
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" } },
});

/** An Aave V3 market: one Pool per network. */
export type AaveMarket = {
  chain: Chain;
  pool: Address;
  dataProvider: Address;
  name: string;
};

// Aave V3 Pool and PoolDataProvider per network, in the order the dashboard lists them.
export const AAVE_MARKETS: readonly AaveMarket[] = [
  {
    chain: chains.mainnet,
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    dataProvider: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
    name: "Ethereum",
  },
  {
    chain: chains.polygon,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Polygon",
  },
  {
    chain: chains.arbitrum,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Arbitrum",
  },
  {
    chain: chains.optimism,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Optimism",
  },
  {
    chain: chains.base,
    pool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    dataProvider: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac",
    name: "Base",
  },
  {
    chain: chains.avalanche,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Avalanche",
  },
  {
    chain: chains.gnosis,
    pool: "0xb50201558B00496A145fE76f7424749556E326D8",
    dataProvider: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
    name: "Gnosis",
  },
];

export const getAaveMarket = (chainId: number) => AAVE_MARKETS.find(market => market.chain.id === chainId);

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

/**
 * Which market on a chain a position or an alert belongs to: "v3" for the chain's V3 Pool, otherwise the V4 Spoke's
 * lowercased address. Stored in notification_configs.market.
 */
export type MarketId = string;

export const V3_MARKET_ID: MarketId = "v3";

/** A market by its chain and its id within the chain: what an alert config is stored under. */
export type MarketRef = { chainId: number; market: MarketId };

export const v4MarketId = (spoke: Address): MarketId => spoke.toLowerCase();

export const isMarketId = (value: unknown): value is MarketId =>
  typeof value === "string" && (value === V3_MARKET_ID || /^0x[0-9a-f]{40}$/.test(value));

/** The one string that names a market across chains: "1:v3", "1:0x94e7...". Keys configs and the dashboard's selection. */
export const marketKey = (chainId: number, marketId: MarketId) => `${chainId}:${marketId}`;

export const getAaveV4Spoke = (chainId: number, marketId: MarketId) =>
  AAVE_V4_SPOKES.find(spoke => spoke.chain.id === chainId && v4MarketId(spoke.spoke) === marketId);

/**
 * How a market is named in the dashboard and in alerts, in every language: the network for V3 ("Ethereum"), the
 * network and the Spoke for V4 ("Ethereum (V4 Lido)").
 */
export const marketLabel = (market: AaveMarket | AaveV4Spoke) =>
  "spokeName" in market ? `${market.name} (V4 ${market.spokeName})` : market.name;

/** Resolves a stored (chain, market) pair to its V3 market or V4 Spoke; undefined when the app no longer reads it. */
export const resolveMarket = (chainId: number, marketId: MarketId) =>
  marketId === V3_MARKET_ID ? getAaveMarket(chainId) : getAaveV4Spoke(chainId, marketId);

/** Every network with an Aave market Tokenping reads, V3 first in dashboard order, then the V4-only ones (Arc). */
export const AAVE_NETWORK_NAMES: readonly string[] = [
  ...new Set([...AAVE_MARKETS.map(({ name }) => name), ...AAVE_V4_SPOKES.map(({ name }) => name)]),
];

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
