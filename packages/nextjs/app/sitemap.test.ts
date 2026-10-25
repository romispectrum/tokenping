import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS as POST_SLUG_PAIRS } from "~~/i18n/postSlugs";
import { CS_POST_SLUGS, POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const APP_DIR = new URL("./", import.meta.url);

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
  vi.unstubAllEnvs();
});

describe("sitemap", () => {
  it("lists every page in both languages, each post with its published translation, with real content dates only", async () => {
    const { sitemap, blog } = await loadSitemap(["safe-aave-health-factor"]);
    const entries = sitemap();
    const entry = (path: string) => entries.find(({ url }) => url === `${SITE}${path}`);

    expect(entries.slice(0, 4)).toEqual([...bilingual("/", "/cz"), ...bilingual("/aave", "/cz/aave")]);
    expect(entries.slice(-2)).toEqual(bilingual("/privacy", "/cz/ochrana-soukromi"));
    // Each language's blog index carries that language's newest content date.
    expect(entry("/blog")).toMatchObject({ lastModified: blog.getLatestPostDate() });
    expect(entry("/cz/blog")).toMatchObject({
      lastModified: blog.getLatestPostDate(blog.getPublishedPosts("cs")),
    });
    // A post listed in both languages names both as alternates.
    for (const { meta } of blog.PUBLISHED_POSTS) {
      const cs = `/cz/blog/${POST_SLUG_PAIRS[meta.slug].cs}`;
      expect(entry(`/blog/${meta.slug}`)).toEqual({
        url: `${SITE}/blog/${meta.slug}`,
        lastModified: meta.updatedAt ?? meta.publishedAt,
        alternates: { languages: { en: `${SITE}/blog/${meta.slug}`, cs: `${SITE}${cs}` } },
      });
    }
    // A placeholder is left out, and its published translation is listed alone, with no hreflang to it.
    expect(entry("/blog/safe-aave-health-factor")).toBeUndefined();
    expect(entry(`/cz/blog/${POST_SLUG_PAIRS["safe-aave-health-factor"].cs}`)).not.toHaveProperty("alternates");
    expect(blog.PUBLISHED_POSTS).toHaveLength(POST_SLUGS.length - 1);
  });

  it("leaves out both blogs and every post while all of them are placeholders", async () => {
    const { sitemap } = await loadSitemap(POST_SLUGS, CS_POST_SLUGS);

    expect(sitemap()).toEqual([
      ...bilingual("/", "/cz"),
      ...bilingual("/aave", "/cz/aave"),
      ...bilingual("/privacy", "/cz/ochrana-soukromi"),
    ]);
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
    // app/sitemap.ts lists it.
    for (const path of expected) expect(listed.has(path), `${path}: add it to app/sitemap.ts`).toBe(true);
  });

  it("lists the Morpho dashboard after Aave's only while Morpho is enabled", async () => {
    const off = pathsOf((await loadSitemap()).sitemap());
    expect(off.filter(path => MORPHO_PAGES.includes(path))).toEqual([]);

    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "true");
    const entries = (await loadSitemap()).sitemap();

    expect(entries.slice(0, 6)).toEqual([
      ...bilingual("/", "/cz"),
      ...bilingual("/aave", "/cz/aave"),
      ...bilingual("/morpho", "/cz/morpho"),
    ]);
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

  it("is the same on every build: no build-time dates", async () => {
    const { sitemap } = await loadSitemap();

    expect(sitemap()).toEqual(sitemap());
    expect(sitemap().every(({ lastModified }) => lastModified === undefined || typeof lastModified === "string")).toBe(
      true,
    );
  });
});
