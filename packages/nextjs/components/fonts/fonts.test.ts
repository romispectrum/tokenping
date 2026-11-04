import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// next/font only runs inside Next's compiler; here each loader returns its options, with the variable as the class.
vi.mock("next/font/google", () => {
  const loader = (options: { variable: string }) => ({ ...options, variable: `class${options.variable}` });
  return { Manrope: loader, Noto_Sans_Thai: loader, Plus_Jakarta_Sans: loader };
});

const css = readFileSync(path.join(__dirname, "../../styles/globals.css"), "utf8");

describe("language fonts", () => {
  it("sets Russian, Ukrainian, Bulgarian and Greek in Manrope with Cyrillic and Greek", async () => {
    const { CYRILLIC_GREEK_FONT_CLASSES, cyrillicGreekFont } = await import("./cyrillicGreek");

    expect(CYRILLIC_GREEK_FONT_CLASSES).toBe("class--font-cyrillic-greek");
    expect(cyrillicGreekFont).toMatchObject({ subsets: ["latin", "cyrillic", "greek"], display: "swap" });
    expect(css).toMatch(
      /html:lang\(ru\),\s*html:lang\(uk\),\s*html:lang\(bg\),\s*html:lang\(el\) \{\s*--font-satoshi: var\(--font-cyrillic-greek\);/,
    );
  });

  it("adds Noto Sans Thai after Satoshi on the Thai pages, with taller lines", async () => {
    const { THAI_FONT_CLASSES, thaiFont } = await import("./thai");

    expect(THAI_FONT_CLASSES).toBe("class--font-thai");
    expect(thaiFont).toMatchObject({ subsets: ["thai"], display: "swap" });
    expect(css).toContain('html:lang(th) {\n  --font-satoshi: "Satoshi", var(--font-thai), "Satoshi Fallback";');
    // The rule names Satoshi by the family name RootDocument gives it.
    const rootDocument = readFileSync(path.join(__dirname, "../RootDocument.tsx"), "utf8");
    expect(rootDocument).toContain('declarations: [{ prop: "font-family", value: "Satoshi" }]');
    expect(css).toMatch(/html:lang\(th\) body \{\s*line-height: 1\.8;/);
    expect(css).toMatch(/html:lang\(th\) :where\(h1, h2, h3, h4, h5, h6\) \{\s*line-height: 1\.45;/);
  });
});
