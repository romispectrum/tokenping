import AaveHealthFactorAlertSetup, {
  meta as aaveHealthFactorAlertSetup,
} from "~~/content/blog/aave-health-factor-alert-setup.mdx";
import AaveHealthFactor, { meta as aaveHealthFactor } from "~~/content/blog/aave-health-factor.mdx";
import AaveLiquidationAlertTools, {
  meta as aaveLiquidationAlertTools,
} from "~~/content/blog/aave-liquidation-alert-tools.mdx";
import AaveLiquidationPrice, { meta as aaveLiquidationPrice } from "~~/content/blog/aave-liquidation-price.mdx";
import AvoidAaveLiquidation, { meta as avoidAaveLiquidation } from "~~/content/blog/avoid-aave-liquidation.mdx";
import HowAaveLiquidationWorks, {
  meta as howAaveLiquidationWorks,
} from "~~/content/blog/how-aave-liquidation-works.mdx";
import SafeAaveHealthFactor, { meta as safeAaveHealthFactor } from "~~/content/blog/safe-aave-health-factor.mdx";
import type { Post } from "~~/content/blog/types";
import WhyAaveHealthFactorDropped, {
  meta as whyAaveHealthFactorDropped,
} from "~~/content/blog/why-aave-health-factor-dropped.mdx";

/** Every post, hub first: /blog, the sitemap and the RSS feed list them in this order. */
export const POSTS: readonly Post[] = [
  { meta: aaveHealthFactor, Content: AaveHealthFactor },
  { meta: safeAaveHealthFactor, Content: SafeAaveHealthFactor },
  { meta: howAaveLiquidationWorks, Content: HowAaveLiquidationWorks },
  { meta: aaveLiquidationPrice, Content: AaveLiquidationPrice },
  { meta: whyAaveHealthFactorDropped, Content: WhyAaveHealthFactorDropped },
  { meta: aaveHealthFactorAlertSetup, Content: AaveHealthFactorAlertSetup },
  { meta: aaveLiquidationAlertTools, Content: AaveLiquidationAlertTools },
  { meta: avoidAaveLiquidation, Content: AvoidAaveLiquidation },
];

/**
 * False for a placeholder (`stub: true`). Placeholders still render at their URL, but with noindex, and stay out of
 * /blog, the sitemap, the RSS feed and related-post links, so deploying before an article is written does not publish
 * its placeholder.
 */
export const isPublished = ({ meta }: Post) => !meta.stub;

/** The posts readers and crawlers can discover, hub first. */
export const PUBLISHED_POSTS: readonly Post[] = POSTS.filter(isPublished);

export const HUB_SLUG = "aave-health-factor";

// The cluster's internal link map (marketing plan §3.9), most relevant first. The page template shows the first
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
};

export const RELATED_POST_COUNT = 3;

export const getPost = (slug: string) => POSTS.find(({ meta }) => meta.slug === slug);

export const getRelatedPosts = (slug: string): Post[] =>
  (RELATED_SLUGS[slug] ?? [])
    .map(getPost)
    .filter((post): post is Post => post !== undefined && isPublished(post))
    .slice(0, RELATED_POST_COUNT);

/** The date a post last changed: `updatedAt` when set, otherwise `publishedAt`. */
export const getPostLastModified = ({ meta }: Post) => meta.updatedAt ?? meta.publishedAt;

/** The newest content date across the published posts; ISO dates compare correctly as strings. */
export const getLatestPostDate = (posts: readonly Post[] = PUBLISHED_POSTS) =>
  posts
    .map(getPostLastModified)
    .reduce<string | undefined>((latest, date) => (latest === undefined || date > latest ? date : latest), undefined);
