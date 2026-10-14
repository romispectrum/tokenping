import { type Chain, type FallbackTransportConfig, fallback, http } from "viem";
import { avalanche, gnosis, hardhat } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, type ScaffoldConfig } from "~~/scaffold.config";
import { RPC_CHAIN_NAMES } from "~~/utils/scaffold-eth/networks";

const LOCAL_RPC_URL = "http://127.0.0.1:8545";

// SE-2's Alchemy network names do not cover Avalanche and Gnosis, which host Aave markets.
const ALCHEMY_NETWORKS: Record<number, string> = {
  ...RPC_CHAIN_NAMES,
  [avalanche.id]: "avax-mainnet",
  [gnosis.id]: "gnosis-mainnet",
};

const isUrl = (url: string | undefined): url is string => !!url;

const getAlchemyUrl = (chainId: number) => {
  const { alchemyApiKey } = scaffoldConfig;
  const network = ALCHEMY_NETWORKS[chainId];
  return alchemyApiKey && network ? `https://${network}.g.alchemy.com/v2/${alchemyApiKey}` : undefined;
};

// Same rule as wagmiConfig: Scaffold-ETH's shared default key is rate-limited, so it only comes after the public RPC.
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
 * Tries the configured RPC endpoints in order, then the chain's own public RPC (the local node for hardhat), then
 * Alchemy with Scaffold-ETH's shared key when no key of our own is set.
 * viem's fallback retries the whole list (retryCount 3 unless `config` says otherwise) and gives each endpoint a 10s
 * timeout, so a read against endpoints that all hang can take (retryCount + 1) x endpoints x 10s; latency-bound
 * callers should pass a lower retryCount.
 */
export const getFallbackTransport = (chain: Chain, config?: FallbackTransportConfig) => {
  const sharedAlchemyUrl = isSharedAlchemyKey() ? getAlchemyUrl(chain.id) : undefined;
  const urls = [...getRpcUrls(chain.id), getPublicRpcUrl(chain), sharedAlchemyUrl].filter(isUrl);
  return fallback(
    urls.map(url => http(url)),
    config,
  );
};
