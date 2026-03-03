import { createPublicClient, formatUnits, http } from "viem";
import * as chains from "viem/chains";
import { AAVE_POOL_ABI, AAVE_POOL_ADDRESSES, AAVE_SUPPORTED_CHAINS, CHAIN_METADATA } from "~~/config/aaveConfig";

const RPC_CHAIN_NAMES: Record<number, string> = {
  [chains.mainnet.id]: "eth-mainnet",
  [chains.polygon.id]: "polygon-mainnet",
  [chains.arbitrum.id]: "arb-mainnet",
  [chains.optimism.id]: "opt-mainnet",
  [chains.base.id]: "base-mainnet",
  [chains.avalanche.id]: "avax-mainnet",
  [chains.gnosis.id]: "gnosis-mainnet",
};

function getRpcUrl(chainId: number): string {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (apiKey && RPC_CHAIN_NAMES[chainId]) {
    return `https://${RPC_CHAIN_NAMES[chainId]}.g.alchemy.com/v2/${apiKey}`;
  }
  const fallbackRpcs: Record<number, string> = {
    [chains.mainnet.id]: "https://eth.llamarpc.com",
    [chains.polygon.id]: "https://polygon.llamarpc.com",
    [chains.arbitrum.id]: "https://arb1.arbitrum.io/rpc",
    [chains.optimism.id]: "https://mainnet.optimism.io",
    [chains.base.id]: "https://mainnet.base.org",
    [chains.avalanche.id]: "https://api.avax.network/ext/bc/C/rpc",
    [chains.gnosis.id]: "https://rpc.gnosischain.com",
  };
  return fallbackRpcs[chainId] ?? "";
}

/**
 * Fetches Aave V3 health factor for a wallet on a given chain.
 * Returns formatted health factor string ("∞" or "1.25") or null on error.
 */
export async function getHealthFactorForWallet(
  walletAddress: `0x${string}`,
  chainId: number,
): Promise<{ healthFactor: string; chainName: string } | null> {
  const poolAddress = AAVE_POOL_ADDRESSES[chainId];
  if (!poolAddress) return null;

  const chain = AAVE_SUPPORTED_CHAINS.find(c => c.id === chainId);
  if (!chain) return null;

  const rpcUrl = getRpcUrl(chainId);
  if (!rpcUrl) return null;

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  try {
    const accountData = await client.readContract({
      address: poolAddress,
      abi: AAVE_POOL_ABI,
      functionName: "getUserAccountData",
      args: [walletAddress],
    });

    const healthFactor = accountData[5];
    const healthFactorFormatted =
      healthFactor >= BigInt("0xffffffffffffffffffffffffffffffff")
        ? "∞"
        : parseFloat(formatUnits(healthFactor, 18)).toFixed(2);

    const chainName = CHAIN_METADATA[chainId]?.name ?? `Chain ${chainId}`;
    return { healthFactor: healthFactorFormatted, chainName };
  } catch {
    return null;
  }
}
