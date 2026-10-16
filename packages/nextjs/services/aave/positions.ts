import { type Address, type Chain, type ContractFunctionReturnType, createPublicClient, formatUnits } from "viem";
import {
  AAVE_MARKETS,
  AAVE_POOL_ABI,
  AAVE_POOL_DATA_PROVIDER_ABI,
  type AaveMarket,
  ERC20_ABI,
  type MarketId,
  V3_MARKET_ID,
  marketKey,
  marketLabel,
} from "~~/config/aaveConfig";
import { getReadErrorMessage } from "~~/services/aave/readErrorMessage";
import { readTokenSymbol } from "~~/services/aave/tokenSymbol";
import { fetchAaveV4Positions } from "~~/services/aave/v4Positions";
import { formatHealthFactor } from "~~/utils/healthFactor";
import { getFallbackTransport } from "~~/utils/rpc";

export type TokenPosition = {
  asset: Address;
  symbol: string;
  decimals: number;
  aTokenBalance: bigint;
  stableDebt: bigint;
  variableDebt: bigint;
  usageAsCollateralEnabled: boolean;
  /** Supply APY in percent; null on Aave V4, whose Spokes have no per-reserve rate to read. */
  supplyApy: number | null;
};

/**
 * One market's position: a V3 network or a V4 Spoke. USD amounts are pre-formatted with toFixed(2); healthFactor is
 * "∞" or a 2-decimal string.
 */
export type NetworkPosition = {
  /** marketKey(chainId, marketId): unique across every market. */
  key: string;
  version: 3 | 4;
  marketId: MarketId;
  /** The market's name in the dashboard and in alerts (config/aaveConfig marketLabel). */
  marketName: string;
  chainId: number;
  /** The network's name. */
  chainName: string;
  totalCollateralUSD: string;
  totalDebtUSD: string;
  healthFactor: string;
  netWorthUSD: string;
  tokens: TokenPosition[];
  hasPosition: boolean;
};

type UsdField = "totalCollateralUSD" | "totalDebtUSD" | "netWorthUSD";

type UserAccountData = ContractFunctionReturnType<typeof AAVE_POOL_ABI, "view", "getUserAccountData">;
type UserReserveData = ContractFunctionReturnType<typeof AAVE_POOL_DATA_PROVIDER_ABI, "view", "getUserReserveData">;

// Aave reports account values in its USD base currency with 8 decimals.
const BASE_CURRENCY_DECIMALS = 8;
const RAY_DECIMALS = 27;
const SECONDS_PER_YEAR = 31_536_000;

/**
 * Aave's liquidityRate is the supply APR as a ray; interest accrues every second, so the APY compounds it per second
 * (the formula Aave's own UI uses). Returns a percentage.
 */
export const toSupplyApy = (liquidityRate: bigint) => {
  const apr = parseFloat(formatUnits(liquidityRate, RAY_DECIMALS));
  return ((1 + apr / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1) * 100;
};

export const hasOpenPosition = ([totalCollateralBase, totalDebtBase]: UserAccountData) =>
  totalCollateralBase > 0n || totalDebtBase > 0n;

export const hasReserveBalance = ([aTokenBalance, stableDebt, variableDebt]: UserReserveData) =>
  aTokenBalance > 0n || stableDebt > 0n || variableDebt > 0n;

export const toTokenPosition = (
  asset: Address,
  userData: UserReserveData,
  symbol: string,
  decimals: number,
): TokenPosition => {
  const [aTokenBalance, stableDebt, variableDebt, , , , liquidityRate, , usageAsCollateralEnabled] = userData;
  return {
    asset,
    symbol,
    decimals,
    aTokenBalance,
    stableDebt,
    variableDebt,
    usageAsCollateralEnabled,
    supplyApy: toSupplyApy(liquidityRate),
  };
};

export const toNetworkPosition = (
  market: AaveMarket,
  accountData: UserAccountData,
  tokens: TokenPosition[],
): NetworkPosition => {
  const [totalCollateralBase, totalDebtBase, , , , healthFactor] = accountData;
  const totalCollateralUSD = parseFloat(formatUnits(totalCollateralBase, BASE_CURRENCY_DECIMALS));
  const totalDebtUSD = parseFloat(formatUnits(totalDebtBase, BASE_CURRENCY_DECIMALS));

  return {
    key: marketKey(market.chain.id, V3_MARKET_ID),
    version: 3,
    marketId: V3_MARKET_ID,
    marketName: marketLabel(market),
    chainId: market.chain.id,
    chainName: market.name,
    totalCollateralUSD: totalCollateralUSD.toFixed(2),
    totalDebtUSD: totalDebtUSD.toFixed(2),
    healthFactor: formatHealthFactor(healthFactor),
    netWorthUSD: (totalCollateralUSD - totalDebtUSD).toFixed(2),
    tokens,
    hasPosition: hasOpenPosition(accountData),
  };
};

/** Sums an already rounded USD field across markets and rounds the total to cents. */
export const sumUsd = (positions: readonly NetworkPosition[], field: UsdField) =>
  positions.reduce((sum, position) => sum + parseFloat(position[field]), 0).toFixed(2);

// Raw viem rather than SE-2's scaffold hooks: these reads span seven external chains that are not in
// scaffold.config targetNetworks, and the Aave contracts are not in deployedContracts/externalContracts.
// Multicall batching packs each round of parallel reads (every reserve, then their token metadata) into a few
// aggregate3 calls (viem splits a batch at about 1 KB of calldata) instead of one eth_call per read.
const createAaveClient = (chain: Chain) =>
  createPublicClient({ chain, transport: getFallbackTransport(chain), batch: { multicall: true } });

type AaveClient = ReturnType<typeof createAaveClient>;

/** Null when the user neither supplies nor borrows the reserve, or when its reads fail. */
const fetchTokenPosition = async (client: AaveClient, dataProvider: Address, asset: Address, user: Address) => {
  try {
    const userData = await client.readContract({
      address: dataProvider,
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      functionName: "getUserReserveData",
      args: [asset, user],
    });
    // A market lists dozens of reserves and a user holds a few, so only those need token metadata.
    if (!hasReserveBalance(userData)) return null;

    const [symbol, decimals] = await Promise.all([
      readTokenSymbol(client, asset),
      client.readContract({ address: asset, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    return toTokenPosition(asset, userData, symbol, decimals);
  } catch {
    return null;
  }
};

const fetchTokenPositions = async (client: AaveClient, market: AaveMarket, user: Address) => {
  const reserves = await client.readContract({
    address: market.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getReservesList",
  });
  const tokens = await Promise.all(reserves.map(asset => fetchTokenPosition(client, market.dataProvider, asset, user)));
  return tokens.filter((token): token is TokenPosition => token !== null);
};

const fetchNetworkPosition = async (market: AaveMarket, user: Address) => {
  const client = createAaveClient(market.chain);
  const accountData = await client.readContract({
    address: market.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: [user],
  });

  // Without the reserve list the network still shows its account summary.
  const tokens = hasOpenPosition(accountData)
    ? await fetchTokenPositions(client, market, user).catch((): TokenPosition[] => [])
    : [];

  return toNetworkPosition(market, accountData, tokens);
};

const fetchAaveV3Positions = async (user: Address) => {
  const positions = await Promise.all(
    AAVE_MARKETS.map(market =>
      fetchNetworkPosition(market, user).catch(error => {
        console.warn(
          `Failed to read Aave positions on ${market.name} (chain ${market.chain.id}): ${getReadErrorMessage(error)}`,
        );
        return null;
      }),
    ),
  );
  return positions.filter((position): position is NetworkPosition => position !== null);
};

/**
 * One position per reachable Aave market: the V3 networks in AAVE_MARKETS order, then every V4 Spoke in
 * AAVE_V4_SPOKES order, with or without a position. Markets whose reads fail are logged and left out; rejects when
 * none can be read.
 */
export const fetchAavePositions = async (user: Address) => {
  const [v3, v4] = await Promise.all([fetchAaveV3Positions(user), fetchAaveV4Positions(user)]);
  const reachable = [...v3, ...v4];
  if (reachable.length === 0) throw new Error("Could not reach any Aave network. Check your connection and try again.");
  return reachable;
};
