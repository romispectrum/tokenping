import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/md/[[...path]]/route";
import { estimateTokens } from "~~/utils/markdown";
import { CONTENT_SIGNAL } from "~~/utils/robots";
import { sitemapEntries } from "~~/utils/sitemap";

const ORIGIN = "https://tokenping.xyz";
const MARKDOWN = "text/markdown, text/html;q=0.9, */*;q=0.8";
const BROWSER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
const PAGE_HTML =
  '<!DOCTYPE html><html lang="en"><head><title>Dashboard | Tokenping</title></head><body>' +
  '<header><a href="/">Tokenping</a></header><main><h1>Dashboard</h1><p>See <a href="/blog">the guides</a>.</p></main>' +
  "</body></html>";

/** Every page the sitemap lists, by path. */
const SITEMAP_PATHS = sitemapEntries().map(({ url }) => new URL(url).pathname);

/** The request next.config.ts rewrites to this route: the page's own URL, `path` its segments. */
const get = (path: string, accept: string | null = MARKDOWN, origin = ORIGIN) => {
  const headers = accept === null ? undefined : { accept };
  const segments = path === "/" ? undefined : path.slice(1).split("/");
  return GET(new NextRequest(`${origin}${path}`, { headers }), { params: Promise.resolve({ path: segments }) });
};

const htmlResponse = (html = PAGE_HTML, init: ResponseInit = {}) =>
  new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" }, ...init });

let fetchMock: ReturnType<typeof vi.fn>;
let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => htmlResponse());
  vi.stubGlobal("fetch", fetchMock);
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /md/[[...path]]", () => {
  it("answers a page with its markdown, its canonical and how to cache it", async () => {
    const response = await get("/aave");
    const markdown = await response.text();

    expect(response.status).toBe(200);
    expect(Object.fromEntries(response.headers)).toEqual({
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "content-signal": CONTENT_SIGNAL,
      "content-type": "text/markdown; charset=utf-8",
      link: `<${ORIGIN}/aave>; rel="canonical"`,
      vary: "Accept",
      "x-markdown-tokens": String(estimateTokens(markdown)),
    });
    expect(markdown).toBe(
      [
        "---",
        'title: "Dashboard | Tokenping"',
        `url: "${ORIGIN}/aave"`,
        'language: "en"',
        "---",
        "",
        "# Dashboard",
        "",
        `See [the guides](${ORIGIN}/blog).`,
        "",
      ].join("\n"),
    );
  });

  it("converts the page's own HTML, asked for as HTML so the rewrite does not send it back here", async () => {
    await get("/cz/blog");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${ORIGIN}/cz/blog`);
    expect(init).toMatchObject({ headers: { Accept: "text/html" }, cache: "no-store", redirect: "error" });
  });

  /** A page's canonical as the page writes it: the site's root without a trailing slash. */
  const canonicalOf = (path: string) => (path === "/" ? ORIGIN : `${ORIGIN}${path}`);

  it("serves every page the sitemap lists, the home pages included", async () => {
    expect(SITEMAP_PATHS).toEqual(expect.arrayContaining(["/", "/cz", "/aave", "/privacy", "/cz/ochrana-soukromi"]));
    for (const path of SITEMAP_PATHS) {
      const response = await get(path);

      expect(response.status, path).toBe(200);
      expect(response.headers.get("link"), path).toMatch(new RegExp(`^<${canonicalOf(path)}>; rel="canonical"`));
    }
    expect(fetchMock).toHaveBeenCalledTimes(SITEMAP_PATHS.length);
  });

  // next.config.ts leaves its home page Link header off markdown requests, because it would replace this one.
  it("names the canonical and then the home page links that next.config.ts sends with the HTML", async () => {
    const { default: nextConfig } = await import("~~/next.config");
    // The homepage rules carry the Link header; the catch-all rule carries the security headers.
    const homeRules = (await nextConfig.headers!()).filter(({ headers }) => headers.some(({ key }) => key === "Link"));

    expect(homeRules.map(({ source }) => source)).toEqual(["/", "/cz", "/es"]);
    for (const { source, headers } of homeRules) {
      const [{ value }] = headers;

      expect((await get(source)).headers.get("link")).toBe(`<${canonicalOf(source)}>; rel="canonical", ${value}`);
    }
    expect((await get("/privacy")).headers.get("link")).toBe(`<${ORIGIN}/privacy>; rel="canonical"`);
  });

  // A crawler or a browser that opens /md/... gets nothing.
  it.each([
    ["no Accept header", null],
    ["a browser's Accept", BROWSER],
    ["*/*", "*/*"],
    ["text/html", "text/html"],
  ])("answers 404 without fetching anything for %s", async (_, accept) => {
    const response = await get("/aave", accept);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["/admin", "/debug", "/blog/no-such-post", "/blog/feed.xml", "/api/auth/session", "/aave/x"])(
    "answers 404 without fetching anything for %s, which the sitemap does not list",
    async path => {
      const response = await get(path);

      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(["http://localhost:3000", ORIGIN])("fetches the page from %s", async origin => {
    vi.stubEnv("VERCEL", undefined);

    expect((await get("/privacy", MARKDOWN, origin)).status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${origin}/privacy`);
  });

  // Off Vercel the Host header could be forged, and it decides what the server fetches.
  it("answers 404 without fetching anything for another host outside Vercel", async () => {
    vi.stubEnv("VERCEL", undefined);

    expect((await get("/privacy", MARKDOWN, "https://attacker.example")).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // On Vercel the Host is always one of the project's domains: a preview URL, an alias or the production domain.
  it("fetches the page from the request's own host on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");

    expect((await get("/privacy", MARKDOWN, "https://tokenping-git-main.vercel.app")).status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://tokenping-git-main.vercel.app/privacy");
  });

  it.each([
    ["the page answers 500", () => htmlResponse("error", { status: 500 })],
    ["the page is not HTML", () => new Response("{}", { headers: { "Content-Type": "application/json" } })],
    ["the page has no <main>", () => htmlResponse("<html><body><p>Hi</p></body></html>")],
    [
      "the fetch fails",
      () => {
        throw new TypeError("fetch failed");
      },
    ],
  ])("answers 502 with no body and logs it when %s", async (_, page) => {
    fetchMock.mockImplementation(async () => page());

    const response = await get("/privacy");

    expect(response.status).toBe(502);
    expect(await response.text()).toBe("");
    expect(consoleError).toHaveBeenCalledWith("GET /privacy as markdown: failed", expect.anything());
  });
});
