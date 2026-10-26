import { describe, expect, it, vi } from "vitest";
import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";
import { renderMarkup } from "~~/utils/testing/render";

vi.mock("~~/components/dashboard/MorphoDashboard", () => ({
  MorphoDashboard: () => <div data-stub="morpho-dashboard" />,
}));

describe("MorphoPage", () => {
  it("serves its heading and explanation in the initial HTML, around the wallet island", () => {
    const html = renderMarkup(MorphoPage({ locale: "en" }));

    expect(html).toContain(">Morpho Blue and Midnight positions and health factor alerts</h1>");
    expect(html).toContain(
      "on Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Unichain, World Chain, HyperEVM, Katana, Monad, Arc, Robinhood Chain, Stable and Tempo:",
    );
    expect(html).toContain("Alerts are checked every 5 minutes.");
    expect(html).toContain("Tokenping is not affiliated with Morpho.");
    // The Morpho guides and the Aave dashboard, linked from the server-rendered page.
    for (const href of [
      "/blog/morpho-health-factor",
      "/blog/how-morpho-liquidation-works",
      "/blog/morpho-midnight-fixed-rate-loans",
      "/aave",
    ])
      expect(html).toContain(`href="${href}"`);
    expect(html).toContain('data-stub="morpho-dashboard"');
  });

  it("is written in Czech under /cz/morpho, with both languages as alternates", () => {
    const html = renderMarkup(MorphoPage({ locale: "cs" }));
    expect(html).toContain(">Pozice a upozornění na health factor na Morpho Blue a Midnight</h1>");
    expect(html).toContain("Upozornění kontrolujeme každých 5 minut.");

    const metadata = morphoMetadata("cs");
    expect(metadata.alternates?.canonical).toBe("/cz/morpho");
    expect(metadata.alternates?.languages).toMatchObject({ en: "/morpho", cs: "/cz/morpho" });
    expect(String(metadata.description)).toContain("na 14 sítích");
  });

  it("fits its title in 60 characters and its description in 155, in both languages, Telegram included", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    for (const locale of ["en", "cs"] as const) {
      const { title, description } = morphoMetadata(locale);
      const shown = typeof title === "string" ? `${title} | Tokenping` : (title as { absolute: string }).absolute;

      expect(shown.length, shown).toBeLessThanOrEqual(60);
      expect(String(description).length, String(description)).toBeLessThanOrEqual(155);
    }
    vi.unstubAllEnvs();
  });
});
