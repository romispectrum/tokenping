// Shared by the dashboard and scripts/fetchNetworkIcons.ts, which downloads the logos and writes NETWORK_ICONS.

/** The folder under public/ that holds the network logos, one per CoinGecko asset platform. */
export const NETWORK_ICON_DIR = "network-icons";

export const networkIconSrc = (icon: string) => `/${NETWORK_ICON_DIR}/${icon}.webp`;
