import { describe, expect, it, vi } from "vitest";
import {
  ENDPOINTS,
  KEY_LOCATION,
  MAX_URLS_PER_REQUEST,
  SITEMAP_URL,
  batches,
  changedSince,
  isIsoDate,
  isSiteUrl,
  parseOptions,
  parseSitemap,
  requestBody,
  run,
} from "~~/scripts/indexNow";
import { renderSitemapXml, sitemapEntries as sitemap } from "~~/utils/sitemap";

const KEY = "0123456789abcdef0123456789abcdef";

/** The XML app/sitemap.xml/route.ts serves, and its URLs as the script reads them (the home page as ".../"). */
const SITEMAP_XML = await renderSitemapXml(sitemap());
const SITEMAP_URLS = parseSitemap(SITEMAP_XML).map(({ url }) => url);

/** A minimal sitemap of `entries`; a page without a date has no <lastmod>, as any sitemap may. */
const sitemapXml = (entries: { url: string; lastModified?: string }[]) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      ({ url, lastModified }) =>
        `<url><loc>${url}</loc>${lastModified ? `<lastmod>${lastModified}</lastmod>` : ""}</url>`,
    ),
    "</urlset>",
  ].join("\n");

type Reply = Response | Error;

/**
 * A fetch that answers the key file and the sitemap by URL and each POST from `posts` in turn, and records every call.
 * Unknown URLs fail the test instead of reaching the network.
 */
const fakeFetch = ({
  key = new Response(KEY),
  sitemap: sitemapReply = new Response(SITEMAP_XML),
  posts = [new Response("", { status: 200 })],
}: { key?: Reply; sitemap?: Reply; posts?: Reply[] } = {}) => {
  const queue = [...posts];
  return vi.fn<typeof fetch>(async (input, init) => {
    const url = String(input);
    const reply =
      init?.method === "POST"
        ? queue.shift()
        : url === KEY_LOCATION
          ? key
          : url === SITEMAP_URL
            ? sitemapReply
            : undefined;
    if (reply === undefined) throw new Error(`Unexpected request to ${url}`);
    if (reply instanceof Error) throw reply;
    return reply;
  });
};

const postsOf = (fetchMock: ReturnType<typeof fakeFetch>) =>
  fetchMock.mock.calls
    .filter(([, init]) => init?.method === "POST")
    .map(([input, init]) => ({
      url: String(input),
      headers: init?.headers,
      body: JSON.parse(String(init?.body)) as ReturnType<typeof requestBody>,
    }));

const runWith = async (argv: string[], fetchMock = fakeFetch()) => {
  const log = vi.fn<(message: string) => void>();
  const error = vi.fn<(message: string) => void>();
  const code = await run(argv, { fetch: fetchMock, log, error });
  const output = (mock: typeof log) => mock.mock.calls.map(([message]) => message).join("\n");
  return { code, fetchMock, posts: postsOf(fetchMock), log: output(log), error: output(error) };
};

describe("parseSitemap", () => {
  it("reads back every URL and content date of the sitemap, in its order", () => {
    const normal = (url: string) => new URL(url).toString();
    expect(parseSitemap(SITEMAP_XML).map(({ url, lastModified }) => [normal(url), lastModified])).toEqual(
      sitemap().map(({ url, lastModified }) => [normal(url), lastModified]),
    );
  });

  it("covers the English and the Czech pages", () => {
    const urls = parseSitemap(SITEMAP_XML).map(({ url }) => url);

    expect(urls).toEqual(expect.arrayContaining(["https://tokenping.xyz/", "https://tokenping.xyz/cz"]));
    expect(urls.filter(url => url.startsWith("https://tokenping.xyz/cz/blog/")).length).toBeGreaterThan(0);
  });

  it("unescapes XML entities and ignores hreflang links", () => {
    const xml = `<urlset><url>\n<loc> https://tokenping.xyz/a?b=1&amp;c=2 </loc>\n<xhtml:link rel="alternate" hreflang="cs" href="https://tokenping.xyz/cz" />\n</url></urlset>`;

    expect(parseSitemap(xml)).toEqual([{ url: "https://tokenping.xyz/a?b=1&c=2" }]);
  });

  it("finds nothing in a page that is not a sitemap", () => {
    expect(parseSitemap("<!DOCTYPE html><html><body>Not found</body></html>")).toEqual([]);
  });
});

describe("isSiteUrl", () => {
  it("accepts every URL of the sitemap", () => {
    expect(SITEMAP_URLS.filter(url => !isSiteUrl(url))).toEqual([]);
  });

  it.each([
    "http://tokenping.xyz/",
    "https://tokenping.xyzz",
    "https://www.tokenping.xyz/",
    "https://tokenping.xyz.example.com/",
    "https://tokenping.xyz:8443/",
    "https://tokenping.xyz@example.com/",
    "https://user@tokenping.xyz/",
    "https://example.com/?next=https://tokenping.xyz/",
    "http://localhost:3000/",
    "not a url",
  ])("refuses %s", url => {
    expect(isSiteUrl(url)).toBe(false);
  });
});

describe("isIsoDate", () => {
  it("accepts a real day written YYYY-MM-DD", () => {
    expect(isIsoDate("2026-10-19")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
  });

  it.each(["2026-02-30", "2026-13-01", "2026-1-01", "19.10.2026", "2026-10-19T00:00:00Z", ""])("refuses %j", value => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe("changedSince", () => {
  const entries = [
    { url: "https://tokenping.xyz/" },
    { url: "https://tokenping.xyz/blog/old", lastModified: "2026-10-13" },
    { url: "https://tokenping.xyz/blog/same-day", lastModified: "2026-10-14" },
    { url: "https://tokenping.xyz/blog/new", lastModified: "2026-10-19T08:00:00.000Z" },
  ];

  it("keeps the pages dated on or after the day and leaves out undated ones", () => {
    expect(changedSince(entries, "2026-10-14").map(({ url }) => url)).toEqual([
      "https://tokenping.xyz/blog/same-day",
      "https://tokenping.xyz/blog/new",
    ]);
  });
});

describe("batches", () => {
  it("splits at the protocol's limit of 10,000 URLs per request", () => {
    const parts = batches(Array.from({ length: MAX_URLS_PER_REQUEST + 1 }, (_, index) => index));

    expect(parts.map(part => part.length)).toEqual([MAX_URLS_PER_REQUEST, 1]);
    expect(parts[1]).toEqual([MAX_URLS_PER_REQUEST]);
  });

  it("makes no batch for no URLs", () => {
    expect(batches([])).toEqual([]);
  });
});

describe("requestBody", () => {
  it("names the host, the key and the root key file", () => {
    expect(requestBody(KEY, ["https://tokenping.xyz/"])).toEqual({
      host: "tokenping.xyz",
      key: KEY,
      keyLocation: "https://tokenping.xyz/indexnow-key.txt",
      urlList: ["https://tokenping.xyz/"],
    });
  });
});

describe("parseOptions", () => {
  it("defaults to every page, the shared endpoint and a real submission", () => {
    expect(parseOptions([])).toEqual({ since: undefined, engine: "indexnow", dryRun: false, help: false });
  });

  it("reads --since, --engine and --dry-run", () => {
    expect(parseOptions(["--since", "2026-10-19", "--engine", "seznam", "--dry-run"])).toEqual({
      since: "2026-10-19",
      engine: "seznam",
      dryRun: true,
      help: false,
    });
  });

  it.each([
    [["--sinse", "2026-10-19"]],
    [["https://example.com/"]],
    [["--since", "yesterday"]],
    [["--engine", "google"]],
  ])("explains what is wrong with %j", argv => {
    expect(parseOptions(argv)).toEqual(expect.any(String));
  });

  it("cannot name an endpoint outside the list", () => {
    expect(parseOptions(["--engine", "constructor"])).toEqual(expect.stringContaining("Unknown engine"));
    expect(parseOptions(["--engine", "https://example.com/indexnow"])).toEqual(
      expect.stringContaining("Unknown engine"),
    );
  });
});

describe("run", () => {
  it("POSTs every sitemap URL to api.indexnow.org as JSON with the live key, and exits 0 on 200", async () => {
    const { code, posts, log, error } = await runWith([]);

    expect(code).toBe(0);
    expect(posts).toEqual([
      {
        url: "https://api.indexnow.org/indexnow",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: requestBody(KEY, SITEMAP_URLS),
      },
    ]);
    expect(log).toContain(`Batch 1 of 1 (${SITEMAP_URLS.length} URLs) to api.indexnow.org: HTTP 200, accepted`);
    expect(error).toBe("");
  });

  it("only ever contacts the site and the chosen endpoint", async () => {
    const { fetchMock } = await runWith([]);
    const contacted = new Set(fetchMock.mock.calls.map(([input]) => String(input)));

    expect(contacted).toEqual(new Set([KEY_LOCATION, SITEMAP_URL, ENDPOINTS.indexnow]));
  });

  it("counts 202 as success: the engine has the URLs and checks the key next", async () => {
    const { code, log } = await runWith([], fakeFetch({ posts: [new Response("", { status: 202 })] }));

    expect(code).toBe(0);
    expect(log).toContain("HTTP 202, received");
  });

  it("sends to one engine's own endpoint with --engine", async () => {
    const { posts } = await runWith(["--engine", "seznam"]);

    expect(posts.map(({ url }) => url)).toEqual(["https://search.seznam.cz/indexnow"]);
  });

  it("sends only the pages changed on or after --since", async () => {
    const entries = [
      { url: "https://tokenping.xyz/" },
      { url: "https://tokenping.xyz/blog/old", lastModified: "2026-10-01" },
      { url: "https://tokenping.xyz/blog/new", lastModified: "2026-10-19" },
      { url: "https://tokenping.xyz/cz/blog/nove", lastModified: "2026-10-19" },
    ];
    const fetchMock = fakeFetch({ sitemap: new Response(sitemapXml(entries)) });
    const { code, posts, log } = await runWith(["--since", "2026-10-15"], fetchMock);

    expect(code).toBe(0);
    expect(posts[0].body.urlList).toEqual(["https://tokenping.xyz/blog/new", "https://tokenping.xyz/cz/blog/nove"]);
    expect(log).toContain("2 of 4 sitemap URLs changed on or after 2026-10-15.");
    expect(log).toContain("Pages with no date in the sitemap, sent only by a run without --since: 1.");
  });

  it("sends nothing and exits 0 when nothing changed since the day", async () => {
    const { code, posts, log } = await runWith(["--since", "2999-01-01"]);

    expect(code).toBe(0);
    expect(posts).toEqual([]);
    expect(log).toContain("Nothing to submit.");
  });

  it("lists the URLs without sending them with --dry-run", async () => {
    const { code, posts, log } = await runWith(["--dry-run"]);

    expect(code).toBe(0);
    expect(posts).toEqual([]);
    for (const url of SITEMAP_URLS) expect(log).toContain(`  ${url}`);
  });

  it("still lists the URLs in a dry run without a deployed key, but exits 1", async () => {
    const { code, posts, log, error } = await runWith(
      ["--dry-run"],
      fakeFetch({ key: new Response(null, { status: 404 }) }),
    );

    expect(code).toBe(1);
    expect(posts).toEqual([]);
    expect(log).toContain(SITEMAP_URLS[0]);
    expect(error).toContain("HTTP 404");
  });

  it("exits 1 in a dry run without a deployed key even when nothing changed", async () => {
    const { code, log, error } = await runWith(
      ["--dry-run", "--since", "2999-01-01"],
      fakeFetch({ key: new Response(null, { status: 404 }) }),
    );

    expect(code).toBe(1);
    expect(log).toContain("Nothing to submit.");
    expect(error).toContain("A real run would stop here.");
  });

  it("stops before sending anything while the key file answers 404", async () => {
    const { code, posts, error } = await runWith([], fakeFetch({ key: new Response(null, { status: 404 }) }));

    expect(code).toBe(1);
    expect(posts).toEqual([]);
    expect(error).toContain("Set INDEXNOW_KEY in Vercel and redeploy");
  });

  it("stops when the key file holds something other than a key", async () => {
    const { code, posts, error } = await runWith(
      [],
      fakeFetch({ key: new Response("<!DOCTYPE html><html>Tokenping</html>") }),
    );

    expect(code).toBe(1);
    expect(posts).toEqual([]);
    expect(error).toContain("does not hold an IndexNow key");
  });

  it("sends nothing when the sitemap lists a URL outside https://tokenping.xyz/", async () => {
    const entries = [{ url: "https://tokenping.xyz/" }, { url: "https://preview.example.com/blog" }];
    const { code, posts, error } = await runWith([], fakeFetch({ sitemap: new Response(sitemapXml(entries)) }));

    expect(code).toBe(1);
    expect(posts).toEqual([]);
    expect(error).toContain("https://preview.example.com/blog");
  });

  it("exits 1 when the sitemap cannot be read or is empty", async () => {
    const failed = await runWith([], fakeFetch({ sitemap: new Response("", { status: 500 }) }));
    const empty = await runWith([], fakeFetch({ sitemap: new Response(sitemapXml([])) }));

    expect([failed.code, empty.code]).toEqual([1, 1]);
    expect(failed.error).toContain("HTTP 500");
    expect(empty.error).toContain("lists no URLs");
    expect([...failed.posts, ...empty.posts]).toEqual([]);
  });

  it.each([
    [400, "bad request"],
    [403, "the key is not valid"],
    [422, "not processed: a URL outside the host"],
    [429, "too many requests"],
    [500, "not accepted"],
  ])("exits 1 and explains an HTTP %i answer", async (status, meaning) => {
    const fetchMock = fakeFetch({ posts: [new Response("Reason from the engine", { status })] });
    const { code, error } = await runWith([], fetchMock);

    expect(code).toBe(1);
    expect(error).toContain(`HTTP ${status}, ${meaning}`);
    expect(error).toContain("Reason from the engine");
  });

  it("prints Retry-After with a 429", async () => {
    const fetchMock = fakeFetch({ posts: [new Response("", { status: 429, headers: { "Retry-After": "600" } })] });
    const { error } = await runWith([], fetchMock);

    expect(error).toContain("(Retry-After: 600)");
  });

  it("exits 1 when the request fails on the network", async () => {
    const networkError = new TypeError("fetch failed", { cause: new Error("getaddrinfo ENOTFOUND api.indexnow.org") });
    const { code, error } = await runWith([], fakeFetch({ posts: [networkError] }));

    expect(code).toBe(1);
    expect(error).toContain("fetch failed");
    expect(error).toContain("ENOTFOUND");
  });

  it("sends more than 10,000 URLs in batches and stops at the first refused one", async () => {
    const entries = Array.from({ length: MAX_URLS_PER_REQUEST * 2 + 1 }, (_, index) => ({
      url: `https://tokenping.xyz/page-${index}`,
    }));
    const fetchMock = fakeFetch({
      sitemap: new Response(sitemapXml(entries)),
      posts: [new Response("", { status: 200 }), new Response("", { status: 429 }), new Response("", { status: 200 })],
    });
    const { code, posts, log, error } = await runWith([], fetchMock);

    expect(code).toBe(1);
    expect(posts.map(({ body }) => body.urlList.length)).toEqual([MAX_URLS_PER_REQUEST, MAX_URLS_PER_REQUEST]);
    expect(posts[1].body.urlList[0]).toBe(`https://tokenping.xyz/page-${MAX_URLS_PER_REQUEST}`);
    expect(log).toContain("Batch 1 of 3");
    expect(error).toContain("Batch 2 of 3");
    expect(error).toContain("Stopped. Batches not sent: 1.");
  });

  it("exits 1 with the usage for an unknown option, before any request", async () => {
    const fetchMock = fakeFetch();
    const { code, error } = await runWith(["--force"], fetchMock);

    expect(code).toBe(1);
    expect(error).toContain("Usage: yarn next:indexnow");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
