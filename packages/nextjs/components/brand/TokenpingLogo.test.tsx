import { describe, expect, it } from "vitest";
import { TokenpingLogo } from "~~/components/brand/TokenpingLogo";
import { LOGO_VIEWBOX, logoNodes, nodesToSvg } from "~~/components/brand/logoArt";
import { renderStaticMarkup } from "~~/utils/testing/render";

const svgTags = (html: string) => html.match(/<svg[^>]*>/g) ?? [];

describe("TokenpingLogo", () => {
  // The mark has its own background, so one drawing serves light and dark surfaces.
  it("renders the lockup as one SVG on every surface", () => {
    const tags = svgTags(renderStaticMarkup(<TokenpingLogo className="h-8 w-auto" />));

    expect(tags).toHaveLength(1);
    expect(tags[0]).toContain(`viewBox="${LOGO_VIEWBOX.primary}"`);
    expect(tags[0]).toContain('class="h-8 w-auto"');
  });

  it("draws the symbol without the wordmark", () => {
    const html = renderStaticMarkup(<TokenpingLogo variant="symbol" />);

    expect(html).toContain(`viewBox="${LOGO_VIEWBOX.symbol}"`);
    expect(html).not.toContain("scale(0.036)");
  });

  // No colour on the SVG itself: the wordmark inherits the text colour, which a .dark band switches to white.
  it("lets the wordmark follow the surrounding text colour", () => {
    const html = renderStaticMarkup(<TokenpingLogo />);

    expect(svgTags(html)[0]).not.toContain("color=");
    expect(html).toMatch(/<path transform="translate\([^"]+\)" d="[^"]+" fill="currentColor"/);
  });

  it("names the logo with an SVG title by default", () => {
    const html = renderStaticMarkup(<TokenpingLogo />);
    const titleId = html.match(/<title id="([^"]+)">Tokenping<\/title>/)?.[1];

    expect(titleId).toBeDefined();
    expect(html).toContain(`role="img" aria-labelledby="${titleId}"`);
  });

  it("hides the logo from assistive technology when a wrapping link names it", () => {
    const html = renderStaticMarkup(<TokenpingLogo title="" />);

    expect(html).not.toContain("<title");
    expect(html).not.toContain('role="img"');
    expect(svgTags(html)[0]).toContain('aria-hidden="true"');
  });

  // Several logos share a page (header, footer): a duplicated gradient id would paint the second square from the
  // first one's definition, and vanish with it.
  it("gives every instance its own gradient and title ids", () => {
    const html = renderStaticMarkup(
      <>
        <TokenpingLogo />
        <TokenpingLogo variant="symbol" />
      </>,
    );
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
    const fills = [...html.matchAll(/fill="url\(#([^)]+)\)"/g)].map(match => match[1]);

    expect(ids.length).toBe(4);
    expect(new Set(ids).size).toBe(ids.length);
    expect(fills).toHaveLength(2);
    for (const id of fills) expect(ids).toContain(id);
  });

  // The component and the SVG files (favicon, PNG routes, social cards) render one node tree.
  it.each(["primary", "symbol"] as const)("draws exactly the shared art for the %s variant", variant => {
    const html = renderStaticMarkup(<TokenpingLogo variant={variant} title="" />);
    const gradientId = html.match(/<linearGradient id="([^"]+)"/)?.[1] ?? "";
    const drawing = html
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "")
      .replace(/<(path|circle|rect|stop)([^>]*)><\/\1>/g, "<$1$2/>");

    expect(drawing).toBe(nodesToSvg(logoNodes(variant, gradientId)));
  });
});
