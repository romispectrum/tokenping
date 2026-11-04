import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANG_PARAMS, langSegment, requireSegmentLocale, segmentLocale } from "~~/i18n/localeSegment";
import { PREFIXED_LOCALES } from "~~/i18n/locales";

/** The folders of a directory that add a fixed path segment: not route groups, dynamic or private folders. */
const staticFolders = (dir: URL) =>
  readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !/^[([_]/.test(entry.name))
    .map(entry => entry.name);

describe("the [lang] segment", () => {
  it("names each prefixed language by its URL prefix, not always its code", () => {
    expect(segmentLocale("cz")).toBe("cs");
    expect(segmentLocale("no")).toBe("nb");
    expect(segmentLocale("de")).toBe("de");
    expect(langSegment("cs")).toBe("cz");
  });

  it("names no language for English, an empty segment or a page", () => {
    expect(["en", "", "aave", "cs", "nb"].map(segmentLocale)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(() => requireSegmentLocale("xx")).toThrow();
  });

  it("is prerendered once for every prefixed language", () => {
    expect(LANG_PARAMS).toHaveLength(PREFIXED_LOCALES.length);
    expect(new Set(LANG_PARAMS.map(({ lang }) => lang)).size).toBe(PREFIXED_LOCALES.length);
  });

  // A fixed folder at the top of app/ wins over [lang], so a prefix that matched one would hide that language's pages.
  it("never matches a top-level route", () => {
    const routes = [
      ...staticFolders(new URL("../app/", import.meta.url)),
      ...staticFolders(new URL("../app/(en)/", import.meta.url)),
    ];
    expect(routes).toContain("aave");
    expect(LANG_PARAMS.map(({ lang }) => lang).filter(lang => routes.includes(lang))).toEqual([]);
  });
});
