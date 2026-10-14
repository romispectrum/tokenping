import type { NetworkPosition, TokenPosition } from "~~/services/aave/positions";

export const SUPPLIED_USDC: TokenPosition = {
  asset: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  symbol: "USDC",
  decimals: 6,
  aTokenBalance: 1_234_560_000n,
  stableDebt: 0n,
  variableDebt: 0n,
  usageAsCollateralEnabled: true,
  liquidityRate: 3.456,
};

// Below 1, so formatTokenAmount keeps 6 decimals.
export const SUPPLIED_WETH_NOT_COLLATERAL: TokenPosition = {
  asset: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  symbol: "WETH",
  decimals: 18,
  aTokenBalance: 123_456_789_000_000n,
  stableDebt: 0n,
  variableDebt: 0n,
  usageAsCollateralEnabled: false,
  liquidityRate: 0,
};

export const VARIABLE_DEBT_DAI: TokenPosition = {
  asset: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  symbol: "DAI",
  decimals: 18,
  aTokenBalance: 0n,
  stableDebt: 0n,
  variableDebt: 250_500_000_000_000_000_000n,
  usageAsCollateralEnabled: false,
  liquidityRate: 4.2,
};

export const STABLE_DEBT_USDT: TokenPosition = {
  asset: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  symbol: "USDT",
  decimals: 6,
  aTokenBalance: 0n,
  stableDebt: 10_000_000n,
  variableDebt: 0n,
  usageAsCollateralEnabled: false,
  liquidityRate: 2.5,
};

export const MIXED_DEBT_GHO: TokenPosition = {
  asset: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
  symbol: "GHO",
  decimals: 18,
  aTokenBalance: 0n,
  stableDebt: 1_500_000_000_000_000_000n,
  variableDebt: 2_000_000_000_000_000_000_000n,
  usageAsCollateralEnabled: false,
  liquidityRate: 0,
};

// Supplied and borrowed, so it shows up in both lists.
export const SUPPLIED_AND_BORROWED_LINK: TokenPosition = {
  asset: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  symbol: "LINK",
  decimals: 18,
  aTokenBalance: 42_000_000_000_000_000_000n,
  stableDebt: 0n,
  variableDebt: 5_000_000_000_000_000_000n,
  usageAsCollateralEnabled: true,
  liquidityRate: 0.0123,
};

export const ETHEREUM_POSITION: NetworkPosition = {
  chainId: 1,
  chainName: "Ethereum",
  chainIcon: "⟠",
  chainColor: "#627EEA",
  totalCollateralUSD: "12345.67",
  totalDebtUSD: "2500.00",
  healthFactor: "1.85",
  netWorthUSD: "9845.67",
  tokens: [
    SUPPLIED_USDC,
    SUPPLIED_WETH_NOT_COLLATERAL,
    VARIABLE_DEBT_DAI,
    STABLE_DEBT_USDT,
    MIXED_DEBT_GHO,
    SUPPLIED_AND_BORROWED_LINK,
  ],
  hasPosition: true,
};

export const POLYGON_COLLATERAL_ONLY_POSITION: NetworkPosition = {
  chainId: 137,
  chainName: "Polygon",
  chainIcon: "⬡",
  chainColor: "#8247E5",
  totalCollateralUSD: "1234.56",
  totalDebtUSD: "0.00",
  healthFactor: "∞",
  netWorthUSD: "1234.56",
  tokens: [SUPPLIED_USDC],
  hasPosition: true,
};

export const ARBITRUM_EMPTY_POSITION: NetworkPosition = {
  chainId: 42161,
  chainName: "Arbitrum",
  chainIcon: "🔷",
  chainColor: "#28A0F0",
  totalCollateralUSD: "0.00",
  totalDebtUSD: "0.00",
  healthFactor: "∞",
  netWorthUSD: "0.00",
  tokens: [],
  hasPosition: false,
};

// Token details failed to load, so only the account summary is known.
export const BASE_SUMMARY_ONLY_POSITION: NetworkPosition = {
  chainId: 8453,
  chainName: "Base",
  chainIcon: "🔵",
  chainColor: "#0052FF",
  totalCollateralUSD: "800.00",
  totalDebtUSD: "760.25",
  healthFactor: "1.05",
  netWorthUSD: "39.75",
  tokens: [],
  hasPosition: true,
};

export const AVALANCHE_DEBT_ONLY_POSITION: NetworkPosition = {
  chainId: 43114,
  chainName: "Avalanche",
  chainIcon: "🔺",
  chainColor: "#E84142",
  totalCollateralUSD: "0.00",
  totalDebtUSD: "250.50",
  healthFactor: "1.30",
  netWorthUSD: "-250.50",
  tokens: [VARIABLE_DEBT_DAI],
  hasPosition: true,
};
