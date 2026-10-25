import { type MarketRef, marketKey } from "~~/config/aaveConfig";

/**
 * The lending protocols an alert can watch. Stored in notification_configs.protocol; a row without one is Aave, as every
 * row was before Morpho.
 */
export const PROTOCOLS = ["aave", "morpho-blue", "morpho-midnight"] as const;

export type Protocol = (typeof PROTOCOLS)[number];

export type MorphoProtocol = Exclude<Protocol, "aave">;

export const isProtocol = (value: unknown): value is Protocol =>
  typeof value === "string" && (PROTOCOLS as readonly string[]).includes(value);

export const isMorphoProtocol = (value: unknown): value is MorphoProtocol => isProtocol(value) && value !== "aave";

/** A Morpho Blue or Midnight market id: a lowercased bytes32, which can never be mistaken for an Aave market id. */
export const isMorphoMarketId = (value: unknown): value is string =>
  typeof value === "string" && /^0x[0-9a-f]{64}$/.test(value);

/**
 * The one string that names a market across protocols and chains. Aave keeps the key it always had ("1:v3",
 * "1:0x94e7..."), so saved selections and cached configs carry over; Morpho's carries the protocol in front.
 */
export const marketRefKey = ({ protocol = "aave", chainId, market }: MarketRef) =>
  protocol === "aave" ? marketKey(chainId, market) : `${protocol}:${chainId}:${market}`;
