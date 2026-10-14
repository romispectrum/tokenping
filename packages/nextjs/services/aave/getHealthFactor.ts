import { type Address, createPublicClient, http } from "viem";
import { AAVE_POOL_ABI, getAaveMarket } from "~~/config/aaveConfig";
import { getServerRpcUrl } from "~~/services/aave/rpc";
import { formatHealthFactor } from "~~/utils/healthFactor";

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

  const rpcUrl = getServerRpcUrl(chainId);
  if (!rpcUrl) return null;

  const client = createPublicClient({
    chain: market.chain,
    transport: http(rpcUrl),
  });

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
