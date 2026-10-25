import { describe, expect, it } from "vitest";
import {
  AAVE_THRESHOLD_RANGE,
  MORPHO_THRESHOLD_RANGE,
  THRESHOLD_INPUT_PATTERN,
  clampSliderThreshold,
  clampThreshold,
  formatThreshold,
  normalizeThreshold,
  parseThresholdInput,
  roundThreshold,
  thresholdRangeFor,
} from "~~/utils/notifications/threshold";

// Verbatim copy of the parse in NotificationConfig's threshold input onBlur handler
// (onChange is the same after its pattern check). null = "do not commit a threshold".
const legacyParse = (thresholdText: string) => {
  const raw = thresholdText.replace(",", ".");
  if (raw === "" || raw === "." || raw.endsWith(".")) return null;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(10, Math.max(1.1, Math.round(parsed * 100) / 100));
};

describe("clampThreshold", () => {
  it.each([
    [1.5, 1.5],
    [1.1, 1.1],
    [10, 10],
    [1.09, 1.1],
    [0, 1.1],
    [-5, 1.1],
    [10.01, 10],
    [Infinity, 10],
    [-Infinity, 1.1],
  ])("clamps %s to %s", (value, expected) => {
    expect(clampThreshold(value)).toBe(expected);
  });

  it("passes NaN through", () => {
    expect(clampThreshold(NaN)).toBeNaN();
  });
});

describe("clampSliderThreshold", () => {
  it.each([
    [2, 2],
    [1.1, 1.1],
    [3, 3],
    [1, 1.1],
    [3.5, 3],
    [10, 3],
    [Infinity, 3],
  ])("clamps %s to %s", (value, expected) => {
    expect(clampSliderThreshold(value)).toBe(expected);
  });

  it("passes NaN through", () => {
    expect(clampSliderThreshold(NaN)).toBeNaN();
  });
});

describe("formatThreshold", () => {
  it.each([
    [1.5, "1.50"],
    [1.1, "1.10"],
    [10, "10.00"],
    [2.345, "2.35"],
    [1.005, "1.00"],
    [0, "0.00"],
    [-1, "-1.00"],
  ])("formats %s as %j", (value, expected) => {
    expect(formatThreshold(value)).toBe(expected);
  });

  it.each([NaN, Infinity, -Infinity])("formats non-finite %s as the default 1.50", value => {
    expect(formatThreshold(value)).toBe("1.50");
  });
});

describe("normalizeThreshold", () => {
  it.each([
    [2.5, 2.5],
    ["2.5", 2.5],
    [1.11, 1.11],
    [-1, 1.1],
    [true, 1.1],
    [Infinity, 10],
    [50, 10],
    [[2], 2],
  ])("normalizes %j to %s", (raw, expected) => {
    expect(normalizeThreshold(raw)).toBe(expected);
  });

  it.each([undefined, null, 0, "", "abc", NaN, [], false, {}])(
    "falls back to the default 1.5 for falsy-number %j (not the 1.1 minimum)",
    raw => {
      expect(normalizeThreshold(raw)).toBe(1.5);
    },
  );

  it("does not round", () => {
    expect(normalizeThreshold(1.23456)).toBe(1.23456);
  });
});

describe("roundThreshold", () => {
  it.each([
    [1.5, 1.5],
    [1.234, 1.23],
    [1.235, 1.24],
    [1.555, 1.56],
    [2.675, 2.68],
    [9.995, 9.99],
    [0.005, 0.01],
  ])("rounds %s to %s", (value, expected) => {
    expect(roundThreshold(value)).toBe(expected);
  });

  it("follows float math, so 1.005 rounds down to 1", () => {
    expect(roundThreshold(1.005)).toBe(1);
  });

  it("does not clamp", () => {
    expect(roundThreshold(0)).toBe(0);
    expect(roundThreshold(25.129)).toBe(25.13);
  });
});

describe("THRESHOLD_INPUT_PATTERN", () => {
  it.each(["", "1", "12", ".", "1.", ".5", "1.5", "1.55", "12.34", "00"])("accepts %j", value => {
    expect(THRESHOLD_INPUT_PATTERN.test(value)).toBe(true);
  });

  it.each(["123", "1.555", "1,5", "-1", "+1", "1e5", " 1", "1 ", "1..", "a", "1.5.5"])("rejects %j", value => {
    expect(THRESHOLD_INPUT_PATTERN.test(value)).toBe(false);
  });

  it("is stateless (no global flag), so repeated tests give the same answer", () => {
    expect(THRESHOLD_INPUT_PATTERN.global).toBe(false);
    expect(THRESHOLD_INPUT_PATTERN.test("1.5")).toBe(true);
    expect(THRESHOLD_INPUT_PATTERN.test("1.5")).toBe(true);
  });
});

describe("parseThresholdInput", () => {
  it.each(["", ".", "1.", "12.", "1.5.", ",", "1,"])("returns null for incomplete input %j", value => {
    expect(parseThresholdInput(value)).toBeNull();
  });

  it.each(["abc", "-", "Infinity", "-Infinity", "1e400"])("returns null for non-finite input %j", value => {
    expect(parseThresholdInput(value)).toBeNull();
  });

  it.each([
    ["1.5", 1.5],
    ["2", 2],
    ["1,75", 1.75],
    ["2.345", 2.35],
    ["1.555", 1.56],
    ["9.99", 9.99],
  ])("parses %j as %s", (value, expected) => {
    expect(parseThresholdInput(value)).toBe(expected);
  });

  it.each([
    ["0", 1.1],
    ["00", 1.1],
    [".5", 1.1],
    ["1.09", 1.1],
    ["1.005", 1.1],
    ["-5", 1.1],
    ["99.99", 10],
    ["1e5", 10],
  ])("clamps %j to %s", (value, expected) => {
    expect(parseThresholdInput(value)).toBe(expected);
  });

  it("replaces only the first comma, so the rest is ignored by parseFloat", () => {
    expect(parseThresholdInput("1,5,5")).toBe(1.5);
    // With every comma replaced this would be "1.5." (incomplete -> null).
    expect(parseThresholdInput("1,5,")).toBe(1.5);
  });

  it("uses parseFloat's lenient prefix parsing", () => {
    expect(parseThresholdInput(" 2")).toBe(2);
    expect(parseThresholdInput("2abc")).toBe(2);
    expect(parseThresholdInput("1..5")).toBe(1.1);
  });

  it("matches the inline onChange/onBlur parse it replaces", () => {
    const samples = [
      "",
      ".",
      "1.",
      "1",
      "1.1",
      "1.15",
      "1,2",
      "3.33",
      "10",
      "10.5",
      "0.99",
      "12.34",
      "abc",
      "1,5,5",
      "1,5,",
      "1e5",
      "Infinity",
      " 2",
    ];
    for (const value of samples) {
      expect(parseThresholdInput(value)).toBe(legacyParse(value));
    }
  });
});

describe("Morpho's threshold range", () => {
  it("is 1.02 to 10 for both Morpho protocols, and Aave's stays 1.1 to 10", () => {
    expect(thresholdRangeFor("morpho-blue")).toBe(MORPHO_THRESHOLD_RANGE);
    expect(thresholdRangeFor("morpho-midnight")).toBe(MORPHO_THRESHOLD_RANGE);
    expect(thresholdRangeFor("aave")).toBe(AAVE_THRESHOLD_RANGE);
    expect(thresholdRangeFor()).toBe(AAVE_THRESHOLD_RANGE);
    expect([MORPHO_THRESHOLD_RANGE.min, MORPHO_THRESHOLD_RANGE.max]).toEqual([1.02, 10]);
    expect([AAVE_THRESHOLD_RANGE.min, AAVE_THRESHOLD_RANGE.max]).toEqual([1.1, 10]);
  });

  it("clamps, normalizes and parses to 1.02 with the Morpho range and to 1.1 without one", () => {
    expect(clampThreshold(1.05, MORPHO_THRESHOLD_RANGE)).toBe(1.05);
    expect(clampThreshold(1.01, MORPHO_THRESHOLD_RANGE)).toBe(1.02);
    expect(clampThreshold(1.05)).toBe(1.1);
    expect(normalizeThreshold("1.03", MORPHO_THRESHOLD_RANGE)).toBe(1.03);
    expect(normalizeThreshold("1.03")).toBe(1.1);
    expect(parseThresholdInput("1,04", MORPHO_THRESHOLD_RANGE)).toBe(1.04);
    expect(parseThresholdInput("1.01", MORPHO_THRESHOLD_RANGE)).toBe(1.02);
    expect(parseThresholdInput("1.04")).toBe(1.1);
  });

  it("keeps the Morpho slider between 1.02 and 2", () => {
    expect(clampSliderThreshold(1, MORPHO_THRESHOLD_RANGE)).toBe(1.02);
    expect(clampSliderThreshold(1.37, MORPHO_THRESHOLD_RANGE)).toBe(1.37);
    expect(clampSliderThreshold(4, MORPHO_THRESHOLD_RANGE)).toBe(2);
  });

  it("puts its lowest mark at its minimum, as Aave's does", () => {
    for (const range of [AAVE_THRESHOLD_RANGE, MORPHO_THRESHOLD_RANGE]) {
      expect(Number(range.scale[0].value)).toBe(range.min);
      expect(Number(range.scale[2].value)).toBe(range.sliderMax);
    }
  });
});
