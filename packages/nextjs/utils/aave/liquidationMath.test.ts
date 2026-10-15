import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LIQUIDATION_THRESHOLDS_AS_OF,
  LIQUIDATION_THRESHOLD_PRESETS,
  type Position,
  assetNameKey,
  averageLiquidationThreshold,
  collateralLiquidationPrice,
  debtLiquidationPrice,
  findLiquidationThresholdPreset,
  formatHealthFactor,
  formatPercent,
  formatRatio,
  formatUsd,
  healthFactor,
  isLiquidatable,
  liquidationPriceRatio,
  parseDecimalInput,
  sharedAssetLiquidationPrice,
  totalCollateralValue,
  totalDebtValue,
  uniformCollateralFall,
  weightedCollateralValue,
} from "~~/utils/aave/liquidationMath";

// Worked examples from the fact sheet (aave-facts.md §2, §4.4, §5.2, §6.1) and the aave-liquidation-price article.
// Prices are the illustrative round numbers those use; thresholds are Ethereum Core / Arbitrum values read 14 Oct 2026.
const USDC_DEBT = (amount: number) => ({ amount, price: 1 });

// Example A: 10 WETH at $2,400 (LT 83%) against 12,000 USDC.
const EXAMPLE_A: Position = {
  collateral: [{ amount: 10, price: 2400, liquidationThreshold: 0.83 }],
  debt: [USDC_DEBT(12_000)],
};

// Example B: plus 0.2 WBTC at $81,500 (LT 78%), against 20,000 USDC.
const EXAMPLE_B: Position = {
  collateral: [
    { amount: 10, price: 2400, liquidationThreshold: 0.83 },
    { amount: 0.2, price: 81_500, liquidationThreshold: 0.78 },
  ],
  debt: [USDC_DEBT(20_000)],
};

// Example C: 10,000 USDC (LT 78%) against 2.5 WETH borrowed at $2,400 ($6,000).
const EXAMPLE_C: Position = {
  collateral: [{ amount: 10_000, price: 1, liquidationThreshold: 0.78 }],
  debt: [{ amount: 2.5, price: 2400 }],
};

const at = (position: Position, collateralPrices: number[]): Position => ({
  ...position,
  collateral: position.collateral.map((asset, i) => ({ ...asset, price: collateralPrices[i] ?? asset.price })),
});

describe("health factor (Σ collateral × LT ÷ debt)", () => {
  it("example A: HF 1.66, weighted collateral $19,920", () => {
    expect(totalCollateralValue(EXAMPLE_A)).toBe(24_000);
    expect(weightedCollateralValue(EXAMPLE_A)).toBeCloseTo(19_920, 9);
    expect(totalDebtValue(EXAMPLE_A)).toBe(12_000);
    expect(healthFactor(EXAMPLE_A)).toBeCloseTo(1.66, 12);
    expect(formatHealthFactor(healthFactor(EXAMPLE_A))).toBe("1.66");
  });

  it("example A at the borrow limit (80.5% LTV, $19,320 of debt): HF 1.031 = LT ÷ LTV", () => {
    const atLimit: Position = { ...EXAMPLE_A, debt: [USDC_DEBT(24_000 * 0.805)] };
    expect(totalDebtValue(atLimit)).toBeCloseTo(19_320, 9);
    expect(healthFactor(atLimit)).toBeCloseTo(0.83 / 0.805, 12);
    expect(formatHealthFactor(healthFactor(atLimit))).toBe("1.031");
  });

  it("example B: weighted collateral 32,634, HF 1.632, average LT 80.98%", () => {
    expect(totalCollateralValue(EXAMPLE_B)).toBe(40_300);
    expect(weightedCollateralValue(EXAMPLE_B)).toBeCloseTo(32_634, 9);
    expect(healthFactor(EXAMPLE_B)).toBeCloseTo(1.6317, 12);
    expect(formatHealthFactor(healthFactor(EXAMPLE_B))).toBe("1.632");
    expect(averageLiquidationThreshold(EXAMPLE_B)).toBeCloseTo(32_634 / 40_300, 12);
    expect(formatPercent(averageLiquidationThreshold(EXAMPLE_B)!)).toBe("81.0%");
    expect((averageLiquidationThreshold(EXAMPLE_B)! * 100).toFixed(2)).toBe("80.98");
  });

  it("example C: HF 1.30, and 1.144 if USDC collateral depegs to $0.88", () => {
    expect(healthFactor(EXAMPLE_C)).toBeCloseTo(1.3, 12);
    expect(formatHealthFactor(healthFactor(EXAMPLE_C))).toBe("1.30");
    expect(healthFactor(at(EXAMPLE_C, [0.88]))).toBeCloseTo(1.144, 12);
    expect(formatHealthFactor(healthFactor(at(EXAMPLE_C, [0.88])))).toBe("1.144");
  });

  it("liquidation examples (§4.4): ETH $1,420 → HF 0.982, ETH $1,330 → HF 0.920, both liquidatable", () => {
    const at1420 = healthFactor(at(EXAMPLE_A, [1420]));
    const at1330 = healthFactor(at(EXAMPLE_A, [1330]));
    expect(at1420).toBeCloseTo(0.98216, 4);
    expect(formatHealthFactor(at1420)).toBe("0.982");
    expect(formatHealthFactor(at1330)).toBe("0.919"); // 0.91991…: truncated below 1, the fact sheet rounds to 0.920
    expect(at1330).toBeCloseTo(0.92, 3);
    expect(isLiquidatable(at1420)).toBe(true);
    expect(isLiquidatable(at1330)).toBe(true);
  });

  it("after the 50% liquidation at $1,420 (6,300 of collateral seized for 6,000 of debt): HF 1.093", () => {
    const after: Position = {
      collateral: [{ amount: 10 - 6300 / 1420, price: 1420, liquidationThreshold: 0.83 }],
      debt: [USDC_DEBT(6000)],
    };
    expect(totalCollateralValue(after)).toBeCloseTo(7900, 9);
    expect(formatHealthFactor(healthFactor(after))).toBe("1.093");
  });

  it("E-Mode ETH correlated (LT 95%): wstETH worth 100 ETH against 90 WETH → 1.056; at the 93% max borrow → 1.0215", () => {
    const emode = (borrowed: number): Position => ({
      collateral: [{ amount: 100, price: 1, liquidationThreshold: 0.95 }],
      debt: [{ amount: borrowed, price: 1 }],
    });
    expect(formatHealthFactor(healthFactor(emode(90)))).toBe("1.056");
    expect(healthFactor(emode(93))).toBeCloseTo(1.0215, 4);
    // Halving ETH's dollar price on both sides leaves the health factor unchanged.
    const halved: Position = {
      collateral: [{ amount: 100, price: 0.5, liquidationThreshold: 0.95 }],
      debt: [{ amount: 90, price: 0.5 }],
    };
    expect(healthFactor(halved)).toBeCloseTo(healthFactor(emode(90)), 12);
  });

  it("interest for a year at the 14 Oct 2026 rates (USDC borrow 4.496%, WETH supply 1.309% APR) → about 1.61", () => {
    // Per-second accrual compounds to e^(APR) over a year for variable debt; supply interest is close enough to the same.
    const accrued: Position = {
      collateral: [{ amount: 10 * Math.exp(0.01309), price: 2400, liquidationThreshold: 0.83 }],
      debt: [USDC_DEBT(12_000 * Math.exp(0.04496))],
    };
    expect(totalDebtValue(accrued)).toBeCloseTo(12_550, -1);
    expect(accrued.collateral[0].amount).toBeCloseTo(10.13, 2);
    expect(healthFactor(accrued)).toBeCloseTo(1.61, 2);
    expect(Math.round(collateralLiquidationPrice(accrued, 0)!.price / 10) * 10).toBe(1490);
  });

  it("is Infinity without debt and 0 without collateral", () => {
    expect(healthFactor({ collateral: EXAMPLE_A.collateral, debt: [] })).toBe(Infinity);
    expect(healthFactor({ collateral: EXAMPLE_A.collateral, debt: [USDC_DEBT(0)] })).toBe(Infinity);
    expect(healthFactor({ collateral: [], debt: [USDC_DEBT(100)] })).toBe(0);
    expect(averageLiquidationThreshold({ collateral: [], debt: [] })).toBeNull();
  });
});

describe("collateralLiquidationPrice", () => {
  it("example A: $1,445.78, a 39.8% fall from $2,400, equal to price ÷ HF", () => {
    const result = collateralLiquidationPrice(EXAMPLE_A, 0)!;
    expect(result.price).toBeCloseTo(12_000 / 8.3, 9);
    expect(result.price).toBeCloseTo(2400 / healthFactor(EXAMPLE_A), 9);
    expect(formatUsd(result.price)).toBe("$1,445.78");
    expect(result.change).toBeLessThan(0);
    expect(formatPercent(result.change)).toBe("39.8%");
    // At that price the health factor is exactly 1 and the position is not yet liquidatable.
    const atLiquidation = healthFactor(at(EXAMPLE_A, [result.price]));
    expect(atLiquidation).toBeCloseTo(1, 12);
    expect(isLiquidatable(atLiquidation)).toBe(false);
    expect(isLiquidatable(healthFactor(at(EXAMPLE_A, [result.price - 0.01])))).toBe(true);
  });

  it("example A at the borrow limit: $2,327.71, only 3.0% below $2,400", () => {
    const result = collateralLiquidationPrice({ ...EXAMPLE_A, debt: [USDC_DEBT(19_320)] }, 0)!;
    expect(formatUsd(result.price)).toBe("$2,327.71");
    expect(formatPercent(result.change)).toBe("3.0%");
  });

  it("a threshold cut from 83% to 80% moves example A's price to $1,500.00 (old LT ÷ new LT)", () => {
    const cut: Position = { ...EXAMPLE_A, collateral: [{ ...EXAMPLE_A.collateral[0], liquidationThreshold: 0.8 }] };
    const result = collateralLiquidationPrice(cut, 0)!;
    expect(formatUsd(result.price)).toBe("$1,500.00");
    expect(result.price).toBeCloseTo((collateralLiquidationPrice(EXAMPLE_A, 0)!.price * 0.83) / 0.8, 9);
  });

  it("an alert at ETH $1,800 is HF 1,800 ÷ 1,445.78 = 1.245", () => {
    const liquidation = collateralLiquidationPrice(EXAMPLE_A, 0)!.price;
    expect(1800 / liquidation).toBeCloseTo(1.245, 9);
    expect(healthFactor(at(EXAMPLE_A, [1800]))).toBeCloseTo(1800 / liquidation, 12);
  });

  it("Arbitrum example: 5 WETH (LT 84%) and 7,000 USDC → HF 1.44, $1,666.67, a 30.6% fall; $1,686.75 at 83%", () => {
    const arbitrum: Position = {
      collateral: [{ amount: 5, price: 2400, liquidationThreshold: 0.84 }],
      debt: [USDC_DEBT(7000)],
    };
    expect(formatHealthFactor(healthFactor(arbitrum))).toBe("1.44");
    const result = collateralLiquidationPrice(arbitrum, 0)!;
    expect(formatUsd(result.price)).toBe("$1,666.67");
    expect(formatPercent(result.change)).toBe("30.6%");
    const core = { ...arbitrum, collateral: [{ ...arbitrum.collateral[0], liquidationThreshold: 0.83 }] };
    expect(formatUsd(collateralLiquidationPrice(core, 0)!.price)).toBe("$1,686.75");
  });

  it("example B: ETH $877.83 (63.4% fall) with WBTC held; WBTC $512.82 (99.4% fall) with ETH held", () => {
    const eth = collateralLiquidationPrice(EXAMPLE_B, 0)!;
    expect(eth.price).toBeCloseTo((20_000 - 12_714) / 8.3, 9);
    expect(formatUsd(eth.price)).toBe("$877.83");
    expect(formatPercent(eth.change)).toBe("63.4%");
    expect(healthFactor(at(EXAMPLE_B, [eth.price]))).toBeCloseTo(1, 12);

    const wbtc = collateralLiquidationPrice(EXAMPLE_B, 1)!;
    expect(wbtc.price).toBeCloseTo((20_000 - 19_920) / (0.2 * 0.78), 9);
    expect(formatUsd(wbtc.price)).toBe("$512.82");
    expect(formatPercent(wbtc.change)).toBe("99.4%");
    expect(healthFactor(at(EXAMPLE_B, [2400, wbtc.price]))).toBeCloseTo(1, 12);
  });

  it("example C: the USDC collateral itself would have to depeg to $0.7692 (a 23.1% fall)", () => {
    const result = collateralLiquidationPrice(EXAMPLE_C, 0)!;
    expect(result.price).toBeCloseTo(6000 / 7800, 12);
    expect(formatUsd(result.price)).toBe("$0.7692");
    expect(formatPercent(result.change)).toBe("23.1%");
  });

  it("is null when the other collateral alone covers the debt, without debt, or for an empty asset", () => {
    const covered: Position = { ...EXAMPLE_B, debt: [USDC_DEBT(19_000)] }; // WETH alone weighs 19,920
    expect(collateralLiquidationPrice(covered, 1)).toBeNull();
    expect(collateralLiquidationPrice(covered, 0)).not.toBeNull();
    expect(collateralLiquidationPrice({ ...EXAMPLE_A, debt: [] }, 0)).toBeNull();
    expect(collateralLiquidationPrice(EXAMPLE_A, 5)).toBeNull();
    for (const empty of [{ amount: 0 }, { price: 0 }, { liquidationThreshold: 0 }, { amount: Number.NaN }]) {
      const position = { ...EXAMPLE_A, collateral: [{ ...EXAMPLE_A.collateral[0], ...empty }] };
      expect(collateralLiquidationPrice(position, 0)).toBeNull();
    }
  });

  it("is above the current price when the position is already liquidatable", () => {
    const result = collateralLiquidationPrice(at(EXAMPLE_A, [1420]), 0)!;
    expect(result.price).toBeCloseTo(1445.783, 3);
    expect(result.change).toBeGreaterThan(0);
  });
});

describe("debtLiquidationPrice", () => {
  it("example C: ETH rising to $3,120 (30.0%), equal to price × HF", () => {
    const result = debtLiquidationPrice(EXAMPLE_C, 0)!;
    expect(result.price).toBeCloseTo(3120, 9);
    expect(result.price).toBeCloseTo(2400 * healthFactor(EXAMPLE_C), 9);
    expect(formatUsd(result.price)).toBe("$3,120.00");
    expect(result.change).toBeGreaterThan(0);
    expect(formatPercent(result.change)).toBe("30.0%");
    const atLiquidation: Position = { ...EXAMPLE_C, debt: [{ amount: 2.5, price: result.price }] };
    expect(healthFactor(atLiquidation)).toBeCloseTo(1, 12);
  });

  it("example C with USDC at $0.88: the ETH liquidation price drops to $2,745.60", () => {
    expect(formatUsd(debtLiquidationPrice(at(EXAMPLE_C, [0.88]), 0)!.price)).toBe("$2,745.60");
  });

  it("subtracts other debt and is null without an amount or when other debt alone reaches HF 1", () => {
    const twoDebts: Position = { ...EXAMPLE_C, debt: [{ amount: 2.5, price: 2400 }, USDC_DEBT(1800)] };
    expect(debtLiquidationPrice(twoDebts, 0)!.price).toBeCloseTo((7800 - 1800) / 2.5, 9);
    expect(debtLiquidationPrice({ ...EXAMPLE_C, debt: [{ amount: 2.5, price: 2400 }, USDC_DEBT(8000)] }, 0)).toBeNull();
    expect(debtLiquidationPrice({ ...EXAMPLE_C, debt: [{ amount: 0, price: 2400 }] }, 0)).toBeNull();
    expect(debtLiquidationPrice(EXAMPLE_C, 1)).toBeNull();
  });
});

describe("sharedAssetLiquidationPrice (one asset in several rows, one price)", () => {
  // Example B's collateral against borrowed WETH instead of USDC: WETH is on both sides.
  const wethDebtB = (borrowed: number): Position => ({ ...EXAMPLE_B, debt: [{ amount: borrowed, price: 2400 }] });
  const WETH_BOTH_SIDES = { collateral: [0], debt: [0] };
  const atWeth = (position: Position, price: number): Position => ({
    collateral: position.collateral.map((a, i) => (i === 0 ? { ...a, price } : a)),
    debt: position.debt.map((d, i) => (i === 0 ? { ...d, price } : d)),
  });

  it("matches the one-row prices: example A's $1,445.78 and example C's $3,120", () => {
    expect(sharedAssetLiquidationPrice(EXAMPLE_A, { collateral: [0], debt: [] })).toEqual(
      collateralLiquidationPrice(EXAMPLE_A, 0),
    );
    expect(sharedAssetLiquidationPrice(EXAMPLE_C, { collateral: [], debt: [0] })).toEqual(
      debtLiquidationPrice(EXAMPLE_C, 0),
    );
  });

  it("8 WETH borrowed against example B: WETH moving alone never liquidates (8.3p + 12,714 = 8p has no positive p)", () => {
    const position = wethDebtB(8);
    expect(sharedAssetLiquidationPrice(position, WETH_BOTH_SIDES)).toBeNull();
    // The row-by-row answer holds the borrowed WETH at $2,400 while the supplied WETH falls: impossible for one asset.
    expect(formatUsd(collateralLiquidationPrice(position, 0)!.price)).toBe("$781.45");
    for (const price of [100, 2400, 10_000, 1e7]) {
      expect(healthFactor(atWeth(position, price))).toBeGreaterThan(1.0375);
    }
  });

  it("9 WETH borrowed against example B: liquidation once WETH rises to 12,714 ÷ (9 − 8.3) = $18,162.86 on both sides", () => {
    const position = wethDebtB(9);
    const result = sharedAssetLiquidationPrice(position, WETH_BOTH_SIDES)!;
    expect(result.price).toBeCloseTo(12_714 / 0.7, 6);
    expect(formatUsd(result.price)).toBe("$18,162.86");
    expect(result.change).toBeGreaterThan(0);
    expect(healthFactor(atWeth(position, result.price))).toBeCloseTo(1, 12);
  });

  it("net long WETH with other debt: 10 WETH against 2 WETH and 5,000 USDC liquidates when WETH falls to $793.65", () => {
    const position: Position = {
      collateral: [{ amount: 10, price: 2400, liquidationThreshold: 0.83 }],
      debt: [{ amount: 2, price: 2400 }, USDC_DEBT(5000)],
    };
    const result = sharedAssetLiquidationPrice(position, WETH_BOTH_SIDES)!;
    expect(result.price).toBeCloseTo(5000 / 6.3, 9);
    expect(formatUsd(result.price)).toBe("$793.65");
    expect(result.change).toBeLessThan(0);
    expect(healthFactor(atWeth(position, result.price))).toBeCloseTo(1, 12);
  });

  it("E-Mode WETH against WETH: the price cancels out, so there is no liquidation price (HF 1.056 at any price)", () => {
    const position: Position = {
      collateral: [{ amount: 10, price: 2400, liquidationThreshold: 0.95 }],
      debt: [{ amount: 9, price: 2400 }],
    };
    expect(sharedAssetLiquidationPrice(position, WETH_BOTH_SIDES)).toBeNull();
    expect(formatHealthFactor(healthFactor(position))).toBe("1.056");
    expect(healthFactor(atWeth(position, 1000))).toBeCloseTo(healthFactor(position), 12);
  });

  it("two collateral rows of one asset fall together: 10 + 5 WETH against 12,000 USDC → 12,000 ÷ 12.45 = $963.86", () => {
    const position: Position = {
      collateral: [
        { amount: 10, price: 2400, liquidationThreshold: 0.83 },
        { amount: 5, price: 2400, liquidationThreshold: 0.83 },
      ],
      debt: [USDC_DEBT(12_000)],
    };
    const result = sharedAssetLiquidationPrice(position, { collateral: [0, 1], debt: [] })!;
    expect(formatUsd(result.price)).toBe("$963.86");
    expect(healthFactor(at(position, [result.price, result.price]))).toBeCloseTo(1, 12);
  });

  it("does not turn float noise into a price when the two sides cancel (10 × 0.83 supplied vs 8.3 borrowed)", () => {
    const position: Position = { ...EXAMPLE_B, debt: [{ amount: 8.3, price: 2400 }] };
    expect(10 * 0.83 - 8.3).not.toBe(0);
    expect(sharedAssetLiquidationPrice(position, WETH_BOTH_SIDES)).toBeNull();
  });

  it("is null for rows that do not exist or an asset without a price", () => {
    expect(sharedAssetLiquidationPrice(EXAMPLE_A, { collateral: [1], debt: [] })).toBeNull();
    expect(sharedAssetLiquidationPrice(EXAMPLE_A, { collateral: [0], debt: [3] })).toBeNull();
    expect(sharedAssetLiquidationPrice(EXAMPLE_A, { collateral: [], debt: [] })).toBeNull();
    expect(sharedAssetLiquidationPrice(at(EXAMPLE_A, [0]), { collateral: [0], debt: [] })).toBeNull();
  });
});

describe("assetNameKey", () => {
  it("matches names typed differently, treats ETH as WETH and leaves unnamed rows unmatched", () => {
    expect(assetNameKey(" WETH ")).toBe("weth");
    expect(assetNameKey("weth")).toBe(assetNameKey("WETH"));
    expect(assetNameKey("ETH")).toBe("weth");
    expect(assetNameKey("wstETH")).toBe("wsteth");
    expect(assetNameKey("   ")).toBe("");
  });
});

describe("uniformCollateralFall", () => {
  it("example B: both collaterals falling 38.7% together (ETH $1,470.86, WBTC $49,948) reaches HF 1", () => {
    const fall = uniformCollateralFall(EXAMPLE_B)!;
    expect(fall).toBeCloseTo(1 - 1 / 1.6317, 12);
    expect(formatPercent(fall)).toBe("38.7%");
    expect(formatUsd(2400 * (1 - fall))).toBe("$1,470.86");
    expect(Math.round(81_500 * (1 - fall))).toBe(49_948);
    expect(healthFactor(at(EXAMPLE_B, [2400 * (1 - fall), 81_500 * (1 - fall)]))).toBeCloseTo(1, 12);
  });

  it("matches the single-collateral fall (1 − 1 ÷ HF): 39.8% for example A; buffers for HF 1.25, 1.5 and 2", () => {
    expect(uniformCollateralFall(EXAMPLE_A)).toBeCloseTo(-collateralLiquidationPrice(EXAMPLE_A, 0)!.change, 12);
    const withHf = (hf: number): Position => ({
      collateral: [{ amount: 1, price: hf, liquidationThreshold: 1 }],
      debt: [USDC_DEBT(1)],
    });
    expect(formatPercent(uniformCollateralFall(withHf(1.25))!)).toBe("20.0%");
    expect(formatPercent(uniformCollateralFall(withHf(1.5))!)).toBe("33.3%");
    expect(formatPercent(uniformCollateralFall(withHf(2))!)).toBe("50.0%");
  });

  it("is negative below HF 1 and null without debt or collateral", () => {
    expect(uniformCollateralFall(at(EXAMPLE_A, [1420]))).toBeLessThan(0);
    expect(uniformCollateralFall({ ...EXAMPLE_A, debt: [] })).toBeNull();
    expect(uniformCollateralFall({ collateral: [], debt: [USDC_DEBT(1)] })).toBeNull();
  });
});

describe("liquidationPriceRatio", () => {
  it("E-Mode: wstETH worth 100 ETH against 90 WETH liquidates after a 5.3% fall in the rate; 2.1% at 93 WETH", () => {
    const emode = (borrowed: number): Position => ({
      collateral: [{ amount: 100, price: 2400, liquidationThreshold: 0.95 }],
      debt: [{ amount: borrowed, price: 2400 }],
    });
    const at90 = liquidationPriceRatio(emode(90))!;
    expect(at90.ratio).toBeCloseTo(90 / 95, 12);
    expect(formatPercent(at90.change)).toBe("5.3%");
    expect(formatPercent(liquidationPriceRatio(emode(93))!.change)).toBe("2.1%");
  });

  it("example C: liquidation when 1 USDC is worth 1/3,120 WETH, i.e. 1 WETH = 3,120 USDC", () => {
    const result = liquidationPriceRatio(EXAMPLE_C)!;
    expect(1 / result.ratio).toBeCloseTo(3120, 9);
    expect(formatRatio(1 / result.ratio)).toBe("3,120");
  });

  it("is null for two collaterals or two debts", () => {
    expect(liquidationPriceRatio(EXAMPLE_B)).toBeNull();
    expect(liquidationPriceRatio({ ...EXAMPLE_C, debt: [...EXAMPLE_C.debt, USDC_DEBT(1)] })).toBeNull();
    expect(liquidationPriceRatio({ ...EXAMPLE_C, debt: [{ amount: 0, price: 2400 }] })).toBeNull();
  });
});

// The article's threshold table and its data snapshot (block numbers, raw bps, E-Mode bitmaps) are the record of the
// on-chain reads; the presets must say the same thing.
const ARTICLE = readFileSync(new URL("../../content/blog/aave-liquidation-price.mdx", import.meta.url), "utf8");
const SNAPSHOT = readFileSync(
  new URL("../../content/blog/snapshots/aave-liquidation-price.md", import.meta.url),
  "utf8",
);

/** Rows of the article's "Aave V3 market | Asset | LTV | Liquidation threshold" table. */
const articleThresholdRows = () => {
  const lines = ARTICLE.slice(ARTICLE.indexOf("| Aave V3 market")).split("\n");
  const tableEnd = lines.findIndex(line => !line.startsWith("|"));
  return lines.slice(2, tableEnd).map(line => {
    const [market, asset, , threshold] = line
      .split("|")
      .slice(1, -1)
      .map(cell => cell.trim());
    return { market, asset, threshold };
  });
};

describe("liquidation threshold presets", () => {
  it("match the article's table, one preset per row, read on 14 Oct 2026", () => {
    expect(LIQUIDATION_THRESHOLDS_AS_OF).toBe("2026-10-14");
    const rows = articleThresholdRows();
    expect(rows).toHaveLength(LIQUIDATION_THRESHOLD_PRESETS.length);
    for (const preset of LIQUIDATION_THRESHOLD_PRESETS) {
      const row = preset.eMode
        ? rows.find(r => r.market === `${preset.market}, E-Mode "${preset.eMode!.category}"`)
        : rows.find(r => r.market === preset.market && r.asset === preset.label);
      expect(row, preset.id).toBeDefined();
      expect(row!.threshold, preset.id).toBe(`${preset.liquidationThresholdPercent}%`);
      if (preset.eMode) expect(row!.asset.split(/, | and /)).toEqual(preset.eMode.collateralSymbols);
    }
  });

  it("match the data snapshot: raw thresholds in bps, the blocks they were read at, and E-Mode's borrowable set", () => {
    for (const preset of LIQUIDATION_THRESHOLD_PRESETS) {
      expect(SNAPSHOT, preset.id).toContain(String(preset.block));
      expect(ARTICLE, preset.id).toContain(`block ${preset.block}`);
      const bps = preset.liquidationThresholdPercent * 100;
      if (preset.eMode) {
        expect(SNAPSHOT).toMatch(
          new RegExp(`\\(\\d+, ${bps}, \\d+\\) → LTV \\d+%, LT ${preset.liquidationThresholdPercent}%`),
        );
        expect(SNAPSHOT).toContain(`→ ${preset.eMode.borrowableSymbols.join(", ")} only`);
      } else {
        const asset = preset.symbol === "USDC" && preset.market === "Arbitrum" ? "USDC native" : preset.symbol;
        const row = SNAPSHOT.split("\n").find(
          line => line.startsWith(`| ${preset.market}`) && line.includes(`| ${asset} \``),
        );
        expect(row, preset.id).toBeDefined();
        expect(row!.split("|").map(cell => cell.trim())[4], preset.id).toBe(String(bps));
      }
    }
  });

  it("have unique ids that findLiquidationThresholdPreset resolves", () => {
    const ids = LIQUIDATION_THRESHOLD_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(findLiquidationThresholdPreset("arbitrum-weth")?.liquidationThresholdPercent).toBe(84);
    expect(findLiquidationThresholdPreset("nope")).toBeUndefined();
  });
});

describe("parseDecimalInput", () => {
  it.each([
    ["2400", 2400],
    [" 0.25 ", 0.25],
    [".5", 0.5],
    ["10.", 10],
    ["0", 0],
    ["12,000", 12_000],
    ["1,234,567.89", 1_234_567.89],
    ["$2,400.50", 2400.5],
    ["$ 81500", 81_500],
  ])("reads %j as %d", (input, value) => {
    expect(parseDecimalInput(input)).toEqual({ status: "valid", value });
  });

  it.each(["2,5", "1,23", "12,0000", "-5", "1e3", "abc", "1.2.3", ".", "Infinity", "0x10", "1 000"])(
    "rejects %j",
    input => {
      expect(parseDecimalInput(input)).toEqual({ status: "invalid" });
    },
  );

  it("reports empty input separately", () => {
    expect(parseDecimalInput("")).toEqual({ status: "empty" });
    expect(parseDecimalInput("  $ ")).toEqual({ status: "empty" });
  });
});

describe("formatting", () => {
  it("never shows a liquidatable health factor as 1.00, and treats float noise at 1 as exactly 1", () => {
    expect(formatHealthFactor(0.9999)).toBe("0.999");
    expect(formatHealthFactor(0.99999999)).toBe("0.999");
    expect(formatHealthFactor(1 - 1e-12)).toBe("1.00");
    expect(isLiquidatable(1 - 1e-12)).toBe(false);
    expect(formatHealthFactor(1.0004)).toBe("1.00");
    expect(formatHealthFactor(1.9996)).toBe("2.00");
    expect(formatHealthFactor(1234.5)).toBe("1,234.50");
    expect(formatHealthFactor(Infinity)).toBe("∞");
    expect(formatHealthFactor(0)).toBe("0.00");
  });

  it("formats USD with cents, and small prices with two to four significant digits", () => {
    expect(formatUsd(1445.783)).toBe("$1,445.78");
    expect(formatUsd(3120)).toBe("$3,120.00");
    expect(formatUsd(1)).toBe("$1.00");
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.5)).toBe("$0.50");
    expect(formatUsd(0.1)).toBe("$0.10");
    expect(formatUsd(0.24096)).toBe("$0.241");
    expect(formatUsd(0.769230769)).toBe("$0.7692");
    expect(formatUsd(0.9999)).toBe("$0.9999");
    // Rounds up to $1 at four significant digits, so it is shown in cents like any other dollar amount.
    expect(formatUsd(0.99995)).toBe("$1.00");
    expect(formatUsd(0.000012345)).toBe("$0.00001235");
  });

  it("formats percentages with one decimal, never 100.0% for a partial fall or 0.0% for a real move", () => {
    expect(formatPercent(-0.39759)).toBe("39.8%");
    expect(formatPercent(0.9994)).toBe("99.9%");
    expect(formatPercent(-0.9995)).toBe(">99.9%");
    expect(formatPercent(-0.999994)).toBe(">99.9%");
    expect(formatPercent(1)).toBe("100.0%");
    expect(formatPercent(1.5)).toBe("150.0%");
    expect(formatPercent(0.0005)).toBe("0.1%");
    expect(formatPercent(-0.0004)).toBe("<0.1%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});
