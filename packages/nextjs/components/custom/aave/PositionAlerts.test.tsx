import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PositionAlerts } from "~~/components/custom/aave/PositionAlerts";
import { ETHEREUM_POSITION } from "~~/components/custom/aave/__fixtures__/positions";
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

describe("PositionAlerts", () => {
  it("puts the network's alert form behind the paywall", () => {
    const html = renderMarkup(<PositionAlerts position={ETHEREUM_POSITION} hasNotificationConfig={false} />);

    expect(html).toContain('data-has-existing-config="false"');
    expect(html).toContain('data-description="Pay once to set health factor alerts on Ethereum and other networks.');
    expect(html).toContain('data-chain-id="1" data-chain-name="Ethereum" data-current-health-factor="1.85"');
  });

  it("offers to extend access when the network already has a saved config", () => {
    const html = renderMarkup(<PositionAlerts position={ETHEREUM_POSITION} hasNotificationConfig />);

    expect(html).toContain('data-has-existing-config="true"');
    expect(html).toContain(
      'data-description="Your saved Ethereum alert settings are still in your account. Pay again to extend access and edit them."',
    );
  });

  it("never writes an em or en dash into the paywall copy", () => {
    for (const hasNotificationConfig of [false, true]) {
      const html = renderMarkup(
        <PositionAlerts position={ETHEREUM_POSITION} hasNotificationConfig={hasNotificationConfig} />,
      );
      // en and em dash, built from their code points
      expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    }
  });
});
