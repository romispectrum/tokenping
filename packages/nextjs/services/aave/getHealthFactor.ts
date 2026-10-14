import { type Address, type Chain, createPublicClient } from "viem";
import { AAVE_POOL_ABI, getAaveMarket } from "~~/config/aaveConfig";
import { formatHealthFactor } from "~~/utils/healthFactor";
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

/**
 * Reads a wallet's Aave V3 health factor ("∞" or e.g. "1.25") on one chain.
 * Resolves null when the chain has no Aave market or the read fails.
 */
export async function getHealthFactorForWallet(
  walletAddress: Address,
  chainId: number,
): Promise<{ healthFactor: string; chainName: string } | null> {
  const market = getAaveMarket(chainId);
  if (!market) return null;

  const client = getClient(market.chain);
  try {
    const [, , , , , healthFactor] = await client.readContract({
      address: market.pool,
      abi: AAVE_POOL_ABI,
      functionName: "getUserAccountData",
      args: [walletAddress],
    });

    return { healthFactor: formatHealthFactor(healthFactor), chainName: market.name };
  } catch (error) {
    console.warn(`Failed to read the Aave health factor on chain ${chainId}:`, error);
    return null;
  }
}
