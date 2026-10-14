import { describe, expect, it } from "vitest";
import { HealthFactorBadge, getHealthFactorStatus } from "~~/components/custom/HealthFactorBadge";
import { renderMarkup } from "~~/utils/testing/render";

const badge = (healthFactor: string) => renderMarkup(<HealthFactorBadge healthFactor={healthFactor} />);

describe("HealthFactorBadge", () => {
  // B1.6: a darker text shade in light mode; dark mode keeps the -400 shade.
  it.each([
    ["∞", "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30", "No Debt"],
    ["0.95", "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30", "Critical"],
    ["1.09", "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30", "Critical"],
    ["1.10", "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30", "Risky"],
    ["1.49", "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30", "Risky"],
    ["1.50", "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", "Safe"],
    ["12.00", "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", "Safe"],
    // Unparseable values fall through every comparison.
    ["n/a", "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", "Safe"],
  ])("renders %j as %s / %s", (healthFactor, colorClass, label) => {
    expect(badge(healthFactor)).toBe(
      `<span class="px-2 py-1 rounded-lg text-xs font-medium border ${colorClass}">${healthFactor}<!-- --> · <!-- -->${label}</span>`,
    );
  });

  it("renders an empty health factor as Safe", () => {
    expect(badge("")).toBe(
      '<span class="px-2 py-1 rounded-lg text-xs font-medium border bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"> · <!-- -->Safe</span>',
    );
  });
});

describe("getHealthFactorStatus", () => {
  it.each([
    ["∞", "no-debt"],
    ["0.00", "critical"],
    ["1.09", "critical"],
    ["1.10", "risky"],
    ["1.49", "risky"],
    ["1.50", "safe"],
    ["Infinity", "safe"],
    ["NaN", "safe"],
    ["", "safe"],
  ] as const)("classifies %j as %s", (healthFactor, status) => {
    expect(getHealthFactorStatus(healthFactor)).toBe(status);
  });
});
