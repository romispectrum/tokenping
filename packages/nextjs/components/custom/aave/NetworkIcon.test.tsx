import { mainnet, polygon } from "viem/chains";
import { describe, expect, it } from "vitest";
import { NetworkIcon } from "~~/components/custom/aave/NetworkIcon";
import { AAVE_CHAINS } from "~~/config/aaveConfig";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { renderStaticMarkup } from "~~/utils/testing/render";

// No Aave market runs on this chain id, so it has no logo.
const UNKNOWN_CHAIN = 999_999;

const classOf = (html: string) => html.match(/^<span aria-hidden="true" class="([^"]*)"/)?.[1] ?? "";

describe("NetworkIcon", () => {
  it("shows the self-hosted logo of a known network, as decoration next to the written name", () => {
    const html = renderStaticMarkup(<NetworkIcon chainId={mainnet.id} name="Ethereum" />);

    expect(NETWORK_ICONS[mainnet.id]).toBe("ethereum");
    expect(html).toContain('src="/network-icons/ethereum.webp"');
    expect(html).toContain('alt=""');
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
  ])("is hidden from assistive technology with %s", (_, chainId) => {
    const html = renderStaticMarkup(<NetworkIcon chainId={chainId} name="Ethereum" />);

    expect(html.match(/aria-hidden="true"/g)).toHaveLength(1);
    expect(html.startsWith('<span aria-hidden="true"')).toBe(true);
  });

  it("is a 20px disc by default and takes a class for another size, with or without a logo", () => {
    expect(classOf(renderStaticMarkup(<NetworkIcon chainId={mainnet.id} name="Ethereum" />))).toMatch(/\bsize-5\b/);
    expect(
      classOf(renderStaticMarkup(<NetworkIcon chainId={mainnet.id} name="Ethereum" className="size-8" />)),
    ).toMatch(/\bsize-8\b/);
    expect(
      classOf(renderStaticMarkup(<NetworkIcon chainId={UNKNOWN_CHAIN} name="Harmony" className="size-8" />)),
    ).toMatch(/\bsize-8\b/);
  });

  it("has a logo for every network the dashboard reads", () => {
    for (const { chain, name } of AAVE_CHAINS) {
      const html = renderStaticMarkup(<NetworkIcon chainId={chain.id} name={name} />);

      expect(html, name).toContain(`src="/network-icons/${NETWORK_ICONS[chain.id]}.webp"`);
    }
  });
});
