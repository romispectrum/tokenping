// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { arbitrum, hardhat } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BetaBanner } from "~~/components/BetaBanner";
import { Header } from "~~/components/Header";
import { renderMarkup } from "~~/utils/testing/render";

// Seeded in beforeEach.
const state = vi.hoisted(() => ({ pathname: "", targetNetworkId: 0 }));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));

// The real outside-click hook, so the burger menu reacts to actual document clicks.
vi.mock("~~/hooks/scaffold-eth", async () => {
  const { useOutsideClick } = await import("~~/hooks/scaffold-eth/useOutsideClick");
  return { useOutsideClick, useTargetNetwork: () => ({ targetNetwork: { id: state.targetNetworkId } }) };
});

vi.mock("~~/components/scaffold-eth", () => ({
  RainbowKitCustomConnectButton: () => <button data-stub="connect" />,
  FaucetButton: () => <button data-stub="faucet-button">Faucet</button>,
}));

// Server markup, for the snapshots only.
const renderHeaderMarkup = () => renderMarkup(<Header />);

const isActive = (link: HTMLElement) => link.className.startsWith("bg-secondary shadow-md ");

const renderOpenBurgerMenu = () => {
  const { container } = render(<Header />);
  const burgerMenu = container.querySelector("details")!;
  burgerMenu.open = true;
  return burgerMenu;
};

describe("Header", () => {
  beforeEach(() => {
    state.pathname = "/";
    state.targetNetworkId = arbitrum.id;
  });

  it("renders the header on the home route", () => {
    expect(renderHeaderMarkup()).toMatchSnapshot();
  });

  it("renders the header on the local network", () => {
    state.targetNetworkId = hardhat.id;

    expect(renderHeaderMarkup()).toMatchSnapshot();
  });

  it("is the page's only banner landmark, next to the beta strip", () => {
    render(
      <>
        <BetaBanner />
        <Header />
      </>,
    );
    const banner = screen.getByRole("banner");

    expect(banner.tagName).toBe("HEADER");
    expect(within(banner).getByRole("link", { name: "Tokenping home" })).toBeTruthy();
  });

  it("labels the logo with the Tokenping brand", () => {
    render(<Header />);

    expect(screen.getByRole("img", { name: "Tokenping logo" }).getAttribute("src")).toBe("/logo.svg");
  });

  it("marks only the exactly matching menu link as active, as the current page", () => {
    state.pathname = "/aave";
    render(<Header />);

    // Desktop and mobile menus both render the links.
    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
    expect(dashboardLinks.map(isActive)).toEqual([true, true]);
    expect(dashboardLinks.map(link => link.getAttribute("aria-current"))).toEqual(["page", "page"]);
    expect(screen.getAllByRole("link", { name: "Home" }).map(isActive)).toEqual([false, false]);
    expect(screen.getAllByRole("link", { name: "Blog" }).map(isActive)).toEqual([false, false]);
  });

  it("puts both menus in the header's one navigation landmark, named Main", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Main" });

    expect(within(screen.getByRole("banner")).getAllByRole("navigation")).toEqual([nav]);
    // Mobile dropdown and desktop menu.
    for (const name of ["Home", "Dashboard", "Blog"])
      expect(within(nav).getAllByRole("link", { name })).toHaveLength(2);
  });

  it("links the dashboard at /aave and the blog at /blog", () => {
    render(<Header />);

    expect(screen.getAllByRole("link", { name: "Dashboard" }).map(link => link.getAttribute("href"))).toEqual([
      "/aave",
      "/aave",
    ]);
    expect(screen.getAllByRole("link", { name: "Blog" }).map(link => link.getAttribute("href"))).toEqual([
      "/blog",
      "/blog",
    ]);
  });

  it("highlights Blog on a post, but names only /blog itself as the current page", () => {
    state.pathname = "/blog/aave-health-factor";
    const { rerender } = render(<Header />);

    expect(screen.getAllByRole("link", { name: "Blog" }).map(isActive)).toEqual([true, true]);
    expect(screen.getAllByRole("link").filter(link => link.hasAttribute("aria-current"))).toEqual([]);

    state.pathname = "/blog";
    rerender(<Header />);

    expect(screen.getAllByRole("link", { name: "Blog" }).map(link => link.getAttribute("aria-current"))).toEqual([
      "page",
      "page",
    ]);
  });

  it("does not highlight Blog on a route that only starts with the same letters", () => {
    state.pathname = "/blogroll";
    render(<Header />);

    expect(screen.getAllByRole("link").filter(isActive)).toEqual([]);
  });

  it("names the product category under the brand, not a generic DeFi app", () => {
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: "Tokenping home" });

    expect(within(homeLink).getByText("Aave health factor alerts")).toBeTruthy();
    expect(homeLink.textContent).not.toMatch(/DeFi/);
  });

  it.each(["/aave/", "/aave/positions"])("does not mark a nested or trailing-slash path (%s) as active", pathname => {
    state.pathname = pathname;
    render(<Header />);

    expect(screen.getAllByRole("link").filter(isActive)).toEqual([]);
  });

  it("renders the menu links in order: Home, Dashboard, Blog", () => {
    render(<Header />);
    const [mobileMenu, desktopMenu] = screen.getAllByRole("list");

    for (const menu of [mobileMenu, desktopMenu]) {
      expect(
        within(menu)
          .getAllByRole("link")
          .map(link => link.textContent),
      ).toEqual(["Home", "Dashboard", "Blog"]);
    }
  });

  it("shows the faucet button only on the local network", () => {
    const { rerender } = render(<Header />);

    expect(screen.queryByRole("button", { name: "Faucet" })).toBeNull();

    state.targetNetworkId = hardhat.id;
    rerender(<Header />);

    expect(screen.getByRole("button", { name: "Faucet" })).toBeTruthy();
  });

  it("closes the burger menu on a click outside it", () => {
    const burgerMenu = renderOpenBurgerMenu();

    fireEvent.click(document.body);

    expect(burgerMenu.open).toBe(false);
  });

  it("closes the burger menu when an item in its dropdown is clicked", () => {
    const burgerMenu = renderOpenBurgerMenu();

    fireEvent.click(within(burgerMenu).getAllByRole("listitem")[1]);

    expect(burgerMenu.open).toBe(false);
  });
});
