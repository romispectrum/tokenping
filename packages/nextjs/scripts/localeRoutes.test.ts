import { PACKAGE_ROOT, localeRouteFiles, readGenerated } from "./localeRoutes";
import { readdirSync } from "node:fs";
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
