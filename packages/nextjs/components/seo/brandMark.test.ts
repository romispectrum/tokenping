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

  it("switches the favicon to the outline art when the browser is in dark mode", () => {
    const svg = faviconSvg();

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">');
    expect(svg).toContain("@media (prefers-color-scheme:dark){.tp-light{display:none}.tp-dark{display:inline}}");
    expect(svg).toContain(`<svg class="tp-light" viewBox="${LOGO_VIEWBOX.symbol.solid}"`);
    expect(svg).toContain(`<svg class="tp-dark" viewBox="${LOGO_VIEWBOX.symbol.outline}"`);
  });

  it("gives every mask in the favicon its own id", () => {
    const ids = [...faviconSvg().matchAll(/ id="([^"]+)"/g)].map(match => match[1]);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("draws the solid art in black by default and in the requested colour", () => {
    expect(logoSvg({ variant: "symbol", art: "solid" })).toContain(
      // lint-brand-ignore-next-line hex-colour: asserts the artwork's default fill
      `viewBox="${LOGO_VIEWBOX.symbol.solid}" color="#000"`,
    );
    // lint-brand-ignore-next-line hex-colour: asserts a colour passed through to the SVG
    expect(logoSvg({ variant: "primary", art: "solid", color: "#9C27B0" })).toContain('color="#9C27B0"');
  });

  it("adds the wordmark to the primary lockup only", () => {
    const wordmark = 'transform="translate(75.72 45.07) scale(0.03505)"';

    expect(logoSvg({ variant: "primary", art: "outline" })).toContain(wordmark);
    expect(logoSvg({ variant: "symbol", art: "outline" })).not.toContain(wordmark);
  });

  it("encodes an SVG as a base64 data URI for next/og", () => {
    const svg = logoSvg({ variant: "primary", art: "outline" });
    const uri = svgDataUri(svg);

    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(Buffer.from(uri.split(",")[1], "base64").toString()).toBe(svg);
  });

  // The lockup must stay at least 100px wide at its smallest allowed height, h-7 (28px).
  it("keeps the lockup at least 100px wide at 28px tall in both arts", () => {
    expect(28 * viewBoxAspect(LOGO_VIEWBOX.primary.solid)).toBeGreaterThanOrEqual(100);
    expect(28 * viewBoxAspect(LOGO_VIEWBOX.primary.outline)).toBeGreaterThanOrEqual(100);
  });
});
