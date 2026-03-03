import * as chains from "viem/chains";

// Aave V3 Pool contract addresses across networks
export const AAVE_POOL_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  [chains.polygon.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.arbitrum.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.optimism.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.base.id]: "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5",
  [chains.avalanche.id]: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
  [chains.gnosis.id]: "0xb50201558B00496A145fE76f7424749556E326D8",
};

// Aave V3 PoolDataProvider addresses for detailed reserve data
export const AAVE_POOL_DATA_PROVIDER_ADDRESSES: Record<number, `0x${string}`> = {
  [chains.mainnet.id]: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
  [chains.polygon.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.arbitrum.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.optimism.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.base.id]: "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac",
  [chains.avalanche.id]: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654",
  [chains.gnosis.id]: "0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741",
};

// Networks that support Aave V3
export const AAVE_SUPPORTED_CHAINS = [
  chains.mainnet,
  chains.polygon,
  chains.arbitrum,
  chains.optimism,
  chains.base,
  chains.avalanche,
  chains.gnosis,
];

// Chain metadata for display
export const CHAIN_METADATA: Record<number, { name: string; icon: string; color: string; nativeSymbol: string }> = {
  [chains.mainnet.id]: { name: "Ethereum", icon: "⟠", color: "#627EEA", nativeSymbol: "ETH" },
  [chains.polygon.id]: { name: "Polygon", icon: "⬡", color: "#8247E5", nativeSymbol: "MATIC" },
  [chains.arbitrum.id]: { name: "Arbitrum", icon: "🔷", color: "#28A0F0", nativeSymbol: "ETH" },
  [chains.optimism.id]: { name: "Optimism", icon: "🔴", color: "#FF0420", nativeSymbol: "ETH" },
  [chains.base.id]: { name: "Base", icon: "🔵", color: "#0052FF", nativeSymbol: "ETH" },
  [chains.avalanche.id]: { name: "Avalanche", icon: "🔺", color: "#E84142", nativeSymbol: "AVAX" },
  [chains.gnosis.id]: { name: "Gnosis", icon: "🦉", color: "#04795B", nativeSymbol: "xDAI" },
};

// Minimal ABI for Aave Pool - getUserAccountData
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

// Minimal ABI for PoolDataProvider - getUserReserveData
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
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveConfigurationData",
    outputs: [
      { name: "decimals", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "liquidationThreshold", type: "uint256" },
      { name: "liquidationBonus", type: "uint256" },
      { name: "reserveFactor", type: "uint256" },
      { name: "usageAsCollateralEnabled", type: "bool" },
      { name: "borrowingEnabled", type: "bool" },
      { name: "stableBorrowRateEnabled", type: "bool" },
      { name: "isActive", type: "bool" },
      { name: "isFrozen", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveTokensAddresses",
    outputs: [
      { name: "aTokenAddress", type: "address" },
      { name: "stableDebtTokenAddress", type: "address" },
      { name: "variableDebtTokenAddress", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ERC20 ABI for token info
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
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
