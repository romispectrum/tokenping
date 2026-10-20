import type { NextRequest } from "next/server";
import sitemap from "~~/app/sitemap";
import { LOCALES } from "~~/i18n/locales";
import { routePath } from "~~/i18n/routes";
import { MARKDOWN_CONTENT_TYPE, acceptsMarkdown, estimateTokens, htmlToMarkdown } from "~~/utils/markdown";
import { CONTENT_SIGNAL } from "~~/utils/robots";
import { SITE_URL } from "~~/utils/seo";

// Markdown for agents: next.config.ts rewrites a public page requested with `Accept: text/markdown` here, and this
// answers with the page's own HTML (fetched from this deployment) converted by utils/markdown.ts. Only pages the
// sitemap lists, and only for a markdown request: a browser or a crawler that opens /md/... gets a 404.

/** Each sitemap page's path, with its canonical URL. */
const CANONICAL_URLS = new Map(sitemap().map(({ url }) => [new URL(url).pathname, url]));

/** The Link entries next.config.ts sends with each home page's HTML; route.test.ts checks they are the same. */
const HOME_LINKS = new Map(
  LOCALES.map(locale => [
    routePath(locale, "home"),
    [
      '</llms.txt>; rel="describedby"; type="text/plain"',
      `<${routePath(locale, "blogFeed")}>; rel="alternate"; type="application/rss+xml"`,
      `<${routePath(locale, "privacy")}>; rel="privacy-policy"`,
    ],
  ]),
);

// The CDN keeps a page's markdown as long as the hourly home page and guides keep their HTML. Vercel's cache key
// includes Accept, and Vary says so to any other cache.
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";
const FETCH_TIMEOUT_MS = 10_000;

type MarkdownRouteContext = {
  params: Promise<{ path?: string[] }>;
};

const notFound = () => new Response(null, { status: 404 });

// NextURL already turns 127.0.0.1 and [::1] into localhost.
const TRUSTED_HOSTNAMES = new Set(["localhost", new URL(SITE_URL).hostname]);

/**
 * The page is fetched from the request's own origin. On Vercel the Host is always one of this project's domains;
 * anywhere else (next start behind a proxy) a forged Host would pick what the server fetches, so only this machine and
 * the site itself are trusted there.
 */
const isTrustedOrigin = ({ hostname }: URL) => process.env.VERCEL === "1" || TRUSTED_HOSTNAMES.has(hostname);

export const GET = async (request: NextRequest, { params }: MarkdownRouteContext) => {
  if (!acceptsMarkdown(request.headers.get("accept"))) return notFound();
  const path = `/${(await params).path?.join("/") ?? ""}`;
  const canonical = CANONICAL_URLS.get(path);
  if (!canonical || !isTrustedOrigin(request.nextUrl)) return notFound();

  // Accept: text/html, so the rewrite does not send this fetch back here.
  let markdown: string | undefined;
  try {
    const page = await fetch(new URL(path, request.nextUrl.origin), {
      headers: { Accept: "text/html" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!page.ok || !page.headers.get("content-type")?.startsWith("text/html")) {
      throw new Error(`${page.status} ${page.headers.get("content-type")}`);
    }
    markdown = htmlToMarkdown(await page.text(), canonical);
    if (markdown === undefined) throw new Error("no <main> in the page");
  } catch (error) {
    console.error(`GET ${path} as markdown: failed`, error);
    return new Response(null, { status: 502 });
  }

  return new Response(markdown, {
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      "Cache-Control": CACHE_CONTROL,
      Vary: "Accept",
      Link: [`<${canonical}>; rel="canonical"`, ...(HOME_LINKS.get(path) ?? [])].join(", "),
      "Content-Signal": CONTENT_SIGNAL,
      "X-Markdown-Tokens": String(estimateTokens(markdown)),
    },
  });
};
