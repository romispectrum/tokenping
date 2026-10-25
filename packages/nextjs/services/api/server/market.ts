import "server-only";
import { type MarketId, type MarketRef, V3_MARKET_ID, isMarketId } from "~~/config/aaveConfig";
import { type Protocol, isMorphoMarketId, isProtocol } from "~~/config/protocols";

export const INVALID_MARKET = "Invalid market: expected v3 or the lowercased address of an Aave V3 Pool or V4 Spoke";

export const INVALID_PROTOCOL = "Invalid protocol: expected aave, morpho-blue or morpho-midnight";

export const INVALID_MORPHO_MARKET =
  "Invalid market: expected a lowercased Morpho market id (0x and 64 hex characters)";

const isAbsent = (raw: unknown) => raw === undefined || raw === null || raw === "";

/** The market in a query string or body: "v3" when absent, null when it is not a market id. */
export const parseMarket = (raw: unknown): MarketId | null => {
  if (isAbsent(raw)) return V3_MARKET_ID;
  return isMarketId(raw) ? raw : null;
};

/** The protocol in a query string or body: Aave when absent (every client before Morpho), null when unknown. */
export const parseProtocol = (raw: unknown): Protocol | null => {
  if (isAbsent(raw)) return "aave";
  return isProtocol(raw) ? raw : null;
};

/**
 * The market a request names, without its chain: an Aave market as parseMarket reads it (no protocol, as before
 * Morpho), or a Morpho market id, which is required. Only the shape is checked: whether the app reads that market is
 * the route's question. `{ chainId, ...market }` is the alert's MarketRef.
 */
export const parseAlertMarket = (
  rawProtocol: unknown,
  rawMarket: unknown,
): Omit<MarketRef, "chainId"> | { error: string } => {
  const protocol = parseProtocol(rawProtocol);
  if (protocol === null) return { error: INVALID_PROTOCOL };
  if (protocol === "aave") {
    const market = parseMarket(rawMarket);
    return market === null ? { error: INVALID_MARKET } : { market };
  }
  return isMorphoMarketId(rawMarket) ? { protocol, market: rawMarket } : { error: INVALID_MORPHO_MARKET };
};
