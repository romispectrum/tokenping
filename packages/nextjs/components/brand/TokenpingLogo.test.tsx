import { describe, expect, it } from "vitest";
import { TokenpingLogo } from "~~/components/brand/TokenpingLogo";
import { LOGO_VIEWBOX, logoNodes, nodesToSvg } from "~~/components/brand/logoArt";
import { renderStaticMarkup } from "~~/utils/testing/render";

const svgTags = (html: string) => html.match(/<svg[^>]*>/g) ?? [];

describe("TokenpingLogo", () => {
  // tone "auto" renders both arts; the .dark class (on <html> or a band) decides which one shows.
  it("renders the solid lockup for light surfaces and the outline lockup for dark ones by default", () => {
    const [solid, outline] = svgTags(renderStaticMarkup(<TokenpingLogo className="h-8 w-auto" />));

    expect(solid).toContain(`viewBox="${LOGO_VIEWBOX.primary.solid}"`);
    expect(solid).toContain('class="dark:hidden h-8 w-auto"');
    expect(solid).toContain('data-art="solid"');
    expect(outline).toContain(`viewBox="${LOGO_VIEWBOX.primary.outline}"`);
    expect(outline).toContain('class="hidden dark:block h-8 w-auto"');
    expect(outline).toContain('data-art="outline"');
  });

  it.each([
    ["light", "solid"],
    ["dark", "outline"],
  ] as const)("forces one art with tone %s", (tone, art) => {
    const tags = svgTags(renderStaticMarkup(<TokenpingLogo tone={tone} />));

    expect(tags).toHaveLength(1);
    expect(tags[0]).toContain(`data-art="${art}"`);
    expect(tags[0]).not.toContain("dark:");
  });

  it("draws the symbol without the wordmark", () => {
    const html = renderStaticMarkup(<TokenpingLogo variant="symbol" tone="light" />);

    expect(html).toContain(`viewBox="${LOGO_VIEWBOX.symbol.solid}"`);
    expect(html).not.toContain("scale(0.03505)");
  });

  // The solid art follows currentColor and defaults to black through a presentation attribute, which any text
  // colour class overrides; the outline art is never recoloured.
  it("colours the solid art black unless a text colour class tints it", () => {
    const [solid, outline] = svgTags(renderStaticMarkup(<TokenpingLogo />));

    // lint-brand-ignore-next-line hex-colour: asserts the artwork's default fill
    expect(solid).toContain('color="#000"');
    expect(outline).not.toContain("color=");
  });

  it("names the logo with an SVG title by default", () => {
    const html = renderStaticMarkup(<TokenpingLogo tone="light" />);
    const titleId = html.match(/<title id="([^"]+)">Tokenping<\/title>/)?.[1];

    expect(titleId).toBeDefined();
    expect(html).toContain(`role="img" aria-labelledby="${titleId}"`);
  });

  it("hides the logo from assistive technology when a wrapping link names it", () => {
    const html = renderStaticMarkup(<TokenpingLogo title="" />);

    expect(html).not.toContain("<title");
    expect(html).not.toContain('role="img"');
    expect(svgTags(html).every(tag => tag.includes('aria-hidden="true"'))).toBe(true);
  });

  // Several logos share a page (header, footer): duplicated mask or title ids would break the second one.
  it("gives every instance its own mask and title ids", () => {
    const html = renderStaticMarkup(
      <>
        <TokenpingLogo />
        <TokenpingLogo variant="symbol" />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);

    expect(ids.length).toBe(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, id] of html.matchAll(/mask="url\(#([^)]+)\)"/g)) expect(ids).toContain(id);
  });

  // The component and the SVG files (favicon, PNG routes, social cards) render one node tree.
  it.each([
    ["light", "solid"],
    ["dark", "outline"],
  ] as const)("draws exactly the shared art with tone %s", (tone, art) => {
    const html = renderStaticMarkup(<TokenpingLogo tone={tone} title="" />);
    const maskId = html.match(/<mask id="([^"]+)"/)?.[1] ?? "";
    const drawing = html
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "")
      .replace(/<(path|circle|rect)([^>]*)><\/\1>/g, "<$1$2/>");

    expect(drawing).toBe(nodesToSvg(logoNodes("primary", art, maskId)));
  });
});
