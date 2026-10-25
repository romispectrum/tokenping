import { maxUint256 } from "viem";

// Bigint ports of the few pieces of Morpho's own math a health factor needs, so Tokenping computes the number exactly
// as the contracts decide liquidations. From github.com/morpho-org/morpho-blue (MIT): MathLib, SharesMathLib,
// MorphoBalancesLib.expectedMarketBalances and Morpho._isHealthy; from github.com/morpho-org/midnight: isHealthy.

export const WAD = 10n ** 18n;
export const ORACLE_PRICE_SCALE = 10n ** 36n;

const VIRTUAL_SHARES = 10n ** 6n;
const VIRTUAL_ASSETS = 1n;

/** The health factor Aave and Tokenping use for "no debt": nothing to alert on. */
export const NO_DEBT_HEALTH_FACTOR = maxUint256;

export const mulDivDown = (x: bigint, y: bigint, d: bigint) => (x * y) / d;
export const mulDivUp = (x: bigint, y: bigint, d: bigint) => (x * y + (d - 1n)) / d;
export const wMulDown = (x: bigint, y: bigint) => mulDivDown(x, y, WAD);

/** e^(x·n) − 1 to three Taylor terms, as Morpho compounds a per-second rate x over n seconds. */
export const wTaylorCompounded = (x: bigint, n: bigint) => {
  const firstTerm = x * n;
  const secondTerm = mulDivDown(firstTerm, firstTerm, 2n * WAD);
  const thirdTerm = mulDivDown(secondTerm, firstTerm, 3n * WAD);
  return firstTerm + secondTerm + thirdTerm;
};

/** Borrow shares to assets, rounded up as the contract does for debt. */
export const toAssetsUp = (shares: bigint, totalAssets: bigint, totalShares: bigint) =>
  mulDivUp(shares, totalAssets + VIRTUAL_ASSETS, totalShares + VIRTUAL_SHARES);

/**
 * The market's total borrow assets with the interest accrued since its last update, as accrueInterest would leave them.
 * `borrowRate` is the IRM's per-second WAD rate; a market without an IRM never accrues (pass 0n).
 */
export const accrueTotalBorrowAssets = (totalBorrowAssets: bigint, borrowRate: bigint, elapsed: bigint) =>
  elapsed > 0n && totalBorrowAssets > 0n && borrowRate > 0n
    ? totalBorrowAssets + wMulDown(totalBorrowAssets, wTaylorCompounded(borrowRate, elapsed))
    : totalBorrowAssets;

/** Collateral valued in loan-token units at an oracle price scaled by 1e36. */
export const collateralValue = (collateral: bigint, price: bigint) => mulDivDown(collateral, price, ORACLE_PRICE_SCALE);

/** What the collateral lets the borrower owe at a line (an LLTV or a pre-LLTV, WAD): Morpho's maxBorrow. */
export const maxBorrowAt = (collateral: bigint, price: bigint, line: bigint) =>
  wMulDown(collateralValue(collateral, price), line);

/**
 * maxBorrow ÷ borrowed as an 18-decimal number (wDivDown, as Morpho's SDK computes it). A position is liquidatable
 * below 1.0; no debt gives NO_DEBT_HEALTH_FACTOR.
 */
export const healthFactorWad = (maxBorrow: bigint, borrowed: bigint) =>
  borrowed === 0n ? NO_DEBT_HEALTH_FACTOR : mulDivDown(maxBorrow, WAD, borrowed);

/** Midnight's maximum debt: Σ collateral_i × price_i / 1e36 × lltv_i / 1e18, each term rounded down as isHealthy does. */
export const midnightMaxDebt = (collaterals: readonly { amount: bigint; price: bigint; lltv: bigint }[]) =>
  collaterals.reduce((sum, { amount, price, lltv }) => sum + maxBorrowAt(amount, price, lltv), 0n);
