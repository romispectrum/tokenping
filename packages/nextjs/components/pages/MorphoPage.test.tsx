import { describe, expect, it, vi } from "vitest";
import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";
import { renderMarkup } from "~~/utils/testing/render";

vi.mock("~~/components/dashboard/MorphoDashboard", () => ({
  MorphoDashboard: () => <div data-stub="morpho-dashboard" />,
}));

describe("MorphoPage", () => {
  it("serves its heading and explanation in the initial HTML, around the wallet island", () => {
    const html = renderMarkup(MorphoPage({ locale: "en" }));

    expect(html).toContain(">Morpho positions</h1>");
    expect(html).toContain(
      "on Ethereum, Base, Arbitrum, OP Mainnet, Polygon, Unichain, World Chain, HyperEVM, Katana, Monad, Arc, Robinhood Chain, Stable and Tempo:",
    );
    expect(html).toContain("Alerts are checked every 5 minutes.");
    expect(html).toContain("Tokenping is not affiliated with Morpho.");
    expect(html).toContain('data-stub="morpho-dashboard"');
  });

  it("is written in Czech under /cz/morpho, with both languages as alternates", () => {
    const html = renderMarkup(MorphoPage({ locale: "cs" }));
    expect(html).toContain(">Pozice na Morpho</h1>");
    expect(html).toContain("Upozornění kontrolujeme každých 5 minut.");

    const metadata = morphoMetadata("cs");
    expect(metadata.alternates?.canonical).toBe("/cz/morpho");
    expect(metadata.alternates?.languages).toMatchObject({ en: "/morpho", cs: "/cz/morpho" });
    expect(String(metadata.description)).toContain("na 14 sítích");
  });
});
