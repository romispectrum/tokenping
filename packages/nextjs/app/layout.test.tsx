import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { metadata, viewport } from "~~/app/layout";
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

describe("root layout", () => {
  it("wraps the page in the theme provider and the app providers", () => {
    // BUG(B4.2): <html> has no lang attribute.
    expect(renderHtml(<RootLayout>page</RootLayout>)).toBe(
      '<html><head></head><body><div data-stub="theme-provider" data-enable-system="true"><div data-stub="providers">page</div></div></body></html>',
    );
  });

  // Server markup never serializes suppressHydrationWarning, so read the props off the element. RootLayout has no
  // hooks, so it can be called directly.
  it("suppresses hydration warnings on <html>, whose attributes next-themes rewrites before hydration", () => {
    const html = RootLayout({ children: "page" });

    expect(html.type).toBe("html");
    expect(html.props.suppressHydrationWarning).toBe(true);
    // BUG(B4.2): no lang attribute, so assistive technology cannot tell the page language.
    expect(html.props.lang).toBeUndefined();
  });

  it("exports the viewport settings", () => {
    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      maximumScale: 5,
      viewportFit: "cover",
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f4f8ff" },
        // BUG(B4.6): the dark browser-chrome colour matches neither the dark header nor the dark page background.
        { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
      ],
    });
  });

  it("exports the default title and description", () => {
    // BUG(B4.4): the title template still appends the Scaffold-ETH 2 brand.
    expect(metadata.title).toEqual({ default: "Tokenping — DeFi notifications", template: "%s | Scaffold-ETH 2" });
    expect(metadata.description).toBe(
      "Monitor your DeFi positions and get notified before your health factor is at risk. Tokenping supports Aave and more protocols.",
    );
  });
});
