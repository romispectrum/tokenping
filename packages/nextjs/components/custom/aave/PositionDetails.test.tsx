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
  it("renders an active position with collateral and debt lists", () => {
    expect(
      renderMarkup(<PositionDetails position={ETHEREUM_POSITION} hasNotificationConfig={false} />),
    ).toMatchSnapshot();
  });

  it("offers to extend access when the network already has a saved config", () => {
    const html = renderMarkup(<PositionDetails position={ETHEREUM_POSITION} hasNotificationConfig />);

    expect(html).toContain('data-has-existing-config="true"');
    expect(html).toMatchSnapshot();
  });

  it("renders the empty debt list for a collateral-only position", () => {
    expect(
      renderMarkup(<PositionDetails position={POLYGON_COLLATERAL_ONLY_POSITION} hasNotificationConfig={false} />),
    ).toMatchSnapshot();
  });

  it("renders the empty collateral list for a debt-only position", () => {
    expect(
      renderMarkup(<PositionDetails position={AVALANCHE_DEBT_ONLY_POSITION} hasNotificationConfig={false} />),
    ).toMatchSnapshot();
  });

  it("renders the summary without token lists when token details are missing", () => {
    expect(
      renderMarkup(<PositionDetails position={BASE_SUMMARY_ONLY_POSITION} hasNotificationConfig={false} />),
    ).toMatchSnapshot();
  });

  it("renders the no-position message without stats or a health factor badge", () => {
    expect(
      renderMarkup(<PositionDetails position={ARBITRUM_EMPTY_POSITION} hasNotificationConfig={false} />),
    ).toMatchSnapshot();
  });
});
