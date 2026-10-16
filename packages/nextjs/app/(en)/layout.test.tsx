import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata, viewport } from "~~/app/(en)/layout";
import { THEME_COLOR } from "~~/components/brand/themeColor";
import { serializeJsonLd } from "~~/components/seo/JsonLd";
import manifest from "~~/public/manifest.json";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, siteJsonLd } from "~~/utils/seo";
import { renderHtml } from "~~/utils/testing/render";

// next/font is compiled by Next; under Vitest each loader records its options and returns the class names it
// would generate.
const fontCalls = vi.hoisted(() => ({ local: [] as unknown[], google: [] as unknown[] }));
vi.mock("next/font/local", () => ({
  default: (options: { variable: string }) => {
    fontCalls.local.push(options);
    return { variable: `local${options.variable}`, className: "", style: {} };
  },
}));
vi.mock("next/font/google", () => ({
  Geist_Mono: (options: { variable: string }) => {
    fontCalls.google.push(options);
    return { variable: `google${options.variable}`, className: "", style: {} };
  },
}));

type ThemeProviderStubProps = {
  children: ReactNode;
  attribute?: string | string[];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

vi.mock("~~/components/ThemeProvider", () => ({
  ThemeProvider: ({
    children,
    attribute,
    defaultTheme,
    enableSystem,
    disableTransitionOnChange,
  }: ThemeProviderStubProps) => (
    <div
      data-stub="theme-provider"
      data-attribute={String(attribute)}
      data-default-theme={defaultTheme}
      data-enable-system={String(enableSystem)}
      data-disable-transition={String(disableTransitionOnChange)}
    >
      {children}
    </div>
  ),
}));

vi.mock("~~/components/ScaffoldEthAppWithProviders", () => ({
  ScaffoldEthAppWithProviders: ({ children }: { children: ReactNode }) => <div data-stub="providers">{children}</div>,
}));

const GLOBALS_CSS = readFileSync(new URL("../../styles/globals.css", import.meta.url), "utf8");

/** --background of a top-level rule (`:root` or `.dark`) in globals.css. */
const backgroundToken = (selector: ":root" | ".dark") =>
  GLOBALS_CSS.match(
    new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")} \\{[^}]*?--background:\\s*(#[0-9A-Fa-f]{6});`),
  )?.[1]?.toUpperCase();

describe("root layout", () => {
  it("renders the site JSON-LD and wraps the page in the theme provider and the app providers", () => {
    expect(renderHtml(<RootLayout>page</RootLayout>)).toBe(
      `<html lang="en" class="local--font-satoshi google--font-geist-mono"><head></head><body><script type="application/ld+json">${serializeJsonLd(siteJsonLd())}</script><div data-stub="theme-provider" data-attribute="class,data-theme" data-default-theme="light" data-enable-system="true" data-disable-transition="true"><div data-stub="providers">page</div></div></body></html>`,
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
    expect(renderHtml(<RootLayout>page</RootLayout>)).toMatch(/^<html lang="en"/);
  });

  // The .dark class drives the tokens and data-theme drives DaisyUI; light is the default whatever the OS says,
  // and System stays available to the user.
  it("themes with both the class and data-theme attributes, light by default", () => {
    const html = RootLayout({ children: "page" });
    const themeProvider = html.props.children.props.children[1];

    expect(themeProvider.props).toMatchObject({
      attribute: ["class", "data-theme"],
      defaultTheme: "light",
      enableSystem: true,
      disableTransitionOnChange: true,
    });
  });

  // Satoshi's upright and italic share one family, so italic text gets the real italic; the data font waits until a
  // page uses it instead of competing with the hero text.
  it("preloads Satoshi with its italic in the same family and leaves the data font unpreloaded", () => {
    expect(fontCalls.local).toEqual([
      expect.objectContaining({
        variable: "--font-satoshi",
        src: [
          expect.objectContaining({ weight: "300 900", style: "normal" }),
          expect.objectContaining({ weight: "300 900", style: "italic" }),
        ],
      }),
    ]);
    expect(fontCalls.local[0]).not.toHaveProperty("preload", false);
    expect(fontCalls.google).toEqual([expect.objectContaining({ variable: "--font-geist-mono", preload: false })]);
  });

  it("exports the viewport size and scaling settings", () => {
    expect(viewport).toMatchObject({ width: "device-width", initialScale: 1, maximumScale: 5, viewportFit: "cover" });
  });

  // Read from globals.css instead of trusting the hex copies: a hard-coded value once drifted from the background.
  it("tints the browser chrome with the light page background and keeps the theme colours in sync with the tokens", () => {
    const light = backgroundToken(":root");
    const dark = backgroundToken(".dark");

    expect(light, ":root --background is not a 6-digit hex in globals.css").toBeDefined();
    expect(dark, ".dark --background is not a 6-digit hex in globals.css").toBeDefined();
    expect(THEME_COLOR).toEqual({ light, dark });
    expect(viewport).toMatchObject({ themeColor: light, colorScheme: "light dark" });
  });

  it("exports the default title, description and production metadataBase", () => {
    expect(metadata.title).toEqual({ default: DEFAULT_TITLE, template: "%s | Tokenping" });
    expect(metadata.description).toBe(DEFAULT_DESCRIPTION);
    expect(metadata.metadataBase?.toString()).toBe("https://tokenping.xyz/");
  });

  // Only Aave V3 exists, so "more protocols" style claims must not come back.
  it("describes the product without claims the product does not support", () => {
    expect(`${DEFAULT_TITLE} ${DEFAULT_DESCRIPTION}`).not.toMatch(/protocols|never miss|real-time|instant/i);
  });

  it("brands social previews as Tokenping without the Scaffold-ETH thumbnail or favicon", () => {
    expect(metadata.openGraph).toMatchObject({ siteName: "Tokenping", title: DEFAULT_TITLE });
    expect(metadata.twitter).toMatchObject({ site: "@tokenping", title: DEFAULT_TITLE });
    expect(JSON.stringify(metadata)).not.toMatch(/thumbnail|favicon\.png|localhost/);
  });

  it("never sets a canonical in the layout, where every page would inherit it", () => {
    expect(metadata.alternates).not.toHaveProperty("canonical");
  });
});

// No page links this file (the metadata sets no `manifest`), so this pins the file's contents only.
describe("public/manifest.json", () => {
  it("carries the Tokenping name and no Scaffold-ETH description", () => {
    expect(manifest).toMatchObject({ name: "Tokenping", short_name: "Tokenping" });
    expect(manifest.description).not.toMatch(/scaffold/i);
  });

  it("lists the icon routes and the light theme colour", () => {
    expect(manifest.icons.map(icon => icon.src)).toEqual(["/icon.svg", "/logo.png", "/apple-icon"]);
    expect(manifest).toMatchObject({ theme_color: THEME_COLOR.light, background_color: THEME_COLOR.light });
  });
});
