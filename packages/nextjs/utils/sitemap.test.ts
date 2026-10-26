import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS as POST_SLUG_PAIRS } from "~~/i18n/postSlugs";
import { parseSitemap } from "~~/scripts/indexNow";
import { CS_POST_SLUGS, POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const APP_DIR = new URL("../app/", import.meta.url);

// Not indexable: noindex (/admin) or a 404 outside local hardhat builds (/debug, /blockexplorer).
const NON_INDEXED_PREFIXES = ["/admin", "/debug", "/blockexplorer"];
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
  const { blogPostMetadata } = await import("~~/components/pages/BlogPostPage");
  return { sitemap, renderSitemapXml, blog, blogPostMetadata };
};

const pathsOf = (entries: { url: string }[]) => entries.map(({ url }) => new URL(url).pathname);

const SITE = "https://tokenping.xyz";
/** A path's URL as the page's canonical writes it: the root without a trailing slash. */
const url = (path: string) => (path === "/" ? SITE : `${SITE}${path}`);

/** A page published in English and Czech: one entry per language, each with its date. */
const bilingual = (en: string, cs: string, lastModified: string) => [
  { url: url(en), lastModified },
  { url: url(cs), lastModified },
];

const HOME_PAGES = bilingual("/", "/cz", "2026-10-20");
const AAVE_PAGES = bilingual("/aave", "/cz/aave", "2026-10-19");
const MORPHO_DASHBOARD_PAGES = bilingual("/morpho", "/cz/morpho", "2026-10-25");
// The privacy page carries the date its Morpho disclosures were added.
const PRIVACY_PAGES = bilingual("/privacy", "/cz/ochrana-soukromi", "2026-10-25");

beforeEach(() => {
  vi.resetModules();
});

describe("sitemapEntries", () => {
  it("lists every page in both languages, each post with its published translation, with real content dates only", async () => {
    const { sitemap, blog } = await loadSitemap(["safe-aave-health-factor"]);
    const entries = sitemap();
    const entry = (path: string) => entries.find(({ url }) => url === `${SITE}${path}`);

    expect(entries.slice(0, 6)).toEqual([...HOME_PAGES, ...AAVE_PAGES, ...MORPHO_DASHBOARD_PAGES]);
    expect(entries.slice(-2)).toEqual(PRIVACY_PAGES);
    // Each language's blog index carries that language's newest content date.
    expect(entry("/blog")).toMatchObject({ lastModified: blog.getLatestPostDate() });
    expect(entry("/cz/blog")).toMatchObject({
      lastModified: blog.getLatestPostDate(blog.getPublishedPosts("cs")),
    });
    // Each published post is listed with its own content date, in each language it is published in.
    for (const { meta } of blog.PUBLISHED_POSTS) {
      expect(entry(`/blog/${meta.slug}`)).toEqual({
        url: `${SITE}/blog/${meta.slug}`,
        lastModified: meta.updatedAt ?? meta.publishedAt,
      });
      expect(entry(`/cz/blog/${POST_SLUG_PAIRS[meta.slug].cs}`)).toBeDefined();
    }
    // A placeholder is left out, and its published translation is listed alone.
    expect(entry("/blog/safe-aave-health-factor")).toBeUndefined();
    expect(entry(`/cz/blog/${POST_SLUG_PAIRS["safe-aave-health-factor"].cs}`)).toBeDefined();
    expect(blog.PUBLISHED_POSTS).toHaveLength(POST_SLUGS.length - 1);
  });

  // hreflang lives in each page's <head>, not in the sitemap: a listed post names its published translation there,
  // English as x-default, and a post whose translation is a placeholder names none.
  it("leaves hreflang to the pages, which name only published translations", async () => {
    const { blog, blogPostMetadata } = await loadSitemap(["safe-aave-health-factor"]);
    const [post] = blog.PUBLISHED_POSTS;
    const cs = POST_SLUG_PAIRS[post.meta.slug].cs;

    expect(blogPostMetadata("en", post.meta.slug).alternates?.languages).toEqual({
      en: `/blog/${post.meta.slug}`,
      cs: `/cz/blog/${cs}`,
      "x-default": `/blog/${post.meta.slug}`,
    });
    expect(blogPostMetadata("cs", POST_SLUG_PAIRS["safe-aave-health-factor"].cs).alternates?.languages).toBeUndefined();
  });

  it("leaves out both blogs and every post while all of them are placeholders", async () => {
    const { sitemap } = await loadSitemap(POST_SLUGS, CS_POST_SLUGS);

    expect(sitemap()).toEqual([...HOME_PAGES, ...AAVE_PAGES, ...MORPHO_DASHBOARD_PAGES, ...PRIVACY_PAGES]);
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
        (path !== "/blog" || blog.PUBLISHED_POSTS.length > 0) &&
        (path !== "/cz/blog" || blog.getPublishedPosts("cs").length > 0),
    );

    // A new Server Component page (e.g. /privacy, or /aave once it stops being a client page) fails here until
    // utils/sitemap.ts lists it.
    for (const path of expected) expect(listed.has(path), `${path}: add it to utils/sitemap.ts`).toBe(true);
  });

  it("lists the Morpho dashboard after Aave's, as a server-rendered page", async () => {
    const entries = (await loadSitemap()).sitemap();

    expect(entries.slice(0, 6)).toEqual([...HOME_PAGES, ...AAVE_PAGES, ...MORPHO_DASHBOARD_PAGES]);
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

  // The sitemap namespace alone: an element in the XHTML namespace makes browsers drop their XML tree view and show the
  // file as one line of text.
  it("writes loc then lastmod in the sitemap namespace alone: no hreflang links, changefreq or priority", async () => {
    const { sitemap, renderSitemapXml } = await loadSitemap();
    const xml = await renderSitemapXml(sitemap());

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
    const orders = elementOrder(xml);
    expect(orders).toHaveLength(sitemap().length);
    for (const order of orders) expect(order).toEqual(["loc", "lastmod"]);
    expect(xml).not.toMatch(/xhtml|hreflang|<changefreq>|<priority>/);
    // The home page in the URL standard's normal form, dated by the day only.
    expect(xml).toContain("<url><loc>https://tokenping.xyz/</loc><lastmod>2026-10-20</lastmod></url>");
  });

  it("escapes what XML reserves", async () => {
    const { renderSitemapXml } = await loadSitemap();
    const xml = await renderSitemapXml([{ url: `${SITE}/a?b=1&c=<2>`, lastModified: "2026-10-25" }]);

    // The URL is first put in its normal form (the query's < and > percent-encoded), then escaped for XML.
    expect(xml).toContain("<loc>https://tokenping.xyz/a?b=1&amp;c=%3C2%3E</loc>");
    expect(xml).toContain("<lastmod>2026-10-25</lastmod></url>");
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it("reads back as the same addresses and dates, in order, as the IndexNow script parses it", async () => {
    const { sitemap, renderSitemapXml } = await loadSitemap();
    const normal = (url: string) => new URL(url).toString();
    expect(
      parseSitemap(await renderSitemapXml(sitemap())).map(({ url, lastModified }) => [normal(url), lastModified]),
    ).toEqual(sitemap().map(({ url, lastModified }) => [normal(url), lastModified]));
  });
});
