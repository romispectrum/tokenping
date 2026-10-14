import { type Address, type Chain, type ContractFunctionReturnType, createPublicClient, formatUnits, http } from "viem";
import {
  AAVE_MARKETS,
  AAVE_POOL_ABI,
  AAVE_POOL_DATA_PROVIDER_ABI,
  type AaveMarket,
  ERC20_ABI,
} from "~~/config/aaveConfig";
import { getDashboardRpcUrl } from "~~/services/aave/rpc";
import { formatHealthFactor } from "~~/utils/healthFactor";

export type TokenPosition = {
  asset: Address;
  symbol: string;
  decimals: number;
  aTokenBalance: bigint;
  stableDebt: bigint;
  variableDebt: bigint;
  usageAsCollateralEnabled: boolean;
  // BUG(B1.4): the supply APR in percent (no compounding), although the UI labels it APY.
  liquidityRate: number;
};

// USD amounts are pre-formatted with toFixed(2); healthFactor is "∞" or a 2-decimal string.
export type NetworkPosition = {
  chainId: number;
  chainName: string;
  chainIcon: string;
  chainColor: string;
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
// liquidityRate is a ray (27 decimals); reading it with 25 decimals yields a percentage.
const RAY_PERCENT_DECIMALS = 25;

export const hasOpenPosition = ([totalCollateralBase, totalDebtBase]: UserAccountData) =>
  totalCollateralBase > 0n || totalDebtBase > 0n;

/** Null when the user neither supplies nor borrows the reserve. */
export const toTokenPosition = (
  asset: Address,
  userData: UserReserveData,
  symbol: string,
  decimals: number,
): TokenPosition | null => {
  const [aTokenBalance, stableDebt, variableDebt, , , , liquidityRate, , usageAsCollateralEnabled] = userData;
  if (aTokenBalance === 0n && stableDebt === 0n && variableDebt === 0n) return null;

  return {
    asset,
    symbol,
    decimals,
    aTokenBalance,
    stableDebt,
    variableDebt,
    usageAsCollateralEnabled,
    liquidityRate: parseFloat(formatUnits(liquidityRate, RAY_PERCENT_DECIMALS)),
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
    chainId: market.chain.id,
    chainName: market.name,
    chainIcon: market.icon,
    chainColor: market.color,
    totalCollateralUSD: totalCollateralUSD.toFixed(2),
    totalDebtUSD: totalDebtUSD.toFixed(2),
    healthFactor: formatHealthFactor(healthFactor),
    netWorthUSD: (totalCollateralUSD - totalDebtUSD).toFixed(2),
    tokens,
    hasPosition: hasOpenPosition(accountData),
  };
};

/** Sums an already rounded USD field across networks and rounds the total to cents. */
export const sumUsd = (positions: readonly NetworkPosition[], field: UsdField) =>
  positions.reduce((sum, position) => sum + parseFloat(position[field]), 0).toFixed(2);

// Raw viem rather than SE-2's scaffold hooks: these reads span seven external chains that are not in
// scaffold.config targetNetworks, and the Aave contracts are not in deployedContracts/externalContracts.
const createAaveClient = (chain: Chain) => createPublicClient({ chain, transport: http(getDashboardRpcUrl(chain.id)) });

type AaveClient = ReturnType<typeof createAaveClient>;

const fetchTokenPosition = async (client: AaveClient, dataProvider: Address, asset: Address, user: Address) => {
  try {
    const [userData, symbol, decimals] = await Promise.all([
      client.readContract({
        address: dataProvider,
        abi: AAVE_POOL_DATA_PROVIDER_ABI,
        functionName: "getUserReserveData",
        args: [asset, user],
      }),
      client.readContract({ address: asset, abi: ERC20_ABI, functionName: "symbol" }),
      client.readContract({ address: asset, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    return toTokenPosition(asset, userData, symbol, decimals);
  } catch {
    // BUG(B1.0): a reserve whose symbol() is not a string (MKR returns bytes32) is dropped from the lists here.
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

/** One position per reachable Aave market, in AAVE_MARKETS order; networks whose reads fail are left out. */
export const fetchAavePositions = async (user: Address) => {
  const positions = await Promise.all(AAVE_MARKETS.map(market => fetchNetworkPosition(market, user).catch(() => null)));
  return positions.filter((position): position is NetworkPosition => position !== null);
};
