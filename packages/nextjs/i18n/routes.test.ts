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
    // A segment that only starts like a language prefix is English.
    ["/esx", "en"],
    ["/czech", "en"],
  ])("reads %j as %s", (path, locale) => {
    expect(localeFromPath(path)).toBe(locale);
  });
});

describe("translatePath", () => {
  it("maps each static page between all three languages", () => {
    expect(translatePath("/privacy", "es")).toBe("/es/privacidad");
    expect(translatePath("/es/privacidad", "cs")).toBe("/cz/ochrana-soukromi");
    expect(translatePath("/cz/ochrana-soukromi", "en")).toBe("/privacy");
    expect(translatePath("/es", "en")).toBe("/");
    expect(translatePath("/es/aave/", "cs")).toBe("/cz/aave");
  });

  it("maps a post to its translation by its slug in each language", () => {
    expect(translatePath("/blog/aave-health-factor", "es")).toBe("/es/blog/factor-de-salud-aave");
    expect(translatePath("/es/blog/factor-de-salud-aave", "cs")).toBe("/cz/blog/aave-health-factor-vysvetleni");
    expect(translatePath("/es/blog/factor-de-salud-aave", "en")).toBe("/blog/aave-health-factor");
  });

  it("falls back to the target language's home page for any other path", () => {
    expect(translatePath("/es/blog/no-such-post", "en")).toBe("/");
    expect(translatePath("/admin", "es")).toBe("/es");
  });
});

describe("routes", () => {
  it("puts every Spanish page under /es", () => {
    for (const route of ["home", "dashboard", "morpho", "blog", "blogFeed", "privacy"] as const)
      expect(routePath("es", route)).toMatch(/^\/es(\/|$)/);
  });

  it("gives every post a distinct Spanish slug and path", () => {
    const slugs = Object.values(POST_SLUGS).map(({ es }) => es);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(postAlternates("aave-health-factor")).toEqual({
      en: "/blog/aave-health-factor",
      cs: "/cz/blog/aave-health-factor-vysvetleni",
      es: "/es/blog/factor-de-salud-aave",
    });
  });
});
