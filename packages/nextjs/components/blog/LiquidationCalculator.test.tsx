// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlertPriceText } from "~~/components/blog/AlertPrice";
import { LiquidationCalculator } from "~~/components/blog/LiquidationCalculator";
import { BLOG_MDX_COMPONENTS } from "~~/components/blog/mdxComponents";
import AaveLiquidationPrice from "~~/content/blog/aave-liquidation-price.mdx";
import { renderHtml } from "~~/utils/testing/render";

afterEach(() => {
  vi.useRealTimers();
});

const group = (name: string) => within(screen.getByRole("group", { name }));
const results = () => within(screen.getByRole("region", { name: "Result" }));

/** The value and description of the result row whose title is `title`. */
const resultRow = (title: string) => {
  const row = results().getByText(title, { selector: "dt" }).parentElement!;
  const [value, description] = [...row.querySelectorAll("dd")].map(dd => dd.textContent);
  return { value, description };
};

const resultTitles = () =>
  results()
    .queryAllByRole("term")
    .map(dt => dt.textContent);

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

const loadExample = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }));

const choosePreset = (collateral: ReturnType<typeof group>, presetId: string) =>
  fireEvent.change(collateral.getByLabelText("Aave V3 asset (fills the threshold)"), { target: { value: presetId } });

const borrowVolatile = (name: string, amount: string, price: string) => {
  fireEvent.click(group("What did you borrow?").getByLabelText("A volatile asset, such as WETH"));
  type(group("Debt").getByLabelText("Asset name (optional)"), name);
  type(group("Debt").getByLabelText("Amount borrowed (tokens)"), amount);
  type(group("Debt").getByLabelText("Price of the borrowed asset (USD)"), price);
};

const E_MODE_STABLE_DEBT =
  "No result: Aave does not allow this combination. Ethereum Core’s “ETH correlated” E-Mode only lets you borrow WETH, so an account with a stablecoin loan cannot use its 95% threshold. Pick the collateral’s own threshold instead (Ethereum Core WETH: 83%), or borrow WETH.";

describe("LiquidationCalculator", () => {
  it("is a labelled region, prefilled with example A (10 WETH at $2,400, LT 83%, 12,000 USDC)", () => {
    render(<LiquidationCalculator />);

    expect(screen.getByRole("region", { name: "Aave liquidation price calculator" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 3, name: "Aave liquidation price calculator" })).toBeDefined();
    const collateral = group("Collateral 1");
    expect(collateral.getByLabelText<HTMLSelectElement>("Aave V3 asset (fills the threshold)").value).toBe(
      "ethereum-core-weth",
    );
    expect(collateral.getByLabelText<HTMLInputElement>("Asset name (optional)").value).toBe("WETH");
    expect(collateral.getByLabelText<HTMLInputElement>("Amount supplied").value).toBe("10");
    expect(collateral.getByLabelText<HTMLInputElement>("Price (USD)").value).toBe("2400");
    expect(collateral.getByLabelText<HTMLInputElement>("Liquidation threshold (%)").value).toBe("83");
    expect(group("Debt").getByLabelText<HTMLInputElement>("Amount borrowed (USD)").value).toBe("12000");
    expect(
      group("What did you borrow?").getByLabelText<HTMLInputElement>("A stablecoin (counted at $1.00)").checked,
    ).toBe(true);

    expect(resultRow("Health factor")).toEqual({
      value: "1.66",
      description: "The position can be liquidated below 1.00.",
    });
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$1,445.78",
      description: "39.8% below $2,400.00, if every other price stays the same.",
    });
    expect(results().getByText(/Health factor = \$19,920\.00 ÷ \$12,000\.00 of debt = 1\.66\./)).toBeDefined();
    expect(resultTitles()).toEqual(["Health factor", "WETH liquidation price"]);
  });

  it("server-renders the prefilled result, the dated estimate note and a no-JavaScript note", () => {
    const html = renderHtml(<LiquidationCalculator />);

    expect(html).toContain("$1,445.78");
    expect(html).toContain("1.66");
    expect(html).toContain("Educational estimate, not financial advice.");
    expect(html).toContain("Live Aave parameters can change");
    expect(html).toContain('<time dateTime="2026-10-14">14 October 2026</time>');
    expect(html).toMatch(/<noscript>.*needs JavaScript to recalculate.*<\/noscript>/s);
  });

  it("recalculates as you type: the borrow limit ($19,320) gives HF 1.031 and $2,327.71, a 3.0% fall", () => {
    render(<LiquidationCalculator />);
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "19,320");

    expect(resultRow("Health factor").value).toBe("1.031");
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$2,327.71",
      description: "3.0% below $2,400.00, if every other price stays the same.",
    });
  });

  it("example B: two collaterals, each price with the other held, and both falling together", () => {
    render(<LiquidationCalculator />);
    loadExample("10 WETH + 0.2 WBTC, 20,000 USDC debt");

    expect(group("Collateral 2").getByLabelText<HTMLInputElement>("Liquidation threshold (%)").value).toBe("78");
    expect(resultRow("Health factor").value).toBe("1.632");
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$877.83",
      description: "63.4% below $2,400.00, if every other price stays the same.",
    });
    expect(resultRow("WBTC liquidation price")).toEqual({
      value: "$512.82",
      description: "99.4% below $81,500.00, if every other price stays the same.",
    });
    expect(resultRow("All collateral falls together")).toEqual({
      value: "38.7%",
      description:
        "If every collateral price falls this much and the debt price does not move, the health factor reaches 1.00: WETH at $1,470.86 and WBTC at $49,947.91.",
    });
  });

  it("example C: volatile debt liquidates on the upside at $3,120, and at $2,745.60 if USDC is at $0.88", () => {
    render(<LiquidationCalculator />);
    loadExample("10,000 USDC, 2.5 WETH borrowed");

    expect(
      group("What did you borrow?").getByLabelText<HTMLInputElement>("A volatile asset, such as WETH").checked,
    ).toBe(true);
    expect(group("Debt").getByLabelText<HTMLInputElement>("Amount borrowed (tokens)").value).toBe("2.5");
    expect(group("Debt").getByLabelText<HTMLInputElement>("Price of the borrowed asset (USD)").value).toBe("2400");
    expect(resultRow("Health factor").value).toBe("1.30");
    expect(resultRow("WETH liquidation price (borrowed)")).toEqual({
      value: "$3,120.00",
      description: "30.0% above $2,400.00: borrowed assets push the health factor down as they rise.",
    });
    expect(resultRow("USDC liquidation price")).toEqual({
      value: "$0.7692",
      description: "23.1% below $1.00, if every other price stays the same.",
    });
    expect(resultRow("WETH ÷ USDC price at liquidation")).toEqual({
      value: "3,120",
      description: "Now 2,400. If both prices move, a 30.0% rise in this ratio takes the health factor to 1.00.",
    });

    type(group("Collateral 1").getByLabelText("Price (USD)"), "0.88");
    expect(resultRow("Health factor").value).toBe("1.144");
    expect(resultRow("WETH liquidation price (borrowed)").value).toBe("$2,745.60");
  });

  it("states the price ratio as collateral ÷ debt when that reads above 1 (wstETH against WETH in E-Mode)", () => {
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    fireEvent.change(collateral.getByLabelText("Aave V3 asset (fills the threshold)"), {
      target: { value: "ethereum-core-emode-eth" },
    });
    expect(collateral.getByLabelText<HTMLInputElement>("Liquidation threshold (%)").value).toBe("95");
    // The E-Mode preset covers several assets, so it leaves the name alone.
    type(collateral.getByLabelText("Asset name (optional)"), "wstETH");
    type(collateral.getByLabelText("Amount supplied"), "100");
    type(collateral.getByLabelText("Price (USD)"), "2400");
    fireEvent.click(group("What did you borrow?").getByLabelText("A volatile asset, such as WETH"));
    type(group("Debt").getByLabelText("Asset name (optional)"), "WETH");
    type(group("Debt").getByLabelText("Amount borrowed (tokens)"), "90");
    type(group("Debt").getByLabelText("Price of the borrowed asset (USD)"), "2400");

    expect(resultRow("Health factor").value).toBe("1.056");
    expect(resultRow("wstETH ÷ WETH price at liquidation")).toEqual({
      value: "0.947368",
      description: "Now 1. If both prices move, a 5.3% fall in this ratio takes the health factor to 1.00.",
    });
  });

  it("fills the threshold from a dated preset and returns the select to 'Other' when the threshold is edited", () => {
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    const preset = collateral.getByLabelText<HTMLSelectElement>("Aave V3 asset (fills the threshold)");
    expect(within(preset).getByRole("group", { name: "Arbitrum (read 14 October 2026)" })).toBeDefined();

    fireEvent.change(preset, { target: { value: "arbitrum-weth" } });
    type(collateral.getByLabelText("Amount supplied"), "5");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "7000");
    expect(collateral.getByLabelText<HTMLInputElement>("Liquidation threshold (%)").value).toBe("84");
    expect(resultRow("Health factor").value).toBe("1.44");
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$1,666.67",
      description: "30.6% below $2,400.00, if every other price stays the same.",
    });

    type(collateral.getByLabelText("Liquidation threshold (%)"), "83");
    expect(preset.value).toBe("");
    expect(resultRow("WETH liquidation price").value).toBe("$1,686.75");

    // Typing the preset's own value back keeps it selected; a threshold cut to 80% moves example A to $1,500.00.
    fireEvent.change(preset, { target: { value: "ethereum-core-weth" } });
    type(collateral.getByLabelText("Liquidation threshold (%)"), "83.0");
    expect(preset.value).toBe("ethereum-core-weth");
    loadExample("10 WETH, 12,000 USDC debt");
    type(collateral.getByLabelText("Liquidation threshold (%)"), "80");
    expect(resultRow("WETH liquidation price").value).toBe("$1,500.00");
  });

  it("flags invalid input on the field itself and withholds the result until every field is a number", () => {
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    const amount = collateral.getByLabelText("Amount supplied");

    type(amount, "2,5");
    expect(amount.getAttribute("aria-invalid")).toBe("true");
    const errorId = amount.getAttribute("aria-describedby")!;
    expect(document.getElementById(errorId)?.textContent).toBe(
      "Enter a number such as 10 or 0.25, with a dot for decimals.",
    );
    expect(results().getByText("Enter a number in every field to see the result.")).toBeDefined();
    expect(resultTitles()).toEqual([]);

    type(amount, "10");
    expect(amount.getAttribute("aria-invalid")).toBeNull();
    expect(amount.getAttribute("aria-describedby")).toBeNull();

    const price = collateral.getByLabelText("Price (USD)");
    type(price, "0");
    expect(collateral.getByText("Enter a price above 0.")).toBeDefined();
    expect(price.getAttribute("aria-describedby")).toMatch(/-hint .+-error$/);
    type(price, "2400");

    type(collateral.getByLabelText("Liquidation threshold (%)"), "120");
    expect(collateral.getByText("Enter a percentage above 0 and at most 100.")).toBeDefined();

    // An empty field is not an error yet, but there is still no result.
    type(collateral.getByLabelText("Liquidation threshold (%)"), "");
    expect(collateral.queryByText("Enter a percentage above 0 and at most 100.")).toBeNull();
    expect(results().getByText("Enter a number in every field to see the result.")).toBeDefined();
  });

  it("shows a liquidatable position as such, with the price that brings it back to 1.00", () => {
    render(<LiquidationCalculator />);
    type(group("Collateral 1").getByLabelText("Price (USD)"), "1420");

    expect(resultRow("Health factor")).toEqual({
      value: "0.982",
      description: "Below 1.00: the position can be liquidated now.",
    });
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$1,445.78",
      description: "The health factor gets back to 1.00 if WETH rises 1.8% from $1,420.00, other prices unchanged.",
    });

    // Two collaterals at §4.4's $1,420 ETH: no "falls together" row once the position is already liquidatable.
    loadExample("10 WETH + 0.2 WBTC, 20,000 USDC debt");
    type(group("Collateral 1").getByLabelText("Price (USD)"), "1420");
    type(group("Collateral 2").getByLabelText("Price (USD)"), "50000");
    expect(resultRow("Health factor").value).toBe("0.979"); // (11,786 + 7,800) ÷ 20,000 = 0.9793
    expect(resultTitles()).toEqual(["Health factor", "WETH liquidation price", "WBTC liquidation price"]);

    // Volatile debt above its liquidation price: ETH at $3,200 against example C (7,800 ÷ 8,000 = 0.975).
    loadExample("10,000 USDC, 2.5 WETH borrowed");
    type(group("Debt").getByLabelText("Price of the borrowed asset (USD)"), "3200");
    expect(resultRow("Health factor").value).toBe("0.975");
    expect(resultRow("WETH liquidation price (borrowed)")).toEqual({
      value: "$3,120.00",
      description: "The health factor gets back to 1.00 if WETH falls 2.5% from $3,200.00, other prices unchanged.",
    });
    expect(resultTitles()).toEqual(["Health factor", "USDC liquidation price", "WETH liquidation price (borrowed)"]);
  });

  it("says there is nothing to liquidate without debt, and no price when other collateral covers the debt", () => {
    render(<LiquidationCalculator />);
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "0");
    expect(resultRow("Health factor")).toEqual({
      value: "∞",
      description: "No debt, so there is nothing to liquidate.",
    });
    expect(resultTitles()).toEqual(["Health factor"]);

    loadExample("10 WETH + 0.2 WBTC, 20,000 USDC debt");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "19000");
    expect(resultRow("WBTC liquidation price")).toEqual({
      value: "None",
      description:
        "Even at $0, WBTC alone cannot take the health factor below 1.00: the other collateral covers the debt.",
    });
  });

  it("adds and removes a second collateral, moving focus to the new fields and back", () => {
    render(<LiquidationCalculator />);
    fireEvent.click(screen.getByRole("button", { name: "Add a second collateral" }));

    const second = group("Collateral 2");
    expect(document.activeElement).toBe(second.getByLabelText("Aave V3 asset (fills the threshold)"));
    expect(screen.queryByRole("button", { name: "Add a second collateral" })).toBeNull();
    expect(results().getByText("Enter a number in every field to see the result.")).toBeDefined();

    fireEvent.change(second.getByLabelText("Aave V3 asset (fills the threshold)"), {
      target: { value: "ethereum-core-wbtc" },
    });
    type(second.getByLabelText("Amount supplied"), "0.2");
    type(second.getByLabelText("Price (USD)"), "$81,500");
    // (19,920 + 12,714) ÷ 12,000 = 2.7195
    expect(resultRow("Health factor").value).toBe("2.72");
    expect(resultRow("WBTC liquidation price").value).toBe("None");

    fireEvent.click(second.getByRole("button", { name: "Remove collateral 2" }));
    expect(screen.queryByRole("group", { name: "Collateral 2" })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add a second collateral" }));
    expect(resultRow("Health factor").value).toBe("1.66");
  });

  it("keeps unnamed assets readable with default names", () => {
    render(<LiquidationCalculator />);
    type(group("Collateral 1").getByLabelText("Asset name (optional)"), " ");
    expect(resultRow("Collateral 1 liquidation price").value).toBe("$1,445.78");
  });

  it("announces the result to screen readers once typing pauses", () => {
    vi.useFakeTimers();
    render(<LiquidationCalculator />);
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Health factor: 1.66. WETH liquidation price: $1,445.78.");

    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "1");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "16600");
    expect(status.textContent).toBe("Health factor: 1.66. WETH liquidation price: $1,445.78.");

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(status.textContent).toBe("Health factor: 1.20. WETH liquidation price: $2,000.00.");
  });
  it("withholds the result when the E-Mode preset meets stablecoin debt, which that category cannot borrow", () => {
    vi.useFakeTimers();
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    choosePreset(collateral, "ethereum-core-emode-eth");

    expect(collateral.getByLabelText<HTMLInputElement>("Liquidation threshold (%)").value).toBe("95");
    // The name the WETH preset filled in is cleared: the E-Mode threshold covers several assets.
    const name = collateral.getByLabelText<HTMLInputElement>("Asset name (optional)");
    expect(name.value).toBe("");
    expect(name.placeholder).toBe("e.g. WETH or wstETH");
    const select = collateral.getByLabelText("Aave V3 asset (fills the threshold)");
    const [hintId, issueId] = select.getAttribute("aria-describedby")!.split(" ");
    expect(document.getElementById(hintId)?.textContent).toBe(
      "Counts at this threshold for WETH, wstETH, cbETH, rETH, weETH, osETH and ETHx; other collateral keeps its own. In this E-Mode you can borrow only WETH.",
    );
    expect(document.getElementById(issueId)?.textContent).toBe(E_MODE_STABLE_DEBT);
    // Not "Health factor 1.90" and "$1,263.16": 12.6% more optimistic than WETH's real 83% allows.
    expect(resultTitles()).toEqual([]);
    expect(results().queryByText("$1,263.16")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByRole("status").textContent).toBe(E_MODE_STABLE_DEBT);

    // Without debt there is no loan to conflict with.
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "0");
    expect(resultRow("Health factor").value).toBe("∞");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "12000");

    // A volatile debt the category cannot lend is refused too; WETH (or ETH, as the Aave app calls it) is fine.
    borrowVolatile("USDT", "9000", "1");
    expect(results().getByText(/an account with borrowed USDT cannot use its 95% threshold/)).toBeDefined();
    expect(resultTitles()).toEqual([]);
    type(group("Debt").getByLabelText("Asset name (optional)"), "ETH");
    expect(resultTitles()[0]).toBe("Health factor");

    // Back to WETH's own threshold: the name returns and example A's result with it.
    loadExample("10 WETH, 12,000 USDC debt");
    choosePreset(collateral, "ethereum-core-emode-eth");
    choosePreset(collateral, "ethereum-core-weth");
    expect(select.getAttribute("aria-describedby")).toBeNull();
    expect(resultRow("WETH liquidation price").value).toBe("$1,445.78");
  });

  it("keeps a name typed by hand when the E-Mode preset is chosen", () => {
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    type(collateral.getByLabelText("Asset name (optional)"), "weETH");
    choosePreset(collateral, "ethereum-core-emode-eth");
    expect(collateral.getByLabelText<HTMLInputElement>("Asset name (optional)").value).toBe("weETH");
  });

  it("E-Mode WETH against borrowed WETH: one price on both sides, so no liquidation price and no ratio", () => {
    render(<LiquidationCalculator />);
    const collateral = group("Collateral 1");
    choosePreset(collateral, "ethereum-core-emode-eth");
    type(collateral.getByLabelText("Asset name (optional)"), "WETH");
    borrowVolatile("weth", "9", "2400");

    expect(resultRow("Health factor").value).toBe("1.056");
    expect(resultTitles()).toEqual(["Health factor", "WETH liquidation price (supplied and borrowed)"]);
    expect(resultRow("WETH liquidation price (supplied and borrowed)")).toEqual({
      value: "None",
      description:
        "WETH is both your collateral and your debt, so the two move together and its price does not change the health factor. Interest, a threshold change or your own transactions still do.",
    });
  });

  it("solves for one WETH price when WETH is both collateral and debt next to other collateral", () => {
    render(<LiquidationCalculator />);
    loadExample("10 WETH + 0.2 WBTC, 20,000 USDC debt");
    borrowVolatile("WETH", "8", "2400");

    // 32,634 ÷ 19,200. Not "$781.45": that held the borrowed WETH at $2,400 while the supplied WETH fell.
    expect(resultRow("Health factor").value).toBe("1.70");
    expect(results().queryByText("$781.45")).toBeNull();
    expect(resultTitles()).toEqual([
      "Health factor",
      "WETH liquidation price (supplied and borrowed)",
      "WBTC liquidation price",
    ]);
    expect(resultRow("WETH liquidation price (supplied and borrowed)")).toEqual({
      value: "None",
      description:
        "WETH is on both sides, so the two move together: its price alone cannot take the health factor below 1.00.",
    });

    // Borrow 9: 12,714 ÷ (9 − 10 × 0.83) = $18,162.86, a price on the upside.
    type(group("Debt").getByLabelText("Amount borrowed (tokens)"), "9");
    expect(resultRow("WETH liquidation price (supplied and borrowed)")).toEqual({
      value: "$18,162.86",
      description:
        "656.8% above $2,400.00: you borrowed more WETH than your WETH collateral counts for, so a rise pushes the health factor down. Other prices unchanged.",
    });
  });

  it("treats two collateral rows of one asset as one price", () => {
    render(<LiquidationCalculator />);
    fireEvent.click(screen.getByRole("button", { name: "Add a second collateral" }));
    const second = group("Collateral 2");
    choosePreset(second, "ethereum-core-weth");
    type(second.getByLabelText("Amount supplied"), "5");
    type(second.getByLabelText("Price (USD)"), "2400");

    // 12,000 ÷ (15 × 0.83)
    expect(resultTitles()).toEqual(["Health factor", "WETH liquidation price", "All collateral falls together"]);
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$963.86",
      description: "59.8% below $2,400.00 for every WETH row, if every other price stays the same.",
    });
  });

  it("asks for one price when the same asset is entered twice at different prices", () => {
    render(<LiquidationCalculator />);
    loadExample("10 WETH, 12,000 USDC debt");
    borrowVolatile("WETH", "4", "2450");

    const price = group("Debt").getByLabelText("Price of the borrowed asset (USD)");
    expect(price.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(price.getAttribute("aria-describedby")!)?.textContent).toBe(
      "WETH is already entered above at $2,400.00. Use the same price: one asset has one price.",
    );
    expect(resultTitles()).toEqual([]);

    type(price, "2,400");
    expect(price.getAttribute("aria-invalid")).toBeNull();
    expect(resultRow("Health factor").value).toBe("2.075"); // 19,920 ÷ 9,600
  });

  it("converts the amount borrowed when the debt switches between a stablecoin (USD) and a volatile asset (tokens)", () => {
    render(<LiquidationCalculator />);
    loadExample("10,000 USDC, 2.5 WETH borrowed");
    fireEvent.click(group("What did you borrow?").getByLabelText("A stablecoin (counted at $1.00)"));

    const debt = group("Debt");
    expect(debt.getByLabelText<HTMLInputElement>("Amount borrowed (USD)").value).toBe("6000");
    expect(debt.getByLabelText<HTMLInputElement>("Asset name (optional)").value).toBe("");
    // Still example C (7,800 ÷ 6,000), not "3,120.00" from reading 2.5 tokens as $2.50.
    expect(resultRow("Health factor").value).toBe("1.30");
    expect(resultRow("USDC liquidation price").value).toBe("$0.7692");

    fireEvent.click(group("What did you borrow?").getByLabelText("A volatile asset, such as WETH"));
    expect(debt.getByLabelText<HTMLInputElement>("Amount borrowed (tokens)").value).toBe("2.5");
    expect(resultRow("Debt asset liquidation price (borrowed)").value).toBe("$3,120.00");

    // Without a price there is nothing to convert 12,000 USD with, so the amount is cleared rather than misread.
    loadExample("10 WETH, 12,000 USDC debt");
    fireEvent.click(group("What did you borrow?").getByLabelText("A volatile asset, such as WETH"));
    expect(debt.getByLabelText<HTMLInputElement>("Amount borrowed (tokens)").value).toBe("");
    expect(results().getByText("Enter a number in every field to see the result.")).toBeDefined();
  });

  it("shows prices under $1 with at least two significant digits", () => {
    render(<LiquidationCalculator />);
    type(group("Collateral 1").getByLabelText("Price (USD)"), "0.5");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "2");
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$0.241",
      description: "51.8% below $0.50, if every other price stays the same.",
    });

    type(group("Collateral 1").getByLabelText("Price (USD)"), "2400");
    type(group("Collateral 1").getByLabelText("Amount supplied"), "1000000");
    type(group("Debt").getByLabelText("Amount borrowed (USD)"), "12000");
    expect(resultRow("WETH liquidation price")).toEqual({
      value: "$0.01446",
      description: ">99.9% below $2,400.00, if every other price stays the same.",
    });
  });

  it("is in the server HTML of the aave-liquidation-price article, under an h2, with its static result", () => {
    // The post page passes its own AlertPrice; the plan does not matter here.
    const html = renderHtml(
      <AaveLiquidationPrice
        components={{ ...BLOG_MDX_COMPONENTS, AlertPrice: () => <AlertPriceText plan={null} /> }}
      />,
    );

    // From the calculator's heading to the end of its disclaimer, so the article's own figures cannot satisfy this.
    const start = html.indexOf(">Aave liquidation price calculator</h3>");
    const end = html.indexOf("before you act.", start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const calculator = html.slice(start, end);
    expect(calculator).toContain("Health factor");
    expect(calculator).toContain("$1,445.78");
    expect(calculator).toContain("WETH liquidation price");
    expect(calculator).toMatch(/<noscript>.*needs JavaScript to recalculate.*<\/noscript>/s);
    expect(calculator).toContain("Educational estimate, not financial advice.");
    expect(calculator).toContain('<time dateTime="2026-10-14">14 October 2026</time>');

    // No h1 in the body (the page template renders it) and no skipped levels down to the calculator's h3 and h4.
    const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map(match => Number(match[1]));
    expect(levels[0]).toBe(2);
    levels.slice(1).forEach((level, i) => expect(level).toBeLessThanOrEqual(levels[i] + 1));
    const headings = [...html.matchAll(/<h([1-6])[^>]*>(.*?)<\/h\1>/g)].map(([, level, text]) => `${level} ${text}`);
    const calculatorHeading = headings.indexOf("3 Aave liquidation price calculator");
    expect(calculatorHeading).toBeGreaterThan(0);
    expect(headings[calculatorHeading - 1]).toMatch(/^2 /);
    expect(headings[calculatorHeading + 1]).toBe("4 Result");
  });
});
