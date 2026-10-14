import { formatUnits } from "viem";
import { describe, expect, it } from "vitest";
import { formatTokenAmount, formatUSD, formatUtcTimestamp } from "~~/utils/format";

// Verbatim copy of formatTokenAmount before its formatters were cached at module level.
const legacyFormatTokenAmount = (amount: bigint, decimals: number) => {
  const asNumber = Number(formatUnits(amount, decimals));
  if (!Number.isFinite(asNumber)) return "0";
  if (asNumber === 0) return "0";
  const maximumFractionDigits = Math.abs(asNumber) < 1 ? 6 : 4;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(asNumber);
};

// Verbatim copy of the inline formatter in services/notifications/runNotificationCheck.ts.
const legacyCronTimestamp = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "long",
  }).format(date);

describe("formatUSD", () => {
  it.each([
    ["0", "$0.00"],
    ["12.3", "$12.30"],
    [" 12 ", "$12.00"],
    ["0.005", "$0.01"],
    ["999.999", "$1,000.00"],
    ["1000", "$1.00K"],
    ["1234.567", "$1.23K"],
    ["1234567", "$1.23M"],
    ["-1500", "-$1.50K"],
    ["-0", "-$0.00"],
    ["1e21", "$1,000,000,000.00T"],
  ])("formats %j as %j", (value, expected) => {
    expect(formatUSD(value)).toBe(expected);
  });

  it.each(["", "abc", "Infinity", "-Infinity", "NaN"])("returns $0.00 for %j", value => {
    // "" is Number("") === 0, which formats the same as the non-finite fallback.
    expect(formatUSD(value)).toBe("$0.00");
  });
});

describe("formatTokenAmount", () => {
  it.each([
    [0n, 18, "0"],
    [1n, 18, "0"],
    [123_456_789_012_345_678n, 18, "0.123457"],
    [999_999n, 6, "0.999999"],
    [1_000_000n, 6, "1"],
    [123_456_789n, 6, "123.4568"],
    [1_234_567_890_123_456_789_012n, 18, "1,234.5679"],
    [-500_000_000_000_000_000n, 18, "-0.5"],
    // Negative amounts at or below -1 must use the 4-digit formatter (selection is by magnitude).
    [-1_234_567_000_000_000_000n, 18, "-1.2346"],
    [1n, 0, "1"],
  ])("formats %s with %s decimals as %j", (amount, decimals, expected) => {
    expect(formatTokenAmount(amount, decimals)).toBe(expected);
  });

  it("returns 0 when the amount overflows to Infinity", () => {
    expect(formatTokenAmount(2n ** 1100n, 0)).toBe("0");
  });

  it("matches the uncached implementation", () => {
    const samples: [bigint, number][] = [
      [0n, 18],
      [1n, 18],
      [-1n, 6],
      [10n ** 17n, 18],
      [999_999_999_999_999_999n, 18],
      [10n ** 18n, 18],
      [123_456_789n, 8],
      [10n ** 30n, 6],
      [-(10n ** 24n), 18],
      [-1_234_567n, 6],
      [2n ** 1100n, 0],
    ];
    for (const [amount, decimals] of samples) {
      expect(formatTokenAmount(amount, decimals)).toBe(legacyFormatTokenAmount(amount, decimals));
    }
  });
});

describe("formatUtcTimestamp", () => {
  it.each([
    ["2026-10-14T09:05:07Z", "Oct 14, 2026, 9:05:07 AM Coordinated Universal Time"],
    ["2026-01-01T00:00:00Z", "Jan 1, 2026, 12:00:00 AM Coordinated Universal Time"],
    ["2026-07-04T23:59:59.999Z", "Jul 4, 2026, 11:59:59 PM Coordinated Universal Time"],
  ])("formats %s in UTC", (iso, expected) => {
    expect(formatUtcTimestamp(new Date(iso))).toBe(expected);
  });

  it("ignores the host time zone", () => {
    const date = new Date("2026-03-29T01:30:00+02:00");
    expect(formatUtcTimestamp(date)).toBe("Mar 28, 2026, 11:30:00 PM Coordinated Universal Time");
  });

  it("matches the cron's inline formatter", () => {
    const dates = [0, 1_700_000_000_000, 1_760_000_000_123, Date.UTC(2024, 1, 29, 12, 0, 0)].map(ms => new Date(ms));
    for (const date of dates) {
      expect(formatUtcTimestamp(date)).toBe(legacyCronTimestamp(date));
    }
  });

  it("throws for an invalid date, like the inline formatter", () => {
    expect(() => formatUtcTimestamp(new Date("nope"))).toThrow(RangeError);
    expect(() => legacyCronTimestamp(new Date("nope"))).toThrow(RangeError);
  });
});
