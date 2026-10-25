import { describe, expect, it } from "vitest";
import {
  NO_DEBT_HEALTH_FACTOR,
  WAD,
  accrueTotalBorrowAssets,
  collateralValue,
  healthFactorWad,
  maxBorrowAt,
  midnightMaxDebt,
  mulDivUp,
  toAssetsUp,
  wTaylorCompounded,
} from "~~/services/morpho/math";

// Expected values were computed independently with Python integers from the same formulas; the live inputs are an
// Ethereum OETH/USDC Blue position and a Base Midnight position read on 25 Oct 2026.

describe("Morpho math", () => {
  it("rounds shares to assets up, with the contract's virtual shares and assets", () => {
    expect(toAssetsUp(0n, 100n, 100n)).toBe(0n);
    expect(toAssetsUp(1n, 0n, 0n)).toBe(1n);
    expect(mulDivUp(10n, 3n, 4n)).toBe(8n);
    expect(toAssetsUp(52320744392661477n, 9242906069378n, 8774564129419866574n)).toBe(55113361618n);
  });

  it("compounds a per-second rate like MathLib.wTaylorCompounded", () => {
    expect(wTaylorCompounded(0n, 1000n)).toBe(0n);
    // About 4% a year for a year: e^0.04 − 1 = 0.0408108, the Taylor sum to three terms is 0.0408106.
    const rate = (4n * WAD) / 100n / 31_536_000n;
    const compounded = Number(wTaylorCompounded(rate, 31_536_000n)) / 1e18;
    expect(compounded).toBeCloseTo(0.04081, 5);
  });

  it("accrues interest exactly as the contract did at a live block, and not without a rate or time", () => {
    // Block 26270603: the contract's own accrueInterest left 9,242,731,482,802; this vector uses the rate read then.
    expect(accrueTotalBorrowAssets(9242731482802n, 1268391679n, 14892n)).toBe(9242906069378n);
    expect(accrueTotalBorrowAssets(9242731482802n, 0n, 14892n)).toBe(9242731482802n);
    expect(accrueTotalBorrowAssets(9242731482802n, 1268391679n, 0n)).toBe(9242731482802n);
    expect(accrueTotalBorrowAssets(0n, 1268391679n, 14892n)).toBe(0n);
  });

  it("computes a Blue health factor and its pre-liquidation line", () => {
    const collateral = 35355274053588173700n;
    const price = 2331889241809637124747709854n;
    const borrowed = 55113361618n;
    expect(maxBorrowAt(collateral, price, 860000000000000000n)).toBe(70902341557n);
    expect(healthFactorWad(70902341557n, borrowed)).toBe(1286481888882701105n);
    expect(healthFactorWad(maxBorrowAt(collateral, price, 832603694978499652n), borrowed)).toBe(1245499504889228330n);
  });

  it("computes a Midnight health factor from its collaterals", () => {
    const priced = [
      { amount: 500000000000000000000000n, price: 1211194030207801131939870n, lltv: 915000000000000000n },
    ];
    expect(collateralValue(priced[0].amount, priced[0].price)).toBe(605597015103n);
    expect(midnightMaxDebt(priced)).toBe(554121268819n);
    expect(healthFactorWad(midnightMaxDebt(priced), 501010136638n)).toBe(1106008099032485108n);
    expect(midnightMaxDebt([...priced, ...priced])).toBe(2n * 554121268819n);
  });

  it("reports no debt as Aave does, and a worthless collateral as 0", () => {
    expect(healthFactorWad(123n, 0n)).toBe(NO_DEBT_HEALTH_FACTOR);
    expect(healthFactorWad(0n, 10n)).toBe(0n);
  });
});
