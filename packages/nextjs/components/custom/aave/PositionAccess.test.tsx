import { describe, expect, it, vi } from "vitest";
import { PositionAccess } from "~~/components/custom/aave/PositionAccess";
import { ETHEREUM_POSITION } from "~~/components/custom/aave/__fixtures__/positions";
import { renderMarkup } from "~~/utils/testing/render";

vi.mock("~~/components/custom/AccessPaywall", () => ({
  AccessPaywall: ({ description, hasExistingConfig }: { description?: string; hasExistingConfig?: boolean }) => (
    <div
      data-stub="access-paywall"
      data-description={description}
      data-has-existing-config={String(hasExistingConfig)}
    />
  ),
}));

describe("PositionAccess", () => {
  it("names the network in the paywall's pitch", () => {
    const html = renderMarkup(<PositionAccess position={ETHEREUM_POSITION} hasNotificationConfig={false} />);

    expect(html).toContain('data-has-existing-config="false"');
    expect(html).toContain('data-description="Pay once to set health factor alerts on Ethereum and other networks.');
  });

  it("offers to extend access when the network already has a saved config", () => {
    const html = renderMarkup(<PositionAccess position={ETHEREUM_POSITION} hasNotificationConfig />);

    expect(html).toContain('data-has-existing-config="true"');
    expect(html).toContain(
      'data-description="Your saved Ethereum alert settings are still in your account. Pay again to extend access and edit them."',
    );
  });

  it("never writes an em or en dash into the paywall copy", () => {
    for (const hasNotificationConfig of [false, true]) {
      const html = renderMarkup(
        <PositionAccess position={ETHEREUM_POSITION} hasNotificationConfig={hasNotificationConfig} />,
      );
      // en and em dash, built from their code points
      expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    }
  });
});
