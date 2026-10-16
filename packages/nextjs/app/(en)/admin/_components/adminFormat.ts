import { formatUnits } from "viem";

const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

const SECONDS_PER_DAY = 86_400n;

/**
 * Every digit of an on-chain amount with the whole part grouped: "1,234.567891". The owner withdraws and prices
 * from these values, so they are never rounded.
 */
export const formatExactAmount = (value: bigint, decimals: number) => {
  const [whole, fraction] = formatUnits(value, decimals).split(".");
  const grouped = INTEGER_FORMATTER.format(BigInt(whole));
  return fraction ? `${grouped}.${fraction}` : grouped;
};

/** "2,592,000 seconds (30 days)": the days only when the duration is a whole number of them. */
export const formatDuration = (seconds: bigint) => {
  const text = `${INTEGER_FORMATTER.format(seconds)} ${seconds === 1n ? "second" : "seconds"}`;
  if (seconds <= 0n || seconds % SECONDS_PER_DAY !== 0n) return text;
  const days = seconds / SECONDS_PER_DAY;
  return `${text} (${INTEGER_FORMATTER.format(days)} ${days === 1n ? "day" : "days"})`;
};
