import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOGO_VIEWBOX } from "~~/components/brand/logoArt";
import { faviconSvg, logoSvg, svgDataUri, viewBoxAspect } from "~~/components/seo/brandMark";

const readPackageFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("brand mark", () => {
  // The static files cannot import the TS source, so they are pinned to it here.
  it.each(["public/logo.svg", "app/icon.svg"])("%s is the current favicon", path => {
    expect(readPackageFile(path)).toBe(`${faviconSvg()}\n`);
  });

  it("draws the favicon as the mark on its rounded gradient square", () => {
    const svg = faviconSvg();

    expect(svg).toContain(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX.symbol}">`);
    expect(svg).toContain('<rect width="64" height="64" rx="14" fill="url(#tp-symbol-gradient)"/>');
    expect(svg).toContain('<linearGradient id="tp-symbol-gradient"');
  });

  // The apple icon passes 0: iOS rounds the corners itself and would fill transparent ones with black.
  it("squares the corners on request", () => {
    expect(logoSvg({ variant: "symbol", cornerRadius: 0 })).toContain('rx="0"');
  });

  it("colours the wordmark only when asked, since a standalone file inherits no text colour", () => {
    expect(logoSvg({ variant: "primary" })).not.toContain(" color=");
    // lint-brand-ignore-next-line hex-colour: asserts a colour passed through to the SVG
    expect(logoSvg({ variant: "primary", color: "#FFFFFF" })).toContain(
      // lint-brand-ignore-next-line hex-colour: asserts a colour passed through to the SVG
      `viewBox="${LOGO_VIEWBOX.primary}" color="#FFFFFF"`,
    );
  });

  it("adds the wordmark to the primary lockup only", () => {
    const wordmark = 'transform="translate(77.5 45) scale(0.036)"';

    expect(logoSvg({ variant: "primary" })).toContain(wordmark);
    expect(logoSvg({ variant: "symbol" })).not.toContain(wordmark);
  });

  it("encodes an SVG as a base64 data URI for next/og", () => {
    const svg = logoSvg({ variant: "primary" });
    const uri = svgDataUri(svg);

    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(Buffer.from(uri.split(",")[1], "base64").toString()).toBe(svg);
  });

  // The lockup must stay at least 100px wide at its smallest allowed height, h-7 (28px).
  it("keeps the lockup at least 100px wide at 28px tall", () => {
    expect(28 * viewBoxAspect(LOGO_VIEWBOX.primary)).toBeGreaterThanOrEqual(100);
  });
});
