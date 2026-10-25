import { describe, expect, it } from "vitest";
import { NO_DEBT_HEALTH_FACTOR } from "~~/services/morpho/math";
import type { BlueMarketParams, MidnightMarketParams, MorphoReading } from "~~/services/morpho/types";
import {
  buildMaturityMessage,
  buildMorphoAlert,
  buildMorphoTestMessage,
  formatLoanAmount,
  isBelowMorphoThreshold,
  morphoMarketName,
} from "~~/services/notifications/morphoMessages";

const NOW = new Date("2026-10-14T09:05:07.000Z");
const USDC = { address: "0x00000000000000000000000000000000000000b1", symbol: "USDC", decimals: 6 } as const;
const WETH = { address: "0x00000000000000000000000000000000000000b2", symbol: "WETH", decimals: 18 } as const;
const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: USDC,
  collateralToken: WETH,
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: "0x00000000000000000000000000000000000000c1",
  lltv: "915000000000000000",
  preLiquidations: [],
};
const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: WETH,
  collaterals: [],
  maturity: 1_793_372_400,
};
const reading = (overrides: Partial<MorphoReading> = {}): MorphoReading => ({
  healthFactor: 1_286_481_888_882_701_105n,
  line: "lltv",
  debt: 55_113_361_618n,
  collateralValue: 82_444_583_206n,
  timestamp: 1_792_014_892,
  ...overrides,
});

describe("morphoMarketName", () => {
  it("names a Blue market by its pair and LLTV, in each language's number form", () => {
    expect(morphoMarketName(BLUE, "en")).toBe("WETH/USDC (91.5% LLTV)");
    expect(morphoMarketName(BLUE, "cs")).toBe("WETH/USDC (91,5 % LLTV)");
  });

  it("names a Midnight market by its loan token and maturity date (UTC)", () => {
    expect(morphoMarketName(MIDNIGHT, "en")).toBe("WETH fixed rate, matures October 30, 2026");
    expect(morphoMarketName(MIDNIGHT, "cs")).toBe("WETH s pevnou sazbou, splatnost 30. října 2026");
  });
});

describe("formatLoanAmount", () => {
  it.each([
    [55_113_361_618n, USDC, "en", "55,113.36 USDC"],
    [55_113_361_618n, USDC, "cs", "55 113,36 USDC"],
    // Below 1, four decimals, so a small debt does not read as 0.
    [123_456_789_000_000n, WETH, "en", "0.0001 WETH"],
    [0n, USDC, "en", "0 USDC"],
  ] as const)("formats %s of %j in %s as %j", (amount, token, locale, expected) => {
    expect(formatLoanAmount(amount, { ...BLUE, loanToken: token }, locale)).toBe(expected);
  });
});

describe("isBelowMorphoThreshold", () => {
  it("compares in 18 decimals, not the rounded display", () => {
    expect(isBelowMorphoThreshold(reading({ healthFactor: 1_049_999_999_999_999_999n }), 1.05)).toBe(true);
    expect(isBelowMorphoThreshold(reading({ healthFactor: 1_050_000_000_000_000_000n }), 1.05)).toBe(false);
    expect(isBelowMorphoThreshold(reading({ healthFactor: NO_DEBT_HEALTH_FACTOR }), 10)).toBe(false);
  });
});

describe("buildMorphoAlert", () => {
  it("escapes the token symbols in the email html, which come from the token contracts", () => {
    const params = { ...BLUE, collateralToken: { ...WETH, symbol: "<b>W&ETH</b>" } };
    const message = buildMorphoAlert({
      chainName: "Base",
      params,
      reading: reading(),
      threshold: 1.5,
      locale: "en",
      now: NOW,
    });

    expect(message.html).toContain("Market: &lt;b&gt;W&amp;ETH&lt;/b&gt;/USDC (91.5% LLTV).");
    expect(message.text).toContain("Market: <b>W&ETH</b>/USDC (91.5% LLTV).");
  });
});

describe("buildMaturityMessage", () => {
  it("names the maturity's date and time and the debt in the loan token", () => {
    const message = buildMaturityMessage({
      stage: "matured",
      chainName: "Ethereum",
      params: MIDNIGHT,
      reading: reading({ debt: 2_500_000_000_000_000_000n }),
      locale: "en",
      now: NOW,
    });

    expect(message.subject).toBe("Morpho loan past maturity - Ethereum");
    expect(message.text.split("\n")[0]).toBe(
      "Your Morpho fixed-rate loan on Ethereum reached maturity on Oct 30, 2026, 3:00:00 PM Coordinated Universal Time and still has 2.5 WETH of debt.",
    );
  });
});

describe("buildMorphoTestMessage", () => {
  const build = (value: MorphoReading | null, threshold = 1.5) =>
    buildMorphoTestMessage({ chainName: "Base", params: BLUE, reading: value, threshold, locale: "en", now: NOW });

  it("names the market and states the position in the loan token", () => {
    const message = build(reading());

    expect(message.subject).toBe("Tokenping test message - Morpho WETH/USDC (91.5% LLTV), Base");
    expect(message.text).toContain(
      "Right now: health factor 1.28 (Risky), collateral 82,444.58 USDC, debt 55,113.36 USDC.\nThat is below your threshold",
    );
  });

  it("says when there is no debt, without a collateral it did not price", () => {
    expect(build(reading({ debt: 0n, healthFactor: NO_DEBT_HEALTH_FACTOR, collateralValue: 0n })).text).toContain(
      "Right now: no debt, so nothing can be liquidated.\n",
    );
  });

  it("still proves the channel works when the position cannot be read", () => {
    expect(build(null).text).toContain("Right now: your position could not be read.");
  });
});
