import { describe, expect, it } from "vitest";
import { NetworkSummaryRow } from "~~/components/custom/aave/NetworkSummaryRow";
import {
  ARBITRUM_EMPTY_POSITION,
  ETHEREUM_POSITION,
  ETHEREUM_PRIME_POSITION,
  ETHEREUM_V4_LIDO_POSITION,
  ETHEREUM_V4_MAIN_EMPTY_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

const noop = () => undefined;

const NETWORK_ICON = /<img [^>]*src="\/network-icons\/([a-z-]+)\.webp"/;

describe("NetworkSummaryRow", () => {
  it("leads with the network's logo, decorative beside the market name", () => {
    const html = renderMarkup(
      <NetworkSummaryRow position={ETHEREUM_POSITION} isSelected={false} onSelect={noop} hasNotification={false} />,
    );

    expect(html.match(NETWORK_ICON)?.[1]).toBe("ethereum");
    expect(html).toMatch(/<span aria-hidden="true" class="[^"]*size-5[^"]*">\s*<img [^>]*alt=""/);
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf('<span class="truncate">Ethereum</span>'));
  });

  it("gives every market on one chain that chain's logo", () => {
    for (const position of [ETHEREUM_PRIME_POSITION, ETHEREUM_V4_LIDO_POSITION, ETHEREUM_V4_MAIN_EMPTY_POSITION]) {
      const html = renderMarkup(
        <NetworkSummaryRow position={position} isSelected={false} onSelect={noop} hasNotification={false} />,
      );

      expect(html.match(NETWORK_ICON)?.[1], position.marketName).toBe("ethereum");
      expect(html).toContain(`<span class="truncate">${position.marketName}</span>`);
    }
    const polygon = renderMarkup(
      <NetworkSummaryRow
        position={POLYGON_COLLATERAL_ONLY_POSITION}
        isSelected={false}
        onSelect={noop}
        hasNotification={false}
      />,
    );
    expect(polygon.match(NETWORK_ICON)?.[1]).toBe("polygon-pos");
  });

  it("renders a selected active network with a notification bell", () => {
    const html = renderMarkup(
      <NetworkSummaryRow position={ETHEREUM_POSITION} isSelected onSelect={noop} hasNotification />,
    );

    // Selected is announced as the current choice (not a pressed toggle) and drawn with the tint plus an edge, never pink.
    expect(html).toContain('aria-current="true"');
    expect(html).not.toContain("aria-pressed");
    expect(html).toContain(">Alert set</span>");
    expect(html).not.toMatch(/\b(bg|text|border)-primary\b/);
    expect(html).toMatchSnapshot();
  });

  it("renders an unselected active network without a bell", () => {
    const html = renderMarkup(
      <NetworkSummaryRow
        position={POLYGON_COLLATERAL_ONLY_POSITION}
        isSelected={false}
        onSelect={noop}
        hasNotification={false}
      />,
    );

    expect(html).not.toContain('aria-current="');
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain("Alert set");
    expect(html).toMatchSnapshot();
  });

  // At 390px a single truncated line cut "borrowed" and sometimes the amount itself off.
  it("lets the totals wrap between supplied and borrowed instead of cutting them off", () => {
    const html = renderMarkup(
      <NetworkSummaryRow position={ETHEREUM_POSITION} isSelected={false} onSelect={noop} hasNotification={false} />,
    );

    expect(html).toMatch(
      /<span class="text-sm text-muted-foreground tabular-nums">\s*<span class="whitespace-nowrap">\$[^<]+ supplied,<\/span> <span class="whitespace-nowrap">\$[^<]+ borrowed<\/span>\s*<\/span>/,
    );
  });

  it("renders an empty network without the health factor badge or totals", () => {
    const html = renderMarkup(
      <NetworkSummaryRow position={ARBITRUM_EMPTY_POSITION} isSelected={false} onSelect={noop} hasNotification />,
    );

    expect(html).not.toContain("Health factor");
    expect(html).not.toContain("supplied");
    expect(html).toContain(">No position</span>");
    expect(html).toMatchSnapshot();
  });

  it("names a V4 Spoke by its market name, so two markets on one chain read apart", () => {
    const active = renderMarkup(
      <NetworkSummaryRow position={ETHEREUM_V4_LIDO_POSITION} isSelected={false} onSelect={noop} hasNotification />,
    );
    const empty = renderMarkup(
      <NetworkSummaryRow
        position={ETHEREUM_V4_MAIN_EMPTY_POSITION}
        isSelected={false}
        onSelect={noop}
        hasNotification={false}
      />,
    );

    expect(active).toContain('<span class="truncate">Ethereum (V4 Lido)</span>');
    expect(active).toContain(">Alert set</span>");
    expect(active).toContain("Health factor");
    expect(empty).toContain('<span class="truncate">Ethereum (V4 Main)</span>');
    expect(empty).toContain(">No position</span>");
  });
});
