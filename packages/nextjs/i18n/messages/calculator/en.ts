import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Aave liquidation price calculator",
  intro:
    "Enter each collateral asset and your debt to get the health factor and the prices at which the position can be liquidated. It uses the Aave V3 formula: Σ(collateral value × liquidation threshold) ÷ debt value.",
  examplesLabel: "Load a worked example:",
  examples: {
    "one-collateral": "10 WETH, 12,000 USDC debt",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20,000 USDC debt",
    "volatile-debt": "10,000 USDC, 2.5 WETH borrowed",
  },
  defaultCollateralName: index => `Collateral ${index}`,
  defaultDebtName: "Debt asset",
  collateralLegend: index => `Collateral ${index}`,
  presetLabel: "Aave V3 asset (fills the threshold)",
  eModeHint: (collateral, borrowable) =>
    `Counts at this threshold for ${joinList("en", collateral)}; other collateral keeps its own. In this E-Mode you can borrow only ${joinList("en", borrowable)}.`,
  otherAsset: "Other asset: enter the threshold yourself",
  presetGroup: (market, date) => `${market} (read ${date})`,
  presetLabels: {},
  nameLabel: "Asset name",
  namePlaceholder: symbols => `e.g. ${symbols.join(" or ")}`,
  amountSupplied: "Amount supplied",
  price: "Price (USD)",
  priceHint: "Aave's oracle price, shown on the asset's page in the Aave app.",
  threshold: "Liquidation threshold (%)",
  thresholdHint: "In E-Mode, the category's threshold. On Aave V4, the collateral factor.",
  removeCollateral: index => `Remove collateral ${index}`,
  addCollateral: "Add a second collateral",
  debtLegend: "Debt",
  debtKindLegend: "What did you borrow?",
  debtKinds: { stable: "A stablecoin (counted at $1.00)", volatile: "A volatile asset, such as WETH" },
  debtAmount: { stable: "Amount borrowed (USD)", volatile: "Amount borrowed (tokens)" },
  debtAmountHint: "Include the interest accrued so far.",
  debtPrice: "Price of the borrowed asset (USD)",
  errors: {
    number: "Enter a number such as 10 or 0.25, with a dot for decimals.",
    price: "Enter a price above 0.",
    threshold: "Enter a percentage above 0 and at most 100.",
    samePrice: (name, price) =>
      `${name} is already entered above at ${price}. Use the same price: one asset has one price.`,
  },
  eModeLead: "No result: Aave does not allow this combination.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("en", borrowable);
    const loanText = loan.kind === "stable" ? "a stablecoin loan" : `borrowed ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `${market}’s “${category}” E-Mode only lets you borrow ${borrowableList}, so an account with ${loanText} ` +
      `cannot use its ${thresholdPercent}% threshold. Pick the collateral’s own threshold instead${own}, or borrow ${borrowableList}.`
    );
  },
  results: {
    heading: "Result",
    empty: "Enter a number in every field to see the result.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "No debt, so there is nothing to liquidate.",
    liquidatableNow: "Below 1.00: the position can be liquidated now.",
    liquidatableBelow: "The position can be liquidated below 1.00.",
    none: "None",
    priceTitle: name => `${name} liquidation price`,
    priceTitleBorrowed: name => `${name} liquidation price (borrowed)`,
    priceTitleShared: name => `${name} liquidation price (supplied and borrowed)`,
    recover: ({ name, change, now, rises, alike }) =>
      `The health factor gets back to 1.00 if ${name} ${rises ? "rises" : "falls"} ${change} from ${now}${
        alike ? ", supplied and borrowed alike" : ""
      }, other prices unchanged.`,
    collateralFall: ({ change, now }) => `${change} below ${now}, if every other price stays the same.`,
    collateralNone: name =>
      `Even at $0, ${name} alone cannot take the health factor below 1.00: the other collateral covers the debt.`,
    debtRise: ({ change, now }) => `${change} above ${now}: borrowed assets push the health factor down as they rise.`,
    sharedRise: ({ name, change, now }) =>
      `${change} above ${now}: you borrowed more ${name} than your ${name} collateral counts for, so a rise pushes the health factor down. Other prices unchanged.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} below ${now}, with the borrowed ${name} at the same price and every other price unchanged.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} below ${now} for every ${name} row, if every other price stays the same.`,
    bothSidesNeutral: name =>
      `${name} is both your collateral and your debt, so the two move together and its price does not change the health factor. Interest, a threshold change or your own transactions still do.`,
    bothSidesRecover: name =>
      `${name} is on both sides, so the two move together: no ${name} price alone brings the health factor back to 1.00.`,
    bothSidesSafe: name =>
      `${name} is on both sides, so the two move together: its price alone cannot take the health factor below 1.00.`,
    uniformTitle: "All collateral falls together",
    uniformDescription: prices =>
      `If every collateral price falls this much and the debt price does not move, the health factor reaches 1.00: ${prices
        .map(({ name, price }) => `${name} at ${price}`)
        .join(" and ")}.`,
    ratioTitle: (numerator, denominator) => `${numerator} ÷ ${denominator} price at liquidation`,
    ratioDescription: (now, change, falls) =>
      `Now ${now}. If both prices move, a ${change} ${falls ? "fall" : "rise"} in this ratio takes the health factor to 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Collateral ${collateral}, counted at its liquidation thresholds: ${weighted}. Health factor = ${weighted} ÷ ${debt} of debt = ${healthFactor}.`,
  },
  noscript:
    "The calculator needs JavaScript to recalculate. The result above is for 10 WETH at $2,400 (liquidation threshold 83%) against 12,000 USDC; the worked examples on this page use the same formula.",
  disclaimer: {
    lead: "Educational estimate, not financial advice.",
    beforeDate:
      "It uses only the numbers you enter. Live Aave parameters can change: the thresholds above were read on-chain on",
    afterDate:
      ", and governance or the Risk Stewards can change them at any time. Oracle prices move, interest keeps adding to your debt, and each liquidation price assumes every other price stays the same. Check your position in the Aave app before you act.",
  },
};
