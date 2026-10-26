import { PAGE_UPDATED } from "~~/constants/pageDates";
import { getLatestPostDate, getPostByKey, getPostLastModified, getPublishedPosts, isPublished } from "~~/content/blog";
import { DEFAULT_LOCALE, LOCALES, LOCALE_INFO, type Locale, type Localized } from "~~/i18n/locales";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { type StaticRoute, postPath, routeAlternates } from "~~/i18n/routes";
import { SITE_URL, absoluteUrl } from "~~/utils/seo";

// The sitemap: canonical, indexable, server-rendered 200 URLs only, in every language; utils/sitemap.test.ts checks
// every path against its route file. Left out: /admin, /debug, /blockexplorer and /api; placeholder posts (and a
// language's /blog while it lists none); any client-rendered page. The dashboards are listed because their pages are
// server shells around the wallet island; the Morpho one included.
//
// app/sitemap.xml/route.ts serves it with renderSitemapXml rather than through Next's sitemap file convention, whose
// serializer writes the hreflang links before <lastmod>: the sitemap schema wants loc, lastmod, changefreq and
// priority first, and strict validators reject anything else.

export type ChangeFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type SitemapEntry = {
  /** The page's canonical URL, written as the page's own <link rel="canonical"> writes it. */
  url: string;
  /** YYYY-MM-DD: when the page's content last changed. Never the build time. */
  lastModified: string;
  changeFrequency: ChangeFrequency;
  /** 0.0 to 1.0, relative to the site's other pages. */
  priority: number;
  /** hreflang to URL, x-default included, when the page is published in more than one language. */
  alternates?: { languages: Record<string, string> };
};

type PageKind = { changeFrequency: ChangeFrequency; priority: number };

// Google ignores changefreq and priority; other engines may use them as hints. Each language's page ranks the same.
const HOME: PageKind = { changeFrequency: "weekly", priority: 1 };
const DASHBOARD: PageKind = { changeFrequency: "weekly", priority: 0.9 };
const BLOG_INDEX: PageKind = { changeFrequency: "weekly", priority: 0.8 };
// Guides are updated as Aave changes (rates, markets, wind-downs).
const POST: PageKind = { changeFrequency: "monthly", priority: 0.7 };
const PRIVACY: PageKind = { changeFrequency: "yearly", priority: 0.3 };

/** A path's URL as its canonical writes it: the site's root without a trailing slash, as Next renders "/". */
const pageUrl = (path: string) => (path === "/" ? SITE_URL : absoluteUrl(path));

/**
 * One entry per language in `paths`, each naming every language's URL as an alternate, with English as x-default,
 * as the pages' own hreflang links do.
 */
const entries = (
  paths: Partial<Localized<string>>,
  kind: PageKind,
  lastModified: (locale: Locale) => string | undefined,
): SitemapEntry[] => {
  const locales = LOCALES.filter(locale => paths[locale] !== undefined);
  const defaultPath = paths[DEFAULT_LOCALE];
  const languages =
    locales.length > 1
      ? {
          ...Object.fromEntries(locales.map(locale => [LOCALE_INFO[locale].htmlLang, pageUrl(paths[locale]!)])),
          ...(defaultPath !== undefined && { "x-default": pageUrl(defaultPath) }),
        }
      : undefined;
  return locales.flatMap(locale => {
    const modified = lastModified(locale);
    if (modified === undefined) return [];
    return [
      {
        url: pageUrl(paths[locale]!),
        lastModified: modified,
        ...kind,
        ...(languages && { alternates: { languages } }),
      },
    ];
  });
};

const staticRoute = (route: StaticRoute, kind: PageKind, date: string) =>
  entries(routeAlternates(route), kind, () => date);

export const sitemapEntries = (): SitemapEntry[] => {
  // A language's blog index is listed once it has a published post, dated by its newest one.
  const blogDates = Object.fromEntries(
    LOCALES.map(locale => [locale, getLatestPostDate(getPublishedPosts(locale))] as const),
  ) as Localized<string | undefined>;
  const blogPaths = Object.fromEntries(
    LOCALES.filter(locale => blogDates[locale]).map(locale => [locale, routeAlternates("blog")[locale]]),
  );
  const posts = Object.keys(POST_SLUGS).flatMap(key => {
    const published = LOCALES.flatMap(locale => {
      const post = getPostByKey(key, locale);
      return post && isPublished(post) ? [[locale, post] as const] : [];
    });
    return entries(
      Object.fromEntries(published.map(([locale, post]) => [locale, postPath(locale, post.meta.slug)])),
      POST,
      locale => {
        const post = published.find(([published]) => published === locale)?.[1];
        return post && getPostLastModified(post);
      },
    );
  });
  return [
    ...staticRoute("home", HOME, PAGE_UPDATED.home),
    ...staticRoute("dashboard", DASHBOARD, PAGE_UPDATED.dashboard),
    ...staticRoute("morpho", DASHBOARD, PAGE_UPDATED.morpho),
    ...entries(blogPaths, BLOG_INDEX, locale => blogDates[locale]),
    ...posts,
    ...staticRoute("privacy", PRIVACY, PAGE_UPDATED.privacy),
  ];
};

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * The sitemaps.org 0.9 XML of `entries`: in each <url>, loc, lastmod, changefreq and priority in the schema's order,
 * then the hreflang links (xhtml:link, Google's extension, which the schema allows only after them).
 */
export const renderSitemapXml = (sitemap: readonly SitemapEntry[]) => {
  const hasAlternates = sitemap.some(({ alternates }) => alternates);
  const urls = sitemap.map(({ url, lastModified, changeFrequency, priority, alternates }) =>
    [
      "  <url>",
      `    <loc>${escapeXml(url)}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      `    <changefreq>${changeFrequency}</changefreq>`,
      `    <priority>${priority.toFixed(1)}</priority>`,
      ...Object.entries(alternates?.languages ?? {}).map(
        ([hreflang, href]) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
      ),
      "  </url>",
    ].join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasAlternates ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ""}>`,
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
};
