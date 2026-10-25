import { type Chain, type FallbackTransportConfig, fallback, http } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  celo,
  gnosis,
  hardhat,
  ink,
  linea,
  mainnet,
  mantle,
  metis,
  optimism,
  polygon,
  scroll,
  soneium,
  sonic,
  unichain,
  worldchain,
  zksync,
} from "viem/chains";
import { arc, monad } from "~~/config/aaveConfig";
import { hyperEvm, katana, robinhood, stable, tempo } from "~~/config/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, type ScaffoldConfig } from "~~/scaffold.config";
import { RPC_CHAIN_NAMES } from "~~/utils/scaffold-eth/networks";

const LOCAL_RPC_URL = "http://127.0.0.1:8545";

// SE-2's Alchemy network names stop at the chains it targets; these are the other Aave and Morpho chains Alchemy serves.
const ALCHEMY_NETWORKS: Record<number, string> = {
  ...RPC_CHAIN_NAMES,
  [avalanche.id]: "avax-mainnet",
  [gnosis.id]: "gnosis-mainnet",
  [bsc.id]: "bnb-mainnet",
  [scroll.id]: "scroll-mainnet",
  [zksync.id]: "zksync-mainnet",
  [linea.id]: "linea-mainnet",
  [metis.id]: "metis-mainnet",
  [soneium.id]: "soneium-mainnet",
  [sonic.id]: "sonic-mainnet",
  [mantle.id]: "mantle-mainnet",
  [ink.id]: "ink-mainnet",
  [monad.id]: "monad-mainnet",
  [unichain.id]: "unichain-mainnet",
  [worldchain.id]: "worldchain-mainnet",
  [hyperEvm.id]: "hyperliquid-mainnet",
  [katana.id]: "katana-mainnet",
  [robinhood.id]: "robinhood-mainnet",
  [stable.id]: "stable-mainnet",
  [tempo.id]: "tempo-mainnet",
};

// Keyless endpoints for every Aave and Morpho chain PublicNode serves (checked 16 Oct 2026, the Morpho ones 25 Oct).
// viem's defaults alone are not enough: Ethereum's (eth.merkle.io) rate-limits and Polygon's (polygon-rpc.com) refuses
// keyless calls, which left both chains without a working endpoint when the app has no Alchemy key of its own. ZKsync,
// Plasma, X Layer, MegaETH, Monad, World Chain, Katana and Stable are not on PublicNode and use their chain's own RPC.
const PUBLICNODE_RPC_URLS: Record<number, string> = {
  [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  [polygon.id]: "https://polygon-bor-rpc.publicnode.com",
  [arbitrum.id]: "https://arbitrum-one-rpc.publicnode.com",
  [optimism.id]: "https://optimism-rpc.publicnode.com",
  [base.id]: "https://base-rpc.publicnode.com",
  [avalanche.id]: "https://avalanche-c-chain-rpc.publicnode.com",
  [gnosis.id]: "https://gnosis-rpc.publicnode.com",
  [arc.id]: "https://arc-rpc.publicnode.com",
  [bsc.id]: "https://bsc-rpc.publicnode.com",
  [scroll.id]: "https://scroll-rpc.publicnode.com",
  [linea.id]: "https://linea-rpc.publicnode.com",
  [metis.id]: "https://metis-rpc.publicnode.com",
  [soneium.id]: "https://soneium-rpc.publicnode.com",
  [sonic.id]: "https://sonic-rpc.publicnode.com",
  [celo.id]: "https://celo-rpc.publicnode.com",
  [mantle.id]: "https://mantle-rpc.publicnode.com",
  [ink.id]: "https://ink-rpc.publicnode.com",
  [unichain.id]: "https://unichain-rpc.publicnode.com",
  [hyperEvm.id]: "https://hyperliquid-rpc.publicnode.com",
  [robinhood.id]: "https://robinhood-rpc.publicnode.com",
  [tempo.id]: "https://tempo-rpc.publicnode.com",
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

/**
 * Only the configured endpoints (getRpcUrls), for answers that must not come from a public RPC anyone could run, such
 * as whether a smart wallet accepts a signature. Undefined when the chain has none.
 */
export const getConfiguredTransport = (chainId: number, config?: FallbackTransportConfig) => {
  const urls = getRpcUrls(chainId);
  return urls.length > 0
    ? fallback(
        urls.map(url => http(url)),
        config,
      )
    : undefined;
};

const getPublicRpcUrl = (chain: Chain) =>
  chain.id === hardhat.id ? (process.env.NEXT_PUBLIC_HARDHAT_RPC_URL ?? LOCAL_RPC_URL) : chain.rpcUrls.default.http[0];

/**
 * Tries the configured RPC endpoints in order, then PublicNode for the Aave and Morpho chains, then the chain's own public RPC
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
