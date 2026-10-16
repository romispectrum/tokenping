import { describe, expect, it } from "vitest";
import { formatDuration, formatExactAmount } from "~~/app/(en)/admin/_components/adminFormat";

describe("formatExactAmount", () => {
  it.each([
    [0n, 6, "0"],
    [1_500_000n, 6, "1.5"],
    [12_345_678_900n, 6, "12,345.6789"],
    [1_000_000_000_000n, 6, "1,000,000"],
    [1n, 18, "0.000000000000000001"],
    [1_234_500_000_000_000_001_000n, 18, "1,234.500000000000001"],
    [5n, 0, "5"],
  ])("formats %s with %s decimals as %j, never rounded", (value, decimals, expected) => {
    expect(formatExactAmount(value, decimals)).toBe(expected);
  });
});

describe("formatDuration", () => {
  it.each([
    [0n, "0 seconds"],
    [1n, "1 second"],
    [59n, "59 seconds"],
    [86_400n, "86,400 seconds (1 day)"],
    [2_592_000n, "2,592,000 seconds (30 days)"],
    [31_536_000n, "31,536,000 seconds (365 days)"],
    [90_000n, "90,000 seconds"],
  ])("formats %s as %j", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
