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

vi.mock("~~/components/SwitchTheme", () => ({
  SwitchTheme: ({ className }: { className?: string }) => <div data-stub="switch-theme" className={className} />,
}));

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

  it("renders only the theme switch and social links without a price on a live network", () => {
    const html = renderFooter();

    expect(html).not.toContain('class="truncate"');
    expect(html).not.toContain('data-stub="faucet"');
    expect(html).toMatchSnapshot();
  });

  it("shows the native currency price with two decimals when it is positive", () => {
    state.price = 1234.567;

    expect(renderFooter()).toContain('<span class="truncate">1234.57</span>');
  });

  it("shows the faucet, the block explorer link and the shifted theme switch on the local network", () => {
    state.price = 3000;
    state.targetNetworkId = hardhat.id;
    const html = renderFooter();

    expect(html).toContain('data-stub="faucet"');
    expect(html).toContain(
      '<a class="btn btn-primary btn-sm font-normal gap-1 touch-target-min min-h-9" href="/blockexplorer">',
    );
    expect(html).toContain('class="pointer-events-auto self-end md:self-auto"');
    expect(html).toMatchSnapshot();
  });

  it("links to the Telegram community and the X account in new tabs without opener or referrer", () => {
    render(<Footer />);

    for (const [name, href] of [
      ["Tokenping Telegram Community", "https://t.me/tokenping_xyz"],
      ["Tokenping on X", "https://x.com/tokenping"],
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")).toBe(href);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    }
  });

  it("puts each social link in its own item of a valid list", () => {
    render(<Footer />);
    const list = screen.getByRole("list");

    expect(list.querySelectorAll(":scope > :not(li)")).toHaveLength(0);
    expect(
      within(list)
        .getAllByRole("listitem")
        .map(item => within(item).getByRole("link").textContent),
    ).toEqual(["Telegram", "X"]);
  });
});
