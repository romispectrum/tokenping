import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALES } from "~~/i18n/locales";

// A page's JavaScript carries one language: client code reads strings through useMessages, which the root layout's
// provider (i18n/client/<locale>.tsx) fills with that language only. Importing a message index (every language) from
// client code would bring every language back into the browser.

const ROOT = path.resolve(__dirname, "../..");
const SOURCE_DIRS = ["app", "components", "hooks", "i18n", "services", "utils"];

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith(".vitest.ts") ? [full] : [];
  });

const runsInTheBrowser = (source: string) =>
  /^["']use client["']/.test(source.trimStart()) || /\buse(Messages|Locale)\(/.test(source);

// A value import of a message area's index ("~~/i18n/messages/dashboard"); type imports are erased.
const INDEX_VALUE_IMPORT = /^import (?!type\b)[^;]*from "~~\/i18n\/messages\/[a-z]+";/m;

describe("client messages", () => {
  it("never imports a message index (every language) from code that runs in the browser", () => {
    const offenders = SOURCE_DIRS.flatMap(dir => sourceFiles(path.join(ROOT, dir)))
      .filter(file => !file.startsWith(path.join(ROOT, "i18n/messages")))
      .filter(file => {
        const source = readFileSync(file, "utf8");
        return runsInTheBrowser(source) && INDEX_VALUE_IMPORT.test(source);
      })
      .map(file => path.relative(ROOT, file));
    expect(offenders).toEqual([]);
  });

  it.each(LOCALES)("has a client provider for %s that loads that language only", locale => {
    const file = path.join(ROOT, "i18n/client", `${locale}.tsx`);
    expect(existsSync(file)).toBe(true);
    const imports = [...readFileSync(file, "utf8").matchAll(/from "~~\/i18n\/messages\/([a-z]+)\/([a-z]+)";/g)];
    expect(imports.length).toBe(6);
    expect(imports.every(([, , language]) => language === locale)).toBe(true);
  });
});
