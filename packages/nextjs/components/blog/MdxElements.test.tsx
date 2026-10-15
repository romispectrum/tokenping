// @vitest-environment jsdom
import type { ComponentType, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MDX_ELEMENTS } from "~~/components/blog/MdxElements";
import { headingId, textContent } from "~~/components/blog/headingId";
import { useMDXComponents } from "~~/mdx-components";
import { renderStaticMarkup } from "~~/utils/testing/render";

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

    // No heading above it: the generic name.
    const region = screen.getByRole("region", { name: "Table, scrolls horizontally" });
    expect(region.getAttribute("tabindex")).toBe("0");
    expect(region.className).toContain("overflow-x-auto");
    expect(region.querySelector("table")).not.toBeNull();
    expect(screen.getByRole("cell", { name: "WETH" })).toBeDefined();
  });

  it("names each table region after the heading above it, numbering tables that share one", () => {
    const [H2, H3, Table, P, Ul, Li] = ["h2", "h3", "table", "p", "ul", "li"].map(element);
    const table = (cell: string) => (
      <Table>
        <tbody>
          <tr>
            <td>{cell}</td>
          </tr>
        </tbody>
      </Table>
    );
    render(
      <>
        <H2>What is the formula?</H2>
        <P>Intro.</P>
        {table("a")}
        <H3>Worked example</H3>
        {table("b")}
        <P>Between the two.</P>
        {table("c")}
        <H2>Alert thresholds</H2>
        <Ul>
          <Li>
            <P>Pick the fall you want left.</P>
            {table("d")}
          </Li>
        </Ul>
      </>,
    );

    expect(screen.getAllByRole("region").map(region => region.getAttribute("aria-label"))).toEqual([
      "Table: What is the formula?",
      "Table 1: Worked example",
      "Table 2: Worked example",
      // inside a list item, the search continues above the list
      "Table: Alert thresholds",
    ]);
  });

  describe("scroll hint", () => {
    const renderTable = () => {
      const Table = element("table");
      return render(
        <Table>
          <tbody>
            <tr>
              <td>WETH</td>
            </tr>
          </tbody>
        </Table>,
      );
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("says the table scrolls sideways, and describes the region with it, while the table is wider", () => {
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(640);
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(358);
      renderTable();

      const hint = screen.getByText("Scroll sideways to see every column.");
      expect(hint.className).toContain("text-sm");
      expect(hint.className).not.toContain("md:hidden");
      expect(screen.getByRole("region").getAttribute("aria-describedby")).toBe(hint.id);
    });

    it("leaves the hint out when the whole table fits", () => {
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(358);
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(358);
      renderTable();

      expect(screen.queryByText("Scroll sideways to see every column.")).toBeNull();
      expect(screen.getByRole("region").getAttribute("aria-describedby")).toBeNull();
    });

    it("shows the hint below md only in the server HTML, before the width is measured", () => {
      const Table = element("table");
      const html = renderStaticMarkup(
        <Table>
          <tbody>
            <tr>
              <td>WETH</td>
            </tr>
          </tbody>
        </Table>,
      );

      expect(html).toContain("Scroll sideways to see every column.");
      expect(html).toMatch(/class="[^"]*md:hidden[^"]*"[^>]*>Scroll sideways/);
      expect(html).toContain('aria-label="Table, scrolls horizontally"');
    });
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
