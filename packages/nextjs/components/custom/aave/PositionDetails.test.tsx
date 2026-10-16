import { describe, expect, it } from "vitest";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import {
  ARBITRUM_EMPTY_POSITION,
  AVALANCHE_DEBT_ONLY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

describe("PositionDetails", () => {
  it("renders an active position with collateral and debt tables", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} />);

    expect(html).toContain('<h3 class="m-0 truncate text-base font-medium text-foreground">Ethereum</h3>');
    expect(html).toContain('<h4 id="supplied-1"');
    expect(html).toContain('<h4 id="borrowed-1"');
    expect(html.split("<table").length - 1).toBe(2);
    // The details card is flat product UI: no shadow and no pink of its own (the alert settings own the view's pink).
    expect(html).not.toMatch(/shadow-card|\bbg-primary\b/);
    expect(html).toMatchSnapshot();
  });

  it("renders the empty debt list for a collateral-only position", () => {
    const html = renderMarkup(<PositionDetails position={POLYGON_COLLATERAL_ONLY_POSITION} />);

    expect(html).toContain(">No outstanding debt</p>");
    expect(html).toMatchSnapshot();
  });

  it("renders the empty collateral list for a debt-only position", () => {
    const html = renderMarkup(<PositionDetails position={AVALANCHE_DEBT_ONLY_POSITION} />);

    expect(html).toContain(">No collateral supplied</p>");
    expect(html).toMatchSnapshot();
  });

  it("explains missing token details under the summary instead of empty tables", () => {
    const html = renderMarkup(<PositionDetails position={BASE_SUMMARY_ONLY_POSITION} />);

    expect(html).toContain('data-variant="warning"');
    expect(html).toContain(">Token details did not load</div>");
    expect(html).not.toContain("<table");
    expect(html).toMatchSnapshot();
  });

  it("renders the no-position message without stats or a health factor badge", () => {
    const html = renderMarkup(<PositionDetails position={ARBITRUM_EMPTY_POSITION} />);

    expect(html).toContain(">No active position on Arbitrum</p>");
    expect(html).not.toContain("Health factor");
    expect(html).not.toContain("<dl");
    expect(html).toMatchSnapshot();
  });
});
