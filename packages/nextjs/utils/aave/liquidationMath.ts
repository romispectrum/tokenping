import { INFINITE_HEALTH_FACTOR } from "~~/utils/healthFactor";

/*
 * Aave V3 health factor and liquidation price arithmetic, as computed by GenericLogic.calculateUserAccountData
 * (aave-dao/aave-v3-origin, read 14 Oct 2026):
 *
 *   HF = Σ(collateral value × liquidation threshold) ÷ total debt value, all in USD at Aave's oracle prices.
 *
 * A position can be liquidated once HF < 1. Aave V4 uses the same shape with one collateral factor per asset in place of
 * the liquidation threshold, computed per Spoke. A liquidation price is not something Aave reports: it is this formula
 * solved for one asset's price with every other price held still.
 */

export type CollateralAsset = {
  amount: number;
  /** USD oracle price of one unit. */
  price: number;
  /** A fraction: 0.83 for 83%. */
  liquidationThreshold: number;
};

export type DebtAsset = {
  amount: number;
  /** USD oracle price of one unit (1 for a stablecoin at its peg). */
  price: number;
};

export type Position = {
  collateral: readonly CollateralAsset[];
  debt: readonly DebtAsset[];
};

export type LiquidationPrice = {
  /** The price at which HF is exactly 1, with every other price unchanged. */
  price: number;
  /** price ÷ current price − 1: negative when the asset has to fall (collateral), positive when it has to rise (debt). */
  change: number;
};

export type LiquidationPriceRatio = {
  /** Collateral price ÷ debt price at which HF is exactly 1 (units of the debt asset per unit of collateral). */
  ratio: number;
  /** ratio ÷ current ratio − 1. */
  change: number;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const isPositive = (value: number) => Number.isFinite(value) && value > 0;

export const totalCollateralValue = ({ collateral }: Position) => sum(collateral.map(a => a.amount * a.price));

/** Σ(collateral value × liquidation threshold): the numerator of the health factor. */
export const weightedCollateralValue = ({ collateral }: Position) =>
  sum(collateral.map(a => a.amount * a.price * a.liquidationThreshold));

export const totalDebtValue = ({ debt }: Position) => sum(debt.map(d => d.amount * d.price));

/** Infinity without debt, like the contract's type(uint256).max. */
export const healthFactor = (position: Position) => {
  const debt = totalDebtValue(position);
  return debt > 0 ? weightedCollateralValue(position) / debt : Infinity;
};

/** The "average liquidation threshold" of getUserAccountData: Σ(collateral × LT) ÷ Σ collateral. Null without collateral. */
export const averageLiquidationThreshold = (position: Position) => {
  const total = totalCollateralValue(position);
  return total > 0 ? weightedCollateralValue(position) / total : null;
};

/** Rows of one position that hold the same asset, so they share one price: collateral rows and borrowed rows by index. */
export type SharedAsset = {
  collateral: readonly number[];
  debt: readonly number[];
};

/** Amounts closer than this (relative) count as equal, so float noise such as 10 × 0.83 vs 8.3 cannot invent a price. */
const RELATIVE_EPSILON = 1e-9;

/**
 * The USD price of one asset at which HF reaches 1, every other asset's price unchanged. The asset may sit in several
 * rows, as collateral, as debt or both (WETH supplied and WETH borrowed); all of them move together, priced like the
 * first row. Solving Σ(other collateral × LT) + p × Σ(amount × LT) = other debt + p × Σ(amount borrowed) for p:
 *
 *   p = (other weighted collateral − other debt) ÷ (amount borrowed − amount supplied × LT)
 *
 * Null when no positive price of this asset alone reaches HF 1: when the other assets already decide the outcome, when
 * its supplied side (× LT) and borrowed side cancel out so its price does not move HF at all, or when it has no
 * amount or price.
 */
export const sharedAssetLiquidationPrice = (position: Position, rows: SharedAsset): LiquidationPrice | null => {
  const collateral = rows.collateral.map(index => position.collateral[index]);
  const debt = rows.debt.map(index => position.debt[index]);
  if (collateral.some(a => !a) || debt.some(d => !d)) return null;
  const currentPrice = collateral[0]?.price ?? debt[0]?.price;
  if (currentPrice === undefined || !isPositive(currentPrice)) return null;

  const supplied = sum(collateral.map(a => a.amount * a.liquidationThreshold));
  const borrowed = sum(debt.map(d => d.amount));
  if (!Number.isFinite(supplied) || !Number.isFinite(borrowed)) return null;
  if (Math.abs(borrowed - supplied) <= RELATIVE_EPSILON * Math.max(borrowed, supplied)) return null;

  const otherWeighted = sum(
    position.collateral.flatMap((a, index) =>
      rows.collateral.includes(index) ? [] : [a.amount * a.price * a.liquidationThreshold],
    ),
  );
  const otherDebt = sum(position.debt.flatMap((d, index) => (rows.debt.includes(index) ? [] : [d.amount * d.price])));
  const price = (otherWeighted - otherDebt) / (borrowed - supplied);
  return isPositive(price) ? { price, change: price / currentPrice - 1 } : null;
};

/**
 * The USD price of collateral asset `index` at which HF reaches 1, every other price unchanged:
 * (debt − other collateral's weighted value) ÷ (amount × LT).
 * Null when no price of this asset alone can reach HF 1: the other collateral already covers the debt at HF ≥ 1, there
 * is no debt, or the asset has no amount, price or threshold.
 */
export const collateralLiquidationPrice = (position: Position, index: number): LiquidationPrice | null => {
  const asset = position.collateral[index];
  if (!asset || !isPositive(asset.amount) || !isPositive(asset.price) || !isPositive(asset.liquidationThreshold)) {
    return null;
  }
  return sharedAssetLiquidationPrice(position, { collateral: [index], debt: [] });
};

/**
 * The USD price of borrowed asset `index` at which HF reaches 1, every other price unchanged: a price on the upside,
 * because debt is worth more as its price rises. (weighted collateral − other debt) ÷ amount borrowed.
 * Null when the asset has no amount or price, or when the other debt alone already puts HF at or below 1.
 */
export const debtLiquidationPrice = (position: Position, index: number): LiquidationPrice | null => {
  const asset = position.debt[index];
  if (!asset || !isPositive(asset.amount) || !isPositive(asset.price)) return null;
  return sharedAssetLiquidationPrice(position, { collateral: [], debt: [index] });
};

/**
 * How far every collateral price can fall together, by the same percentage and with debt prices unchanged, before HF
 * reaches 1: 1 − 1 ÷ HF, as a fraction. Negative when HF is already below 1; null without debt or without collateral.
 */
export const uniformCollateralFall = (position: Position) => {
  const hf = healthFactor(position);
  return Number.isFinite(hf) && hf > 0 ? 1 - 1 / hf : null;
};

/**
 * For one collateral asset against one borrowed asset, HF depends only on the ratio between their prices. This is the
 * collateral price ÷ debt price at which HF reaches 1: debt amount ÷ (collateral amount × LT). Useful when both sides
 * move, e.g. wstETH against WETH in E-Mode. Null for any other position shape.
 */
export const liquidationPriceRatio = (position: Position): LiquidationPriceRatio | null => {
  if (position.collateral.length !== 1 || position.debt.length !== 1) return null;
  const [collateral] = position.collateral;
  const [debt] = position.debt;
  if (
    ![collateral.amount, collateral.price, collateral.liquidationThreshold, debt.amount, debt.price].every(isPositive)
  ) {
    return null;
  }
  const ratio = debt.amount / (collateral.amount * collateral.liquidationThreshold);
  return { ratio, change: ratio / (collateral.price / debt.price) - 1 };
};

/*
 * Prefill values for the calculator: liquidation thresholds read on-chain in one Multicall3 call per chain from each
 * market's current PoolDataProvider (getReserveConfigurationData) and, for E-Mode, Pool.getEModeCategoryCollateralConfig.
 * Governance and the Risk Stewards can change them at any time, so the calculator shows the date next to them.
 */
export const LIQUIDATION_THRESHOLDS_AS_OF = "2026-10-14";

export type LiquidationThresholdPreset = {
  id: string;
  market: "Ethereum Core" | "Arbitrum";
  /** What the option is called in the select. */
  label: string;
  /** Prefilled as the asset name; null when the preset covers several assets. */
  symbol: string | null;
  liquidationThresholdPercent: number;
  /** Block the value was read at, on the market's own chain. */
  block: number;
  /**
   * For an E-Mode category: the assets its threshold applies to (getEModeCategoryCollateralBitmap) and the only assets an
   * account in it may borrow (getEModeCategoryBorrowableBitmap).
   */
  eMode?: {
    category: string;
    collateralSymbols: readonly string[];
    borrowableSymbols: readonly string[];
  };
};

export const LIQUIDATION_THRESHOLD_PRESETS: readonly LiquidationThresholdPreset[] = [
  {
    id: "ethereum-core-weth",
    market: "Ethereum Core",
    label: "WETH",
    symbol: "WETH",
    liquidationThresholdPercent: 83,
    block: 26193284,
  },
  {
    id: "ethereum-core-wbtc",
    market: "Ethereum Core",
    label: "WBTC",
    symbol: "WBTC",
    liquidationThresholdPercent: 78,
    block: 26193284,
  },
  {
    id: "ethereum-core-usdc",
    market: "Ethereum Core",
    label: "USDC",
    symbol: "USDC",
    liquidationThresholdPercent: 78,
    block: 26193284,
  },
  {
    id: "ethereum-core-emode-eth",
    market: "Ethereum Core",
    label: "E-Mode “ETH correlated” (e.g. WETH, wstETH, weETH)",
    symbol: null,
    liquidationThresholdPercent: 95,
    block: 26193288,
    // Collateral bitmap 2952790659 = reserve ids 0, 1, 7, 9, 28, 29, 31; borrowable bitmap 1 = id 0 (WETH).
    eMode: {
      category: "ETH correlated",
      collateralSymbols: ["WETH", "wstETH", "cbETH", "rETH", "weETH", "osETH", "ETHx"],
      borrowableSymbols: ["WETH"],
    },
  },
  {
    id: "arbitrum-weth",
    market: "Arbitrum",
    label: "WETH",
    symbol: "WETH",
    liquidationThresholdPercent: 84,
    block: 514855406,
  },
  {
    id: "arbitrum-wbtc",
    market: "Arbitrum",
    label: "WBTC",
    symbol: "WBTC",
    liquidationThresholdPercent: 78,
    block: 514855406,
  },
  {
    id: "arbitrum-usdc",
    market: "Arbitrum",
    label: "USDC (native)",
    symbol: "USDC",
    liquidationThresholdPercent: 78,
    block: 514855406,
  },
];

export const findLiquidationThresholdPreset = (id: string) => LIQUIDATION_THRESHOLD_PRESETS.find(p => p.id === id);

// Aave's app lists borrowed WETH as "ETH" when it goes through the WETH gateway; both have one oracle price.
const ASSET_NAME_ALIASES: Record<string, string> = { eth: "weth" };

/**
 * A key for "is this the same asset?" across rows typed by a person: trimmed, case-insensitive, ETH = WETH.
 * "" for an unnamed row, which matches nothing.
 */
export const assetNameKey = (name: string) => {
  const key = name.trim().toLowerCase();
  return ASSET_NAME_ALIASES[key] ?? key;
};

/* Input parsing and display. Formatting is pinned to en-US so server and client render the same text. */

export type ParsedNumber = { status: "empty" } | { status: "invalid" } | { status: "valid"; value: number };

const PLAIN_DECIMAL = /^(?:\d+\.?\d*|\.\d+)$/;
const GROUPED_DECIMAL = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/;

/**
 * Reads a non-negative decimal typed by a person: "2400", "0.25", ".5", "12,000", "$2,400.50". Commas count only as
 * thousands separators ("12,000"); "2,5" is rejected rather than guessed, so a decimal comma never becomes 25.
 */
export const parseDecimalInput = (input: string): ParsedNumber => {
  const text = input.trim().replace(/^\$\s*/, "");
  if (text === "") return { status: "empty" };
  if (!PLAIN_DECIMAL.test(text) && !GROUPED_DECIMAL.test(text)) return { status: "invalid" };
  const value = Number(text.replace(/,/g, ""));
  return Number.isFinite(value) ? { status: "valid", value } : { status: "invalid" };
};

/** HF values this close to 1 count as exactly 1, so float noise at the liquidation price does not flip the verdict. */
const HEALTH_FACTOR_EPSILON = 1e-9;

export const isLiquidatable = (hf: number) => hf < 1 - HEALTH_FACTOR_EPSILON;

const HEALTH_FACTOR_FORMATTER = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });

/**
 * Up to three decimals ("1.632", "1.66", "1.30"); "∞" without debt. Below 1 the value is truncated, never rounded, so a
 * liquidatable position cannot be shown as "1.00".
 */
export const formatHealthFactor = (hf: number) => {
  if (!Number.isFinite(hf)) return INFINITE_HEALTH_FACTOR;
  const shown = isLiquidatable(hf) ? Math.floor(hf * 1000) / 1000 : Math.max(hf, 1);
  return HEALTH_FACTOR_FORMATTER.format(shown);
};

const USD_FORMATTER = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const USD_SMALL_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumSignificantDigits: 2,
  maximumSignificantDigits: 4,
});

/**
 * "$1,445.78". Prices under $1 keep up to four significant digits ("$0.7692", "$0.50") so small tokens don't collapse
 * to $0.00; a value that rounds up to $1 at that precision (0.99995) is shown in cents like any other dollar amount.
 */
export const formatUsd = (value: number) =>
  (value === 0 || Number(value.toPrecision(4)) >= 1 ? USD_FORMATTER : USD_SMALL_FORMATTER).format(value);

const PERCENT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A fraction as an unsigned percentage with one decimal: 0.3976 → "39.8%". The sentence around it says fall or rise.
 * A fall short of 100% never reads "100.0%" next to a non-zero price (">99.9%"), and a non-zero move never reads
 * "0.0%" ("<0.1%").
 */
export const formatPercent = (fraction: number) => {
  const magnitude = Math.abs(fraction);
  if (magnitude >= 0.9995 && magnitude < 1) return ">99.9%";
  if (magnitude > 0 && magnitude < 0.0005) return "<0.1%";
  return PERCENT_FORMATTER.format(magnitude);
};

const RATIO_FORMATTER = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6 });

export const formatRatio = (ratio: number) => RATIO_FORMATTER.format(ratio);
