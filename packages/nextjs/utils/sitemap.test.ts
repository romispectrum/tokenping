import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS as POST_SLUG_PAIRS } from "~~/i18n/postSlugs";
import { parseSitemap } from "~~/scripts/indexNow";
import { CS_POST_SLUGS, MORPHO_POST_SLUGS, POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const APP_DIR = new URL("../app/", import.meta.url);

// Not indexable: noindex (/admin) or a 404 outside local hardhat builds (/debug, /blockexplorer).
const NON_INDEXED_PREFIXES = ["/admin", "/debug", "/blockexplorer"];
// A 404 until NEXT_PUBLIC_MORPHO_ENABLED is "true", and listed from then on.
const MORPHO_PAGES = ["/morpho", "/cz/morpho"];

/** Every app/**\/page.tsx without a dynamic segment, by its URL path ("/", "/aave", "/cz/blog", …). */
const staticPageFiles = (dir = APP_DIR, prefix = ""): [string, URL][] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry): [string, URL][] => {
    if (entry.isDirectory()) {
      // Route groups "(x)" add no path segment; dynamic "[x]" and private "_x" folders are not static pages.
      if (/^[[_]/.test(entry.name)) return [];
      const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
      return staticPageFiles(new URL(`${entry.name}/`, dir), `${prefix}${segment}`);
    }
    return entry.name === "page.tsx" ? [[prefix || "/", new URL(entry.name, dir)]] : [];
  });

const PAGE_FILES = new Map(staticPageFiles());
const staticPagePaths = () => [...PAGE_FILES.keys()];
const pageFile = (path: string) => PAGE_FILES.get(path);

/** A page whose first statement is "use client" renders its content in the browser, not in the initial HTML. */
const isClientPage = (path: string) =>
  /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(readFileSync(pageFile(path)!, "utf8"));

const loadSitemap = async (stubSlugs: readonly string[] = [], csStubSlugs: readonly string[] = []) => {
  mockPostStubs(stubSlugs, csStubSlugs);
  const blog = await import("~~/content/blog");
  const { sitemapEntries: sitemap, renderSitemapXml } = await import("~~/utils/sitemap");
  return { sitemap, renderSitemapXml, blog };
};

const pathsOf = (entries: { url: string }[]) => entries.map(({ url }) => new URL(url).pathname);

const SITE = "https://tokenping.xyz";
/** A path's URL as the page's canonical writes it: the root without a trailing slash. */
const url = (path: string) => (path === "/" ? SITE : `${SITE}${path}`);

type Kind = { changeFrequency: string; priority: number };
const HOME = { changeFrequency: "weekly", priority: 1 };
const DASHBOARD = { changeFrequency: "weekly", priority: 0.9 };
const PRIVACY = { changeFrequency: "yearly", priority: 0.3 };

/**
 * A page published in English and Czech: one entry per language, each with its date and rank, and listing both with
 * English as x-default (hreflang), as the pages' own links do.
 */
const bilingual = (en: string, cs: string, kind: Kind, lastModified: string) => {
  const alternates = { languages: { en: url(en), cs: url(cs), "x-default": url(en) } };
  return [
    { url: url(en), lastModified, ...kind, alternates },
    { url: url(cs), lastModified, ...kind, alternates },
  ];
};

const HOME_PAGES = bilingual("/", "/cz", HOME, "2026-10-20");
const AAVE_PAGES = bilingual("/aave", "/cz/aave", DASHBOARD, "2026-10-19");
const PRIVACY_PAGES = bilingual("/privacy", "/cz/ochrana-soukromi", PRIVACY, "2026-10-19");

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("sitemapEntries", () => {
  it("lists every page in both languages, each post with its published translation, with real content dates only", async () => {
    const { sitemap, blog } = await loadSitemap(["safe-aave-health-factor"]);
    const entries = sitemap();
    const entry = (path: string) => entries.find(({ url }) => url === `${SITE}${path}`);

    expect(entries.slice(0, 4)).toEqual([...HOME_PAGES, ...AAVE_PAGES]);
    expect(entries.slice(-2)).toEqual(PRIVACY_PAGES);
    // Each language's blog index carries that language's newest content date.
    expect(entry("/blog")).toMatchObject({
      lastModified: blog.getLatestPostDate(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
    expect(entry("/cz/blog")).toMatchObject({
      lastModified: blog.getLatestPostDate(blog.getPublishedPosts("cs")),
    });
    // A post listed in both languages names both as alternates, English as x-default.
    for (const { meta } of blog.PUBLISHED_POSTS) {
      const en = `${SITE}/blog/${meta.slug}`;
      const cs = `${SITE}/cz/blog/${POST_SLUG_PAIRS[meta.slug].cs}`;
      expect(entry(`/blog/${meta.slug}`)).toEqual({
        url: en,
        lastModified: meta.updatedAt ?? meta.publishedAt,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: { en, cs, "x-default": en } },
      });
    }
    // A placeholder is left out, and its published translation is listed alone, with no hreflang to it.
    expect(entry("/blog/safe-aave-health-factor")).toBeUndefined();
    expect(entry(`/cz/blog/${POST_SLUG_PAIRS["safe-aave-health-factor"].cs}`)).not.toHaveProperty("alternates");
    // The Morpho guides wait for Morpho to be enabled.
    expect(blog.PUBLISHED_POSTS).toHaveLength(POST_SLUGS.length - MORPHO_POST_SLUGS.length - 1);
    for (const slug of MORPHO_POST_SLUGS) expect(entry(`/blog/${slug}`), slug).toBeUndefined();
  });

  it("leaves out both blogs and every post while all of them are placeholders", async () => {
    const { sitemap } = await loadSitemap(POST_SLUGS, CS_POST_SLUGS);

    expect(sitemap()).toEqual([...HOME_PAGES, ...AAVE_PAGES, ...PRIVACY_PAGES]);
  });

  it("lists only pages that exist and render on the server", async () => {
    const { sitemap } = await loadSitemap();
    const pages = pathsOf(sitemap()).filter(path => !path.startsWith("/blog/") && !path.startsWith("/cz/blog/"));

    for (const path of pages) {
      expect(pageFile(path) && existsSync(pageFile(path)!), `${path}: no page.tsx under app/ for it`).toBe(true);
      expect(isClientPage(path), `${path}: a "use client" page, so not listed until it is server-rendered`).toBe(false);
    }
  });

  it("lists every indexable server-rendered page", async () => {
    const { sitemap, blog } = await loadSitemap();
    const listed = new Set(pathsOf(sitemap()));
    const expected = staticPagePaths().filter(
      path =>
        !NON_INDEXED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`)) &&
        !isClientPage(path) &&
        !MORPHO_PAGES.includes(path) &&
        (path !== "/blog" || blog.PUBLISHED_POSTS.length > 0) &&
        (path !== "/cz/blog" || blog.getPublishedPosts("cs").length > 0),
    );

    // A new Server Component page (e.g. /privacy, or /aave once it stops being a client page) fails here until
    // utils/sitemap.ts lists it.
    for (const path of expected) expect(listed.has(path), `${path}: add it to utils/sitemap.ts`).toBe(true);
  });

  it("lists the Morpho dashboard after Aave's only while Morpho is enabled, and dates privacy by it", async () => {
    const off = pathsOf((await loadSitemap()).sitemap());
    expect(off.filter(path => MORPHO_PAGES.includes(path))).toEqual([]);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "true");
    const entries = (await loadSitemap()).sitemap();

    expect(entries.slice(0, 6)).toEqual([
      ...HOME_PAGES,
      ...AAVE_PAGES,
      ...bilingual("/morpho", "/cz/morpho", DASHBOARD, "2026-10-25"),
    ]);
    // The privacy page lists Morpho's API from then on, and carries that change's date.
    expect(entries.slice(-2)).toEqual(bilingual("/privacy", "/cz/ochrana-soukromi", PRIVACY, "2026-10-25"));
    for (const path of MORPHO_PAGES) {
      expect(pageFile(path) && existsSync(pageFile(path)!), path).toBe(true);
      expect(isClientPage(path), path).toBe(false);
    }
  });

  it("never lists dev, admin or API routes", async () => {
    const { sitemap } = await loadSitemap();
    const urls = sitemap().map(({ url }) => url);

    expect(urls.filter(url => /\/(admin|debug|blockexplorer|api)(\/|$)/.test(url))).toEqual([]);
  });

  it("is the same on every build: a real content date on every page, never the build time", async () => {
    const { sitemap } = await loadSitemap();

    expect(sitemap()).toEqual(sitemap());
    for (const { url, lastModified } of sitemap()) {
      expect(lastModified, url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(lastModified).toISOString().startsWith(lastModified), url).toBe(true);
    }
  });
});

describe("renderSitemapXml", () => {
  /** Each <url> block's element names, in document order. */
  const elementOrder = (xml: string) =>
    [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) =>
      [...block.matchAll(/<([a-z:]+)[\s>/]/g)].map(([, name]) => name),
    );

  it("writes loc, lastmod, changefreq and priority in the schema's order, then the hreflang links", async () => {
    const { sitemap, renderSitemapXml } = await loadSitemap();
    const xml = renderSitemapXml(sitemap());

    expect(xml.split("\n").slice(0, 2)).toEqual([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]);
    expect(xml.endsWith("</urlset>\n")).toBe(true);
    const orders = elementOrder(xml);
    expect(orders).toHaveLength(sitemap().length);
    for (const order of orders) {
      expect(order.slice(0, 4)).toEqual(["loc", "lastmod", "changefreq", "priority"]);
      expect(order.slice(4).every(name => name === "xhtml:link")).toBe(true);
    }
    expect(xml).toContain(
      [
        "  <url>",
        "    <loc>https://tokenping.xyz</loc>",
        "    <lastmod>2026-10-20</lastmod>",
        "    <changefreq>weekly</changefreq>",
        "    <priority>1.0</priority>",
        '    <xhtml:link rel="alternate" hreflang="en" href="https://tokenping.xyz"/>',
        '    <xhtml:link rel="alternate" hreflang="cs" href="https://tokenping.xyz/cz"/>',
        '    <xhtml:link rel="alternate" hreflang="x-default" href="https://tokenping.xyz"/>',
        "  </url>",
      ].join("\n"),
    );
  });

  it("escapes what XML reserves, and leaves out the xhtml namespace without alternates", async () => {
    const { renderSitemapXml } = await loadSitemap();
    const xml = renderSitemapXml([
      { url: `${SITE}/a?b=1&c=<2>`, lastModified: "2026-10-25", changeFrequency: "yearly", priority: 0.3 },
    ]);

    expect(xml).toContain("<loc>https://tokenping.xyz/a?b=1&amp;c=&lt;2&gt;</loc>");
    expect(xml).toContain("<priority>0.3</priority>");
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it("reads back as the same URLs and dates, in order, as the IndexNow script parses it", async () => {
    const { sitemap, renderSitemapXml } = await loadSitemap();
    expect(parseSitemap(renderSitemapXml(sitemap()))).toEqual(
      sitemap().map(({ url, lastModified }) => ({ url, lastModified })),
    );
  });
});
