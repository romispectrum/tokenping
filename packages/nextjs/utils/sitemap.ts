import { SitemapStream, streamToPromise } from "sitemap";
import { PAGE_UPDATED } from "~~/constants/pageDates";
import { getLatestPostDate, getPostByKey, getPostLastModified, getPublishedPosts, isPublished } from "~~/content/blog";
import { LOCALES, type Locale, type Localized } from "~~/i18n/locales";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { type StaticRoute, postPath, routeAlternates } from "~~/i18n/routes";
import { SITE_URL, absoluteUrl } from "~~/utils/seo";

// The sitemap: canonical, indexable, server-rendered 200 URLs only, in every language; utils/sitemap.test.ts checks
// every path against its route file. Left out: /admin, /debug, /blockexplorer and /api; placeholder posts (and a
// language's /blog while it lists none); any client-rendered page. The dashboards are listed because their pages are
// server shells around the wallet island; the Morpho one included.
//
// app/sitemap.xml/route.ts serves it with renderSitemapXml (the `sitemap` package): the plain sitemaps.org 0.9 format,
// <loc> and <lastmod> only.
//
// No changefreq or priority: Google ignores both, and a guessed value says nothing. Each page's lastmod is the day its
// own content last changed, never a site-wide or build date.
//
// No hreflang either: every page already names its English and Czech versions in its own <head> (utils/seo.ts
// pageMetadata), which Google treats the same as sitemap hreflang. Repeating them here as <xhtml:link> put XHTML
// elements in the file, and browsers then show it as one run-on line of text instead of an XML tree.

export type SitemapEntry = {
  /** The page's canonical URL, written as the page's own <link rel="canonical"> writes it. */
  url: string;
  /** YYYY-MM-DD: when the page's content last changed. Never the build time. */
  lastModified: string;
};

/** A path's URL as its canonical writes it: the site's root without a trailing slash, as Next renders "/". */
const pageUrl = (path: string) => (path === "/" ? SITE_URL : absoluteUrl(path));

/** One entry per language in `paths` that has a date. */
const entries = (
  paths: Partial<Localized<string>>,
  lastModified: (locale: Locale) => string | undefined,
): SitemapEntry[] =>
  LOCALES.filter(locale => paths[locale] !== undefined).flatMap(locale => {
    const modified = lastModified(locale);
    return modified === undefined ? [] : [{ url: pageUrl(paths[locale]!), lastModified: modified }];
  });

const staticRoute = (route: StaticRoute, date: string) => entries(routeAlternates(route), () => date);

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
      locale => {
        const post = published.find(([published]) => published === locale)?.[1];
        return post && getPostLastModified(post);
      },
    );
  });
  return [
    ...staticRoute("home", PAGE_UPDATED.home),
    ...staticRoute("dashboard", PAGE_UPDATED.dashboard),
    ...staticRoute("morpho", PAGE_UPDATED.morpho),
    ...entries(blogPaths, locale => blogDates[locale]),
    ...posts,
    ...staticRoute("privacy", PAGE_UPDATED.privacy),
  ];
};

/**
 * The sitemaps.org 0.9 XML of `entries`, written by the `sitemap` package: the schema's element order (loc, then
 * lastmod), XML escaping and YYYY-MM-DD dates, in the sitemap namespace alone. It writes every URL in the URL
 * standard's normal form, so the home page comes out as "https://tokenping.xyz/" (the same address as the bare origin
 * the page's canonical uses).
 */
export const renderSitemapXml = async (sitemap: readonly SitemapEntry[]) => {
  const stream = new SitemapStream({
    hostname: SITE_URL,
    lastmodDateOnly: true,
    xmlns: { news: false, xhtml: false, image: false, video: false },
  });
  for (const { url, lastModified } of sitemap) stream.write({ url, lastmod: lastModified });
  stream.end();
  return (await streamToPromise(stream)).toString();
};
