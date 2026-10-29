import { describe, expect, it } from "vitest";
import { OG_CACHE_CONTROL, OG_IMAGE_SIZE, OgCard, ogImageOptions } from "~~/components/seo/OgCard";
import { renderStaticMarkup } from "~~/utils/testing/render";

describe("OgCard", () => {
  it("is 1200x630 and shows the logo, the title, the footer line and the domain", () => {
    const html = renderStaticMarkup(
      <OgCard title="How to calculate your Aave liquidation price" footer="Tokenping · Aave V3 guides" />,
    );

    expect(html).toContain("font-family:Satoshi, Noto Sans Devanagari");

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

  it("loads Satoshi Medium and Regular as OTF, then Noto Sans Devanagari as WOFF, for ImageResponse", async () => {
    const options = await ogImageOptions();

    expect(options).toMatchObject({ width: 1200, height: 630 });
    expect(options.fonts.map(({ name, weight, style }) => ({ name, weight, style }))).toEqual([
      { name: "Satoshi", weight: 500, style: "normal" },
      { name: "Satoshi", weight: 400, style: "normal" },
      { name: "Noto Sans Devanagari", weight: 500, style: "normal" },
      { name: "Noto Sans Devanagari", weight: 400, style: "normal" },
    ]);
    // OTF files start with the "OTTO" tag, WOFF files with "wOFF".
    const tags = options.fonts.map(font => font.data.subarray(0, 4).toString("latin1"));
    expect(tags).toEqual(["OTTO", "OTTO", "wOFF", "wOFF"]);
  });

  // Satoshi lacks most Vietnamese letters, so the Vietnamese cards are set in Plus Jakarta Sans alone.
  it("draws the Vietnamese cards in Plus Jakarta Sans, every subset file of both weights", async () => {
    const options = await ogImageOptions("vi");

    expect(new Set(options.fonts.map(({ name }) => name))).toEqual(new Set(["Plus Jakarta Sans"]));
    expect(options.fonts.map(({ weight }) => weight)).toEqual([500, 500, 500, 400, 400, 400]);
    for (const font of options.fonts) expect(font.data.subarray(0, 4).toString("latin1")).toBe("wOFF");
    expect(renderStaticMarkup(<OgCard title="Hệ số sức khỏe" footer="Tokenping" locale="vi" />)).toContain(
      "font-family:Plus Jakarta Sans",
    );
  });

  // The card URLs have no hash, so nothing may call them immutable (next/og's default).
  it("replaces next/og's immutable year-long cache with a day", async () => {
    expect((await ogImageOptions()).headers).toEqual({ "Cache-Control": OG_CACHE_CONTROL });
    expect(OG_CACHE_CONTROL).not.toMatch(/immutable/);
  });
});
