import { DEFAULT_LOCALE, LOCALES, type Locale, type Localized } from "~~/i18n/locales";
import { POST_SLUGS, postKeyForSlug } from "~~/i18n/postSlugs";

// Every public page's path in each language. English keeps the original URLs at the root; Czech lives under /cz with
// Czech words where a path has words. The single source for links, canonicals, hreflang, the sitemap and the switcher.

export type StaticRoute = "home" | "dashboard" | "blog" | "blogFeed" | "privacy";

const STATIC_PATHS: Record<StaticRoute, Localized<string>> = {
  home: { en: "/", cs: "/cz" },
  dashboard: { en: "/aave", cs: "/cz/aave" },
  blog: { en: "/blog", cs: "/cz/blog" },
  blogFeed: { en: "/blog/feed.xml", cs: "/cz/blog/feed.xml" },
  privacy: { en: "/privacy", cs: "/cz/ochrana-soukromi" },
};

export const routePath = (locale: Locale, route: StaticRoute) => STATIC_PATHS[route][locale];

/** Every language's path of a static route, for hreflang. */
export const routeAlternates = (route: StaticRoute): Localized<string> => STATIC_PATHS[route];

/** A post's path; `slug` is the post's slug in that language. */
export const postPath = (locale: Locale, slug: string) => `${routePath(locale, "blog")}/${slug}`;

/** Every language's path of a post, by its English slug (the key); undefined for an unknown key. */
export const postAlternates = (key: string): Localized<string> | undefined => {
  const slugs = POST_SLUGS[key];
  if (!slugs) return undefined;
  return Object.fromEntries(LOCALES.map(locale => [locale, postPath(locale, slugs[locale])])) as Localized<string>;
};

/** The language a path belongs to: Czech for /cz and below, English otherwise. */
export const localeFromPath = (pathname: string): Locale =>
  pathname === "/cz" || pathname.startsWith("/cz/") ? "cs" : DEFAULT_LOCALE;

const stripTrailingSlash = (pathname: string) => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

/**
 * The same page in another language: a static route or a post maps to its translation; any other path (the 404,
 * the developer pages, which exist in English only) falls back to the target language's home page.
 */
export const translatePath = (pathname: string, target: Locale): string => {
  const path = stripTrailingSlash(pathname);
  const source = localeFromPath(path);
  for (const paths of Object.values(STATIC_PATHS)) {
    if (paths[source] === path) return paths[target];
  }
  const blogPrefix = `${routePath(source, "blog")}/`;
  if (path.startsWith(blogPrefix)) {
    const key = postKeyForSlug(source, path.slice(blogPrefix.length));
    if (key) return postPath(target, POST_SLUGS[key][target]);
  }
  return routePath(target, "home");
};
