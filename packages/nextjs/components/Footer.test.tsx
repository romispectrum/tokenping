// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { arbitrum, hardhat } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "~~/components/Footer";
import { renderMarkup } from "~~/utils/testing/render";

const state = vi.hoisted(() => ({ price: 0, targetNetworkId: 42161 }));

vi.mock("@scaffold-ui/hooks", () => ({ useFetchNativeCurrencyPrice: () => ({ price: state.price }) }));

vi.mock("~~/hooks/scaffold-eth/useTargetNetwork", () => ({
  useTargetNetwork: () => ({ targetNetwork: { id: state.targetNetworkId } }),
}));

vi.mock("~~/components/ui/ThemeChoice", () => ({ ThemeChoice: () => <div data-stub="theme-choice" /> }));

vi.mock("~~/components/scaffold-eth", () => ({ Faucet: () => <button data-stub="faucet" /> }));

const renderFooter = () => renderMarkup(<Footer />);

describe("Footer", () => {
  beforeEach(() => {
    state.price = 0;
    state.targetNetworkId = arbitrum.id;
  });

  it("is the page's contentinfo landmark", () => {
    expect(renderFooter()).toMatch(/^<footer[ >]/);
  });

  it("renders the theme choice and the footer links without a price on a live network", () => {
    const html = renderFooter();

    expect(html).toContain('data-stub="theme-choice"');
    expect(html).not.toContain('class="truncate"');
    expect(html).not.toContain('data-stub="faucet"');
    expect(html).toMatchSnapshot();
  });

  it("shows the ETH price with two decimals when it is positive, named in words", () => {
    state.price = 1234.567;

    expect(renderFooter()).toContain('<p class="m-0 tabular-nums">ETH price: $1234.57</p>');
    render(<Footer />);
    expect(screen.getByText("ETH price: $1234.57").tagName).toBe("P");
  });

  // Nothing fixed on a live network, so nothing can cover page content.
  it("keeps the price in the band's bottom row, in the page flow", () => {
    state.price = 3000;
    const { container } = render(<Footer />);
    const band = container.querySelector("footer > .dark")!;

    expect(band.contains(screen.getByText("ETH price: $3000.00"))).toBe(true);
    expect(container.querySelector('[class*="fixed"]')).toBeNull();
  });

  it("shows the faucet and the block explorer link on the local network", () => {
    state.price = 3000;
    state.targetNetworkId = hardhat.id;
    render(<Footer />);

    expect(document.querySelector('[data-stub="faucet"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: /Block explorer/ }).getAttribute("href")).toBe("/blockexplorer");
    expect(renderFooter()).toMatchSnapshot();
  });

  it("is an always-dark band with the logo and no pink, the local tools floating outside it", () => {
    state.price = 3000;
    state.targetNetworkId = hardhat.id;
    const { container } = render(<Footer />);
    const band = container.querySelector("footer > .dark")!;

    expect(band.className).toContain("bg-background");
    expect(
      within(band as HTMLElement)
        .getByRole("link", { name: "Tokenping home" })
        .querySelector("svg"),
    ).toBeTruthy();
    expect(band.innerHTML).not.toMatch(/bg-primary|btn-primary|text-primary|brand-pink/);
    expect(band.contains(screen.getByRole("link", { name: /Block explorer/ }))).toBe(false);
  });

  it("links GitHub, the Telegram community and the X account in new tabs without opener or referrer", () => {
    render(<Footer />);

    for (const [name, href] of [
      ["Tokenping source code on GitHub", "https://github.com/romispectrum/tokenping"],
      ["Tokenping Telegram community", "https://t.me/tokenping_xyz"],
      ["Tokenping on X", "https://x.com/tokenping"],
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("links the blog, its RSS feed and the privacy page in the same tab", () => {
    render(<Footer />);

    for (const [name, href] of [
      ["Blog", "/blog"],
      ["Tokenping blog RSS feed", "/blog/feed.xml"],
      ["Privacy", "/privacy"],
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.hasAttribute("target")).toBe(false);
    }
  });

  it("keeps each visible link label inside its accessible name", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Footer" });

    for (const link of within(nav).getAllByRole("link")) {
      const name = link.getAttribute("aria-label") ?? link.textContent ?? "";
      expect(name).toContain(link.textContent);
    }
  });

  it("puts each footer link in its own item of a valid list, in order", () => {
    render(<Footer />);
    const lists = within(screen.getByRole("navigation", { name: "Footer" })).getAllByRole("list");

    lists.forEach(list => expect(list.querySelectorAll(":scope > :not(li)")).toHaveLength(0));
    expect(
      lists.flatMap(list =>
        within(list)
          .getAllByRole("listitem")
          .map(item => within(item).getByRole("link").textContent),
      ),
    ).toEqual(["Blog", "RSS", "GitHub", "X", "Telegram", "Privacy"]);
  });

  it("names each link column with its heading", () => {
    render(<Footer />);
    const nav = screen.getByRole("navigation", { name: "Footer" });

    expect(
      within(nav)
        .getAllByRole("list")
        .map(list => list.getAttribute("aria-labelledby")),
    ).toEqual(["footer-resources", "footer-community", "footer-legal"]);
    expect(
      within(nav)
        .getAllByRole("heading", { level: 2 })
        .map(heading => heading.textContent),
    ).toEqual(["Resources", "Community", "Legal"]);
  });

  it("says Tokenping is independent of Aave", () => {
    render(<Footer />);

    expect(screen.getByText("Independent tool, not affiliated with Aave Labs or the Aave DAO.")).toBeTruthy();
  });

  it("no longer promises more protocols", () => {
    expect(renderFooter()).not.toMatch(/protocols|coming soon/i);
  });
});
