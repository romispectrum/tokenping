import "server-only";
import { type MarketId, V3_MARKET_ID, isMarketId } from "~~/config/aaveConfig";

export const INVALID_MARKET = "Invalid market: expected v3 or the lowercased address of an Aave V3 Pool or V4 Spoke";

/** The market in a query string or body: "v3" when absent, null when it is not a market id. */
export const parseMarket = (raw: unknown): MarketId | null => {
  if (raw === undefined || raw === null || raw === "") return V3_MARKET_ID;
  return isMarketId(raw) ? raw : null;
};
