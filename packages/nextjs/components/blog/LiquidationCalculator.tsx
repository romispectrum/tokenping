"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import { Alert } from "~~/components/ui/Alert";
import { Button } from "~~/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/Card";
import { Field } from "~~/components/ui/Field";
import { Input } from "~~/components/ui/Input";
import { Select } from "~~/components/ui/Select";
import { cx } from "~~/components/ui/classNames";
import { useLocale } from "~~/i18n/LocaleProvider";
import { CALCULATOR_MESSAGES } from "~~/i18n/messages/blog";
import {
  LIQUIDATION_THRESHOLDS_AS_OF,
  LIQUIDATION_THRESHOLD_PRESETS,
  type LiquidationThresholdPreset,
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

type Messages = (typeof CALCULATOR_MESSAGES)["en"];
type ResultMessages = Messages["results"];

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
// Decimals kept when switching the debt between a USD amount and a token amount.
const USD_INPUT_DECIMALS = 2;
const TOKEN_INPUT_DECIMALS = 8;

const DEBT_KINDS = ["stable", "volatile"] as const;

// Product UI inside an article: flat, no marketing effects. Each group of fields is an inner panel of the card (never
// a card in a card); the floated legend sits inside the panel instead of on its top edge.
const PANEL_CLASS_NAME = "min-w-0 rounded-xl bg-muted p-4 sm:p-5";
// The longest example label is wider than a 320px screen's card, so these buttons wrap onto a second line instead
// of being clipped by the card. Button is nowrap and 32px tall, hence the overrides.
const EXAMPLE_BUTTON_CLASS_NAME = "h-auto min-h-8 max-w-full whitespace-normal! py-1.5 text-left leading-snug";
const LEGEND_CLASS_NAME = "float-left mb-4 w-full text-base leading-snug font-medium text-foreground";
// A 20px native radio on the field boundary; checked is the link colour (globals.css), never pink.
const RADIO_CLASS_NAME =
  "radio radio-sm bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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
const CALCULATOR_EXAMPLES: readonly { id: keyof Messages["examples"]; fields: CalculatorFields }[] = [
  {
    id: "one-collateral",
    fields: {
      collateral: [presetCollateral("ethereum-core-weth", "10", "2400")],
      debt: { kind: "stable", name: "USDC", amount: "12000", price: "" },
    },
  },
  {
    id: "two-collaterals",
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
    fields: {
      collateral: [presetCollateral("ethereum-core-usdc", "10000", "1")],
      debt: { kind: "volatile", name: "WETH", amount: "2.5", price: "2400" },
    },
  },
];

const INITIAL_FIELDS = CALCULATOR_EXAMPLES[0].fields;

type ErrorMessages = Messages["errors"];

const checkAmount = (text: string, errors: ErrorMessages): CheckedNumber => {
  const parsed = parseDecimalInput(text);
  if (parsed.status === "empty") return { value: null, error: null };
  if (parsed.status === "invalid") return { value: null, error: errors.number };
  return { value: parsed.value, error: null };
};

const checkPrice = (text: string, errors: ErrorMessages): CheckedNumber => {
  const checked = checkAmount(text, errors);
  return checked.value === 0 ? { value: null, error: errors.price } : checked;
};

const checkThreshold = (text: string, errors: ErrorMessages): CheckedNumber => {
  const checked = checkAmount(text, errors);
  return checked.value !== null && (checked.value <= 0 || checked.value > 100)
    ? { value: null, error: errors.threshold }
    : checked;
};

/** The select's text for a preset: "Ethereum Core WETH: 83%". */
const presetOptionLabel = (preset: LiquidationThresholdPreset, t: Messages) =>
  `${preset.market} ${t.presetLabels[preset.id] ?? preset.label}: ${preset.liquidationThresholdPercent}%`;

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
const eModeConflict = (fields: CalculatorFields, t: Messages) => {
  const preset = fields.collateral.map(asset => findLiquidationThresholdPreset(asset.presetId)).find(p => p?.eMode);
  if (!preset?.eMode) return null;
  const { category, collateralSymbols, borrowableSymbols } = preset.eMode;
  const amount = parseDecimalInput(fields.debt.amount);
  if (amount.status === "valid" && amount.value === 0) return null;
  const debtKey = assetNameKey(fields.debt.name);
  const borrowable = borrowableSymbols.map(assetNameKey);
  if (fields.debt.kind === "volatile" && (!debtKey || borrowable.includes(debtKey))) return null;

  const ownThresholds = LIQUIDATION_THRESHOLD_PRESETS.filter(
    p => p.market === preset.market && !p.eMode && p.symbol && collateralSymbols.includes(p.symbol),
  ).map(p => presetOptionLabel(p, t));
  return t.eModeConflict({
    market: preset.market,
    category,
    borrowable: borrowableSymbols,
    loan: fields.debt.kind === "stable" ? { kind: "stable" } : { kind: "volatile", name: fields.debt.name.trim() },
    thresholdPercent: preset.liquidationThresholdPercent,
    ownThresholds,
  });
};

type NumberFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint?: string;
  placeholder?: string;
};

/**
 * A decimal input in a Field: visible label, optional hint, error, all tied to the control for screen readers.
 * The error is checked on every keystroke, so it is not an alert (liveError false): typing "0.5" passes through "0",
 * and an alert would interrupt with "Enter a price above 0." mid-number. The error stays linked through
 * aria-describedby and aria-invalid, and the results' status line speaks once typing pauses.
 */
const NumberField = ({ id, label, value, onChange, error, hint, placeholder }: NumberFieldProps) => (
  <Field id={id} label={label} description={hint} error={error} liveError={false}>
    {control => (
      <Input
        {...control}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="tabular-nums"
      />
    )}
  </Field>
);

type NameFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const NameField = ({ id, label, value, onChange, placeholder }: NameFieldProps) => (
  <Field id={id} label={label} optional>
    {control => (
      <Input
        {...control}
        autoComplete="off"
        maxLength={MAX_NAME_LENGTH}
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    )}
  </Field>
);

/** The liquidation price card of one asset, which may be in several rows (collateral, debt or both). */
const priceCard = (
  position: Position,
  subject: SharedAsset,
  name: string,
  liquidatable: boolean,
  t: ResultMessages,
): ResultCard | null => {
  const key = `price-${subject.collateral.map(i => `c${i}`).join("")}${subject.debt.map(i => `d${i}`).join("")}`;
  const [collateralIndex] = subject.collateral;
  const isShared = subject.collateral.length + subject.debt.length > 1;

  if (!isShared && collateralIndex !== undefined) {
    const asset = position.collateral[collateralIndex];
    const result = collateralLiquidationPrice(position, collateralIndex);
    const now = formatUsd(asset.price);
    if (!result) return { key, title: t.priceTitle(name), value: t.none, description: t.collateralNone(name) };
    const move = { name, change: formatPercent(result.change), now };
    return {
      key,
      title: t.priceTitle(name),
      value: formatUsd(result.price),
      description: liquidatable ? t.recover({ ...move, rises: true }) : t.collateralFall(move),
    };
  }

  if (!isShared) {
    const debt = position.debt[subject.debt[0]];
    const result = debtLiquidationPrice(position, subject.debt[0]);
    if (!result) return null;
    const move = { name, change: formatPercent(result.change), now: formatUsd(debt.price) };
    return {
      key,
      title: t.priceTitleBorrowed(name),
      value: formatUsd(result.price),
      description: liquidatable ? t.recover({ ...move, rises: false }) : t.debtRise(move),
    };
  }

  // The same asset in several rows: one price moves all of them.
  const borrowed = subject.debt.length > 0;
  const title = borrowed ? t.priceTitleShared(name) : t.priceTitle(name);
  const result = sharedAssetLiquidationPrice(position, subject);
  const currentPrice =
    collateralIndex !== undefined ? position.collateral[collateralIndex].price : position.debt[subject.debt[0]].price;
  const now = formatUsd(currentPrice);
  if (result) {
    const move = { name, change: formatPercent(result.change), now };
    let description: string;
    if (liquidatable) {
      description = t.recover({ ...move, rises: result.change > 0, alike: borrowed });
    } else if (result.change > 0) {
      description = t.sharedRise(move);
    } else {
      description = borrowed ? t.sharedFallBorrowed(move) : t.sharedFallRows(move);
    }
    return { key, title, value: formatUsd(result.price), description };
  }

  let description: string;
  if (!borrowed) {
    description = t.collateralNone(name);
  } else if (
    subject.collateral.length === position.collateral.filter(asset => asset.amount > 0).length &&
    subject.debt.length === position.debt.filter(debt => debt.amount > 0).length
  ) {
    description = t.bothSidesNeutral(name);
  } else {
    description = liquidatable ? t.bothSidesRecover(name) : t.bothSidesSafe(name);
  }
  return { key, title, value: t.none, description };
};

const buildResults = (
  position: Position,
  subjects: SharedAsset[],
  collateralNames: string[],
  debtName: string,
  t: ResultMessages,
): { cards: ResultCard[]; breakdown: string | null } => {
  const hf = healthFactor(position);
  const liquidatable = isLiquidatable(hf);
  const cards: ResultCard[] = [
    {
      key: "hf",
      title: t.healthFactor,
      value: formatHealthFactor(hf),
      description: !Number.isFinite(hf) ? t.noDebt : liquidatable ? t.liquidatableNow : t.liquidatableBelow,
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
    const card = priceCard(position, subject, subjectName(subject), liquidatable, t);
    if (card) cards.push(card);
  };
  const debtIsAlsoCollateral = activeSubjects.some(s => s.collateral.length > 0 && s.debt.length > 0);

  activeSubjects.filter(s => s.collateral.length > 0).forEach(addPriceCard);

  // Not when the debt is also collateral: that part of the debt would fall with it.
  const fall = uniformCollateralFall(position);
  if (position.collateral.length > 1 && fall !== null && !liquidatable && !debtIsAlsoCollateral) {
    cards.push({
      key: "uniform",
      title: t.uniformTitle,
      value: formatPercent(fall),
      description: t.uniformDescription(
        position.collateral.map((asset, index) => ({
          name: collateralNames[index],
          price: formatUsd(asset.price * (1 - fall)),
        })),
      ),
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
            title: t.ratioTitle(collateralName, debtName),
            value: formatRatio(ratio.ratio),
            description: t.ratioDescription(formatRatio(currentRatio), formatPercent(ratio.change), true),
          }
        : {
            key: "ratio",
            title: t.ratioTitle(debtName, collateralName),
            value: formatRatio(1 / ratio.ratio),
            description: t.ratioDescription(
              formatRatio(1 / currentRatio),
              formatPercent(1 / (1 + ratio.change) - 1),
              false,
            ),
          },
    );
  }

  const breakdown = t.breakdown({
    collateral: formatUsd(totalCollateralValue(position)),
    weighted: formatUsd(weightedCollateralValue(position)),
    debt: formatUsd(totalDebtValue(position)),
    healthFactor: formatHealthFactor(hf),
  });
  return { cards, breakdown };
};

/**
 * Health factor and liquidation price calculator for one or two collateral assets against stablecoin or volatile debt.
 * It renders on the server with the first worked example filled in, so the page shows a full result before (or
 * without) JavaScript; the inputs only start recalculating after hydration.
 */
export const LiquidationCalculator = () => {
  const locale = useLocale();
  const t = CALCULATOR_MESSAGES[locale];
  const thresholdsDate = formatPostDate(LIQUIDATION_THRESHOLDS_AS_OF, locale);
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
      const price = checkPrice(current.debt.price, t.errors).value;
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
    displayName(asset.name, t.defaultCollateralName(index + 1)),
  );
  const debtName = displayName(fields.debt.name, t.defaultDebtName);
  const subjects = sharedAssets(fields);

  // One asset has one price: a row naming an asset entered in an earlier collateral row must repeat that row's price.
  const collateralPrices = fields.collateral.map(asset => checkPrice(asset.price, t.errors));
  const matchEarlierPrice = (checked: CheckedNumber, rows: SharedAsset, isFirstRow: boolean): CheckedNumber => {
    const [firstIndex] = rows.collateral;
    if (isFirstRow || firstIndex === undefined) return checked;
    const first = collateralPrices[firstIndex].value;
    if (first === null || checked.value === null || checked.value === first) return checked;
    return {
      value: null,
      error: t.errors.samePrice(collateralNames[firstIndex], formatUsd(first)),
    };
  };
  const checkedCollateral = fields.collateral.map((asset, index) => {
    const rows = subjects.find(subject => subject.collateral.includes(index))!;
    return {
      amount: checkAmount(asset.amount, t.errors),
      price: matchEarlierPrice(collateralPrices[index], rows, rows.collateral[0] === index),
      threshold: checkThreshold(asset.threshold, t.errors),
    };
  });
  const checkedDebt = {
    amount: checkAmount(fields.debt.amount, t.errors),
    price:
      fields.debt.kind === "stable"
        ? { value: STABLE_DEBT_PRICE, error: null }
        : matchEarlierPrice(
            checkPrice(fields.debt.price, t.errors),
            subjects.find(subject => subject.debt.length > 0)!,
            false,
          ),
  };
  const eModeIssue = eModeConflict(fields, t);

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

  const results =
    position && !eModeIssue ? buildResults(position, subjects, collateralNames, debtName, t.results) : null;
  const summary =
    (eModeIssue && `${t.eModeLead} ${eModeIssue}`) ||
    (results ? results.cards.map(card => t.results.summaryLine(card.title, card.value)).join(" ") : t.results.empty);

  // Screen readers hear the result once typing pauses, not after every keystroke.
  const [announcement, setAnnouncement] = useState(summary);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(summary), ANNOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [summary]);

  const headingId = id("heading");
  const resultsHeadingId = id("results-heading");
  const eModeIssueId = id("emode-issue");
  const examplesLabelId = id("examples-label");

  return (
    // From lg it reaches 64px out of the reading column on each side, so the fields sit two to a row.
    <section aria-labelledby={headingId} className="my-10 lg:-mx-16">
      <Card>
        <CardHeader>
          <CardTitle id={headingId}>{t.title}</CardTitle>
          <CardDescription className="leading-relaxed">{t.intro}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div role="group" aria-labelledby={examplesLabelId} className="flex flex-wrap items-center gap-2">
            <span id={examplesLabelId} className="mr-1 text-sm leading-snug font-medium text-foreground">
              {t.examplesLabel}
            </span>
            {CALCULATOR_EXAMPLES.map(example => (
              <Button
                key={example.id}
                variant="outline"
                size="sm"
                className={EXAMPLE_BUTTON_CLASS_NAME}
                onClick={() => setFields(example.fields)}
              >
                {t.examples[example.id]}
              </Button>
            ))}
          </div>

          <form noValidate onSubmit={event => event.preventDefault()} className="flex flex-col gap-4">
            {fields.collateral.map((asset, index) => {
              const eMode = findLiquidationThresholdPreset(asset.presetId)?.eMode;
              const presetId = id(`collateral-${index}-preset`);
              return (
                <fieldset key={index} className={PANEL_CLASS_NAME}>
                  <legend className={LEGEND_CLASS_NAME}>{t.collateralLegend(index + 1)}</legend>
                  <div className="clear-both flex flex-col gap-4">
                    <Field
                      id={presetId}
                      label={t.presetLabel}
                      description={eMode ? t.eModeHint(eMode.collateralSymbols, eMode.borrowableSymbols) : undefined}
                    >
                      {control => (
                        <Select
                          {...control}
                          // The E-Mode conflict under the result also describes the choice that caused it.
                          aria-describedby={
                            [control["aria-describedby"], eMode && eModeIssue ? eModeIssueId : null]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                          value={asset.presetId}
                          onChange={event => selectPreset(index, event.target.value)}
                        >
                          <option value="">{t.otherAsset}</option>
                          {PRESET_MARKETS.map(market => (
                            <optgroup key={market} label={t.presetGroup(market, thresholdsDate)}>
                              {LIQUIDATION_THRESHOLD_PRESETS.filter(preset => preset.market === market).map(preset => (
                                <option key={preset.id} value={preset.id}>
                                  {presetOptionLabel(preset, t)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </Select>
                      )}
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <NameField
                        id={id(`collateral-${index}-name`)}
                        label={t.nameLabel}
                        value={asset.name}
                        onChange={name => updateCollateral(index, { name })}
                        placeholder={eMode ? t.namePlaceholder(eMode.collateralSymbols.slice(0, 2)) : undefined}
                      />
                      <NumberField
                        id={id(`collateral-${index}-amount`)}
                        label={t.amountSupplied}
                        placeholder="10"
                        value={asset.amount}
                        onChange={amount => updateCollateral(index, { amount })}
                        error={checkedCollateral[index].amount.error}
                      />
                      <NumberField
                        id={id(`collateral-${index}-price`)}
                        label={t.price}
                        placeholder="2400"
                        value={asset.price}
                        onChange={price => updateCollateral(index, { price })}
                        error={checkedCollateral[index].price.error}
                        hint={t.priceHint}
                      />
                      <NumberField
                        id={id(`collateral-${index}-threshold`)}
                        label={t.threshold}
                        placeholder="83"
                        value={asset.threshold}
                        onChange={threshold => changeThreshold(index, threshold)}
                        error={checkedCollateral[index].threshold.error}
                        hint={t.thresholdHint}
                      />
                    </div>
                    {index === 1 && (
                      <Button variant="ghost" size="sm" className="self-start" onClick={removeCollateral}>
                        {t.removeCollateral(2)}
                      </Button>
                    )}
                  </div>
                </fieldset>
              );
            })}

            {fields.collateral.length === 1 && (
              <Button
                id={id("add-collateral")}
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addCollateral}
              >
                <Plus aria-hidden="true" />
                {t.addCollateral}
              </Button>
            )}

            <fieldset className={PANEL_CLASS_NAME}>
              <legend className={LEGEND_CLASS_NAME}>{t.debtLegend}</legend>
              <div className="clear-both flex flex-col gap-4">
                <fieldset className="min-w-0">
                  <legend className="float-left mb-1 w-full text-sm leading-snug font-medium text-foreground">
                    {t.debtKindLegend}
                  </legend>
                  <div className="clear-both grid gap-x-6 sm:grid-cols-2">
                    {DEBT_KINDS.map(kind => (
                      <Field key={kind} id={id(`debt-kind-${kind}`)} label={t.debtKinds[kind]} orientation="horizontal">
                        {control => (
                          <input
                            {...control}
                            type="radio"
                            name={id("debt-kind")}
                            value={kind}
                            checked={fields.debt.kind === kind}
                            onChange={() => changeDebtKind(kind)}
                            className={RADIO_CLASS_NAME}
                          />
                        )}
                      </Field>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NameField
                    id={id("debt-name")}
                    label={t.nameLabel}
                    value={fields.debt.name}
                    onChange={name => updateDebt({ name })}
                  />
                  <NumberField
                    id={id("debt-amount")}
                    label={t.debtAmount[fields.debt.kind]}
                    placeholder={fields.debt.kind === "stable" ? "12000" : "2.5"}
                    value={fields.debt.amount}
                    onChange={amount => updateDebt({ amount })}
                    error={checkedDebt.amount.error}
                    hint={t.debtAmountHint}
                  />
                  {fields.debt.kind === "volatile" && (
                    <NumberField
                      id={id("debt-price")}
                      label={t.debtPrice}
                      placeholder="2400"
                      value={fields.debt.price}
                      onChange={price => updateDebt({ price })}
                      error={checkedDebt.price.error}
                    />
                  )}
                </div>
              </div>
            </fieldset>
          </form>

          <section aria-labelledby={resultsHeadingId} className="flex flex-col gap-3">
            <h4 id={resultsHeadingId} className="m-0 text-base leading-snug">
              {t.results.heading}
            </h4>
            <p role="status" className="sr-only">
              {announcement}
            </p>
            {eModeIssue ? (
              <Alert id={eModeIssueId} variant="warning">
                <p>
                  <span className="font-medium text-foreground">{t.eModeLead}</span> {eModeIssue}
                </p>
              </Alert>
            ) : results ? (
              <>
                <dl className="m-0 divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {results.cards.map(card => (
                    <div
                      key={card.key}
                      className={cx("flex flex-col gap-1 px-4 py-3", card.danger && "bg-destructive-subtle")}
                    >
                      <dt className="text-sm text-muted-foreground">{card.title}</dt>
                      <dd
                        className={cx(
                          "m-0 inline-flex items-center gap-2 text-2xl leading-tight font-bold tabular-nums",
                          card.danger ? "text-destructive" : "text-foreground",
                        )}
                      >
                        {card.danger && <CircleAlert aria-hidden="true" className="size-5 shrink-0" />}
                        {card.value}
                      </dd>
                      <dd className="m-0 text-sm leading-relaxed text-muted-foreground">{card.description}</dd>
                    </div>
                  ))}
                </dl>
                {results.breakdown && (
                  <p className="m-0 text-sm leading-relaxed text-muted-foreground tabular-nums">{results.breakdown}</p>
                )}
              </>
            ) : (
              <p className="m-0 text-sm text-muted-foreground">{t.results.empty}</p>
            )}
          </section>

          <noscript>
            <p className="m-0 text-sm text-muted-foreground">{t.noscript}</p>
          </noscript>

          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">{t.disclaimer.lead}</strong>
            {` ${t.disclaimer.beforeDate}`} <time dateTime={LIQUIDATION_THRESHOLDS_AS_OF}>{thresholdsDate}</time>
            {t.disclaimer.afterDate}
          </p>
        </CardContent>
      </Card>
    </section>
  );
};
