// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { mainnet, polygon } from "viem/chains";
import { describe, expect, it } from "vitest";
import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { renderStaticMarkup } from "~~/utils/testing/render";

// No Aave market runs on this chain id, so it has no logo.
const UNKNOWN_CHAIN = 999_999;

const classOf = (html: string) => html.match(/^<span (?:[a-z-]+="[^"]*" )*class="([^"]*)"/)?.[1] ?? "";

describe("NetworkIcon", () => {
  it("shows the self-hosted logo of a known network, named in its alt", () => {
    const html = renderStaticMarkup(<NetworkIcon chainId={mainnet.id} name="Ethereum" />);

    expect(NETWORK_ICONS[mainnet.id]).toBe("ethereum");
    expect(html).toContain('src="/network-icons/ethereum.webp"');
    expect(html).toContain('alt="Ethereum"');
    expect(html).toContain('width="20" height="20"');
    expect(html).toMatch(/^<span aria-hidden="true" class="[^"]*">\s*<img /);
    // Never routed through the image optimizer, and never a CoinGecko URL: the browser only talks to this site.
    expect(html).not.toContain("/_next/image");
    expect(html).not.toContain("coingecko");
  });

  it("looks the logo up by chain id, not by name", () => {
    const html = renderStaticMarkup(<NetworkIcon chainId={polygon.id} name="Ethereum" />);

    expect(html).toContain('src="/network-icons/polygon-pos.webp"');
  });

  it("draws the network's initial on the disc when it has no logo", () => {
    const html = renderStaticMarkup(<NetworkIcon chainId={UNKNOWN_CHAIN} name="Harmony" />);

    expect(html).not.toContain("<img");
    expect(html).toMatch(/^<span aria-hidden="true" class="[^"]*">H<\/span>$/);
  });

  it.each([
    ["a logo", mainnet.id],
    ["an initial", UNKNOWN_CHAIN],
  ])("is hidden from assistive technology with %s, beside the written name", (_, chainId) => {
    const html = renderStaticMarkup(<NetworkIcon chainId={chainId} name="Ethereum" />);
    const { queryByRole } = render(<NetworkIcon chainId={chainId} name="Ethereum" />);

    expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
    expect(html.startsWith('<span aria-hidden="true"')).toBe(true);
    expect(queryByRole("img")).toBeNull();
    expect(html).not.toContain("title=");
  });

  it.each([
    ["a logo", mainnet.id],
    ["an initial", UNKNOWN_CHAIN],
  ])("names the network once, to assistive technology and on hover, when it stands alone with %s", (_, chainId) => {
    const { container, getAllByRole } = render(<NetworkIcon chainId={chainId} name="Ethereum" standalone />);
    const images = getAllByRole("img");

    expect(images).toHaveLength(1);
    expect(images[0].getAttribute("title")).toBe("Ethereum");
    expect(getAllByRole("img", { name: "Ethereum" })).toHaveLength(1);
    expect(container.querySelector("[aria-hidden]")).toBeNull();
    expect(container.querySelectorAll("[title]")).toHaveLength(1);
  });

  it("is a 20px disc by default and takes a class for another size, with or without a logo, standalone or not", () => {
    expect(classOf(renderStaticMarkup(<NetworkIcon chainId={mainnet.id} name="Ethereum" />))).toMatch(/\bsize-5\b/);
    for (const standalone of [false, true]) {
      expect(
        classOf(
          renderStaticMarkup(
            <NetworkIcon chainId={mainnet.id} name="Ethereum" standalone={standalone} className="size-8" />,
          ),
        ),
      ).toMatch(/\bsize-8\b/);
      expect(
        classOf(
          renderStaticMarkup(
            <NetworkIcon chainId={UNKNOWN_CHAIN} name="Harmony" standalone={standalone} className="size-8" />,
          ),
        ),
      ).toMatch(/\bsize-8\b/);
    }
  });

  it("has a logo for every network the dashboard reads, with the network's name as its alt", () => {
    for (const { chain, name } of AAVE_CHAINS) {
      const { container, unmount } = render(<NetworkIcon chainId={chain.id} name={name} />);
      const logo = container.querySelector("img");

      expect(logo?.getAttribute("src"), name).toBe(`/network-icons/${NETWORK_ICONS[chain.id]}.webp`);
      expect(logo?.getAttribute("alt"), name).toBe(name);
      unmount();
    }
  });
});
