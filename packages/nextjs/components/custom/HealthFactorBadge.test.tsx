import { describe, expect, it } from "vitest";
import { HealthFactorBadge, getHealthFactorStatus } from "~~/components/custom/HealthFactorBadge";
import { renderMarkup } from "~~/utils/testing/render";

const badge = (healthFactor: string) => renderMarkup(<HealthFactorBadge healthFactor={healthFactor} />);

/** The badge's visible and screen-reader text, without tags. */
const text = (markup: string) =>
  markup
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

describe("HealthFactorBadge", () => {
  // A status colour, an icon and a word for every state; pink is never a status.
  it.each([
    ["∞", "info", "lucide-infinity", "Health factor No debt"],
    ["0.95", "destructive", "lucide-shield-alert", "Health factor 0.95 Critical"],
    ["1.09", "destructive", "lucide-shield-alert", "Health factor 1.09 Critical"],
    ["1.10", "warning", "lucide-triangle-alert", "Health factor 1.10 Risky"],
    ["1.49", "warning", "lucide-triangle-alert", "Health factor 1.49 Risky"],
    ["1.50", "success", "lucide-shield-check", "Health factor 1.50 Safe"],
    ["12.00", "success", "lucide-shield-check", "Health factor 12.00 Safe"],
    // Unparseable values fall through every comparison.
    ["n/a", "success", "lucide-shield-check", "Health factor n/a Safe"],
  ])("renders %j as the %s badge with its icon and word", (healthFactor, variant, icon, content) => {
    const markup = badge(healthFactor);

    expect(markup).toContain(`data-variant="${variant}"`);
    expect(markup).toContain(icon);
    expect(markup).not.toContain("bg-primary");
    expect(text(markup)).toBe(content);
  });

  it("renders an empty health factor as Safe without a number", () => {
    expect(text(badge(""))).toBe("Health factor Safe");
  });

  it("keeps the number in tabular figures and hides the icon from screen readers", () => {
    expect(badge("1.85")).toMatchSnapshot();
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
