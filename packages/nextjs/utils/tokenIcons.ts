import type { Address } from "viem";

// Shared by the dashboard and scripts/fetchTokenIcons.ts, which downloads the icons and writes TOKEN_ICONS.

/** The folder under public/ that holds the icons. */
export const TOKEN_ICON_DIR = "token-icons";

/** Icons are square WebP files of this many pixels: crisp up to a 32px icon on a 2x screen. */
export const TOKEN_ICON_SIZE = 64;

/** The TOKEN_ICONS key of a reserve. Addresses are lowercased, so checksummed and plain spellings match. */
export const tokenIconKey = (chainId: number, address: Address) => `${chainId}:${address.toLowerCase()}`;

export const tokenIconSrc = (icon: string) => `/${TOKEN_ICON_DIR}/${icon}.webp`;
