import { formatUnits } from "viem";

export const INFINITE_HEALTH_FACTOR = "∞";

// Aave reports type(uint256).max when there is no debt; anything at or above 2^128 - 1 is shown as infinite.
export const HEALTH_FACTOR_INFINITY_THRESHOLD = 2n ** 128n - 1n;

/** Formats Aave's 18-decimal health factor as "∞" or a 2-decimal string. */
export const formatHealthFactor = (raw: bigint) =>
  raw >= HEALTH_FACTOR_INFINITY_THRESHOLD ? INFINITE_HEALTH_FACTOR : parseFloat(formatUnits(raw, 18)).toFixed(2);

/** The exact health factor as a number, for comparisons; Infinity when Aave reports no debt. */
export const toHealthFactorValue = (raw: bigint) =>
  raw >= HEALTH_FACTOR_INFINITY_THRESHOLD ? Infinity : Number(formatUnits(raw, 18));

/**
 * 2 decimals rounded DOWN, for alert text: a health factor of 1.4996 reads "1.49", never "1.50", so a message can't
 * claim a value at or above the threshold it crossed.
 */
export const formatHealthFactorDown = (raw: bigint) => {
  if (raw >= HEALTH_FACTOR_INFINITY_THRESHOLD) return INFINITE_HEALTH_FACTOR;
  const hundredths = raw / 10n ** 16n;
  return `${hundredths / 100n}.${(hundredths % 100n).toString().padStart(2, "0")}`;
};

/** Parses a formatted health factor ("∞" becomes Infinity); NaN when unparseable. */
export const parseHealthFactor = (value: string) => (value === INFINITE_HEALTH_FACTOR ? Infinity : parseFloat(value));

/** Unparseable health factors never count as below the threshold. */
export const isBelowThreshold = (healthFactor: string, threshold: number) => {
  const hf = parseHealthFactor(healthFactor);
  return !Number.isNaN(hf) && hf < threshold;
};
