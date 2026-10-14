import { formatUnits } from "viem";

export const INFINITE_HEALTH_FACTOR = "∞";

// Aave reports type(uint256).max when there is no debt; anything at or above 2^128 - 1 is shown as infinite.
export const HEALTH_FACTOR_INFINITY_THRESHOLD = 2n ** 128n - 1n;

/** Formats Aave's 18-decimal health factor as "∞" or a 2-decimal string. */
export const formatHealthFactor = (raw: bigint) =>
  raw >= HEALTH_FACTOR_INFINITY_THRESHOLD ? INFINITE_HEALTH_FACTOR : parseFloat(formatUnits(raw, 18)).toFixed(2);

/** Parses a formatted health factor ("∞" becomes Infinity); NaN when unparseable. */
export const parseHealthFactor = (value: string) => (value === INFINITE_HEALTH_FACTOR ? Infinity : parseFloat(value));

/** Unparseable health factors never count as below the threshold. */
export const isBelowThreshold = (healthFactor: string, threshold: number) => {
  const hf = parseHealthFactor(healthFactor);
  return !Number.isNaN(hf) && hf < threshold;
};
