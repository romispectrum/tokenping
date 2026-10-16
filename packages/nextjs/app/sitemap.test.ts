import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const APP_DIR = new URL("./", import.meta.url);

// Not indexable: noindex (/admin) or a 404 outside local hardhat builds (/debug, /blockexplorer).
const NON_INDEXED_PREFIXES = ["/admin", "/debug", "/blockexplorer"];

/** Every app/**\/page.tsx without a dynamic segment, by its URL path ("/", "/aave", "/cs/blog", …). */
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

const loadSitemap = async (stubSlugs: readonly string[] = []) => {
  mockPostStubs(stubSlugs);
  const blog = await import("~~/content/blog");
  const { default: sitemap } = await import("~~/app/sitemap");
  return { sitemap, blog };
};

const pathsOf = (entries: { url: string }[]) => entries.map(({ url }) => new URL(url).pathname);

const SITE = "https://tokenping.xyz";
/** A page published in English and Czech: one entry per language, each listing both (hreflang). */
const bilingual = (en: string, cs: string) => {
  const alternates = { languages: { en: `${SITE}${en}`, cs: `${SITE}${cs}` } };
  return [
    { url: `${SITE}${en}`, alternates },
    { url: `${SITE}${cs}`, alternates },
  ];
};

beforeEach(() => {
  vi.resetModules();
});

describe("sitemap", () => {
  it("lists the home page, /blog and every published post, with real content dates only", async () => {
    const { sitemap, blog } = await loadSitemap(["safe-aave-health-factor"]);

    // The Czech posts are placeholders until translated, so the blog lists English only (no hreflang to a stub).
    expect(sitemap()).toEqual([
      ...bilingual("/", "/cs"),
      ...bilingual("/aave", "/cs/aave"),
      { url: `${SITE}/blog`, lastModified: blog.getLatestPostDate() },
      ...blog.PUBLISHED_POSTS.map(({ meta }) => ({
        url: `${SITE}/blog/${meta.slug}`,
        lastModified: meta.updatedAt ?? meta.publishedAt,
      })),
      ...bilingual("/privacy", "/cs/ochrana-soukromi"),
    ]);
    expect(pathsOf(sitemap())).not.toContain("/blog/safe-aave-health-factor");
    expect(blog.PUBLISHED_POSTS).toHaveLength(POST_SLUGS.length - 1);
  });

  it("leaves out /blog and every post while all of them are placeholders", async () => {
    const { sitemap } = await loadSitemap(POST_SLUGS);

    expect(sitemap()).toEqual([
      ...bilingual("/", "/cs"),
      ...bilingual("/aave", "/cs/aave"),
      ...bilingual("/privacy", "/cs/ochrana-soukromi"),
    ]);
  });

  it("lists only pages that exist and render on the server", async () => {
    const { sitemap } = await loadSitemap();
    const pages = pathsOf(sitemap()).filter(path => !path.startsWith("/blog/"));

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
        (path !== "/cs/blog" || blog.getPublishedPosts("cs").length > 0),
    );

    // A new Server Component page (e.g. /privacy, or /aave once it stops being a client page) fails here until
    // app/sitemap.ts lists it.
    for (const path of expected) expect(listed.has(path), `${path}: add it to app/sitemap.ts`).toBe(true);
  });

  it("never lists dev, admin or API routes", async () => {
    const { sitemap } = await loadSitemap();
    const urls = sitemap().map(({ url }) => url);

    expect(urls.filter(url => /\/(admin|debug|blockexplorer|api)(\/|$)/.test(url))).toEqual([]);
  });

  it("is the same on every build: no build-time dates", async () => {
    const { sitemap } = await loadSitemap();

    expect(sitemap()).toEqual(sitemap());
    expect(sitemap().every(({ lastModified }) => lastModified === undefined || typeof lastModified === "string")).toBe(
      true,
    );
  });
});
