import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PositionDetails } from "~~/components/custom/aave/PositionDetails";
import {
  ARBITRUM_EMPTY_POSITION,
  AVALANCHE_DEBT_ONLY_POSITION,
  BASE_SUMMARY_ONLY_POSITION,
  ETHEREUM_POSITION,
  POLYGON_COLLATERAL_ONLY_POSITION,
} from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({
    children,
    description,
    hasExistingConfig,
  }: {
    children: ReactNode;
    description?: string;
    hasExistingConfig?: boolean;
  }) => (
    <div data-stub="access-paywall" data-description={description} data-has-existing-config={String(hasExistingConfig)}>
      {children}
    </div>
  ),
}));

vi.mock("~~/components/custom/NotificationConfig", () => ({
  NotificationConfig: (props: { chainId: number; chainName: string; currentHealthFactor: string }) => (
    <div
      data-stub="notification-config"
      data-chain-id={props.chainId}
      data-chain-name={props.chainName}
      data-current-health-factor={props.currentHealthFactor}
    />
  ),
}));

describe("PositionDetails", () => {
  it("renders an active position with collateral and debt tables", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} hasNotificationConfig={false} />);

    expect(html).toContain('<h3 class="m-0 truncate text-base font-medium text-foreground">Ethereum</h3>');
    expect(html).toContain('<h4 id="supplied-1"');
    expect(html).toContain('<h4 id="borrowed-1"');
    expect(html.split("<table").length - 1).toBe(2);
    // The details card is flat product UI: no shadow and no pink of its own (the paywall owns the view's pink).
    expect(html).not.toMatch(/shadow-card|\bbg-primary\b/);
    expect(html).toMatchSnapshot();
  });

  it("offers to extend access when the network already has a saved config", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} hasNotificationConfig />);

    expect(html).toContain('data-has-existing-config="true"');
    expect(html).toContain(
      'data-description="Your saved Ethereum alert settings are still in your account. Pay again to extend access and edit them."',
    );
    expect(html).toMatchSnapshot();
  });

  it("renders the empty debt list for a collateral-only position", () => {
    const html = renderMarkup(
      <PositionDetails position={POLYGON_COLLATERAL_ONLY_POSITION} hasNotificationConfig={false} />,
    );

    expect(html).toContain(">No outstanding debt</p>");
    expect(html).toMatchSnapshot();
  });

  it("renders the empty collateral list for a debt-only position", () => {
    const html = renderMarkup(
      <PositionDetails position={AVALANCHE_DEBT_ONLY_POSITION} hasNotificationConfig={false} />,
    );

    expect(html).toContain(">No collateral supplied</p>");
    expect(html).toMatchSnapshot();
  });

  it("explains missing token details under the summary instead of empty tables", () => {
    const html = renderMarkup(<PositionDetails position={BASE_SUMMARY_ONLY_POSITION} hasNotificationConfig={false} />);

    expect(html).toContain('data-variant="warning"');
    expect(html).toContain(">Token details did not load</div>");
    expect(html).not.toContain("<table");
    expect(html).toMatchSnapshot();
  });

  it("renders the no-position message without stats or a health factor badge", () => {
    const html = renderMarkup(<PositionDetails position={ARBITRUM_EMPTY_POSITION} hasNotificationConfig={false} />);

    expect(html).toContain(">No active position on Arbitrum</p>");
    expect(html).not.toContain("Health factor");
    expect(html).not.toContain("<dl");
    expect(html).toMatchSnapshot();
  });

  it("never writes an em or en dash into the paywall copy", () => {
    for (const hasNotificationConfig of [false, true]) {
      const html = renderMarkup(
        <PositionDetails position={ETHEREUM_POSITION} hasNotificationConfig={hasNotificationConfig} />,
      );
      // en and em dash, built from their code points
      expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    }
  });
});
