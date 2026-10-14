import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  THRESHOLD_SLIDER_MAX,
  THRESHOLD_SLIDER_MIN,
} from "~~/constants/notifications";

/** Keystroke filter for the typed threshold: at most 2 integer and 2 decimal digits, partial input allowed. */
export const THRESHOLD_INPUT_PATTERN = /^\d{0,2}(\.\d{0,2})?$/;

export const clampThreshold = (value: number) =>
  Math.min(HEALTH_FACTOR_THRESHOLD_MAX, Math.max(HEALTH_FACTOR_THRESHOLD_MIN, value));

export const clampSliderThreshold = (value: number) =>
  Math.min(THRESHOLD_SLIDER_MAX, Math.max(THRESHOLD_SLIDER_MIN, value));

export const formatThreshold = (value: number) =>
  Number.isFinite(value) ? value.toFixed(2) : DEFAULT_HEALTH_FACTOR_THRESHOLD.toFixed(2);

/** Falsy numbers (0, NaN) fall back to the default before clamping, so 0 becomes 1.5, not the minimum. */
export const normalizeThreshold = (raw: unknown) => clampThreshold(Number(raw) || DEFAULT_HEALTH_FACTOR_THRESHOLD);

export const roundThreshold = (value: number) => Math.round(value * 100) / 100;

/**
 * Parses the typed threshold. Returns null while the input is incomplete ("", ".", "1.") or not a finite number.
 * Only the first comma is treated as a decimal separator.
 */
export const parseThresholdInput = (raw: string) => {
  const normalized = raw.replace(",", ".");
  if (normalized === "" || normalized === "." || normalized.endsWith(".")) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;
  return clampThreshold(roundThreshold(parsed));
};
