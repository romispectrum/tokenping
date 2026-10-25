import { describe, expect, it } from "vitest";
import { isMorphoMarketId, isMorphoProtocol, isProtocol, marketRefKey } from "~~/config/protocols";

const BLUE_ID = `0x${"ab".repeat(32)}`;

describe("protocols", () => {
  it("knows the three protocols and which of them are Morpho's", () => {
    expect(["aave", "morpho-blue", "morpho-midnight"].every(isProtocol)).toBe(true);
    expect(isProtocol("compound")).toBe(false);
    expect(isMorphoProtocol("morpho-blue")).toBe(true);
    expect(isMorphoProtocol("aave")).toBe(false);
  });

  it("accepts a lowercased bytes32 as a Morpho market id, never an Aave one", () => {
    expect(isMorphoMarketId(BLUE_ID)).toBe(true);
    expect(isMorphoMarketId(BLUE_ID.toUpperCase().replace("0X", "0x"))).toBe(false);
    expect(isMorphoMarketId("v3")).toBe(false);
    expect(isMorphoMarketId(`0x${"ab".repeat(20)}`)).toBe(false);
  });

  // Saved dashboard selections and cached configs use the Aave key, so it must not change.
  it("keeps Aave's market key and prefixes Morpho's with the protocol", () => {
    expect(marketRefKey({ chainId: 1, market: "v3" })).toBe("1:v3");
    expect(marketRefKey({ protocol: "aave", chainId: 1, market: "v3" })).toBe("1:v3");
    expect(marketRefKey({ protocol: "morpho-blue", chainId: 8453, market: BLUE_ID })).toBe(
      `morpho-blue:8453:${BLUE_ID}`,
    );
    expect(marketRefKey({ protocol: "morpho-midnight", chainId: 1, market: BLUE_ID })).toBe(
      `morpho-midnight:1:${BLUE_ID}`,
    );
  });
});
