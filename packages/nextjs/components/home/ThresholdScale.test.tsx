// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThresholdScale } from "~~/components/home/ThresholdScale";
import { formatDecimal } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";

/** The scale as the "How it works" card renders it, with the page's labels and number format. */
const renderScale = (locale: Locale = "en") =>
  render(<ThresholdScale labels={HOME_MESSAGES[locale].scale} formatNumber={value => formatDecimal(locale, value)} />);

/** The zone names and their ranges, in bar order. */
const zones = (container: HTMLElement) =>
  [...container.querySelectorAll("dl > div")].map(zone => [
    zone.querySelector("dt")?.textContent,
    zone.querySelector("dd")?.textContent,
  ]);

describe("ThresholdScale", () => {
  it("pins the default threshold over the bar", () => {
    renderScale();

    expect(screen.getByText("Default 1.5")).toBeTruthy();
  });

  it("names the three zones with their ranges, critical to safe, as the dashboard's badges do", () => {
    const { container } = renderScale();

    expect(zones(container)).toEqual([
      ["Critical", "Below 1.1"],
      ["Risky", "1.1 to 1.5"],
      ["Safe", "1.5 and above"],
    ]);
    // Status never rests on colour alone: each name carries a glyph too.
    container.querySelectorAll("dt").forEach(term => {
      expect(term.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("marks the ends of the bar at 1 (liquidation) and 2, and says how far a typed value may go", () => {
    renderScale();

    expect(screen.getByText("liquidation").textContent).toBe("1 liquidation");
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Any value from 1.1 to 10. The dashboard's badges use the same zones.")).toBeTruthy();
  });

  it("writes every number with a decimal comma in Czech", () => {
    const { container } = renderScale("cs");

    expect(screen.getByText("Výchozí 1,5")).toBeTruthy();
    expect(zones(container)).toEqual([
      ["Kritický", "Pod 1,1"],
      ["Rizikový", "1,1 až 1,5"],
      ["Bezpečný", "1,5 a více"],
    ]);
    expect(screen.getByText("Libovolná hodnota od 1,1 do 10. Štítky v přehledu používají stejná pásma.")).toBeTruthy();
    expect(container.textContent).not.toContain("1.5");
  });

  it("gives the zones their share of the bar: 10% critical, 40% risky, 50% safe, each decorative", () => {
    const { container } = renderScale();
    const bar = [...container.querySelectorAll("[aria-hidden='true'][style]")] as HTMLElement[];

    expect(bar).toHaveLength(3);
    expect(bar.map(zone => zone.className)).toEqual(["bg-destructive", "bg-warning", "bg-success"]);
    const widths = bar.map(zone => parseFloat(zone.style.width));
    expect(widths[0]).toBeCloseTo(10);
    expect(widths[1]).toBeCloseTo(40);
    expect(widths[2]).toBeCloseTo(50);
  });
});
