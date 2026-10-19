import AaveHealthFactorAlertSetup, {
  meta as aaveHealthFactorAlertSetup,
} from "~~/content/blog/aave-health-factor-alert-setup.mdx";
import AaveHealthFactor, { meta as aaveHealthFactor } from "~~/content/blog/aave-health-factor.mdx";
import AaveLiquidationAlertTools, {
  meta as aaveLiquidationAlertTools,
} from "~~/content/blog/aave-liquidation-alert-tools.mdx";
import AaveLiquidationPrice, { meta as aaveLiquidationPrice } from "~~/content/blog/aave-liquidation-price.mdx";
import AvoidAaveLiquidation, { meta as avoidAaveLiquidation } from "~~/content/blog/avoid-aave-liquidation.mdx";
import CryptoBackedLoans, { meta as cryptoBackedLoans } from "~~/content/blog/crypto-backed-loans.mdx";
import CsAaveHealthFactor, { meta as csAaveHealthFactor } from "~~/content/blog/cs/aave-health-factor-vysvetleni.mdx";
import CsSafeAaveHealthFactor, {
  meta as csSafeAaveHealthFactor,
} from "~~/content/blog/cs/bezpecny-health-factor-aave.mdx";
import CsHowAaveLiquidationWorks, {
  meta as csHowAaveLiquidationWorks,
} from "~~/content/blog/cs/jak-funguje-likvidace-aave.mdx";
import CsAvoidAaveLiquidation, {
  meta as csAvoidAaveLiquidation,
} from "~~/content/blog/cs/jak-se-vyhnout-likvidaci-aave.mdx";
import CsAaveLiquidationPrice, { meta as csAaveLiquidationPrice } from "~~/content/blog/cs/likvidacni-cena-aave.mdx";
import CsAaveHealthFactorAlertSetup, {
  meta as csAaveHealthFactorAlertSetup,
} from "~~/content/blog/cs/nastaveni-upozorneni-health-factor-aave.mdx";
import CsAaveLiquidationAlertTools, {
  meta as csAaveLiquidationAlertTools,
} from "~~/content/blog/cs/nastroje-pro-upozorneni-na-likvidaci-aave.mdx";
import CsWhyAaveHealthFactorDropped, {
  meta as csWhyAaveHealthFactorDropped,
} from "~~/content/blog/cs/proc-klesl-health-factor-aave.mdx";
import CsCryptoBackedLoans, { meta as csCryptoBackedLoans } from "~~/content/blog/cs/pujcky-zajistene-kryptomenami.mdx";
import CsShortFiatWithAave, { meta as csShortFiatWithAave } from "~~/content/blog/cs/short-fiatu-pujckou-na-aave.mdx";
import CsPrivateAaveLiquidationAlerts, {
  meta as csPrivateAaveLiquidationAlerts,
} from "~~/content/blog/cs/soukroma-upozorneni-na-likvidaci-aave.mdx";
import HowAaveLiquidationWorks, {
  meta as howAaveLiquidationWorks,
} from "~~/content/blog/how-aave-liquidation-works.mdx";
import PrivateAaveLiquidationAlerts, {
  meta as privateAaveLiquidationAlerts,
} from "~~/content/blog/private-aave-liquidation-alerts.mdx";
import SafeAaveHealthFactor, { meta as safeAaveHealthFactor } from "~~/content/blog/safe-aave-health-factor.mdx";
import ShortFiatWithAave, { meta as shortFiatWithAave } from "~~/content/blog/short-fiat-with-aave.mdx";
import type { Post } from "~~/content/blog/types";
import WhyAaveHealthFactorDropped, {
  meta as whyAaveHealthFactorDropped,
} from "~~/content/blog/why-aave-health-factor-dropped.mdx";
import { DEFAULT_LOCALE, type Locale, type Localized } from "~~/i18n/locales";
import { POST_SLUGS, postKeyForSlug } from "~~/i18n/postSlugs";

/** Every English post, hub first: /blog, the sitemap and the RSS feed list them in this order. */
export const POSTS: readonly Post[] = [
  { meta: aaveHealthFactor, Content: AaveHealthFactor },
  { meta: safeAaveHealthFactor, Content: SafeAaveHealthFactor },
  { meta: howAaveLiquidationWorks, Content: HowAaveLiquidationWorks },
  { meta: aaveLiquidationPrice, Content: AaveLiquidationPrice },
  { meta: whyAaveHealthFactorDropped, Content: WhyAaveHealthFactorDropped },
  { meta: aaveHealthFactorAlertSetup, Content: AaveHealthFactorAlertSetup },
  { meta: aaveLiquidationAlertTools, Content: AaveLiquidationAlertTools },
  { meta: avoidAaveLiquidation, Content: AvoidAaveLiquidation },
  { meta: privateAaveLiquidationAlerts, Content: PrivateAaveLiquidationAlerts },
  { meta: cryptoBackedLoans, Content: CryptoBackedLoans },
  { meta: shortFiatWithAave, Content: ShortFiatWithAave },
];

/** The Czech translations (content/blog/cs), in the same order. Slugs pair with English through i18n/postSlugs. */
const CS_POSTS: readonly Post[] = [
  { meta: csAaveHealthFactor, Content: CsAaveHealthFactor },
  { meta: csSafeAaveHealthFactor, Content: CsSafeAaveHealthFactor },
  { meta: csHowAaveLiquidationWorks, Content: CsHowAaveLiquidationWorks },
  { meta: csAaveLiquidationPrice, Content: CsAaveLiquidationPrice },
  { meta: csWhyAaveHealthFactorDropped, Content: CsWhyAaveHealthFactorDropped },
  { meta: csAaveHealthFactorAlertSetup, Content: CsAaveHealthFactorAlertSetup },
  { meta: csAaveLiquidationAlertTools, Content: CsAaveLiquidationAlertTools },
  { meta: csAvoidAaveLiquidation, Content: CsAvoidAaveLiquidation },
  { meta: csPrivateAaveLiquidationAlerts, Content: CsPrivateAaveLiquidationAlerts },
  { meta: csCryptoBackedLoans, Content: CsCryptoBackedLoans },
  { meta: csShortFiatWithAave, Content: CsShortFiatWithAave },
];

const POSTS_BY_LOCALE: Localized<readonly Post[]> = { en: POSTS, cs: CS_POSTS };

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

/** The hub's key: its English slug. */
export const HUB_SLUG = "aave-health-factor";

/** The hub post's slug in a language. */
export const hubSlug = (locale: Locale = DEFAULT_LOCALE) => POST_SLUGS[HUB_SLUG][locale];

// The cluster's internal link map (marketing plan §3.9), keyed by English slug, most relevant first. The page template shows the first
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
    "safe-aave-health-factor",
    "how-aave-liquidation-works",
    "aave-health-factor-alert-setup",
  ],
  "aave-health-factor-alert-setup": [
    "aave-health-factor",
    "safe-aave-health-factor",
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
