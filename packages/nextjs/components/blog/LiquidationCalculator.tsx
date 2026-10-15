"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import {
  LIQUIDATION_THRESHOLDS_AS_OF,
  LIQUIDATION_THRESHOLD_PRESETS,
  type Position,
  type SharedAsset,
  assetNameKey,
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

type DebtKind = "stable" | "volatile";

type CollateralFields = {
  /** Selected threshold preset, or "" for a threshold typed by hand. */
  presetId: string;
  name: string;
  amount: string;
  price: string;
  threshold: string;
};

type DebtFields = {
  kind: DebtKind;
  name: string;
  amount: string;
  /** Only used for volatile debt; a stablecoin counts at $1.00. */
  price: string;
};

type CalculatorFields = {
  collateral: CollateralFields[];
  debt: DebtFields;
};

type CheckedNumber = { value: number | null; error: string | null };

type ResultCard = {
  key: string;
  title: string;
  value: string;
  description: string;
  danger?: boolean;
};

const STABLE_DEBT_PRICE = 1;
const MAX_NAME_LENGTH = 24;
const ANNOUNCE_DELAY_MS = 600;
const PRESET_MARKETS = ["Ethereum Core", "Arbitrum"] as const;
const DEFAULT_COLLATERAL_NAMES = ["Collateral 1", "Collateral 2"];
const DEFAULT_DEBT_NAME = "Debt asset";
const THRESHOLDS_DATE = formatPostDate(LIQUIDATION_THRESHOLDS_AS_OF);
// Decimals kept when switching the debt between a USD amount and a token amount.
const USD_INPUT_DECIMALS = 2;
const TOKEN_INPUT_DECIMALS = 8;

const E_MODE_ISSUE_LEAD = "No result: Aave does not allow this combination.";

const LIST_FORMAT = new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" });

const presetCollateral = (presetId: string, amount: string, price: string): CollateralFields => {
  const preset = findLiquidationThresholdPreset(presetId);
  return {
    presetId,
    name: preset?.symbol ?? "",
    amount,
    price,
    threshold: preset ? String(preset.liquidationThresholdPercent) : "",
  };
};

const EMPTY_COLLATERAL: CollateralFields = { presetId: "", name: "", amount: "", price: "", threshold: "" };

/** The worked examples of the aave-liquidation-price article (fact sheet §2 examples A, B and C). */
const CALCULATOR_EXAMPLES: readonly { id: string; label: string; fields: CalculatorFields }[] = [
  {
    id: "one-collateral",
    label: "10 WETH, 12,000 USDC debt",
    fields: {
      collateral: [presetCollateral("ethereum-core-weth", "10", "2400")],
      debt: { kind: "stable", name: "USDC", amount: "12000", price: "" },
    },
  },
  {
    id: "two-collaterals",
    label: "10 WETH + 0.2 WBTC, 20,000 USDC debt",
    fields: {
      collateral: [
        presetCollateral("ethereum-core-weth", "10", "2400"),
        presetCollateral("ethereum-core-wbtc", "0.2", "81500"),
      ],
      debt: { kind: "stable", name: "USDC", amount: "20000", price: "" },
    },
  },
  {
    id: "volatile-debt",
    label: "10,000 USDC, 2.5 WETH borrowed",
    fields: {
      collateral: [presetCollateral("ethereum-core-usdc", "10000", "1")],
      debt: { kind: "volatile", name: "WETH", amount: "2.5", price: "2400" },
    },
  },
];

const INITIAL_FIELDS = CALCULATOR_EXAMPLES[0].fields;

const NUMBER_ERROR = "Enter a number such as 10 or 0.25, with a dot for decimals.";

const checkAmount = (text: string): CheckedNumber => {
  const parsed = parseDecimalInput(text);
  if (parsed.status === "empty") return { value: null, error: null };
  if (parsed.status === "invalid") return { value: null, error: NUMBER_ERROR };
  return { value: parsed.value, error: null };
};

const checkPrice = (text: string): CheckedNumber => {
  const checked = checkAmount(text);
  return checked.value === 0 ? { value: null, error: "Enter a price above 0." } : checked;
};

const checkThreshold = (text: string): CheckedNumber => {
  const checked = checkAmount(text);
  return checked.value !== null && (checked.value <= 0 || checked.value > 100)
    ? { value: null, error: "Enter a percentage above 0 and at most 100." }
    : checked;
};

const displayName = (name: string, fallback: string) => name.trim() || fallback;

/** A number written back into an input: plain digits, at most `decimals` of them, no trailing zeros ("6000", "2.5"). */
const toInputText = (value: number, decimals: number) =>
  value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");

/**
 * Rows that name the same asset share one price, so they are priced and solved together: WETH supplied and WETH
 * borrowed move as one. Unnamed rows stand alone. Stablecoin debt is counted at $1.00 and has no price to share.
 * Ordered by first appearance, collateral before debt.
 */
const sharedAssets = (fields: CalculatorFields): SharedAsset[] => {
  const byName = new Map<string, { collateral: number[]; debt: number[] }>();
  const subjects: { collateral: number[]; debt: number[] }[] = [];
  const subjectFor = (name: string) => {
    const key = assetNameKey(name);
    const existing = key ? byName.get(key) : undefined;
    if (existing) return existing;
    const subject = { collateral: [] as number[], debt: [] as number[] };
    if (key) byName.set(key, subject);
    subjects.push(subject);
    return subject;
  };
  fields.collateral.forEach((asset, index) => subjectFor(asset.name).collateral.push(index));
  if (fields.debt.kind === "volatile") subjectFor(fields.debt.name).debt.push(0);
  return subjects;
};

/**
 * Why the position cannot exist when a collateral preset puts the account in an E-Mode category whose borrowable set
 * does not include the debt (Ethereum Core "ETH correlated" lends only WETH). Null when nothing conflicts: no E-Mode
 * preset, no debt, or a volatile debt that is borrowable or unnamed.
 */
const eModeConflict = (fields: CalculatorFields) => {
  const preset = fields.collateral.map(asset => findLiquidationThresholdPreset(asset.presetId)).find(p => p?.eMode);
  if (!preset?.eMode) return null;
  const { category, collateralSymbols, borrowableSymbols } = preset.eMode;
  const amount = parseDecimalInput(fields.debt.amount);
  if (amount.status === "valid" && amount.value === 0) return null;
  const debtKey = assetNameKey(fields.debt.name);
  const borrowable = borrowableSymbols.map(assetNameKey);
  if (fields.debt.kind === "volatile" && (!debtKey || borrowable.includes(debtKey))) return null;

  const borrowableList = LIST_FORMAT.format(borrowableSymbols);
  const ownThresholds = LIQUIDATION_THRESHOLD_PRESETS.filter(
    p => p.market === preset.market && !p.eMode && p.symbol && collateralSymbols.includes(p.symbol),
  )
    .map(p => `${p.market} ${p.label}: ${p.liquidationThresholdPercent}%`)
    .join(", ");
  const loan = fields.debt.kind === "stable" ? "a stablecoin loan" : `borrowed ${fields.debt.name.trim()}`;
  return (
    `${preset.market}’s “${category}” E-Mode only lets you borrow ${borrowableList}, so an account with ${loan} ` +
    `cannot use its ${preset.liquidationThresholdPercent}% threshold. Pick the collateral’s own threshold instead` +
    `${ownThresholds ? ` (${ownThresholds})` : ""}, or borrow ${borrowableList}.`
  );
};

/** One field per input: a visible label, an optional hint and an error, all tied to the control for screen readers. */
const NumberField = ({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint?: string;
  placeholder?: string;
}) => {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-base-content">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`input w-full tabular-nums dark:bg-white/5 ${error ? "input-error" : ""}`}
      />
      {hint && (
        <p id={`${id}-hint`} className="m-0 text-xs text-base-content/75 dark:text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="m-0 text-xs font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
};

const NameField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm font-medium text-base-content">
      {label}
    </label>
    <input
      id={id}
      type="text"
      autoComplete="off"
      maxLength={MAX_NAME_LENGTH}
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
      className="input w-full dark:bg-white/5"
    />
  </div>
);

/** The liquidation price card of one asset, which may be in several rows (collateral, debt or both). */
const priceCard = (
  position: Position,
  subject: SharedAsset,
  name: string,
  liquidatable: boolean,
): ResultCard | null => {
  const key = `price-${subject.collateral.map(i => `c${i}`).join("")}${subject.debt.map(i => `d${i}`).join("")}`;
  const [collateralIndex] = subject.collateral;
  const isShared = subject.collateral.length + subject.debt.length > 1;

  if (!isShared && collateralIndex !== undefined) {
    const asset = position.collateral[collateralIndex];
    const result = collateralLiquidationPrice(position, collateralIndex);
    const now = formatUsd(asset.price);
    return result
      ? {
          key,
          title: `${name} liquidation price`,
          value: formatUsd(result.price),
          description: liquidatable
            ? `The health factor gets back to 1.00 if ${name} rises ${formatPercent(result.change)} from ${now}, other prices unchanged.`
            : `${formatPercent(result.change)} below ${now}, if every other price stays the same.`,
        }
      : {
          key,
          title: `${name} liquidation price`,
          value: "None",
          description: `Even at $0, ${name} alone cannot take the health factor below 1.00: the other collateral covers the debt.`,
        };
  }

  if (!isShared) {
    const debt = position.debt[subject.debt[0]];
    const result = debtLiquidationPrice(position, subject.debt[0]);
    if (!result) return null;
    const now = formatUsd(debt.price);
    return {
      key,
      title: `${name} liquidation price (borrowed)`,
      value: formatUsd(result.price),
      description: liquidatable
        ? `The health factor gets back to 1.00 if ${name} falls ${formatPercent(result.change)} from ${now}, other prices unchanged.`
        : `${formatPercent(result.change)} above ${now}: borrowed assets push the health factor down as they rise.`,
    };
  }

  // The same asset in several rows: one price moves all of them.
  const borrowed = subject.debt.length > 0;
  const title = `${name} liquidation price${borrowed ? " (supplied and borrowed)" : ""}`;
  const result = sharedAssetLiquidationPrice(position, subject);
  const currentPrice =
    collateralIndex !== undefined ? position.collateral[collateralIndex].price : position.debt[subject.debt[0]].price;
  const now = formatUsd(currentPrice);
  if (result) {
    const direction = result.change > 0 ? "rises" : "falls";
    let description: string;
    if (liquidatable) {
      description = `The health factor gets back to 1.00 if ${name} ${direction} ${formatPercent(result.change)} from ${now}${
        borrowed ? ", supplied and borrowed alike" : ""
      }, other prices unchanged.`;
    } else if (result.change > 0) {
      description = `${formatPercent(result.change)} above ${now}: you borrowed more ${name} than your ${name} collateral counts for, so a rise pushes the health factor down. Other prices unchanged.`;
    } else {
      description = borrowed
        ? `${formatPercent(result.change)} below ${now}, with the borrowed ${name} at the same price and every other price unchanged.`
        : `${formatPercent(result.change)} below ${now} for every ${name} row, if every other price stays the same.`;
    }
    return { key, title, value: formatUsd(result.price), description };
  }

  let description: string;
  if (!borrowed) {
    description = `Even at $0, ${name} alone cannot take the health factor below 1.00: the other collateral covers the debt.`;
  } else if (
    subject.collateral.length === position.collateral.filter(asset => asset.amount > 0).length &&
    subject.debt.length === position.debt.filter(debt => debt.amount > 0).length
  ) {
    description = `${name} is both your collateral and your debt, so the two move together and its price does not change the health factor. Interest, a threshold change or your own transactions still do.`;
  } else {
    description = liquidatable
      ? `${name} is on both sides, so the two move together: no ${name} price alone brings the health factor back to 1.00.`
      : `${name} is on both sides, so the two move together: its price alone cannot take the health factor below 1.00.`;
  }
  return { key, title, value: "None", description };
};

const buildResults = (
  position: Position,
  subjects: SharedAsset[],
  collateralNames: string[],
  debtName: string,
): { cards: ResultCard[]; breakdown: string | null } => {
  const hf = healthFactor(position);
  const liquidatable = isLiquidatable(hf);
  const cards: ResultCard[] = [
    {
      key: "hf",
      title: "Health factor",
      value: formatHealthFactor(hf),
      description: !Number.isFinite(hf)
        ? "No debt, so there is nothing to liquidate."
        : liquidatable
          ? "Below 1.00: the position can be liquidated now."
          : "The position can be liquidated below 1.00.",
      danger: liquidatable,
    },
  ];
  if (!Number.isFinite(hf)) return { cards, breakdown: null };

  // Rows with nothing in them have no price that matters.
  const activeSubjects = subjects
    .map(subject => ({
      collateral: subject.collateral.filter(index => position.collateral[index].amount > 0),
      debt: subject.debt.filter(index => position.debt[index].amount > 0),
    }))
    .filter(subject => subject.collateral.length + subject.debt.length > 0);
  const subjectName = (subject: SharedAsset) =>
    subject.collateral.length > 0 ? collateralNames[subject.collateral[0]] : debtName;
  const addPriceCard = (subject: SharedAsset) => {
    const card = priceCard(position, subject, subjectName(subject), liquidatable);
    if (card) cards.push(card);
  };
  const debtIsAlsoCollateral = activeSubjects.some(s => s.collateral.length > 0 && s.debt.length > 0);

  activeSubjects.filter(s => s.collateral.length > 0).forEach(addPriceCard);

  // Not when the debt is also collateral: that part of the debt would fall with it.
  const fall = uniformCollateralFall(position);
  if (position.collateral.length > 1 && fall !== null && !liquidatable && !debtIsAlsoCollateral) {
    const prices = position.collateral
      .map((asset, index) => `${collateralNames[index]} at ${formatUsd(asset.price * (1 - fall))}`)
      .join(" and ");
    cards.push({
      key: "uniform",
      title: "All collateral falls together",
      value: formatPercent(fall),
      description: `If every collateral price falls this much and the debt price does not move, the health factor reaches 1.00: ${prices}.`,
    });
  }

  activeSubjects.filter(s => s.collateral.length === 0).forEach(addPriceCard);

  const ratio = liquidationPriceRatio(position);
  if (ratio && !liquidatable && !debtIsAlsoCollateral && subjects.some(s => s.debt.length > 0)) {
    const [collateral] = position.collateral;
    const [debt] = position.debt;
    const collateralName = collateralNames[0];
    const currentRatio = collateral.price / debt.price;
    // Show whichever way round reads as a number above 1, e.g. "WETH ÷ USDC: 3,120" rather than 0.00032.
    cards.push(
      currentRatio >= 1
        ? {
            key: "ratio",
            title: `${collateralName} ÷ ${debtName} price at liquidation`,
            value: formatRatio(ratio.ratio),
            description: `Now ${formatRatio(currentRatio)}. If both prices move, a ${formatPercent(ratio.change)} fall in this ratio takes the health factor to 1.00.`,
          }
        : {
            key: "ratio",
            title: `${debtName} ÷ ${collateralName} price at liquidation`,
            value: formatRatio(1 / ratio.ratio),
            description: `Now ${formatRatio(1 / currentRatio)}. If both prices move, a ${formatPercent(1 / (1 + ratio.change) - 1)} rise in this ratio takes the health factor to 1.00.`,
          },
    );
  }

  const breakdown = `Collateral ${formatUsd(totalCollateralValue(position))}, counted at its liquidation thresholds: ${formatUsd(
    weightedCollateralValue(position),
  )}. Health factor = ${formatUsd(weightedCollateralValue(position))} ÷ ${formatUsd(totalDebtValue(position))} of debt = ${formatHealthFactor(hf)}.`;
  return { cards, breakdown };
};

/**
 * Health factor and liquidation price calculator for one or two collateral assets against stablecoin or volatile debt.
 * It renders on the server with the first worked example filled in, so the page shows a full result before (or
 * without) JavaScript; the inputs only start recalculating after hydration.
 */
export const LiquidationCalculator = () => {
  const baseId = useId();
  const id = (suffix: string) => `${baseId}-${suffix}`;
  const [fields, setFields] = useState<CalculatorFields>(INITIAL_FIELDS);
  const focusAfterRender = useRef<string | null>(null);

  useEffect(() => {
    if (!focusAfterRender.current) return;
    document.getElementById(focusAfterRender.current)?.focus();
    focusAfterRender.current = null;
  });

  const updateCollateral = (index: number, patch: Partial<CollateralFields>) =>
    setFields(current => ({
      ...current,
      collateral: current.collateral.map((asset, i) => (i === index ? { ...asset, ...patch } : asset)),
    }));

  const updateDebt = (patch: Partial<DebtFields>) =>
    setFields(current => ({ ...current, debt: { ...current.debt, ...patch } }));

  const selectPreset = (index: number, presetId: string) => {
    const preset = findLiquidationThresholdPreset(presetId);
    if (!preset) {
      updateCollateral(index, { presetId: "" });
      return;
    }
    const asset = fields.collateral[index];
    // A preset covering several assets (E-Mode) clears a name the previous preset filled in, so "WETH" does not stay
    // on what may be wstETH; a name typed by hand stays.
    const filledName = findLiquidationThresholdPreset(asset.presetId)?.symbol;
    const name = preset.symbol ?? (filledName && asset.name.trim() === filledName ? "" : asset.name);
    updateCollateral(index, { presetId, threshold: String(preset.liquidationThresholdPercent), name });
  };

  // A typed threshold that no longer matches the preset turns the select back to "Other".
  const changeThreshold = (index: number, threshold: string) => {
    const preset = findLiquidationThresholdPreset(fields.collateral[index].presetId);
    const parsed = parseDecimalInput(threshold);
    const stillPreset = preset && parsed.status === "valid" && parsed.value === preset.liquidationThresholdPercent;
    updateCollateral(index, { threshold, presetId: stillPreset ? preset.id : "" });
  };

  const addCollateral = () => {
    focusAfterRender.current = id("collateral-1-preset");
    setFields(current => ({ ...current, collateral: [current.collateral[0], EMPTY_COLLATERAL] }));
  };

  const removeCollateral = () => {
    focusAfterRender.current = id("add-collateral");
    setFields(current => ({ ...current, collateral: [current.collateral[0]] }));
  };

  // The amount changes unit with the kind (USD for a stablecoin, tokens otherwise), so convert it at the entered price;
  // without a price there is nothing to convert with, and a stale number would be read in the wrong unit.
  const changeDebtKind = (kind: DebtKind) =>
    setFields(current => {
      if (current.debt.kind === kind) return current;
      const amount = parseDecimalInput(current.debt.amount);
      const price = checkPrice(current.debt.price).value;
      let converted = "";
      if (amount.status === "valid" && price !== null) {
        converted =
          kind === "stable"
            ? toInputText(amount.value * price, USD_INPUT_DECIMALS)
            : toInputText(amount.value / price, TOKEN_INPUT_DECIMALS);
      }
      // The name described the other kind of asset ("WETH" is not a stablecoin).
      return { ...current, debt: { ...current.debt, kind, name: "", amount: converted } };
    });

  const collateralNames = fields.collateral.map((asset, index) =>
    displayName(asset.name, DEFAULT_COLLATERAL_NAMES[index]),
  );
  const debtName = displayName(fields.debt.name, DEFAULT_DEBT_NAME);
  const subjects = sharedAssets(fields);

  // One asset has one price: a row naming an asset entered in an earlier collateral row must repeat that row's price.
  const collateralPrices = fields.collateral.map(asset => checkPrice(asset.price));
  const matchEarlierPrice = (checked: CheckedNumber, rows: SharedAsset, isFirstRow: boolean): CheckedNumber => {
    const [firstIndex] = rows.collateral;
    if (isFirstRow || firstIndex === undefined) return checked;
    const first = collateralPrices[firstIndex].value;
    if (first === null || checked.value === null || checked.value === first) return checked;
    return {
      value: null,
      error: `${collateralNames[firstIndex]} is already entered above at ${formatUsd(first)}. Use the same price: one asset has one price.`,
    };
  };
  const checkedCollateral = fields.collateral.map((asset, index) => {
    const rows = subjects.find(subject => subject.collateral.includes(index))!;
    return {
      amount: checkAmount(asset.amount),
      price: matchEarlierPrice(collateralPrices[index], rows, rows.collateral[0] === index),
      threshold: checkThreshold(asset.threshold),
    };
  });
  const checkedDebt = {
    amount: checkAmount(fields.debt.amount),
    price:
      fields.debt.kind === "stable"
        ? { value: STABLE_DEBT_PRICE, error: null }
        : matchEarlierPrice(checkPrice(fields.debt.price), subjects.find(subject => subject.debt.length > 0)!, false),
  };
  const eModeIssue = eModeConflict(fields);

  let position: Position | null = null;
  const debtAmount = checkedDebt.amount.value;
  const debtPrice = checkedDebt.price.value;
  const collateral = checkedCollateral.flatMap(({ amount, price, threshold }) =>
    amount.value === null || price.value === null || threshold.value === null
      ? []
      : [{ amount: amount.value, price: price.value, liquidationThreshold: threshold.value / 100 }],
  );
  if (collateral.length === checkedCollateral.length && debtAmount !== null && debtPrice !== null) {
    position = { collateral, debt: [{ amount: debtAmount, price: debtPrice }] };
  }

  const results = position && !eModeIssue ? buildResults(position, subjects, collateralNames, debtName) : null;
  const summary =
    (eModeIssue && `${E_MODE_ISSUE_LEAD} ${eModeIssue}`) ||
    (results
      ? results.cards.map(card => `${card.title}: ${card.value}.`).join(" ")
      : "Enter a number in every field to see the result.");

  // Screen readers hear the result once typing pauses, not after every keystroke.
  const [announcement, setAnnouncement] = useState(summary);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(summary), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [summary]);

  const headingId = id("heading");
  const resultsHeadingId = id("results-heading");
  const eModeIssueId = id("emode-issue");

  return (
    <section
      aria-labelledby={headingId}
      className="card my-8 border border-indigo-200 bg-indigo-50/50 dark:border-indigo-400/30 dark:bg-indigo-500/5"
    >
      <div className="card-body gap-4 p-4 sm:p-6">
        <h3 id={headingId} className="card-title m-0 text-xl font-semibold leading-snug text-base-content">
          Aave liquidation price calculator
        </h3>
        <p className="m-0 text-sm leading-relaxed text-base-content/90 dark:text-gray-200">
          Enter each collateral asset and your debt to get the health factor and the prices at which the position can be
          liquidated. It uses the Aave V3 formula: Σ(collateral value × liquidation threshold) ÷ debt value.
        </p>

        <div role="group" aria-labelledby={id("examples-label")} className="flex flex-wrap items-center gap-2">
          <span id={id("examples-label")} className="text-sm font-medium text-base-content">
            Load a worked example:
          </span>
          {CALCULATOR_EXAMPLES.map(example => (
            <button
              key={example.id}
              type="button"
              className="btn btn-outline btn-sm rounded-full"
              onClick={() => setFields(example.fields)}
            >
              {example.label}
            </button>
          ))}
        </div>

        <form noValidate onSubmit={event => event.preventDefault()} className="flex flex-col gap-4">
          {fields.collateral.map((asset, index) => {
            const eMode = findLiquidationThresholdPreset(asset.presetId)?.eMode;
            const presetId = id(`collateral-${index}-preset`);
            const presetDescribedBy = [eMode ? `${presetId}-hint` : null, eMode && eModeIssue ? eModeIssueId : null]
              .filter(Boolean)
              .join(" ");
            return (
              <fieldset
                key={index}
                className="fieldset gap-3 rounded-box border border-base-300 bg-base-100 p-4 text-sm dark:border-white/10 dark:bg-gray-900/60"
              >
                <legend className="fieldset-legend px-1 text-base">{`Collateral ${index + 1}`}</legend>
                <div className="flex flex-col gap-1">
                  <label htmlFor={presetId} className="text-sm font-medium text-base-content">
                    Aave V3 asset (fills the threshold)
                  </label>
                  <select
                    id={presetId}
                    className="select w-full dark:bg-white/5"
                    value={asset.presetId}
                    onChange={event => selectPreset(index, event.target.value)}
                    aria-describedby={presetDescribedBy || undefined}
                  >
                    <option value="">Other asset: enter the threshold yourself</option>
                    {PRESET_MARKETS.map(market => (
                      <optgroup key={market} label={`${market} (read ${THRESHOLDS_DATE})`}>
                        {LIQUIDATION_THRESHOLD_PRESETS.filter(preset => preset.market === market).map(preset => (
                          <option key={preset.id} value={preset.id}>
                            {`${market} ${preset.label}: ${preset.liquidationThresholdPercent}%`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {eMode && (
                    <p id={`${presetId}-hint`} className="m-0 text-xs text-base-content/75 dark:text-gray-400">
                      {`Counts at this threshold for ${LIST_FORMAT.format(eMode.collateralSymbols)}; other collateral keeps its own. In this E-Mode you can borrow only ${LIST_FORMAT.format(eMode.borrowableSymbols)}.`}
                    </p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NameField
                    id={id(`collateral-${index}-name`)}
                    label="Asset name (optional)"
                    value={asset.name}
                    onChange={name => updateCollateral(index, { name })}
                    placeholder={eMode ? `e.g. ${eMode.collateralSymbols.slice(0, 2).join(" or ")}` : undefined}
                  />
                  <NumberField
                    id={id(`collateral-${index}-amount`)}
                    label="Amount supplied"
                    placeholder="10"
                    value={asset.amount}
                    onChange={amount => updateCollateral(index, { amount })}
                    error={checkedCollateral[index].amount.error}
                  />
                  <NumberField
                    id={id(`collateral-${index}-price`)}
                    label="Price (USD)"
                    placeholder="2400"
                    value={asset.price}
                    onChange={price => updateCollateral(index, { price })}
                    error={checkedCollateral[index].price.error}
                    hint="Aave's oracle price, shown on the asset's page in the Aave app."
                  />
                  <NumberField
                    id={id(`collateral-${index}-threshold`)}
                    label="Liquidation threshold (%)"
                    placeholder="83"
                    value={asset.threshold}
                    onChange={threshold => changeThreshold(index, threshold)}
                    error={checkedCollateral[index].threshold.error}
                    hint="In E-Mode, the category's threshold. On Aave V4, the collateral factor."
                  />
                </div>
                {index === 1 && (
                  <button type="button" className="btn btn-ghost btn-sm justify-self-start" onClick={removeCollateral}>
                    Remove collateral 2
                  </button>
                )}
              </fieldset>
            );
          })}

          {fields.collateral.length === 1 && (
            <button
              id={id("add-collateral")}
              type="button"
              className="btn btn-outline btn-sm self-start rounded-full"
              onClick={addCollateral}
            >
              Add a second collateral
            </button>
          )}

          <fieldset className="fieldset gap-3 rounded-box border border-base-300 bg-base-100 p-4 text-sm dark:border-white/10 dark:bg-gray-900/60">
            <legend className="fieldset-legend px-1 text-base">Debt</legend>
            <fieldset className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <legend className="mb-2 text-sm font-medium text-base-content">What did you borrow?</legend>
              {(
                [
                  ["stable", "A stablecoin (counted at $1.00)"],
                  ["volatile", "A volatile asset, such as WETH"],
                ] as const
              ).map(([kind, label]) => (
                <label key={kind} className="flex cursor-pointer items-center gap-2 text-sm text-base-content">
                  <input
                    type="radio"
                    name={id("debt-kind")}
                    value={kind}
                    checked={fields.debt.kind === kind}
                    onChange={() => changeDebtKind(kind)}
                    className="radio radio-sm"
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <NameField
                id={id("debt-name")}
                label="Asset name (optional)"
                value={fields.debt.name}
                onChange={name => updateDebt({ name })}
              />
              <NumberField
                id={id("debt-amount")}
                label={fields.debt.kind === "stable" ? "Amount borrowed (USD)" : "Amount borrowed (tokens)"}
                placeholder={fields.debt.kind === "stable" ? "12000" : "2.5"}
                value={fields.debt.amount}
                onChange={amount => updateDebt({ amount })}
                error={checkedDebt.amount.error}
                hint="Include the interest accrued so far."
              />
              {fields.debt.kind === "volatile" && (
                <NumberField
                  id={id("debt-price")}
                  label="Price of the borrowed asset (USD)"
                  placeholder="2400"
                  value={fields.debt.price}
                  onChange={price => updateDebt({ price })}
                  error={checkedDebt.price.error}
                />
              )}
            </div>
          </fieldset>
        </form>

        <section
          aria-labelledby={resultsHeadingId}
          className="rounded-box border border-base-300 bg-base-100 p-4 dark:border-white/10 dark:bg-gray-900/60"
        >
          <h4 id={resultsHeadingId} className="m-0 mb-3 text-lg font-semibold leading-snug text-base-content">
            Result
          </h4>
          <p role="status" className="sr-only">
            {announcement}
          </p>
          {eModeIssue ? (
            <div
              id={eModeIssueId}
              className="alert m-0 items-start rounded-box border-amber-300 bg-amber-50 text-sm leading-relaxed text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-50"
            >
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="m-0">
                <span className="font-semibold">{E_MODE_ISSUE_LEAD}</span> {eModeIssue}
              </p>
            </div>
          ) : results ? (
            <>
              <dl className="stats stats-vertical m-0 w-full rounded-box border border-base-300 dark:border-white/10">
                {results.cards.map(card => (
                  <div key={card.key} className={`stat px-4 py-3 ${card.danger ? "bg-red-50 dark:bg-red-500/10" : ""}`}>
                    <dt className="stat-title whitespace-normal text-sm text-base-content/80 dark:text-gray-300">
                      {card.title}
                    </dt>
                    <dd
                      className={`stat-value m-0 text-2xl tabular-nums ${
                        card.danger ? "text-red-700 dark:text-red-300" : "text-base-content"
                      }`}
                    >
                      {card.value}
                    </dd>
                    <dd className="stat-desc m-0 whitespace-normal text-xs leading-relaxed text-base-content/75 dark:text-gray-400">
                      {card.description}
                    </dd>
                  </div>
                ))}
              </dl>
              {results.breakdown && (
                <p className="mb-0 mt-3 text-xs leading-relaxed text-base-content/75 dark:text-gray-400">
                  {results.breakdown}
                </p>
              )}
            </>
          ) : (
            <p className="m-0 text-sm text-base-content/80 dark:text-gray-300">
              Enter a number in every field to see the result.
            </p>
          )}
        </section>

        <noscript>
          <p className="m-0 text-sm text-base-content/80 dark:text-gray-300">
            The calculator needs JavaScript to recalculate. The result above is for 10 WETH at $2,400 (liquidation
            threshold 83%) against 12,000 USDC; the worked examples on this page use the same formula.
          </p>
        </noscript>

        <p className="m-0 text-xs leading-relaxed text-base-content/75 dark:text-gray-400">
          <strong className="font-semibold text-base-content">Educational estimate, not financial advice.</strong> It
          uses only the numbers you enter. Live Aave parameters can change: the thresholds above were read on-chain on{" "}
          <time dateTime={LIQUIDATION_THRESHOLDS_AS_OF}>{THRESHOLDS_DATE}</time>, and governance or the Risk Stewards
          can change them at any time. Oracle prices move, interest keeps adding to your debt, and each liquidation
          price assumes every other price stays the same. Check your position in the Aave app before you act.
        </p>
      </div>
    </section>
  );
};
