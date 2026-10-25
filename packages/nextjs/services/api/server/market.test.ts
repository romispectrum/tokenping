import { describe, expect, it } from "vitest";
import {
  INVALID_MARKET,
  INVALID_MORPHO_MARKET,
  INVALID_PROTOCOL,
  parseAlertMarket,
  parseMarket,
  parseProtocol,
} from "~~/services/api/server/market";

// Ethereum's Lido Spoke and Prime Pool, as market ids (lowercased addresses).
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const PRIME_POOL = "0x4e033931ad43597d96d6bcc25c280717730b58b1";
const MORPHO_ID = `0x${"3a".repeat(32)}`;

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

describe("parseProtocol", () => {
  it.each([undefined, null, ""])("reads %j as Aave, as every request before Morpho", raw => {
    expect(parseProtocol(raw)).toBe("aave");
  });

  it.each(["aave", "morpho-blue", "morpho-midnight"])("accepts %s", raw => {
    expect(parseProtocol(raw)).toBe(raw);
  });

  it.each(["morpho", "Aave", "MORPHO-BLUE", " aave", 1, {}])("returns null for %j", raw => {
    expect(parseProtocol(raw)).toBeNull();
  });
});

describe("parseAlertMarket", () => {
  it("reads an Aave market as parseMarket does, without naming the protocol", () => {
    expect(parseAlertMarket(undefined, undefined)).toStrictEqual({ market: "v3" });
    expect(parseAlertMarket("aave", LIDO_SPOKE)).toStrictEqual({ market: LIDO_SPOKE });
    expect(parseAlertMarket(undefined, MORPHO_ID)).toStrictEqual({ error: INVALID_MARKET });
  });

  it.each(["morpho-blue", "morpho-midnight"])("reads a %s market id with its protocol", protocol => {
    expect(parseAlertMarket(protocol, MORPHO_ID)).toStrictEqual({ protocol, market: MORPHO_ID });
  });

  // A Morpho market has no default: "v3" and an absent market are Aave's.
  it.each([undefined, "", "v3", LIDO_SPOKE, MORPHO_ID.toUpperCase().replace("0X", "0x"), `${MORPHO_ID}00`])(
    "refuses the Morpho market %j",
    market => {
      expect(parseAlertMarket("morpho-blue", market)).toStrictEqual({ error: INVALID_MORPHO_MARKET });
    },
  );

  it("refuses an unknown protocol whatever the market", () => {
    expect(parseAlertMarket("compound", "v3")).toStrictEqual({ error: INVALID_PROTOCOL });
  });
});
