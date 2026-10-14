import { formatUnits } from "viem";

const USD_COMPACT_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const USD_STANDARD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

/** Amounts below 1 keep more precision so small balances don't collapse to 0. */
const TOKEN_AMOUNT_SMALL_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
const TOKEN_AMOUNT_FORMATTER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

export function formatUSD(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  if (Math.abs(num) >= 1000) return USD_COMPACT_FORMATTER.format(num);
  return USD_STANDARD_FORMATTER.format(num);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const asNumber = Number(formatUnits(amount, decimals));
  if (!Number.isFinite(asNumber)) return "0";
  if (asNumber === 0) return "0";
  const formatter = Math.abs(asNumber) < 1 ? TOKEN_AMOUNT_SMALL_FORMATTER : TOKEN_AMOUNT_FORMATTER;
  return formatter.format(asNumber);
}

// Created lazily so client bundles that only use the number formatters can tree-shake it.
let utcTimestampFormatter: Intl.DateTimeFormat | undefined;

/** e.g. "Oct 14, 2026, 9:05:07 AM Coordinated Universal Time". Pinned to UTC so alerts read the same on any host. */
export const formatUtcTimestamp = (date: Date) => {
  utcTimestampFormatter ??= new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "long",
  });
  return utcTimestampFormatter.format(date);
};
