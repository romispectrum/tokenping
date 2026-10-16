import { describe, expect, it } from "vitest";
import { AAVE_MARKETS, AAVE_V4_SPOKES, marketLabel } from "~~/config/aaveConfig";
import { capitalize, csForMarket, csOnMarket } from "~~/i18n/format";

describe("csOnMarket and csForMarket", () => {
  it("call a V3 market a network", () => {
    expect(csOnMarket("Arbitrum")).toBe("na síti Arbitrum");
    expect(csForMarket("Arbitrum")).toBe("pro síť Arbitrum");
  });

  it("call a V4 Spoke a market", () => {
    expect(csOnMarket("Ethereum (V4 Lido)")).toBe("na trhu Ethereum (V4 Lido)");
    expect(csForMarket("Ethereum (V4 Lido)")).toBe("pro trh Ethereum (V4 Lido)");
  });

  it("tell every configured market apart by the name marketLabel gives it", () => {
    for (const market of AAVE_MARKETS) expect(csOnMarket(marketLabel(market))).toMatch(/^na síti /);
    for (const spoke of AAVE_V4_SPOKES) expect(csOnMarket(marketLabel(spoke))).toMatch(/^na trhu /);
  });
});

describe("capitalize", () => {
  it("upper-cases only the first letter", () => {
    expect(capitalize("na síti Base")).toBe("Na síti Base");
    expect(capitalize("")).toBe("");
  });
});
