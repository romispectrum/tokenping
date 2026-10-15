import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { markDataUri, markSvg } from "~~/components/seo/brandMark";

const readPackageFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("brand mark", () => {
  // The static files cannot import the TS source, so they are pinned to it here.
  it.each(["public/logo.svg", "app/icon.svg"])("%s is the current mark", path => {
    expect(readPackageFile(path)).toBe(`${markSvg()}\n`);
  });

  it("draws the background square with the requested corner radius", () => {
    expect(markSvg()).toContain('<rect width="64" height="64" rx="14"');
    expect(markSvg({ cornerRadius: 0 })).toContain('<rect width="64" height="64" rx="0"');
  });

  it("encodes the mark as a base64 SVG data URI for next/og", () => {
    const uri = markDataUri();

    expect(uri.startsWith("data:image/svg+xml;base64,")).toBe(true);
    expect(Buffer.from(uri.split(",")[1], "base64").toString()).toBe(markSvg());
  });
});
