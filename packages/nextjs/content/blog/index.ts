import { POSTS_BY_LOCALE } from "~~/content/blog/posts";
import type { Post } from "~~/content/blog/types";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { POST_SLUGS, postKeyForSlug } from "~~/i18n/postSlugs";

/** Every English post, hub first: the sitemap and the RSS feed list them in this order; /blog sorts the guides by date. */
export const POSTS: readonly Post[] = POSTS_BY_LOCALE.en;

/** Every post of a language, hub first. */
export const getPosts = (locale: Locale = DEFAULT_LOCALE) => POSTS_BY_LOCALE[locale];

/**
 * False for a placeholder (`stub: true`). Placeholders still render at their URL, but with noindex, and stay out of
 * /blog, the sitemap, the RSS feed and related-post links, so deploying before an article is written does not publish
 * its placeholder.
 */
export const isPublished = ({ meta }: Post) => !meta.stub;

/** The posts of a language readers and crawlers can discover, hub first. */
export const getPublishedPosts = (locale: Locale = DEFAULT_LOCALE): readonly Post[] =>
  getPosts(locale).filter(isPublished);

/** The English posts readers and crawlers can discover, hub first. */
export const PUBLISHED_POSTS: readonly Post[] = getPublishedPosts(DEFAULT_LOCALE);

/** Latest publish date first; posts published the same day keep their order above. */
export const newestFirst = (posts: readonly Post[]): Post[] =>
  [...posts].sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));

/** The hub's key: its English slug. */
export const HUB_SLUG = "aave-health-factor";

/** The Morpho guides' own hub, which every Morpho guide links back to. */
export const MORPHO_HUB_SLUG = "morpho-health-factor";

/** The hub post's slug in a language. */
export const hubSlug = (locale: Locale = DEFAULT_LOCALE) => POST_SLUGS[HUB_SLUG][locale];

// The cluster's internal link map, keyed by English slug, most relevant first. The page template shows the first
// RELATED_POST_COUNT published entries under each post; the articles themselves carry the full set of in-text links.
export const RELATED_SLUGS: Record<string, readonly string[]> = {
  "aave-health-factor": [
    "safe-aave-health-factor",
    "how-aave-liquidation-works",
    "aave-liquidation-price",
    "why-aave-health-factor-dropped",
    "aave-health-factor-alert-setup",
    "aave-liquidation-alert-tools",
    "avoid-aave-liquidation",
  ],
  "safe-aave-health-factor": [
    "aave-health-factor",
    "aave-liquidation-price",
    "aave-health-factor-alert-setup",
    "why-aave-health-factor-dropped",
  ],
  "how-aave-liquidation-works": [
    "aave-health-factor",
    "avoid-aave-liquidation",
    "aave-liquidation-price",
    "aave-health-factor-alert-setup",
    "why-aave-health-factor-dropped",
  ],
  "aave-liquidation-price": [
    "aave-health-factor",
    "safe-aave-health-factor",
    "how-aave-liquidation-works",
    "aave-health-factor-alert-setup",
  ],
  "why-aave-health-factor-dropped": [
    "aave-health-factor",
    "avoid-aave-liquidation",
    "aave-interest-rates",
    "safe-aave-health-factor",
    "how-aave-liquidation-works",
    "aave-market-wind-down",
    "aave-health-factor-alert-setup",
  ],
  "aave-health-factor-alert-setup": [
    "aave-health-factor",
    "safe-aave-health-factor",
    "aave-alerts-do-not-disturb",
    "aave-liquidation-alert-tools",
    "why-aave-health-factor-dropped",
  ],
  "aave-liquidation-alert-tools": ["aave-health-factor-alert-setup", "aave-health-factor", "avoid-aave-liquidation"],
  "avoid-aave-liquidation": [
    "aave-health-factor",
    "safe-aave-health-factor",
    "aave-health-factor-alert-setup",
    "how-aave-liquidation-works",
    "why-aave-health-factor-dropped",
    "aave-liquidation-alert-tools",
  ],
  "private-aave-liquidation-alerts": [
    "aave-health-factor",
    "aave-health-factor-alert-setup",
    "aave-liquidation-alert-tools",
    "aave-alerts-do-not-disturb",
    "safe-aave-health-factor",
  ],
  "crypto-backed-loans": [
    "aave-health-factor",
    "short-fiat-with-aave",
    "how-aave-liquidation-works",
    "safe-aave-health-factor",
    "aave-liquidation-price",
    "aave-health-factor-alert-setup",
  ],
  "short-fiat-with-aave": [
    "aave-health-factor",
    "crypto-backed-loans",
    "safe-aave-health-factor",
    "aave-liquidation-price",
    "aave-health-factor-alert-setup",
  ],
  "aave-interest-rates": [
    "aave-health-factor",
    "why-aave-health-factor-dropped",
    "safe-aave-health-factor",
    "avoid-aave-liquidation",
    "aave-liquidation-alert-tools",
  ],
  "aave-market-wind-down": [
    "aave-health-factor",
    "why-aave-health-factor-dropped",
    "aave-interest-rates",
    "avoid-aave-liquidation",
    "how-aave-liquidation-works",
    "safe-aave-health-factor",
  ],
  "aave-e-mode": [
    "aave-health-factor",
    "aave-liquidation-price",
    "safe-aave-health-factor",
    "why-aave-health-factor-dropped",
    "aave-interest-rates",
    "how-aave-liquidation-works",
  ],
  "stablecoin-depeg-aave": [
    "why-aave-health-factor-dropped",
    "aave-health-factor",
    "avoid-aave-liquidation",
    "short-fiat-with-aave",
    "how-aave-liquidation-works",
    "safe-aave-health-factor",
  ],
  "aave-alerts-do-not-disturb": [
    "aave-health-factor",
    "aave-health-factor-alert-setup",
    "safe-aave-health-factor",
    "avoid-aave-liquidation",
    "private-aave-liquidation-alerts",
  ],
  "why-aave-withdraw-or-borrow-fails": [
    "aave-health-factor",
    "avoid-aave-liquidation",
    "aave-interest-rates",
    "aave-market-wind-down",
    "why-aave-health-factor-dropped",
    "aave-e-mode",
  ],
  "wrapped-bitcoin-aave-collateral": [
    "aave-health-factor",
    "stablecoin-depeg-aave",
    "aave-e-mode",
    "aave-liquidation-price",
    "morpho-health-factor",
    "aave-market-wind-down",
  ],
  "tokenized-stocks-collateral": [
    "aave-health-factor",
    "safe-aave-health-factor",
    "how-morpho-liquidation-works",
    "wrapped-bitcoin-aave-collateral",
    "why-aave-withdraw-or-borrow-fails",
    "morpho-health-factor",
  ],
  "who-needs-health-factor-alerts": [
    "aave-health-factor",
    "aave-health-factor-alert-setup",
    "safe-aave-health-factor",
    "aave-liquidation-alert-tools",
    "aave-alerts-do-not-disturb",
    "why-aave-health-factor-dropped",
  ],
  "liquidated-on-aave-or-morpho-what-now": [
    "aave-health-factor",
    "how-aave-liquidation-works",
    "how-morpho-liquidation-works",
    "why-aave-health-factor-dropped",
    "avoid-aave-liquidation",
    "safe-aave-health-factor",
    "who-needs-health-factor-alerts",
  ],
  // The Morpho guides link to each other, their own hub first, and to the Aave guides that explain the shared ideas.
  "morpho-health-factor": [
    "how-morpho-liquidation-works",
    "morpho-pre-liquidation",
    "morpho-midnight-fixed-rate-loans",
    "aave-health-factor",
  ],
  "how-morpho-liquidation-works": [
    "morpho-health-factor",
    "morpho-pre-liquidation",
    "morpho-midnight-fixed-rate-loans",
    "how-aave-liquidation-works",
  ],
  "morpho-pre-liquidation": [
    "morpho-health-factor",
    "how-morpho-liquidation-works",
    "morpho-midnight-fixed-rate-loans",
  ],
  "morpho-midnight-fixed-rate-loans": [
    "morpho-health-factor",
    "how-morpho-liquidation-works",
    "morpho-pre-liquidation",
  ],
  // The comparisons sit between the two clusters; they link the Aave hub first, like every Aave guide.
  "aave-vs-morpho": [
    "aave-health-factor",
    "morpho-health-factor",
    "how-morpho-liquidation-works",
    "how-aave-liquidation-works",
    "aave-v4-vs-v3",
  ],
  "aave-v4-vs-v3": [
    "aave-health-factor",
    "how-aave-liquidation-works",
    "aave-interest-rates",
    "aave-e-mode",
    "aave-vs-morpho",
  ],
};

export const RELATED_POST_COUNT = 3;

/** A post by its slug in `locale`. */
export const getPost = (slug: string, locale: Locale = DEFAULT_LOCALE) =>
  getPosts(locale).find(({ meta }) => meta.slug === slug);

/** A post in `locale` by its key (English slug). */
export const getPostByKey = (key: string, locale: Locale = DEFAULT_LOCALE) => {
  const slug = POST_SLUGS[key]?.[locale];
  return slug === undefined ? undefined : getPost(slug, locale);
};

/** The published related posts of a post (by its slug in `locale`), in the same language. */
export const getRelatedPosts = (slug: string, locale: Locale = DEFAULT_LOCALE): Post[] =>
  (RELATED_SLUGS[postKeyForSlug(locale, slug) ?? slug] ?? [])
    .map(key => getPostByKey(key, locale))
    .filter((post): post is Post => post !== undefined && isPublished(post))
    .slice(0, RELATED_POST_COUNT);

/** The date a post last changed: `updatedAt` when set, otherwise `publishedAt`. */
export const getPostLastModified = ({ meta }: Post) => meta.updatedAt ?? meta.publishedAt;

/** The newest content date across the published posts; ISO dates compare correctly as strings. */
export const getLatestPostDate = (posts: readonly Post[] = PUBLISHED_POSTS) =>
  posts
    .map(getPostLastModified)
    .reduce<string | undefined>((latest, date) => (latest === undefined || date > latest ? date : latest), undefined);
