import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata, viewport } from "~~/app/layout";
import manifest from "~~/public/manifest.json";
import { renderHtml } from "~~/utils/testing/render";

vi.mock("~~/components/ThemeProvider", () => ({
  ThemeProvider: ({ children, enableSystem }: { children: ReactNode; enableSystem?: boolean }) => (
    <div data-stub="theme-provider" data-enable-system={String(enableSystem)}>
      {children}
    </div>
  ),
}));

vi.mock("~~/components/ScaffoldEthAppWithProviders", () => ({
  ScaffoldEthAppWithProviders: ({ children }: { children: ReactNode }) => <div data-stub="providers">{children}</div>,
}));

const GLOBALS_CSS = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

const getThemeHexToken = (theme: "light" | "dark", token: string) => {
  const themeBlock = GLOBALS_CSS.match(
    new RegExp(`@plugin\\s+"daisyui/theme"\\s*\\{\\s*name\\s*:\\s*"${theme}"\\s*;([^}]*)\\}`),
  )?.[1];
  return themeBlock?.match(new RegExp(`${token}\\s*:\\s*(#[0-9a-f]{6})\\s*;`, "i"))?.[1].toLowerCase();
};

describe("root layout", () => {
  it("wraps the page in the theme provider and the app providers", () => {
    expect(renderHtml(<RootLayout>page</RootLayout>)).toBe(
      '<html lang="en"><head></head><body><div data-stub="theme-provider" data-enable-system="true"><div data-stub="providers">page</div></div></body></html>',
    );
  });

  // Server markup never serializes suppressHydrationWarning, so read the props off the element. RootLayout has no
  // hooks, so it can be called directly.
  it("suppresses hydration warnings on <html>, whose attributes next-themes rewrites before hydration", () => {
    const html = RootLayout({ children: "page" });

    expect(html.type).toBe("html");
    expect(html.props.suppressHydrationWarning).toBe(true);
  });

  it("declares the page language on <html> for assistive technology", () => {
    expect(renderHtml(<RootLayout>page</RootLayout>)).toMatch(/^<html lang="en">/);
  });

  it("exports the viewport size and scaling settings", () => {
    expect(viewport).toMatchObject({ width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover" });
  });

  // Read from globals.css instead of hex literals: a hard-coded dark value once drifted from the rendered background.
  it("tints the browser chrome with the root page background of each theme in globals.css", () => {
    const light = getThemeHexToken("light", "--color-base-200");
    const dark = getThemeHexToken("dark", "--color-base-200");

    expect(GLOBALS_CSS, "globals.css no longer paints :root with --color-base-200").toMatch(
      /:root,\s*\[data-theme\]\s*\{[^}]*background:\s*var\(--color-base-200\)/,
    );
    expect(light, "light --color-base-200 is not a 6-digit hex in globals.css").toBeDefined();
    expect(dark, "dark --color-base-200 is not a 6-digit hex in globals.css").toBeDefined();
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: light },
      { media: "(prefers-color-scheme: dark)", color: dark },
    ]);
  });

  it("exports the default title and description", () => {
    expect(metadata.title).toEqual({ default: "Tokenping — DeFi notifications", template: "%s | Tokenping" });
    expect(metadata.description).toBe(
      "Monitor your DeFi positions and get notified before your health factor is at risk. Tokenping supports Aave and more protocols.",
    );
  });

  it("brands page titles in social previews as Tokenping", () => {
    const title = { default: "Tokenping — DeFi notifications", template: "%s | Tokenping" };

    expect(metadata.openGraph?.title).toEqual(title);
    expect(metadata.twitter?.title).toEqual(title);
  });
});

// No page links this file (getMetadata sets no `manifest`), so this pins the file's contents only.
describe("public/manifest.json", () => {
  it("carries the Tokenping name", () => {
    expect(manifest).toMatchObject({ name: "Tokenping", short_name: "Tokenping" });
  });
});
