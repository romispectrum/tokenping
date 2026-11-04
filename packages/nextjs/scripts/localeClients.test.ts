import { PACKAGE_ROOT, localeClientFiles, readGenerated } from "./localeClients";
import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The client roots are generated (scripts/localeClients.ts); edit the templates there and run `yarn locale-clients`,
// never one language's copy.
describe("generated client roots", () => {
  it("match their templates for every language", async () => {
    const files = await localeClientFiles();
    const stale = Object.entries(files)
      .filter(([file, text]) => readGenerated(file) !== text)
      .map(([file]) => file);
    expect(stale, "run `yarn locale-clients`").toEqual([]);
  }, 60_000);

  it("leave English its own routes and every other language the one [lang] route", () => {
    const groups = readdirSync(path.join(PACKAGE_ROOT, "app")).filter(name => /^\([a-z]+\)$/.test(name));
    expect(groups.sort()).toEqual(["(en)", "(intl)"]);
    expect(readdirSync(path.join(PACKAGE_ROOT, "app/(intl)"))).toEqual(["[lang]"]);
  });
});
