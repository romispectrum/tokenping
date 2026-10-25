import type { Address } from "viem";

// What Tokenping keeps about a Morpho market. None of it changes once the market exists, so it is read once, when an
// alert is saved (and when the dashboard loads), and stored in notification_configs.market_params; the cron then reads
// only the borrower's position and the prices. Large numbers are decimal strings so the object survives JSON.

export type MorphoToken = { address: Address; symbol: string; decimals: number };

/** A pre-liquidation contract Morpho's factory created for the market. It applies only if the borrower authorised it. */
export type BluePreLiquidation = { address: Address; preLltv: string; oracle: Address };

export type BlueMarketParams = {
  kind: "blue";
  loanToken: MorphoToken;
  collateralToken: MorphoToken;
  oracle: Address;
  /** 0x0 for a market without interest. */
  irm: Address;
  /** WAD (1e18 = 100%). */
  lltv: string;
  preLiquidations: BluePreLiquidation[];
};

export type MidnightCollateral = { token: MorphoToken; lltv: string; oracle: Address };

export type MidnightMarketParams = {
  kind: "midnight";
  loanToken: MorphoToken;
  /** In the market's order: a position's collateral at index i is collaterals[i]. */
  collaterals: MidnightCollateral[];
  /** Unix seconds. After it, any unpaid debt can be liquidated. */
  maturity: number;
};

export type MorphoMarketParams = BlueMarketParams | MidnightMarketParams;

/**
 * One health reading of a Morpho position, in the shape Aave's readings take: an 18-decimal health factor (maxUint256
 * when there is no debt), plus the debt and the value the collateral counts for, in loan-token units.
 */
export type MorphoReading = {
  healthFactor: bigint;
  /** Which line the health factor is measured against: the market's LLTV, or a pre-liquidation the borrower authorised. */
  line: "lltv" | "pre-liquidation";
  debt: bigint;
  collateralValue: bigint;
  /** The block's timestamp (unix seconds) the reading was taken at. */
  timestamp: number;
};
