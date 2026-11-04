import { PACKAGE_ROOT, layoutFont, layoutSource, localeRouteFiles, readGenerated } from "./localeRoutes";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES } from "~~/i18n/locales";

// The route groups and client roots are generated (scripts/localeRoutes.ts); edit the templates there and run
// `yarn locale-routes`, never one language's copy.
describe("generated language routes", () => {
  it("match their templates for every language", async () => {
    const files = await localeRouteFiles();
    const stale = Object.entries(files)
      .filter(([file, text]) => readGenerated(file) !== text)
      .map(([file]) => file);
    expect(stale, "run `yarn locale-routes`").toEqual([]);
  }, 60_000);

  it("leave no route group for a language that is not in LOCALES", () => {
    const groups = readdirSync(path.join(PACKAGE_ROOT, "app"))
      .filter(name => /^\([a-z]+\)$/.test(name))
      .map(name => name.slice(1, -1))
      .sort();
    expect(groups).toEqual([...LOCALES].sort());
    expect(groups).toContain(DEFAULT_LOCALE);
  });
});

// Satoshi lacks Vietnamese letters, Cyrillic, Greek and Thai. The upcoming languages are named by plain code, so adding
// one to LOCALES gives its generated layout its font with no edit here.
describe("layout fonts", () => {
  it.each(["ru", "uk", "bg", "el"])("sets %s in Manrope through CYRILLIC_GREEK_FONT_CLASSES", code => {
    expect(layoutFont(code)).toEqual({
      name: "CYRILLIC_GREEK_FONT_CLASSES",
      module: "~~/components/fonts/cyrillicGreek",
    });
    const source = layoutSource(code);
    expect(source).toContain('import { CYRILLIC_GREEK_FONT_CLASSES } from "~~/components/fonts/cyrillicGreek";');
    expect(source).toContain(
      `rootDocument({ locale: "${code}", LocaleRoot, children, fontClassName: CYRILLIC_GREEK_FONT_CLASSES })`,
    );
  });

  it("adds Noto Sans Thai to the Thai layout through THAI_FONT_CLASSES", () => {
    expect(layoutFont("th")).toEqual({ name: "THAI_FONT_CLASSES", module: "~~/components/fonts/thai" });
    expect(layoutSource("th")).toContain('import { THAI_FONT_CLASSES } from "~~/components/fonts/thai";');
    expect(layoutSource("th")).toContain("fontClassName: THAI_FONT_CLASSES");
  });

  it("names modules that export those classes", () => {
    for (const code of ["vi", "ru", "uk", "bg", "el", "th"]) {
      const font = layoutFont(code);
      const file = path.join(PACKAGE_ROOT, `${font?.module.replace("~~/", "")}.ts`);
      expect(readFileSync(file, "utf8")).toContain(`export const ${font?.name} = `);
    }
  });

  it("adds no font to a language Satoshi covers", () => {
    expect(LOCALES.filter(locale => layoutFont(locale))).toEqual(["vi"]);
    expect(layoutSource("fr")).not.toContain("fontClassName");
    expect(layoutSource("fr")).not.toContain("components/fonts");
  });
});
