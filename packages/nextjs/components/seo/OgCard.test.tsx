import { describe, expect, it } from "vitest";
import { OG_IMAGE_SIZE, OgCard } from "~~/components/seo/OgCard";
import { renderStaticMarkup } from "~~/utils/testing/render";

describe("OgCard", () => {
  it("is 1200x630 and shows the mark, the brand, the title, the footer line and the domain", () => {
    const html = renderStaticMarkup(
      <OgCard title="How to Calculate Your Aave Liquidation Price" footer="Tokenping · Aave V3 guides" />,
    );

    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(html).toContain('src="data:image/svg+xml;base64,');
    expect(html).toContain(">Tokenping<");
    expect(html).toContain(">How to Calculate Your Aave Liquidation Price<");
    expect(html).toContain(">Tokenping · Aave V3 guides<");
    expect(html).toContain(">tokenping.xyz<");
  });

  // Satori lays out only flex containers: an element with several children and no display: flex fails to render.
  it("sets display: flex on every element with children", () => {
    const html = renderStaticMarkup(<OgCard title="Title" footer="Footer" />);
    const divs = html.match(/<div[^>]*>/g) ?? [];

    expect(divs.length).toBeGreaterThan(0);
    for (const div of divs) expect(div).toContain("display:flex");
  });
});
