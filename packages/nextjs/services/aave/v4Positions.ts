import { type Address, type ContractFunctionReturnType, formatUnits } from "viem";
import {
  AAVE_V4_SPOKES,
  AAVE_V4_SPOKE_ABI,
  type AaveV4Spoke,
  addressMarketId,
  marketKey,
  marketLabel,
} from "~~/config/aaveConfig";
import { type AaveClient, type AaveClientFor, createAaveClientCache } from "~~/services/aave/client";
import type { NetworkPosition, TokenPosition } from "~~/services/aave/positions";
import { getReadErrorMessage } from "~~/services/aave/readErrorMessage";
import { readTokenSymbol } from "~~/services/aave/tokenSymbol";
import { formatHealthFactor } from "~~/utils/healthFactor";

type V4AccountData = ContractFunctionReturnType<typeof AAVE_V4_SPOKE_ABI, "view", "getUserAccountData">;

// A Spoke's values are USD with 26 decimals; the debt value is also scaled by a ray (27 more).
const VALUE_DECIMALS = 26;
const DEBT_VALUE_RAY_DECIMALS = VALUE_DECIMALS + 27;

/**
 * Collateral counts only supplies enabled as collateral with a collateral factor above zero, as V3's
 * totalCollateralBase does, so a wallet that only supplies non-collateral assets reads as having no position.
 */
export const hasOpenV4Position = ({ totalCollateralValue, totalDebtValueRay }: V4AccountData) =>
  totalCollateralValue > 0n || totalDebtValueRay > 0n;

export const toV4NetworkPosition = (
  spoke: AaveV4Spoke,
  accountData: V4AccountData,
  tokens: TokenPosition[],
): NetworkPosition => {
  const totalCollateralUSD = parseFloat(formatUnits(accountData.totalCollateralValue, VALUE_DECIMALS));
  const totalDebtUSD = parseFloat(formatUnits(accountData.totalDebtValueRay, DEBT_VALUE_RAY_DECIMALS));
  const marketId = addressMarketId(spoke.spoke);

  return {
    key: marketKey(spoke.chain.id, marketId),
    version: 4,
    marketId,
    marketName: marketLabel(spoke),
    chainId: spoke.chain.id,
    chainName: spoke.name,
    totalCollateralUSD: totalCollateralUSD.toFixed(2),
    totalDebtUSD: totalDebtUSD.toFixed(2),
    healthFactor: formatHealthFactor(accountData.healthFactor),
    netWorthUSD: (totalCollateralUSD - totalDebtUSD).toFixed(2),
    tokens,
    hasPosition: hasOpenV4Position(accountData),
  };
};

/**
 * Null when the user neither supplies nor borrows the reserve, or when its reads fail. V4 debt has no stable part:
 * the drawn debt and the risk premium both accrue at the variable rate, so the total is the variable debt.
 */
const fetchV4TokenPosition = async (client: AaveClient, spoke: Address, reserveId: bigint, user: Address) => {
  try {
    const args = [reserveId, user] as const;
    const [supplied, debt, [usageAsCollateralEnabled]] = await Promise.all([
      client.readContract({ address: spoke, abi: AAVE_V4_SPOKE_ABI, functionName: "getUserSuppliedAssets", args }),
      client.readContract({ address: spoke, abi: AAVE_V4_SPOKE_ABI, functionName: "getUserTotalDebt", args }),
      client.readContract({ address: spoke, abi: AAVE_V4_SPOKE_ABI, functionName: "getUserReserveStatus", args }),
    ]);
    if (supplied === 0n && debt === 0n) return null;

    const { underlying, decimals } = await client.readContract({
      address: spoke,
      abi: AAVE_V4_SPOKE_ABI,
      functionName: "getReserve",
      args: [reserveId],
    });
    const token: TokenPosition = {
      asset: underlying,
      symbol: await readTokenSymbol(client, underlying),
      decimals,
      aTokenBalance: supplied,
      stableDebt: 0n,
      variableDebt: debt,
      usageAsCollateralEnabled,
      supplyApy: null,
    };
    return token;
  } catch {
    return null;
  }
};

const fetchV4TokenPositions = async (client: AaveClient, spoke: Address, user: Address) => {
  const count = await client.readContract({ address: spoke, abi: AAVE_V4_SPOKE_ABI, functionName: "getReserveCount" });
  // Reserve ids run from 0 to getReserveCount() - 1.
  const ids = Array.from({ length: Number(count) }, (_, id) => BigInt(id));
  const tokens = await Promise.all(ids.map(id => fetchV4TokenPosition(client, spoke, id, user)));
  return tokens.filter((token): token is TokenPosition => token !== null);
};

const fetchSpokePosition = async (client: AaveClient, spoke: AaveV4Spoke, user: Address) => {
  const accountData = await client.readContract({
    address: spoke.spoke,
    abi: AAVE_V4_SPOKE_ABI,
    functionName: "getUserAccountData",
    args: [user],
  });

  // Without the reserves the Spoke still shows its account summary.
  const tokens = hasOpenV4Position(accountData)
    ? await fetchV4TokenPositions(client, spoke.spoke, user).catch((): TokenPosition[] => [])
    : [];

  return toV4NetworkPosition(spoke, accountData, tokens);
};

/**
 * One position per reachable Aave V4 Spoke, in AAVE_V4_SPOKES order, with or without a position. Spokes whose reads
 * fail are logged and left out. `clientFor` is shared with the V3 reads, so a chain's markets share one client.
 */
export const fetchAaveV4Positions = async (user: Address, clientFor: AaveClientFor = createAaveClientCache()) => {
  const positions = await Promise.all(
    AAVE_V4_SPOKES.map(spoke =>
      // Inside the promise chain, so a client that cannot be created fails only its Spokes.
      Promise.resolve()
        .then(() => fetchSpokePosition(clientFor(spoke.chain), spoke, user))
        .catch(error => {
          console.warn(
            `Failed to read Aave positions on ${marketLabel(spoke)} (chain ${spoke.chain.id}): ${getReadErrorMessage(error)}`,
          );
          return null;
        }),
    ),
  );
  return positions.filter((position): position is NetworkPosition => position !== null);
};
