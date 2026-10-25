import type { Address } from "viem";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  celo,
  gnosis,
  ink,
  linea,
  mainnet,
  mantle,
  metis,
  optimism,
  plasma,
  polygon,
  scroll,
  soneium,
  sonic,
  unichain,
  worldchain,
  xLayer,
  zksync,
} from "viem/chains";
import { arc, megaEth, monad } from "~~/config/aaveConfig";
import { hyperEvm, katana, robinhood, stable } from "~~/config/chains";
import { tokenIconKey } from "~~/utils/tokenIcons";

// The pure parts of scripts/fetchTokenIcons.ts, kept apart so they are testable without the network.

/**
 * CoinGecko asset platform ids (GET /asset_platforms) of the chains with an Aave V3 or V4 market, then of the Morpho
 * chains Aave does not cover. Tempo has no platform on CoinGecko (25 Oct 2026), so it shows its first letter.
 */
export const COINGECKO_PLATFORMS: Readonly<Record<number, string>> = {
  [mainnet.id]: "ethereum",
  [polygon.id]: "polygon-pos",
  [arbitrum.id]: "arbitrum-one",
  [optimism.id]: "optimistic-ethereum",
  [base.id]: "base",
  [avalanche.id]: "avalanche",
  [gnosis.id]: "xdai",
  [arc.id]: "arc",
  [bsc.id]: "binance-smart-chain",
  [scroll.id]: "scroll",
  [zksync.id]: "zksync",
  [linea.id]: "linea",
  [metis.id]: "metis-andromeda",
  [soneium.id]: "soneium",
  [sonic.id]: "sonic",
  [celo.id]: "celo",
  [mantle.id]: "mantle",
  [plasma.id]: "plasma",
  [ink.id]: "ink",
  [xLayer.id]: "x-layer",
  [megaEth.id]: "megaeth",
  [monad.id]: "monad",
  [unichain.id]: "unichain",
  [worldchain.id]: "world-chain",
  [hyperEvm.id]: "hyperevm",
  [katana.id]: "katana",
  [robinhood.id]: "robinhood",
  [stable.id]: "stable",
};

/**
 * Coin images CoinGecko serves broken, by image id, mapped to an earlier upload of the same logo that still works.
 * Check the icons after a refresh and add an entry here when one comes out wrong.
 * - 13469 (1INCH): the image uploaded in August 2026 is a plain black square.
 */
export const IMAGE_OVERRIDES: Readonly<Record<string, string>> = {
  "13469": "https://assets.coingecko.com/coins/images/13469/large/1inch-token.png",
};

/**
 * Coin images whose artwork is dark on a transparent background, by image id. They are drawn on a white disc, as on the
 * light theme, or they would vanish on the dark theme's cards.
 * - 11683 (BAL): a pure black mark.
 * - 33800 (rsETH): a dark teal mark.
 */
export const WHITE_BACKED_IMAGES: ReadonlySet<string> = new Set(["11683", "33800"]);

const COINGECKO_IMAGE_HOSTS = new Set(["assets.coingecko.com", "coin-images.coingecko.com"]);

/** True for an https URL on one of CoinGecko's image CDNs (asset platform logos have no coin image id to parse). */
export const isCoinGeckoImageUrl = (url: string | null | undefined): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && COINGECKO_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};
const IMAGE_PATH = /^\/coins\/images\/(\d+)\/(?:thumb|small|large)\/([^/]+)$/;

export type CoinGeckoImage = {
  /** CoinGecko's numeric image id: one coin has one id on every chain, so it names the downloaded file. */
  id: string;
  /** The 250px original, which the script scales down itself (or the IMAGE_OVERRIDES entry for this id). */
  largeUrl: string;
};

/**
 * Reads a CoinGecko image URL (any size; the token lists link the 25px thumb). Returns null for anything that is not a
 * CoinGecko coin image, including the "missing" placeholder CoinGecko shows for coins without a logo.
 */
export const parseCoinGeckoImage = (url: string | null | undefined): CoinGeckoImage | null => {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const match = IMAGE_PATH.exec(parsed.pathname);
  if (parsed.protocol !== "https:" || !COINGECKO_IMAGE_HOSTS.has(parsed.hostname) || !match) return null;
  const [, id, file] = match;
  if (file.startsWith("missing")) return null;
  return {
    id,
    largeUrl: IMAGE_OVERRIDES[id] ?? `https://${parsed.hostname}/coins/images/${id}/large/${file}${parsed.search}`,
  };
};

/**
 * The keys that had an icon before a refresh, are still Aave reserves after it, and would have no icon. Delisted
 * reserves are not lost, they are gone.
 */
export const findLostIcons = (
  previous: Readonly<Record<string, string>>,
  reserveKeys: ReadonlySet<string>,
  keptKeys: ReadonlySet<string>,
) => Object.keys(previous).filter(key => reserveKeys.has(key) && !keptKeys.has(key));

export type TokenIconEntry = {
  chainId: number;
  address: Address;
  symbol: string;
  icon: string;
};

/** Symbols come from token contracts: printable ASCII only, so one cannot end its line comment early. */
const commentSafe = (symbol: string) => symbol.replace(/[^\x20-\x7E]/g, "?");

/**
 * The source of config/tokenIcons.generated.ts. Entries are grouped by chain in `chainNames` order and sorted by
 * address inside each chain, so a refresh only shows the reserves that changed.
 */
export const renderTokenIconsModule = (entries: readonly TokenIconEntry[], chainNames: ReadonlyMap<number, string>) => {
  const lines = [
    "// Generated by scripts/fetchTokenIcons.ts from CoinGecko. Do not edit: run `yarn next:token-icons` to refresh.",
    "// Keys are chainId:lowercaseReserveAddress (see tokenIconKey); each value names public/token-icons/<value>.webp.",
    "",
    "export const TOKEN_ICONS: Readonly<Record<string, string>> = {",
  ];
  for (const [chainId, chainName] of chainNames) {
    const chainEntries = entries
      .filter(entry => entry.chainId === chainId)
      .map(entry => ({ ...entry, key: tokenIconKey(chainId, entry.address) }))
      .sort((a, b) => (a.key < b.key ? -1 : 1));
    if (chainEntries.length === 0) continue;
    lines.push(`  // ${chainName}`);
    for (const { key, symbol, icon } of chainEntries) {
      lines.push(`  "${key}": "${icon}", // ${commentSafe(symbol)}`);
    }
  }
  lines.push("};", "");
  return lines.join("\n");
};

export type NetworkIconEntry = {
  chainId: number;
  name: string;
  /** CoinGecko's asset platform id, which names the file. */
  icon: string;
};

/** The source of config/networkIcons.generated.ts, in AAVE_CHAINS order. */
export const renderNetworkIconsModule = (entries: readonly NetworkIconEntry[]) =>
  [
    "// Generated by scripts/fetchNetworkIcons.ts from CoinGecko. Do not edit: run `yarn next:network-icons` to refresh.",
    "// Keys are chain ids; each value names public/network-icons/<value>.webp (CoinGecko's asset platform id).",
    "",
    "export const NETWORK_ICONS: Readonly<Record<number, string>> = {",
    ...entries.map(({ chainId, name, icon }) => `  ${chainId}: "${icon}", // ${commentSafe(name)}`),
    "};",
    "",
  ].join("\n");
