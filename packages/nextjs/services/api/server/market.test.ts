import { describe, expect, it } from "vitest";
import { INVALID_MARKET, parseMarket } from "~~/services/api/server/market";

// Ethereum's Lido Spoke and Prime Pool, as market ids (lowercased addresses).
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const PRIME_POOL = "0x4e033931ad43597d96d6bcc25c280717730b58b1";

describe("parseMarket", () => {
  it.each([undefined, null, ""])("reads %j as the V3 market", raw => {
    expect(parseMarket(raw)).toBe("v3");
  });

  // Only the shape is checked here: whether the app reads that market is resolveMarket's question.
  it.each(["v3", LIDO_SPOKE, PRIME_POOL, `0x${"12".repeat(20)}`])("accepts the market id %s as is", raw => {
    expect(parseMarket(raw)).toBe(raw);
  });

  it.each(["V3", "v4", " v3", "0x1234", "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd", ` ${LIDO_SPOKE}`, 3, {}, ["v3"]])(
    "returns null for %j",
    raw => {
      expect(parseMarket(raw)).toBeNull();
    },
  );

  it("explains a refused market", () => {
    expect(INVALID_MARKET).toBe("Invalid market: expected v3 or the lowercased address of an Aave V3 Pool or V4 Spoke");
  });
});
