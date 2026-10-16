import { type Address, type Chain, createPublicClient } from "viem";
import {
  AAVE_POOL_ABI,
  AAVE_V4_SPOKE_ABI,
  type AaveMarket,
  type AaveV4Spoke,
  type MarketId,
  V3_MARKET_ID,
  marketLabel,
  resolveMarket,
} from "~~/config/aaveConfig";
import { getReadErrorMessage } from "~~/services/aave/readErrorMessage";
import { formatHealthFactorDown, toHealthFactorValue } from "~~/utils/healthFactor";
import { getFallbackTransport } from "~~/utils/rpc";

// The cron reads one wallet after another, so a hanging RPC delays every later alert. One retry caps a read whose
// endpoints all hang at two passes of 10s per endpoint (viem's default of 3 retries would make it four).
const RETRY_COUNT = 1;

const createHealthFactorClient = (chain: Chain) =>
  createPublicClient({
    chain,
    transport: getFallbackTransport(chain, { retryCount: RETRY_COUNT }),
    batch: { multicall: true },
  });

// One client per chain for the life of the server instance, so reads that overlap on a chain share one multicall.
const CLIENTS = new Map<number, ReturnType<typeof createHealthFactorClient>>();

const getClient = (chain: Chain) => {
  let client = CLIENTS.get(chain.id);
  if (!client) {
    client = createHealthFactorClient(chain);
    CLIENTS.set(chain.id, client);
  }
  return client;
};

type Client = ReturnType<typeof getClient>;

const readHealthFactor = async (client: Client, market: AaveMarket | AaveV4Spoke, walletAddress: Address) => {
  if ("spoke" in market) {
    const { healthFactor } = await client.readContract({
      address: market.spoke,
      abi: AAVE_V4_SPOKE_ABI,
      functionName: "getUserAccountData",
      args: [walletAddress],
    });
    return healthFactor;
  }
  const [, , , , , healthFactor] = await client.readContract({
    address: market.pool,
    abi: AAVE_POOL_ABI,
    functionName: "getUserAccountData",
    args: [walletAddress],
  });
  return healthFactor;
};

/**
 * Reads a wallet's Aave health factor in one market, one of the chain's V3 Pools or V4 Spokes: the exact value for
 * threshold comparisons and a 2-decimal, rounded-down string ("∞" without debt) for the alert text. `chainName` is
 * the market's name in alerts ("Polygon", "Ethereum (Core)", "Ethereum (V4 Lido)"). Resolves null when the app does
 * not read that market or the read fails.
 */
export async function getHealthFactorForWallet(
  walletAddress: Address,
  chainId: number,
  marketId: MarketId = V3_MARKET_ID,
): Promise<{ healthFactor: string; healthFactorValue: number; chainName: string } | null> {
  const market = resolveMarket(chainId, marketId);
  if (!market) return null;

  try {
    const healthFactor = await readHealthFactor(getClient(market.chain), market, walletAddress);
    return {
      healthFactor: formatHealthFactorDown(healthFactor),
      healthFactorValue: toHealthFactorValue(healthFactor),
      chainName: marketLabel(market),
    };
  } catch (error) {
    console.warn(
      `Failed to read the Aave health factor on ${marketLabel(market)} (chain ${chainId}): ${getReadErrorMessage(error)}`,
    );
    return null;
  }
}
