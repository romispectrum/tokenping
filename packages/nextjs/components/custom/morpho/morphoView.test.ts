import { describe, expect, it } from "vitest";
import {
  hasDebt,
  healthFactorText,
  lltvText,
  loanAmount,
  ltvText,
  marketName,
  maturityCountdown,
  maturityDay,
  pairName,
} from "~~/components/custom/morpho/morphoView";
import { getMorphoChain } from "~~/config/morpho";
import { NO_DEBT_HEALTH_FACTOR } from "~~/services/morpho/math";
import type { BlueMarketParams, MidnightMarketParams, MorphoReading } from "~~/services/morpho/types";

const token = (symbol: string, decimals = 18) => ({
  address: "0x00000000000000000000000000000000000000b1" as const,
  symbol,
  decimals,
});
const BLUE: BlueMarketParams = {
  kind: "blue",
  loanToken: token("USDC", 6),
  collateralToken: token("OETH"),
  oracle: "0x00000000000000000000000000000000000000e1",
  irm: "0x00000000000000000000000000000000000000c1",
  lltv: "860000000000000000",
  preLiquidations: [],
};
const MIDNIGHT: MidnightMarketParams = {
  kind: "midnight",
  loanToken: token("USDC", 6),
  collaterals: [
    { token: token("savUSD"), lltv: "915000000000000000", oracle: "0x00000000000000000000000000000000000000f1" },
    { token: token("sUSDe"), lltv: "860000000000000000", oracle: "0x00000000000000000000000000000000000000f2" },
  ],
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

describe("Morpho view helpers", () => {
  it("names a market by its pair, and in the alert form by its network and pair", () => {
    expect(pairName(BLUE)).toBe("OETH/USDC");
    expect(pairName(MIDNIGHT)).toBe("savUSD+sUSDe/USDC");
    const base = getMorphoChain(8453)!;
    expect(marketName({ chain: base, params: BLUE, marketId: "0x" })).toBe("Base (OETH/USDC)");
    expect(marketName({ chain: base, params: null, marketId: `0x${"3a".repeat(32)}` })).toBe("Base (0x3a3a...3a3a)");
  });

  it("gives the LLTV of a Blue market, and each distinct one of a Midnight market, lowest first", () => {
    expect(lltvText(BLUE)).toBe("86%");
    expect(lltvText(MIDNIGHT)).toBe("86%, 91.5%");
  });

  it("gives the LTV, or nothing without collateral", () => {
    expect(ltvText(reading())).toBe("66.84%");
    expect(ltvText(reading({ collateralValue: 0n }))).toBeNull();
  });

  it("formats the health factor as the badge reads it, infinite without debt", () => {
    expect(healthFactorText(reading())).toBe("1.29");
    expect(healthFactorText(reading({ healthFactor: NO_DEBT_HEALTH_FACTOR }))).toBe("∞");
    expect(hasDebt(reading())).toBe(true);
    expect(hasDebt(reading({ debt: 0n }))).toBe(false);
    expect(hasDebt(undefined)).toBe(false);
  });

  it("states amounts in the loan token", () => {
    expect(loanAmount(55_113_361_618n, BLUE)).toBe("55,113.3616 USDC");
  });

  it("counts down to maturity in days, then hours in the last day", () => {
    const maturity = MIDNIGHT.maturity;
    expect(maturityCountdown(maturity, maturity - 3 * 86_400 - 5)).toEqual({ matured: false, days: 3, hours: 72 });
    expect(maturityCountdown(maturity, maturity - 5 * 3600 - 1)).toMatchObject({ days: 0, hours: 5 });
    expect(maturityCountdown(maturity, maturity - 30)).toMatchObject({ days: 0, hours: 1 });
    expect(maturityCountdown(maturity, maturity)).toMatchObject({ matured: true });
    expect(maturityDay(maturity)).toBe("2026-10-30");
  });
});
