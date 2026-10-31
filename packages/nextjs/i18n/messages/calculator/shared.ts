export type DebtLoan = { kind: "stable" } | { kind: "volatile"; name: string };

export type EModeConflictFields = {
  market: string;
  category: string;
  /** The assets the category can borrow, as a list item array. */
  borrowable: readonly string[];
  loan: DebtLoan;
  thresholdPercent: number;
  /** "Ethereum Core WETH: 83%" entries, the collateral's own thresholds; may be empty. */
  ownThresholds: readonly string[];
};

export type PriceMove = {
  name: string;
  /** formatPercent of the move. */
  change: string;
  /** The current price, formatted. */
  now: string;
};

export type CalculatorMessages = {
  title: string;
  intro: string;
  examplesLabel: string;
  /** The worked examples' button labels, by example id. */
  examples: Record<"one-collateral" | "two-collaterals" | "volatile-debt", string>;
  defaultCollateralName: (index: number) => string;
  defaultDebtName: string;
  collateralLegend: (index: number) => string;
  presetLabel: string;
  eModeHint: (collateral: readonly string[], borrowable: readonly string[]) => string;
  otherAsset: string;
  /** An optgroup: the market and the day its thresholds were read. */
  presetGroup: (market: string, date: string) => string;
  /** Overrides of a preset's English label (liquidationMath), by preset id. */
  presetLabels: Partial<Record<string, string>>;
  nameLabel: string;
  namePlaceholder: (symbols: readonly string[]) => string;
  amountSupplied: string;
  price: string;
  priceHint: string;
  threshold: string;
  thresholdHint: string;
  removeCollateral: (index: number) => string;
  addCollateral: string;
  debtLegend: string;
  debtKindLegend: string;
  debtKinds: Record<"stable" | "volatile", string>;
  debtAmount: Record<"stable" | "volatile", string>;
  debtAmountHint: string;
  debtPrice: string;
  errors: {
    number: string;
    price: string;
    threshold: string;
    samePrice: (name: string, price: string) => string;
  };
  eModeLead: string;
  eModeConflict: (fields: EModeConflictFields) => string;
  results: {
    heading: string;
    empty: string;
    /** One result line for the screen-reader summary. */
    summaryLine: (title: string, value: string) => string;
    healthFactor: string;
    noDebt: string;
    liquidatableNow: string;
    liquidatableBelow: string;
    none: string;
    priceTitle: (name: string) => string;
    priceTitleBorrowed: (name: string) => string;
    priceTitleShared: (name: string) => string;
    /** The move that brings a liquidatable position back to 1.00; `alike` when supplied and borrowed rows move. */
    recover: (move: PriceMove & { rises: boolean; alike?: boolean }) => string;
    collateralFall: (move: PriceMove) => string;
    collateralNone: (name: string) => string;
    debtRise: (move: PriceMove) => string;
    sharedRise: (move: PriceMove) => string;
    sharedFallBorrowed: (move: PriceMove) => string;
    sharedFallRows: (move: PriceMove) => string;
    bothSidesNeutral: (name: string) => string;
    bothSidesRecover: (name: string) => string;
    bothSidesSafe: (name: string) => string;
    uniformTitle: string;
    uniformDescription: (prices: readonly { name: string; price: string }[]) => string;
    ratioTitle: (numerator: string, denominator: string) => string;
    ratioDescription: (now: string, change: string, falls: boolean) => string;
    breakdown: (fields: { collateral: string; weighted: string; debt: string; healthFactor: string }) => string;
  };
  noscript: string;
  disclaimer: {
    lead: string;
    /** The words before the thresholds' date. */
    beforeDate: string;
    afterDate: string;
  };
};
