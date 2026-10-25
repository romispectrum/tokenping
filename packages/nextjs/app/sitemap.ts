import type { MetadataRoute } from "next";
import { isMorphoEnabled } from "~~/config/morpho";
import { getLatestPostDate, getPostByKey, getPostLastModified, getPublishedPosts, isPublished } from "~~/content/blog";
import { LOCALES, LOCALE_INFO, type Locale, type Localized } from "~~/i18n/locales";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { type StaticRoute, postPath, routeAlternates } from "~~/i18n/routes";
import { absoluteUrl } from "~~/utils/seo";

// Canonical, indexable, server-rendered 200 URLs only, in every language; app/sitemap.test.ts checks every path
// against its route file. Each URL lists its translations (hreflang) when there is more than one. Left out: /admin,
// /debug, /blockexplorer and /api; placeholder posts (and a language's /blog while it lists none); any
// client-rendered page. The dashboards are listed because their pages are server shells around the wallet island; the
// Morpho one only while Morpho is enabled (a 404 otherwise).
// lastModified is a real content date or absent, never the build time; priority and changeFrequency are left out
// because Google ignores them.

type Entry = MetadataRoute.Sitemap[number];

/** One URL per language in `paths`, each naming the others as alternates. */
const entries = (paths: Partial<Localized<string>>, lastModified?: (locale: Locale) => string | undefined): Entry[] => {
  const locales = LOCALES.filter(locale => paths[locale] !== undefined);
  const languages =
    locales.length > 1
      ? Object.fromEntries(locales.map(locale => [LOCALE_INFO[locale].htmlLang, absoluteUrl(paths[locale]!)]))
      : undefined;
  return locales.map(locale => {
    const modified = lastModified?.(locale);
    return {
      url: absoluteUrl(paths[locale]!),
      ...(modified && { lastModified: modified }),
      ...(languages && { alternates: { languages } }),
    };
  });
};

const staticRoute = (route: StaticRoute) => entries(routeAlternates(route));

const sitemap = (): MetadataRoute.Sitemap => {
  // A language's blog index is listed once it has a published post.
  const blogPaths = Object.fromEntries(
    LOCALES.filter(locale => getLatestPostDate(getPublishedPosts(locale))).map(locale => [
      locale,
      routeAlternates("blog")[locale],
    ]),
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
    ...staticRoute("home"),
    ...staticRoute("dashboard"),
    ...(isMorphoEnabled() ? staticRoute("morpho") : []),
    ...entries(blogPaths, locale => getLatestPostDate(getPublishedPosts(locale))),
    ...posts,
    ...staticRoute("privacy"),
  ];
};

export default sitemap;
