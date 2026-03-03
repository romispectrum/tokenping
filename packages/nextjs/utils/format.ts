import { formatUnits } from "viem";

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const usdStandard = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatUSD(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "$0.00";
  if (Math.abs(num) >= 1000) return usdCompact.format(num);
  return usdStandard.format(num);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const asNumber = Number(formatUnits(amount, decimals));
  if (!Number.isFinite(asNumber)) return "0";
  if (asNumber === 0) return "0";
  const maximumFractionDigits = Math.abs(asNumber) < 1 ? 6 : 4;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(asNumber);
}
