import { describe, expect, it } from "vitest";
import { isStoredMarketParams } from "~~/services/morpho/storedParams";
import type { BlueMarketParams, MidnightMarketParams } from "~~/services/morpho/types";

const TOKEN = { address: "0x00000000000000000000000000000000000000b1", symbol: "USDC", decimals: 6 } as const;
const COLLATERAL = { address: "0x00000000000000000000000000000000000000B2", symbol: "OETH", decimals: 18 } as const;

const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: TOKEN,
  collateralToken: COLLATERAL,
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: "0x0000000000000000000000000000000000000000",
  lltv: "860000000000000000",
  preLiquidations: [
    {
      address: "0x00000000000000000000000000000000000000d1",
      preLltv: "832603694978499652",
      oracle: "0x00000000000000000000000000000000000000e2",
    },
  ],
};

const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: TOKEN,
  collaterals: [
    { token: COLLATERAL, lltv: "915000000000000000", oracle: "0x00000000000000000000000000000000000000f1" },
  ],
  maturity: 1_793_372_400,
};

describe("isStoredMarketParams", () => {
  it("accepts what the readers write, after a trip through JSON", () => {
    expect(isStoredMarketParams("morpho-blue", JSON.parse(JSON.stringify(BLUE)))).toBe(true);
    expect(isStoredMarketParams("morpho-midnight", JSON.parse(JSON.stringify(MIDNIGHT)))).toBe(true);
  });

  it("refuses another protocol's parameters", () => {
    expect(isStoredMarketParams("morpho-midnight", BLUE)).toBe(false);
    expect(isStoredMarketParams("morpho-blue", MIDNIGHT)).toBe(false);
  });

  it.each([
    ["null", null],
    ["an array", [BLUE]],
    ["a string", JSON.stringify(BLUE)],
    ["a token without decimals", { ...BLUE, loanToken: { ...TOKEN, decimals: undefined } }],
    ["a token with fractional decimals", { ...BLUE, loanToken: { ...TOKEN, decimals: 6.5 } }],
    ["a token without a symbol", { ...BLUE, collateralToken: { ...COLLATERAL, symbol: 5 } }],
    ["an oracle that is no address", { ...BLUE, oracle: "0x1234" }],
    ["an LLTV as a number", { ...BLUE, lltv: 860000000000000000 }],
    ["a negative LLTV", { ...BLUE, lltv: "-1" }],
    ["an LLTV with a leading zero", { ...BLUE, lltv: "0860000000000000000" }],
    ["no pre-liquidation list", { ...BLUE, preLiquidations: undefined }],
    ["a malformed pre-liquidation", { ...BLUE, preLiquidations: [{ address: TOKEN.address, preLltv: "1" }] }],
  ])("refuses Blue parameters with %s", (_label, value) => {
    expect(isStoredMarketParams("morpho-blue", value)).toBe(false);
  });

  it.each([
    ["no collaterals", { ...MIDNIGHT, collaterals: [] }],
    ["a malformed collateral", { ...MIDNIGHT, collaterals: [{ token: COLLATERAL, lltv: "1" }] }],
    ["a maturity as a string", { ...MIDNIGHT, maturity: "1793372400" }],
    ["a zero maturity", { ...MIDNIGHT, maturity: 0 }],
    ["a fractional maturity", { ...MIDNIGHT, maturity: 1.5 }],
  ])("refuses Midnight parameters with %s", (_label, value) => {
    expect(isStoredMarketParams("morpho-midnight", value)).toBe(false);
  });
});
