import * as chains from "viem/chains";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth/networks";

// Public endpoints used when no Alchemy URL can be built for a chain.
const FALLBACK_RPC_URLS: Record<number, string> = {
  [chains.mainnet.id]: "https://eth.llamarpc.com",
  [chains.polygon.id]: "https://polygon.llamarpc.com",
  [chains.arbitrum.id]: "https://arb1.arbitrum.io/rpc",
  [chains.optimism.id]: "https://mainnet.optimism.io",
  [chains.base.id]: "https://mainnet.base.org",
  [chains.avalanche.id]: "https://api.avax.network/ext/bc/C/rpc",
  [chains.gnosis.id]: "https://rpc.gnosischain.com",
};

// Unlike utils/scaffold-eth's map (used by getDashboardRpcUrl), this one also covers Avalanche and Gnosis.
const SERVER_ALCHEMY_NETWORKS: Record<number, string> = {
  [chains.mainnet.id]: "eth-mainnet",
  [chains.polygon.id]: "polygon-mainnet",
  [chains.arbitrum.id]: "arb-mainnet",
  [chains.optimism.id]: "opt-mainnet",
  [chains.base.id]: "base-mainnet",
  [chains.avalanche.id]: "avax-mainnet",
  [chains.gnosis.id]: "gnosis-mainnet",
};

export const getFallbackRpcUrl = (chainId: number) => FALLBACK_RPC_URLS[chainId] ?? "";

/**
 * Client-side RPC for the positions dashboard: SE-2's Alchemy URL (scaffold default key included), else the public RPC.
 * BUG(B1.5): this differs from getServerRpcUrl, so the dashboard and the cron can read different nodes for one chain.
 */
export const getDashboardRpcUrl = (chainId: number) => getAlchemyHttpUrl(chainId) || getFallbackRpcUrl(chainId);

/** Server-side RPC for health-factor checks: Alchemy only when the env key is set (no scaffold default key). */
export const getServerRpcUrl = (chainId: number) => {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const network = SERVER_ALCHEMY_NETWORKS[chainId];
  return apiKey && network ? `https://${network}.g.alchemy.com/v2/${apiKey}` : getFallbackRpcUrl(chainId);
};
