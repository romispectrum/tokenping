import { type Chain, type FallbackTransportConfig, fallback, http } from "viem";
import { arbitrum, avalanche, base, gnosis, hardhat, mainnet, optimism, polygon } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, type ScaffoldConfig } from "~~/scaffold.config";
import { RPC_CHAIN_NAMES } from "~~/utils/scaffold-eth/networks";

const LOCAL_RPC_URL = "http://127.0.0.1:8545";

// SE-2's Alchemy network names do not cover Avalanche and Gnosis, which host Aave markets.
const ALCHEMY_NETWORKS: Record<number, string> = {
  ...RPC_CHAIN_NAMES,
  [avalanche.id]: "avax-mainnet",
  [gnosis.id]: "gnosis-mainnet",
};

// Keyless endpoints for every chain with an Aave market. viem's defaults alone are not enough: Ethereum's
// (eth.merkle.io) rate-limits and Polygon's (polygon-rpc.com) refuses keyless calls, which left both chains without
// a working endpoint when the app has no Alchemy key of its own.
const PUBLICNODE_RPC_URLS: Record<number, string> = {
  [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  [polygon.id]: "https://polygon-bor-rpc.publicnode.com",
  [arbitrum.id]: "https://arbitrum-one-rpc.publicnode.com",
  [optimism.id]: "https://optimism-rpc.publicnode.com",
  [base.id]: "https://base-rpc.publicnode.com",
  [avalanche.id]: "https://avalanche-c-chain-rpc.publicnode.com",
  [gnosis.id]: "https://gnosis-rpc.publicnode.com",
};

const isUrl = (url: string | undefined): url is string => !!url;

const getAlchemyUrl = (chainId: number) => {
  const { alchemyApiKey } = scaffoldConfig;
  const network = ALCHEMY_NETWORKS[chainId];
  return alchemyApiKey && network ? `https://${network}.g.alchemy.com/v2/${alchemyApiKey}` : undefined;
};

// Same rule as wagmiConfig: Scaffold-ETH's shared default key is rate-limited, so it only comes after the public RPCs.
const isSharedAlchemyKey = () => scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;

/** RPC endpoints configured for a chain in priority order: the rpcOverrides entry, then Alchemy with this app's own key. */
export const getRpcUrls = (chainId: number) => {
  // Widen from the `as const` literal type, whose rpcOverrides is `{}`.
  const { rpcOverrides }: ScaffoldConfig = scaffoldConfig;
  return [rpcOverrides?.[chainId], isSharedAlchemyKey() ? undefined : getAlchemyUrl(chainId)].filter(isUrl);
};

const getPublicRpcUrl = (chain: Chain) =>
  chain.id === hardhat.id ? (process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ?? LOCAL_RPC_URL) : chain.rpcUrls.default.http[0];

/**
 * Tries the configured RPC endpoints in order, then PublicNode for the Aave chains, then the chain's own public RPC
 * (the local node for hardhat), then Alchemy with Scaffold-ETH's shared key when no key of our own is set. A URL that
 * appears twice, e.g. an override pointing at PublicNode, is tried once.
 * viem's fallback retries the whole list (retryCount 3 unless `config` says otherwise) and gives each endpoint a 10s
 * timeout, so a read against endpoints that all hang can take (retryCount + 1) x endpoints x 10s; latency-bound
 * callers should pass a lower retryCount.
 */
export const getFallbackTransport = (chain: Chain, config?: FallbackTransportConfig) => {
  const sharedAlchemyUrl = isSharedAlchemyKey() ? getAlchemyUrl(chain.id) : undefined;
  const urls = [...getRpcUrls(chain.id), PUBLICNODE_RPC_URLS[chain.id], getPublicRpcUrl(chain), sharedAlchemyUrl];
  return fallback(
    [...new Set(urls.filter(isUrl))].map(url => http(url)),
    config,
  );
};
