// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthFactorChart } from "~~/components/home/HealthFactorChart";
import { formatDecimal } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";

const TIME_TICKS = ["22:00", "00:00", "02:00", "04:00", "06:00", "08:00"];

const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`);

/** The chart as the problem section renders it, with the page's labels and number format. */
const renderChart = (locale: Locale = "en") =>
  render(
    <HealthFactorChart labels={HOME_MESSAGES[locale].chart} formatNumber={value => formatDecimal(locale, value)} />,
  );

describe("HealthFactorChart", () => {
  it("is a figure whose caption says the numbers are an example", () => {
    renderChart();
    const figure = screen.getByRole("figure");

    expect(figure.querySelector("figcaption")?.textContent).toBe(
      "An example night. The alert goes out at 03:05, the first check below 1.5, five hours before you look.",
    );
  });

  it("marks the alert at 03:05 with the health factor it found, and the owner's look at 08:00", () => {
    renderChart();

    expect(screen.getByText("Alert sent (1.49)").textContent).toBe("03:05 Alert sent (1.49)");
    expect(screen.getByText("You check your phone").textContent).toBe("08:00 You check your phone");
  });

  it("labels the y axis at 2, the default threshold and the liquidation line, the notes hidden on a phone", () => {
    renderChart();
    const threshold = screen.getByText("1.5");
    const liquidation = screen.getByText("1");

    expect(screen.getByText("2").nextElementSibling).toBeNull();
    expect(threshold.nextElementSibling?.textContent).toBe("your threshold");
    expect(liquidation.nextElementSibling?.textContent).toBe("liquidation");
    for (const note of [threshold.nextElementSibling, liquidation.nextElementSibling]) {
      expect(note?.className).toContain("hidden sm:block");
    }
  });

  it("formats every figure for the page's language", () => {
    renderChart("cs");

    expect(screen.getByText("1,5").nextElementSibling?.textContent).toBe("váš práh");
    expect(screen.getByText("Upozornění odesláno (1,49)").textContent).toBe("03:05 Upozornění odesláno (1,49)");
    expect(screen.queryByText("1.5")).toBeNull();
  });

  it("ticks the time axis from 22:00 to 08:00 in two-hour steps", () => {
    renderChart();
    const axis = screen.getByText("22:00").parentElement!;

    expect([...axis.children].map(tick => tick.textContent)).toEqual(TIME_TICKS);
  });

  it("draws the zones, the reference lines and the curve in one decorative SVG", () => {
    const { container } = renderChart();
    const svg = container.querySelector("svg")!;
    const zones = [...svg.querySelectorAll("rect")];

    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    // Safe on top, risky, then critical down to the bottom: the badge's zones, filling the plot.
    expect(zones.map(zone => zone.getAttribute("class"))).toEqual([
      "fill-success-subtle",
      "fill-warning-subtle",
      "fill-destructive-subtle",
    ]);
    expect(zones.reduce((total, zone) => total + Number(zone.getAttribute("height")), 0)).toBeCloseTo(100);
    expect(svg.querySelectorAll("line")).toHaveLength(2);
    expect(svg.querySelectorAll("polyline")).toHaveLength(1);
    expect(svg.querySelector("polyline")?.getAttribute("class")).toContain("stroke-chart-1");
    expect(within(screen.getByRole("figure")).queryByRole("img")).toBeNull();
  });

  it.each<Locale>(["en", "cs"])("uses no em or en dash in its text (%s)", locale => {
    const { container } = renderChart(locale);

    expect(container.textContent).not.toMatch(DASHES);
  });
});
