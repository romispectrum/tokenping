import type { Protocol } from "~~/config/protocols";
import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  MORPHO_HEALTH_FACTOR_THRESHOLD_MIN,
  THRESHOLD_SLIDER_MAX,
  THRESHOLD_SLIDER_MIN,
  THRESHOLD_SLIDER_STEP,
} from "~~/constants/notifications";

/** Keystroke filter for the typed threshold: at most 2 integer and 2 decimal digits, partial input allowed. */
export const THRESHOLD_INPUT_PATTERN = /^\d{0,2}(\.\d{0,2})?$/;

/** A mark under the threshold slider: a value and the word that describes it. */
export type ThresholdScaleMark = { value: string; mark: "critical" | "safe" | "verySafe" };

/**
 * The thresholds an alert accepts (typed input and saved value), the narrower range the slider covers, its step and
 * the three marks under it.
 */
export type ThresholdRange = {
  min: number;
  max: number;
  sliderMin: number;
  sliderMax: number;
  sliderStep: number;
  scale: readonly [ThresholdScaleMark, ThresholdScaleMark, ThresholdScaleMark];
};

export const AAVE_THRESHOLD_RANGE: ThresholdRange = {
  min: HEALTH_FACTOR_THRESHOLD_MIN,
  max: HEALTH_FACTOR_THRESHOLD_MAX,
  sliderMin: THRESHOLD_SLIDER_MIN,
  sliderMax: THRESHOLD_SLIDER_MAX,
  sliderStep: THRESHOLD_SLIDER_STEP,
  scale: [
    { value: "1.1", mark: "critical" },
    { value: "2.0", mark: "safe" },
    { value: "3.0", mark: "verySafe" },
  ],
};

/** Morpho goes down to 1.02, and its slider moves in hundredths below 2, where high-LLTV positions sit. */
export const MORPHO_THRESHOLD_RANGE: ThresholdRange = {
  min: MORPHO_HEALTH_FACTOR_THRESHOLD_MIN,
  max: HEALTH_FACTOR_THRESHOLD_MAX,
  sliderMin: MORPHO_HEALTH_FACTOR_THRESHOLD_MIN,
  sliderMax: 2,
  sliderStep: 0.01,
  scale: [
    { value: "1.02", mark: "critical" },
    { value: "1.5", mark: "safe" },
    { value: "2.0", mark: "verySafe" },
  ],
};

export const thresholdRangeFor = (protocol: Protocol = "aave") =>
  protocol === "aave" ? AAVE_THRESHOLD_RANGE : MORPHO_THRESHOLD_RANGE;

export const clampThreshold = (value: number, range: ThresholdRange = AAVE_THRESHOLD_RANGE) =>
  Math.min(range.max, Math.max(range.min, value));

export const clampSliderThreshold = (value: number, range: ThresholdRange = AAVE_THRESHOLD_RANGE) =>
  Math.min(range.sliderMax, Math.max(range.sliderMin, value));

export const formatThreshold = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : DEFAULT_HEALTH_FACTOR_THRESHOLD.toFixed(2);

/** Falsy numbers (0, NaN) fall back to the default before clamping, so 0 becomes 1.5, not the minimum. */
export const normalizeThreshold = (raw: unknown, range: ThresholdRange = AAVE_THRESHOLD_RANGE) =>
  clampThreshold(Number(raw) || DEFAULT_HEALTH_FACTOR_THRESHOLD, range);

export const roundThreshold = (value: number) => Math.round(value * 100) / 100;

/**
 * Parses the typed threshold. Returns null while the input is incomplete ("", ".", "1.") or not a finite number.
 * Only the first comma is treated as a decimal separator.
 */
export const parseThresholdInput = (raw: string, range: ThresholdRange = AAVE_THRESHOLD_RANGE) => {
  const normalized = raw.replace(",", ".");
  if (normalized === "" || normalized === "." || normalized.endsWith(".")) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return clampThreshold(roundThreshold(parsed), range);
};
