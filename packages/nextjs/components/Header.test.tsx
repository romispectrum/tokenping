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

  it("marks only the exactly matching menu link as active", () => {
    state.pathname = "/aave";
    render(<Header />);

    // Desktop and mobile menus both render the links.
    expect(screen.getAllByRole("link", { name: "Aave" }).map(isActive)).toEqual([true, true]);
    expect(screen.getAllByRole("link", { name: "Home" }).map(isActive)).toEqual([false, false]);
  });

  it.each(["/aave/", "/aave/positions"])("does not mark a nested or trailing-slash path (%s) as active", pathname => {
    state.pathname = pathname;
    render(<Header />);

    expect(screen.getAllByRole("link").filter(isActive)).toEqual([]);
  });

  it("renders the menu links in order: Home, Aave", () => {
    render(<Header />);
    const [mobileMenu, desktopMenu] = screen.getAllByRole("list");

    for (const menu of [mobileMenu, desktopMenu]) {
      expect(
        within(menu)
          .getAllByRole("link")
          .map(link => link.textContent),
      ).toEqual(["Home", "Aave"]);
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
