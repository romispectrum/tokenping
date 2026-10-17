// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { arbitrum, hardhat } from "viem/chains";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BetaBanner, SkipLink } from "~~/components/BetaBanner";
import { Header } from "~~/components/Header";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
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

// The active link sits on the accent surface; hover:bg-accent is a different class token.
const isActive = (link: HTMLElement) => link.classList.contains("bg-accent");

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

  it("is the page's only banner landmark, next to the beta tab", () => {
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

  it("names the home link once: the logo inside it is decorative", () => {
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: "Tokenping home" });
    const logos = [...homeLink.querySelectorAll("svg")];

    expect(logos).toHaveLength(1);
    expect(logos[0].getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });

  // The app shell renders the skip link, then the header, then <main id="main">, then the beta tab.
  it("is preceded by the skip link, the first tab stop of the shell", () => {
    const { container } = render(
      <>
        <SkipLink />
        <Header />
      </>,
    );
    const [first] = container.querySelectorAll("a, button, summary, input");

    expect(first.textContent).toBe("Skip to content");
    expect(first.getAttribute("href")).toBe("#main");
    expect(screen.getAllByRole("link", { name: "Skip to content" })).toHaveLength(1);
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
    // The language menu marks the current language with aria-current too; only the menu links are checked here.
    expect(
      screen.getAllByRole("link").filter(link => link.hasAttribute("aria-current") && !link.hasAttribute("hreflang")),
    ).toEqual([]);

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

  // The logo stands alone (the design system's logo rules); the hero kicker names the product category.
  it("puts no tagline under the logo", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Tokenping home" }).textContent).toBe("");
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

  it("closes the burger menu on Escape and returns focus to its button", () => {
    const burgerMenu = renderOpenBurgerMenu();
    const dashboardLink = within(burgerMenu).getByRole("link", { name: "Dashboard" });
    dashboardLink.focus();

    fireEvent.keyDown(dashboardLink, { key: "Escape" });

    expect(burgerMenu.open).toBe(false);
    expect(document.activeElement).toBe(burgerMenu.querySelector("summary"));
  });

  it("closes the burger menu when focus moves on past it, and keeps it open while focus stays inside", () => {
    const burgerMenu = renderOpenBurgerMenu();
    const [homeLink, dashboardLink] = within(burgerMenu).getAllByRole("link");

    fireEvent.focusOut(homeLink, { relatedTarget: dashboardLink });
    expect(burgerMenu.open).toBe(true);

    // Another window or a click on the panel's padding: no new focus target.
    fireEvent.focusOut(dashboardLink, { relatedTarget: null });
    expect(burgerMenu.open).toBe(true);

    fireEvent.focusOut(dashboardLink, { relatedTarget: document.querySelector('[data-stub="connect"]') });
    expect(burgerMenu.open).toBe(false);
  });

  it("closes the burger menu on a route change", () => {
    const { container, rerender } = render(<Header />);
    const burgerMenu = container.querySelector("details")!;
    burgerMenu.open = true;

    state.pathname = "/blog";
    rerender(<Header />);

    expect(burgerMenu.open).toBe(false);
  });

  it("gives the menu panel the 14px menu radius and room for the focus ring in its scrolling list", () => {
    const burgerMenu = renderOpenBurgerMenu();
    const list = within(burgerMenu).getAllByRole("list")[0];

    expect(list.parentElement!.className).toContain("rounded-xl");
    expect(list.className).toContain("overflow-y-auto");
    expect(list.className).toContain("p-1");
  });

  it("offers the theme toggle in the bar from lg and inside the menu below it", () => {
    render(<Header />);
    const toggles = screen.getAllByRole("button", { name: "Toggle light or dark theme" });

    expect(toggles).toHaveLength(2);
    expect(toggles[0].closest("details")).toBeTruthy();
    expect(toggles[1].closest("details")).toBeNull();
  });

  // The wallet button is stubbed here: its own styling lives in components/scaffold-eth.
  it("keeps hover and the active link off pink", () => {
    state.pathname = "/aave";
    const html = renderHeaderMarkup();

    expect(html).not.toMatch(/bg-primary|text-primary|btn-primary|bg-brand-pink/);
  });
});

describe("Header in Czech", () => {
  beforeEach(() => {
    state.pathname = "/cz";
    state.targetNetworkId = arbitrum.id;
  });

  const renderCzech = () =>
    render(
      <LocaleProvider locale="cs">
        <Header />
      </LocaleProvider>,
    );

  it("names the menu links in Czech and points them at the Czech pages", () => {
    renderCzech();
    const nav = screen.getByRole("navigation", { name: "Hlavní" });

    for (const [name, href] of [
      ["Úvod", "/cz"],
      ["Přehled", "/cz/aave"],
      ["Blog", "/cz/blog"],
    ])
      expect(
        within(nav)
          .getAllByRole("link", { name })
          .map(link => link.getAttribute("href")),
      ).toEqual([href, href]);
  });

  it("marks the Czech home page as the current page on /cz", () => {
    renderCzech();

    expect(screen.getAllByRole("link", { name: "Úvod" }).map(link => link.getAttribute("aria-current"))).toEqual([
      "page",
      "page",
    ]);
  });

  it("highlights Blog on a Czech post", () => {
    state.pathname = "/cz/blog/aave-health-factor-vysvetleni";
    renderCzech();

    expect(screen.getAllByRole("link", { name: "Blog" }).map(isActive)).toEqual([true, true]);
  });

  it("links the logo to the Czech home page and labels the menu, theme and language controls in Czech", () => {
    const { container } = renderCzech();

    expect(screen.getByRole("link", { name: "Úvodní stránka Tokenpingu" }).getAttribute("href")).toBe("/cz");
    expect(container.querySelector("summary")?.getAttribute("aria-label")).toBe("Otevřít menu");
    expect(screen.getAllByRole("button", { name: "Přepnout světlý nebo tmavý motiv" })).toHaveLength(2);
    expect(screen.getByText("Motiv")).toBeTruthy();
    expect(screen.getByText("Jazyk")).toBeTruthy();
    // The switch on a Czech page leads to the English one.
    expect(screen.getAllByRole("link", { name: "English" })[0].getAttribute("href")).toBe("/");
  });

  it("has no English menu labels and no em or en dash", () => {
    const { container } = renderCzech();

    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });
});
