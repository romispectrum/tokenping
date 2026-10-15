import { existsSync, readFileSync, readdirSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const APP_DIR = new URL("./", import.meta.url);

// Not indexable: noindex (/admin) or a 404 outside local hardhat builds (/debug, /blockexplorer).
const NON_INDEXED_PREFIXES = ["/admin", "/debug", "/blockexplorer"];

/** Path of every app/**\/page.tsx without a dynamic segment ("/", "/aave", "/blog", …). */
const staticPagePaths = (dir = APP_DIR, prefix = ""): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) {
      // Route groups "(x)" add no path segment; dynamic "[x]" and private "_x" folders are not static pages.
      if (/^[[_]/.test(entry.name)) return [];
      const segment = /^\(.*\)$/.test(entry.name) ? "" : `/${entry.name}`;
      return staticPagePaths(new URL(`${entry.name}/`, dir), `${prefix}${segment}`);
    }
    return entry.name === "page.tsx" ? [prefix || "/"] : [];
  });

const pageFile = (path: string) => new URL(`.${path === "/" ? "" : path}/page.tsx`, APP_DIR);

/** A page whose first statement is "use client" renders its content in the browser, not in the initial HTML. */
const isClientPage = (path: string) =>
  /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["']/.test(readFileSync(pageFile(path), "utf8"));

const loadSitemap = async (stubSlugs: readonly string[] = []) => {
  mockPostStubs(stubSlugs);
  const blog = await import("~~/content/blog");
  const { default: sitemap } = await import("~~/app/sitemap");
  return { sitemap, blog };
};

const pathsOf = (entries: { url: string }[]) => entries.map(({ url }) => new URL(url).pathname);

beforeEach(() => {
  vi.resetModules();
});

describe("sitemap", () => {
  it("lists the home page, /blog and every published post, with real content dates only", async () => {
    const { sitemap, blog } = await loadSitemap(["safe-aave-health-factor"]);

    expect(sitemap()).toEqual([
      { url: "https://tokenping.xyz/" },
      { url: "https://tokenping.xyz/aave" },
      { url: "https://tokenping.xyz/blog", lastModified: blog.getLatestPostDate() },
      ...blog.PUBLISHED_POSTS.map(({ meta }) => ({
        url: `https://tokenping.xyz/blog/${meta.slug}`,
        lastModified: meta.updatedAt ?? meta.publishedAt,
      })),
      { url: "https://tokenping.xyz/privacy" },
    ]);
    expect(pathsOf(sitemap())).not.toContain("/blog/safe-aave-health-factor");
    expect(blog.PUBLISHED_POSTS).toHaveLength(POST_SLUGS.length - 1);
  });

  it("leaves out /blog and every post while all of them are placeholders", async () => {
    const { sitemap } = await loadSitemap(POST_SLUGS);

    expect(sitemap()).toEqual([
      { url: "https://tokenping.xyz/" },
      { url: "https://tokenping.xyz/aave" },
      { url: "https://tokenping.xyz/privacy" },
    ]);
  });

  it("lists only pages that exist and render on the server", async () => {
    const { sitemap } = await loadSitemap();
    const pages = pathsOf(sitemap()).filter(path => !path.startsWith("/blog/"));

    for (const path of pages) {
      expect(existsSync(pageFile(path)), `${path}: no app${path}/page.tsx`).toBe(true);
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
        (path !== "/blog" || blog.PUBLISHED_POSTS.length > 0),
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
