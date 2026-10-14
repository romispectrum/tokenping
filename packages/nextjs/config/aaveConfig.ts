import type { Address, Chain } from "viem";
import * as chains from "viem/chains";

export type AaveMarket = {
  chain: Chain;
  pool: Address;
  dataProvider: Address;
  name: string;
  icon: string;
  color: string;
};

// Aave V3 Pool and PoolDataProvider per network, in the order the dashboard lists them.
export const AAVE_MARKETS: readonly AaveMarket[] = [
  {
    chain: chains.mainnet,
    pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    dataProvider: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
    name: "Ethereum",
    icon: "⟠",
    color: "#627EEA",
  },
  {
    chain: chains.polygon,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Polygon",
    icon: "⬡",
    color: "#8247E5",
  },
  {
    chain: chains.arbitrum,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Arbitrum",
    icon: "🔷",
    color: "#28A0F0",
  },
  {
    chain: chains.optimism,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Optimism",
    icon: "🔴",
    color: "#FF0420",
  },
  {
    chain: chains.base,
    pool: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
    dataProvider: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac",
    name: "Base",
    icon: "🔵",
    color: "#0052FF",
  },
  {
    chain: chains.avalanche,
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
    name: "Avalanche",
    icon: "🔺",
    color: "#E84142",
  },
  {
    chain: chains.gnosis,
    pool: "0xb50201558B00496A145fE76f7424749556E326D8",
    dataProvider: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
    name: "Gnosis",
    icon: "🦉",
    color: "#04795B",
  },
];

export const getAaveMarket = (chainId: number) => AAVE_MARKETS.find(market => market.chain.id === chainId);

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
