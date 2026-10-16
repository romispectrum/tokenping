import { describe, expect, it, vi } from "vitest";
import { PositionAccess } from "~~/components/custom/aave/PositionAccess";
import { ETHEREUM_POSITION } from "~~/components/custom/aave/__fixtures__/positions";
import { LocaleProvider } from "~~/i18n/LocaleProvider";
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

describe("PositionAccess in Czech", () => {
  const czech = (hasNotificationConfig: boolean) =>
    renderMarkup(
      <LocaleProvider locale="cs">
        <PositionAccess position={ETHEREUM_POSITION} hasNotificationConfig={hasNotificationConfig} />
      </LocaleProvider>,
    );

  it("names the network in the Czech pitch", () => {
    expect(czech(false)).toContain(
      'data-description="Zaplaťte jednou a nastavte si upozornění na health factor na síti Ethereum i na dalších sítích.',
    );
  });

  it("offers to extend access in Czech when the network has a saved config", () => {
    expect(czech(true)).toContain(
      'data-description="Vaše uložené nastavení upozornění pro síť Ethereum ve vašem účtu zůstává.',
    );
  });

  it("never writes an em or en dash into the Czech copy", () => {
    for (const hasNotificationConfig of [false, true]) {
      expect(czech(hasNotificationConfig)).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    }
  });
});
