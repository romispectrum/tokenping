// @vitest-environment jsdom
import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MDX_ELEMENTS } from "~~/components/blog/MdxElements";
import { headingId, textContent } from "~~/components/blog/headingId";
import { useMDXComponents } from "~~/mdx-components";

const element = (name: string) => MDX_ELEMENTS[name] as ComponentType<{ href?: string; children?: ReactNode }>;

describe("headingId", () => {
  it.each([
    ["Step 1: Connect your wallet", "step-1-connect-your-wallet"],
    [
      "Health factor vs LTV vs liquidation threshold: what's the difference?",
      "health-factor-vs-ltv-vs-liquidation-threshold-whats-the-difference",
    ],
    ["Is the health factor different on Aave V4?", "is-the-health-factor-different-on-aave-v4"],
    ["Interest drift: 1.66 → 1.61", "interest-drift-166-161"],
    ["  Crème brûlée  ", "creme-brulee"],
  ])("%j -> %j", (text, id) => {
    expect(headingId(text)).toBe(id);
  });
});

describe("textContent", () => {
  it("joins the text of nested elements", () => {
    expect(
      textContent([
        "What is ",
        <code key="c">getUserAccountData</code>,
        <strong key="s">
          {"?"}
          {1}
        </strong>,
      ]),
    ).toBe("What is getUserAccountData?1");
    expect(textContent(null)).toBe("");
  });
});

describe("MDX elements", () => {
  it("gives headings an anchor id from their text, including inline code", () => {
    const H2 = element("h2");
    const H3 = element("h3");
    render(
      <>
        <H2>
          How do you check <code>getUserAccountData</code>?
        </H2>
        <H3>Step 1: Connect your wallet</H3>
      </>,
    );

    expect(screen.getByRole("heading", { level: 2 }).id).toBe("how-do-you-check-getuseraccountdata");
    expect(screen.getByRole("heading", { level: 3 }).id).toBe("step-1-connect-your-wallet");
  });

  it("routes internal links through next/link and marks external links noopener noreferrer", () => {
    const A = element("a");
    render(
      <>
        <A href="/blog/aave-health-factor">hub</A>
        <A href="#sources">sources</A>
        <A href="https://aave.com/docs">docs</A>
      </>,
    );

    expect(screen.getByRole("link", { name: "hub" }).getAttribute("href")).toBe("/blog/aave-health-factor");
    expect(screen.getByRole("link", { name: "hub" }).getAttribute("rel")).toBeNull();
    expect(screen.getByRole("link", { name: "sources" }).getAttribute("href")).toBe("#sources");
    expect(screen.getByRole("link", { name: "docs" }).getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders tables as real tables inside a focusable horizontal scroll region", () => {
    const Table = element("table");
    render(
      <Table>
        <tbody>
          <tr>
            <td>WETH</td>
          </tr>
        </tbody>
      </Table>,
    );

    const region = screen.getByRole("region", { name: "Table, scrolls horizontally" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");
    expect(region.querySelector("table")?.className).toContain("table");
    expect(screen.getByRole("cell", { name: "WETH" })).toBeDefined();
  });
});

describe("useMDXComponents", () => {
  it("provides the styled elements and the article vocabulary, and lets a page override any of them", () => {
    const Override = () => null;
    const components = useMDXComponents({ AlertPrice: Override });

    expect(Object.keys(components)).toEqual(
      expect.arrayContaining([
        "h2",
        "h3",
        "a",
        "table",
        "ShortAnswer",
        "ScopeNote",
        "Callout",
        "LiquidationCalculator",
      ]),
    );
    expect(components.AlertPrice).toBe(Override);
    expect(useMDXComponents().AlertPrice).not.toBe(Override);
  });
});
