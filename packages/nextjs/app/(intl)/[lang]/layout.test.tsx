import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import RootLayout, { dynamicParams, generateMetadata, generateStaticParams } from "~~/app/(intl)/[lang]/layout";
import { LANG_PARAMS } from "~~/i18n/localeSegment";
import { rootMetadata } from "~~/utils/seo";
import { langParams } from "~~/utils/testing/langParams";
import { renderHtml } from "~~/utils/testing/render";

// next/font is compiled by Next; under Vitest each loader returns its variable as the class.
vi.mock("next/font/local", () => ({ default: (options: { variable: string }) => ({ variable: options.variable }) }));
vi.mock("next/font/google", () => {
  const loader = (options: { variable: string }) => ({ variable: options.variable });
  return { Geist_Mono: loader, Manrope: loader, Noto_Sans_Thai: loader, Plus_Jakarta_Sans: loader };
});

// The client root loads on demand in the browser; here it only shows which language it was given.
vi.mock("~~/i18n/client/roots", () => ({
  PrefixedLocaleRoot: ({ locale, children }: { locale: string; children: ReactNode }) => (
    <div data-stub="root" data-locale={locale}>
      {children}
    </div>
  ),
}));

const renderLayout = async (lang: string) => renderHtml(await RootLayout({ children: "page", ...langParams(lang) }));

describe("the prefixed languages' root layout", () => {
  it("is prerendered for every prefixed language and 404s any other first segment", async () => {
    expect(generateStaticParams()).toEqual(LANG_PARAMS);
    expect(dynamicParams).toBe(false);
    await expect(RootLayout({ children: "page", ...langParams("xx") })).rejects.toThrow();
  });

  it("declares the language on <html> and mounts its client root", async () => {
    expect(await renderLayout("cz")).toMatch(
      /^<html lang="cs"[^>]*><head><\/head><body><div data-stub="root" data-locale="cs">page<\/div><\/body><\/html>$/,
    );
    expect(await renderLayout("sr")).toMatch(/^<html lang="sr-Latn"/);
    expect(await renderLayout("no")).toContain('data-locale="nb"');
  });

  it("adds a language's own font only where Satoshi lacks its letters", async () => {
    expect(await renderLayout("ru")).toContain("--font-cyrillic-greek");
    expect(await renderLayout("vi")).toContain("--font-vietnamese");
    const french = await renderLayout("fr");
    expect(french).not.toContain("--font-cyrillic-greek");
    expect(french).not.toContain("--font-vietnamese");
  });

  it("takes the language's site metadata", async () => {
    expect(await generateMetadata(langParams("cz"))).toEqual(rootMetadata("cs"));
  });
});
