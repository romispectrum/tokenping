import { describe, expect, it } from "vitest";
import { OG_IMAGE_SIZE, OgCard, ogImageOptions } from "~~/components/seo/OgCard";
import { renderStaticMarkup } from "~~/utils/testing/render";

describe("OgCard", () => {
  it("is 1200x630 and shows the logo, the title, the footer line and the domain", () => {
    const html = renderStaticMarkup(
      <OgCard title="How to calculate your Aave liquidation price" footer="Tokenping · Aave V3 guides" />,
    );

    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
    expect(html).toMatch(/<img src="data:image\/svg\+xml;base64,[^"]+" width="243" height="64" alt="Tokenping"\/>/);
    expect(html).toContain(">How to calculate your Aave liquidation price<");
    expect(html).toContain(">Tokenping · Aave V3 guides<");
    expect(html).toContain(">tokenping.xyz<");
  });

  it("uses the lockup with a white wordmark on the night background and one pink accent", () => {
    const html = renderStaticMarkup(<OgCard title="Title" footer="Footer" />);
    const logo = Buffer.from(html.match(/base64,([^"]+)"/)?.[1] ?? "", "base64").toString();

    // lint-brand-ignore-next-line hex-colour: asserts the colours written into the OG image
    expect(html).toContain("background:#18001C");
    expect(logo).toContain('color="#FFFFFF"'); // lint-brand-ignore hex-colour: the wordmark colour on night
    expect(logo).toContain("scale(0.036)");
    expect(html.match(/#FE5FA9/g)).toHaveLength(1);
  });

  // Satori lays out only flex containers: an element with several children and no display: flex fails to render.
  it("sets display: flex on every element with children", () => {
    const html = renderStaticMarkup(<OgCard title="Title" footer="Footer" />);
    const divs = html.match(/<div[^>]*>/g) ?? [];

    expect(divs.length).toBeGreaterThan(0);
    for (const div of divs) expect(div).toContain("display:flex");
  });

  it("loads Satoshi Medium and Regular as OTF for ImageResponse", async () => {
    const options = await ogImageOptions();

    expect(options).toMatchObject({ width: 1200, height: 630 });
    expect(options.fonts.map(({ name, weight, style }) => ({ name, weight, style }))).toEqual([
      { name: "Satoshi", weight: 500, style: "normal" },
      { name: "Satoshi", weight: 400, style: "normal" },
    ]);
    // OTF files start with the "OTTO" tag.
    for (const font of options.fonts) expect(font.data.subarray(0, 4).toString("latin1")).toBe("OTTO");
  });
});
