import { describe, expect, it } from "vitest";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { localeFromPath, postAlternates, routePath, translatePath } from "~~/i18n/routes";

describe("localeFromPath", () => {
  it.each([
    ["/", "en"],
    ["/aave", "en"],
    ["/blog/aave-health-factor", "en"],
    ["/cz", "cs"],
    ["/cz/blog/aave-health-factor-vysvetleni", "cs"],
    ["/es", "es"],
    ["/es/privacidad", "es"],
    ["/es/blog/factor-de-salud-aave", "es"],
    ["/hi", "hi"],
    ["/hi/gopaniyata", "hi"],
    ["/hi/blog/aave-health-factor-kya-hai", "hi"],
    ["/de", "de"],
    ["/de/datenschutz", "de"],
    ["/vi", "vi"],
    ["/vi/blog/he-so-suc-khoe-aave", "vi"],
    // A segment that only starts like a language prefix is English.
    ["/esx", "en"],
    ["/hindi", "en"],
    ["/design", "en"],
    ["/video", "en"],
    ["/czech", "en"],
  ])("reads %j as %s", (path, locale) => {
    expect(localeFromPath(path)).toBe(locale);
  });
});

describe("translatePath", () => {
  it("maps each static page between all languages", () => {
    expect(translatePath("/privacy", "de")).toBe("/de/datenschutz");
    expect(translatePath("/de/datenschutz", "vi")).toBe("/vi/quyen-rieng-tu");
    expect(translatePath("/vi/aave", "de")).toBe("/de/aave");
    expect(translatePath("/privacy", "es")).toBe("/es/privacidad");
    expect(translatePath("/privacy", "hi")).toBe("/hi/gopaniyata");
    expect(translatePath("/hi/gopaniyata", "cs")).toBe("/cz/ochrana-soukromi");
    expect(translatePath("/es/privacidad", "cs")).toBe("/cz/ochrana-soukromi");
    expect(translatePath("/cz/ochrana-soukromi", "en")).toBe("/privacy");
    expect(translatePath("/es", "en")).toBe("/");
    expect(translatePath("/es/aave/", "cs")).toBe("/cz/aave");
  });

  it("maps a post to its translation by its slug in each language", () => {
    expect(translatePath("/blog/aave-health-factor", "es")).toBe("/es/blog/factor-de-salud-aave");
    expect(translatePath("/es/blog/factor-de-salud-aave", "cs")).toBe("/cz/blog/aave-health-factor-vysvetleni");
    expect(translatePath("/es/blog/factor-de-salud-aave", "en")).toBe("/blog/aave-health-factor");
    expect(translatePath("/blog/aave-health-factor", "hi")).toBe("/hi/blog/aave-health-factor-kya-hai");
    expect(translatePath("/hi/blog/aave-health-factor-kya-hai", "es")).toBe("/es/blog/factor-de-salud-aave");
    expect(translatePath("/de/blog/aave-health-factor-erklaert", "vi")).toBe("/vi/blog/he-so-suc-khoe-aave");
  });

  it("falls back to the target language's home page for any other path", () => {
    expect(translatePath("/es/blog/no-such-post", "en")).toBe("/");
    expect(translatePath("/admin", "es")).toBe("/es");
  });
});

describe("routes", () => {
  it("puts every translated page under its language's prefix", () => {
    for (const [locale, prefix] of [
      ["es", "/es"],
      ["hi", "/hi"],
      ["de", "/de"],
      ["vi", "/vi"],
    ] as const)
      for (const route of ["home", "dashboard", "morpho", "blog", "blogFeed", "privacy"] as const)
        expect(routePath(locale, route)).toMatch(new RegExp(`^${prefix}(/|$)`));
  });

  it("gives every post a distinct slug in every translation, all of them lower-case ASCII", () => {
    for (const locale of ["cs", "es", "hi", "de", "vi"] as const) {
      const slugs = Object.values(POST_SLUGS).map(slug => slug[locale]);

      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
    expect(postAlternates("aave-health-factor")).toEqual({
      en: "/blog/aave-health-factor",
      cs: "/cz/blog/aave-health-factor-vysvetleni",
      es: "/es/blog/factor-de-salud-aave",
      hi: "/hi/blog/aave-health-factor-kya-hai",
      de: "/de/blog/aave-health-factor-erklaert",
      vi: "/vi/blog/he-so-suc-khoe-aave",
    });
  });
});
