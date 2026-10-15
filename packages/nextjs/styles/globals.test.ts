import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// globals.css is the token contract (docs/design-system.md). These tests pin the values every pair in the contrast
// check was computed from, so a token cannot change without this file changing too.
const CSS = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

/** The custom properties declared in the first top-level rule with exactly this selector. */
const block = (selector: string) => {
  const start = CSS.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`no ${selector} block`);
  const body = CSS.slice(CSS.indexOf("{", start) + 1, CSS.indexOf("\n}", start));
  return Object.fromEntries(
    [...body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      // prettier lowercases hex colours; compare them in the spec's upper case
      value.trim().replace(/#[0-9a-f]{3,8}\b/gi, hex => hex.toUpperCase()),
    ]),
  );
};

const LIGHT = block(":root");
const DARK = block(".dark");

describe("globals.css tokens", () => {
  it("defines the six brand colours under neutral names", () => {
    expect(LIGHT).toMatchObject({
      "brand-pink": "#FE5FA9",
      "brand-violet": "#9C27B0",
      "brand-cyan": "#20FAFF",
      "brand-plum": "#4E2255",
      "brand-night": "#18001C",
      "brand-white": "#FFFFFF",
    });
  });

  it.each([
    ["background", "#FFFFFF", "#18001C"],
    ["foreground", "#171717", "#FFFFFF"],
    ["card", "#FFFFFF", "#250E28"],
    ["popover", "#FFFFFF", "#2A142E"],
    ["primary", "#FE5FA9", "#FE5FA9"],
    ["primary-foreground", "#18001C", "#18001C"],
    ["secondary", "#F6F6F6", "#2A142E"],
    ["muted", "#F6F6F6", "#200924"],
    ["muted-foreground", "#666666", "#CBBFC6"],
    ["accent", "#F5E9F7", "#341F37"],
    ["accent-foreground", "#4E2255", "#FFFFFF"],
    ["destructive", "#B42318", "#FF8A80"],
    ["border-color", "#E0E0E0", "rgb(255 255 255 / 0.1)"],
    ["input", "#8A8A8A", "#746677"],
    ["ring", "#9C27B0", "#20FAFF"],
    ["link", "#9C27B0", "#20FAFF"],
    ["kicker", "#9C27B0", "#20FAFF"],
    ["inverse", "#18001C", "#FFFFFF"],
    ["inverse-foreground", "#FFFFFF", "#18001C"],
    ["success", "#157347", "#5AD28F"],
    ["warning", "#9A5B00", "#FFB547"],
    ["info", "#9C27B0", "#D58BE6"],
    ["success-subtle", "#E3EEE9", "#23222E"],
    ["destructive-subtle", "#F6E5E3", "#3D162C"],
  ])("sets --%s to %s on light and %s on dark", (token, light, dark) => {
    expect(LIGHT[token]).toBe(light);
    expect(DARK[token]).toBe(dark);
  });

  // DaisyUI reads --border as its border width (border: var(--border) solid ...). A colour there makes every
  // DaisyUI border invalid: 3px default borders on buttons, toggles without a track.
  it("leaves --border to DaisyUI's border width and names the hairline colour --border-color", () => {
    expect(LIGHT.border).toBeUndefined();
    expect(DARK.border).toBeUndefined();
    for (const theme of CSS.match(/@plugin "daisyui\/theme" \{[^}]*\}/g) ?? []) expect(theme).toMatch(/--border: 1px;/);
    expect(CSS).toContain("--color-border: var(--border-color);");
  });

  it("drops every shadow on dark, where elevation is a lighter surface", () => {
    expect(DARK).toMatchObject({ "shadow-card": "none", "shadow-card-hover": "none", "shadow-frame": "none" });
  });

  // One mapping for both themes and for dark bands: DaisyUI components follow the .dark class.
  it("maps the DaisyUI colours onto the semantic tokens", () => {
    const daisy = block(":root,\n.dark");

    expect(daisy).toMatchObject({
      "color-base-100": "var(--background)",
      "color-base-200": "var(--muted)",
      "color-base-300": "var(--border-color)",
      "color-base-content": "var(--foreground)",
      "color-primary": "var(--primary)",
      "color-primary-content": "var(--primary-foreground)",
      "color-neutral": "var(--inverse)",
      "color-neutral-content": "var(--inverse-foreground)",
      "color-error": "var(--destructive)",
      "color-error-content": "var(--destructive-foreground)",
    });
  });

  it("gives DaisyUI flat shapes: 10px controls, 18px cards, no depth or noise", () => {
    for (const theme of CSS.match(/@plugin "daisyui\/theme" \{[^}]*\}/g) ?? []) {
      expect(theme).toMatch(/--radius-field: 0\.625rem;/);
      expect(theme).toMatch(/--radius-box: 1\.125rem;/);
      expect(theme).toMatch(/--depth: 0;/);
      expect(theme).toMatch(/--noise: 0;/);
    }
    expect(CSS).toMatch(/@plugin "daisyui" \{\s*themes: false;\s*\}/);
  });

  it("switches dark mode with the .dark class only, never with the OS media query", () => {
    expect(CSS).toContain("@custom-variant dark (&:where(.dark, .dark *));");
    expect(CSS).not.toMatch(/prefers-color-scheme|--prefersdark/);
  });

  // dark: follows a dark band; theme-dark follows only the user's theme on <html> (the theme toggle's icon).
  it("offers a theme-dark variant keyed to <html> alone", () => {
    expect(CSS).toContain("@custom-variant theme-dark (&:where(html.dark *));");
  });

  // Without it, text in a dark band inherits the light body's ink: night on night.
  it("gives a dark band the dark text colour in the base layer, where a utility on the band still wins", () => {
    const base = CSS.slice(CSS.indexOf("@layer base {"), CSS.indexOf("/* --- Brand utilities"));

    expect(base).toMatch(/\n {2}\.dark \{\s*color: var\(--foreground\);\s*\}/);
  });

  it("aligns DaisyUI's 600 and 800 weights with the brand's 500 and 700", () => {
    expect(CSS).toMatch(
      /\.btn,\s*\.card-title,\s*\.fieldset-legend,\s*\.menu-title,\s*\.footer-title,\s*\.file-input::file-selector-button \{\s*font-weight: 500;/,
    );
    expect(CSS).toMatch(/\.table :where\(thead, tfoot\),\s*\.stat-value \{\s*font-weight: 700;/);
    expect(CSS).not.toMatch(/font-weight: 600/);
  });

  it("draws the switch as a filled track, --input off and --link on, with a thumb in the page colour", () => {
    expect(CSS).toMatch(
      /\.toggle,\s*\.toggle:is\(:checked, \[aria-checked="true"\], :has\(> input:checked\)\) \{\s*color: var\(--background\);\s*border-color: var\(--input-color\);\s*background-color: var\(--input-color\);/,
    );
    expect(CSS).toMatch(/:is\(\.checkbox, \.radio, \.toggle\):is\(:checked, \[aria-checked="true"\], :indeterminate\)/);
  });

  it("keeps the old palette and pill-shaped fields out", () => {
    expect(CSS).not.toMatch(/#93bbfb|#212638|#385183|#a855f7|#4f46e5|9999rem/i);
  });

  it("ships the brand utilities and the base rules", () => {
    for (const utility of ["kicker", "grain", "divider-brand", "font-data"])
      expect(CSS).toContain(`@utility ${utility} {`);
    expect(CSS).toMatch(/:focus-visible \{\s*outline: 2px solid var\(--ring\);/);
    expect(CSS).toMatch(/h5,\s*h6 \{\s*font-weight: 500;/);
    expect(CSS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(CSS).not.toContain("font-variation-settings:");
  });
});
