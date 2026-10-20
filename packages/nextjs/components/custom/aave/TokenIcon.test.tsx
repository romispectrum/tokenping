import type { Address } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { TokenIcon } from "~~/components/custom/aave/TokenIcon";
import { TOKEN_ICONS } from "~~/config/tokenIcons.generated";
import { renderStaticMarkup } from "~~/utils/testing/render";

const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const NOT_A_RESERVE = "0x000000000000000000000000000000000000dEaD";

describe("TokenIcon", () => {
  it("shows the self-hosted icon of a known reserve, as decoration next to the written symbol", () => {
    const html = renderStaticMarkup(<TokenIcon chainId={mainnet.id} address={USDC} symbol="USDC" />);
    const icon = TOKEN_ICONS[`1:${USDC.toLowerCase()}`];

    expect(icon).toBeDefined();
    expect(html).toContain(`src="/token-icons/${icon}.webp"`);
    // Named for crawlers, which flag an empty alt, but hidden from assistive technology: the symbol is read once.
    expect(html).toMatch(/^<img alt="USDC" aria-hidden="true" /);
    expect(html).toContain('width="24" height="24"');
    // Never routed through the image optimizer, and never a CoinGecko URL: the browser only talks to this site.
    expect(html).not.toContain("/_next/image");
    expect(html).not.toContain("coingecko");
  });

  it("matches the address in any letter case", () => {
    const checksummed = renderStaticMarkup(<TokenIcon chainId={mainnet.id} address={USDC} symbol="USDC" />);
    const lowercase = renderStaticMarkup(
      <TokenIcon chainId={mainnet.id} address={USDC.toLowerCase() as Address} symbol="USDC" />,
    );

    expect(lowercase).toBe(checksummed);
  });

  it("looks the icon up per chain", () => {
    const html = renderStaticMarkup(<TokenIcon chainId={999_999} address={USDC} symbol="USDC" />);

    expect(html).not.toContain("<img");
  });

  it.each([
    ["the first letter of the symbol", "wstETH", "W"],
    ["a leading digit", "1INCH", "1"],
    ["the first letter after punctuation", "$crvUSD", "C"],
    ["the first character of a symbol with no letter or digit", "₮", "₮"],
    ["a question mark for an empty symbol", "", "?"],
  ])("draws %s for a reserve without an icon", (_, symbol, initial) => {
    const html = renderStaticMarkup(<TokenIcon chainId={mainnet.id} address={NOT_A_RESERVE} symbol={symbol} />);

    expect(html.match(/^<span aria-hidden="true" class="[^"]*">(.*)<\/span>$/)?.[1]).toBe(initial);
  });
});
