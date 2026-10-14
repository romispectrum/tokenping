import { formatUnits, maxUint256 } from "viem";
import { describe, expect, it } from "vitest";
import {
  HEALTH_FACTOR_INFINITY_THRESHOLD,
  INFINITE_HEALTH_FACTOR,
  formatHealthFactor,
  isBelowThreshold,
  parseHealthFactor,
} from "~~/utils/healthFactor";

const WAD = 10n ** 18n;

// Verbatim copy of the logic formerly inlined in services/aave/getHealthFactor.ts and hooks/custom/useAavePositions.ts.
const legacyFormatHealthFactor = (healthFactor: bigint) =>
  healthFactor >= BigInt("0xffffffffffffffffffffffffffffffff")
    ? "∞"
    : parseFloat(formatUnits(healthFactor, 18)).toFixed(2);

// Verbatim copy of the comparison formerly inlined in services/notifications/runNotificationCheck.ts
// (alert when NOT skipped).
const legacyCronAlerts = (healthFactor: string, threshold: number) => {
  const hfNum = healthFactor === "∞" ? Infinity : parseFloat(healthFactor);
  return !(Number.isNaN(hfNum) || hfNum >= threshold);
};

// Verbatim copy of NotificationConfig's banner condition, without the `&& enabled` part.
const legacyComponentBelow = (currentHealthFactor: string, threshold: number) => {
  const hf = parseFloat(currentHealthFactor);
  return !isNaN(hf) && hf < threshold;
};

describe("constants", () => {
  it("uses the infinity sign", () => {
    expect(INFINITE_HEALTH_FACTOR).toBe("∞");
  });

  it("puts the infinity threshold at 2^128 - 1 (32 hex f's)", () => {
    expect(HEALTH_FACTOR_INFINITY_THRESHOLD).toBe(BigInt("0x" + "f".repeat(32)));
    expect(HEALTH_FACTOR_INFINITY_THRESHOLD).toBe(340282366920938463463374607431768211455n);
  });
});

describe("formatHealthFactor", () => {
  it.each([
    [0n, "0.00"],
    [1n, "0.00"],
    [WAD, "1.00"],
    [1_234_567_890_123_456_789n, "1.23"],
    [999_999_999_999_999_999n, "1.00"],
    [1_015n * 10n ** 15n, "1.01"],
    [1_995n * 10n ** 15n, "2.00"],
    [25n * WAD, "25.00"],
  ])("formats %s as %s", (raw, expected) => {
    expect(formatHealthFactor(raw)).toBe(expected);
  });

  it("rounds through a float, so 1.005 becomes 1.00 rather than 1.01", () => {
    expect(formatHealthFactor(1_005n * 10n ** 15n)).toBe("1.00");
  });

  it("returns ∞ at and above the threshold", () => {
    expect(formatHealthFactor(HEALTH_FACTOR_INFINITY_THRESHOLD)).toBe("∞");
    expect(formatHealthFactor(HEALTH_FACTOR_INFINITY_THRESHOLD + 1n)).toBe("∞");
    expect(formatHealthFactor(maxUint256)).toBe("∞");
  });

  it("prints a huge (float-rounded) number just below the threshold", () => {
    expect(formatHealthFactor(HEALTH_FACTOR_INFINITY_THRESHOLD - 1n)).toBe("340282366920938487808.00");
  });

  it("keeps the sign for negative input", () => {
    expect(formatHealthFactor(-1n)).toBe("-0.00");
    expect(formatHealthFactor(-WAD)).toBe("-1.00");
  });

  it("matches the inline implementation it replaces", () => {
    const samples = [
      0n,
      1n,
      -1n,
      WAD,
      WAD / 3n,
      (WAD * 7n) / 6n,
      1_104_999_999_999_999_999n,
      1_499_999_999_999_999_999n,
      123_456n * WAD,
      HEALTH_FACTOR_INFINITY_THRESHOLD - 1n,
      HEALTH_FACTOR_INFINITY_THRESHOLD,
      maxUint256,
    ];
    for (const raw of samples) {
      expect(formatHealthFactor(raw)).toBe(legacyFormatHealthFactor(raw));
    }
  });
});

describe("parseHealthFactor", () => {
  it("maps ∞ to Infinity", () => {
    expect(parseHealthFactor("∞")).toBe(Infinity);
  });

  it.each([
    ["1.25", 1.25],
    ["0.00", 0],
    ["-1", -1],
    [" 1.5", 1.5],
    ["1.5abc", 1.5],
    ["Infinity", Infinity],
  ])("parses %j with parseFloat semantics as %s", (value, expected) => {
    expect(parseHealthFactor(value)).toBe(expected);
  });

  it.each(["", "abc", " ∞", "∞ ", "--1"])("returns NaN for %j", value => {
    expect(parseHealthFactor(value)).toBeNaN();
  });
});

describe("isBelowThreshold", () => {
  it("is true only when strictly below the threshold", () => {
    expect(isBelowThreshold("1.49", 1.5)).toBe(true);
    expect(isBelowThreshold("1.50", 1.5)).toBe(false);
    expect(isBelowThreshold("1.51", 1.5)).toBe(false);
  });

  it("is never true for ∞", () => {
    expect(isBelowThreshold("∞", 1.5)).toBe(false);
    expect(isBelowThreshold("∞", Infinity)).toBe(false);
  });

  it("is false for unparseable health factors", () => {
    expect(isBelowThreshold("", 1.5)).toBe(false);
    expect(isBelowThreshold("abc", 10)).toBe(false);
  });

  it("is false when the threshold is NaN", () => {
    expect(isBelowThreshold("1.00", NaN)).toBe(false);
  });

  it("treats 0 and negative values as below a positive threshold", () => {
    expect(isBelowThreshold("0.00", 1.1)).toBe(true);
    expect(isBelowThreshold("-0.00", 1.1)).toBe(true);
  });

  it("matches both inline comparisons it replaces (cron and NotificationConfig banner)", () => {
    const healthFactors = ["∞", "0.00", "1.09", "1.10", "1.49", "1.50", "2.00", "", "abc", "Infinity", "1.5x"];
    const thresholds = [1.1, 1.5, 3, 10, Infinity, NaN];
    for (const hf of healthFactors) {
      for (const threshold of thresholds) {
        expect(isBelowThreshold(hf, threshold)).toBe(legacyComponentBelow(hf, threshold));
        if (!Number.isNaN(threshold)) {
          expect(isBelowThreshold(hf, threshold)).toBe(legacyCronAlerts(hf, threshold));
        }
      }
    }
  });

  it("differs from the cron's skip check only for a NaN threshold, which the cron cannot produce", () => {
    // The cron skips when `hf >= threshold`, which is false for NaN, so it would alert. Its threshold is
    // `Number(row.health_factor_threshold) || DEFAULT_HEALTH_FACTOR_THRESHOLD`, which is never NaN.
    expect(legacyCronAlerts("2.00", NaN)).toBe(true);
    expect(isBelowThreshold("2.00", NaN)).toBe(false);
  });
});
