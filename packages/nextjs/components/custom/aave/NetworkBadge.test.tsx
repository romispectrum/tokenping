import { describe, expect, it } from "vitest";
import { NetworkBadge } from "~~/components/custom/aave/NetworkBadge";
import { renderMarkup } from "~~/utils/testing/render";

describe("NetworkBadge", () => {
  it("names a mainnet in a neutral pill", () => {
    const html = renderMarkup(<NetworkBadge name="Arbitrum One" />);

    // Real text, not an image with a label.
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("aria-label");
    expect(html).toContain('<span class="truncate">Arbitrum One</span>');
    expect(html).toContain("bg-secondary");
    expect(html).not.toContain("Testnet");
    expect(html).toMatchSnapshot();
  });

  it("tags a testnet in words and a dashed outline, so test funds never look real", () => {
    const html = renderMarkup(<NetworkBadge name="Arbitrum Sepolia" testnet />);

    expect(html).toContain('<span class="truncate">Arbitrum Sepolia</span>');
    expect(html).toContain("border-dashed");
    expect(html).toContain(">Testnet</span>");
  });
});
