import { hardhat, mainnet } from "viem/chains";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { PAYMENT_CHAIN_ID, PAYMENT_CONTRACT_ADDRESS } from "~~/constants/payments";
import { getPost, isPublished } from "~~/content/blog";
import { formatAlertChannels, getAlertChannelNames } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { ORGANIZATION_ID, SITE_NAME, absoluteUrl, needsAbsoluteTitle } from "~~/utils/seo";

// Copy and data for the homepage (marketing plan §2) and the /aave shell. Everything that depends on the deployment
// (channels, networks, price, payment contract) is derived here, so the visible text, the metadata and the JSON-LD
// cannot disagree.

const MAX_DESCRIPTION_LENGTH = 155;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "a", "a and b", "a, b and c" (no serial comma, matching the site copy). */
export const joinList = (items: readonly string[], conjunction: "and" | "or" = "and") =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;

/** Channel names for badges: "Signal", "Email" and, once the bot is configured, "Telegram". */
export const getChannelBadgeNames = () => getAlertChannelNames().map(capitalize);

/** Headline A of the marketing plan (§2.1), in its Telegram variant once the bot is configured. */
export const getHomeHeadline = () => `Aave health factor alerts on ${formatAlertChannels("and")}`;

/**
 * The headline as the page title, in sentence case like every title: "Aave health factor alerts on Signal and email |
 * Tokenping". The Telegram variant drops the brand to stay ≤ 60.
 */
export const getHomeTitle = () => {
  const title = getHomeHeadline();
  return needsAbsoluteTitle(title) ? title : `${title} | ${SITE_NAME}`;
};

/**
 * The meta description and SoftwareApplication description. "No approvals on your position" rather than a bare
 * "Read-only": paying for alerts takes an approval and a payment on Arbitrum.
 */
export const getHomeDescription = () => {
  const channels = formatAlertChannels("or");
  const full = `${channels} alerts when your Aave V3 health factor drops below your threshold on ${AAVE_MARKETS.length} networks. Checked every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. No approvals on your position.`;
  if (full.length <= MAX_DESCRIPTION_LENGTH) return full;
  return `${channels} alerts when your Aave V3 health factor is below your threshold on ${AAVE_MARKETS.length} networks, checked every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes. No approvals on Aave.`;
};

/** The /aave meta description (marketing plan §4.2). */
export const getDashboardDescription = () =>
  `See your Aave V3 collateral, debt and health factor on ${AAVE_MARKETS.length} networks for free, then set a ${formatAlertChannels("or")} alert threshold for each network.`;

/** The monitored networks in dashboard order; on Ethereum only the Core market's pool is read. */
export const getNetworkNames = () =>
  AAVE_MARKETS.map(({ chain, name }) => (chain.id === mainnet.id ? `${name} (Core market)` : name));

/** Badge labels: the plain network names. The Core-market note sits next to the badges. */
export const getNetworkBadgeNames = () => AAVE_MARKETS.map(({ name }) => name);

/** The paywall's public Sourcify page, or undefined on a local build, where the contract is not verified anywhere. */
export const getPaywallSourcifyUrl = () => {
  // Widened: the generated chain-id type only names the configured networks, which may not include hardhat.
  const chainId: number | undefined = PAYMENT_CHAIN_ID;
  return chainId === undefined || chainId === hardhat.id || !PAYMENT_CONTRACT_ADDRESS
    ? undefined
    : `https://repo.sourcify.dev/${chainId}/${PAYMENT_CONTRACT_ADDRESS}`;
};

/** A post that readers can see: placeholders are never linked from site pages. */
export const getPublishedPost = (slug: string) => {
  const post = getPost(slug);
  return post && isPublished(post) ? post : undefined;
};

/** "From the blog" on the homepage: the hub, the alert how-to and the safe-HF guide (marketing plan §2.7, §3.9). */
export const HOME_BLOG_SLUGS = ["aave-health-factor", "aave-health-factor-alert-setup", "safe-aave-health-factor"];

/** Forum threads named in "The problem, named" (marketing market.md §B.4), each linked from its own mention. */
export const PROBLEM_SOURCES = {
  /** Aave governance forum, February 2025: checked in the morning and found the position liquidated again. */
  morningLiquidation: "https://governance.aave.com/t/unexpected-or-poorly-executed-settlement-by-the-system/21120",
  /** Aave governance forum, December 2024: an hour of pending repay attempts, then liquidation. */
  failedRepays: "https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379",
  /** Polygon forum, May 2021 (before Aave V3): repay at health factor 1.01 failed until the position was liquidated. */
  polygonRepay: "https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067",
} as const;

/** "Set up alerts: 3 USDC for 30 days", or a priceless label while the plan cannot be read. */
export const getPricingCtaLabel = (plan: AlertPlan | null) =>
  plan ? `Set up alerts: ${plan.priceLabel} for ${plan.days === 1 ? "1 day" : `${plan.days} days`}` : "Set up alerts";

/**
 * The Offer for the price the page shows: `{ price: "3", priceCurrency: "USDC" }` from the plan's "3 USDC" label.
 * Undefined when there is no plan, so the JSON-LD never carries a price the visitor cannot see.
 */
export const getAlertPlanOffer = (plan: AlertPlan | null) => {
  const match = plan?.priceLabel.match(/^(\d+(?:\.\d+)?) ([A-Za-z0-9.]+)$/);
  if (!plan || !match) return undefined;
  return {
    "@type": "Offer",
    price: match[1],
    priceCurrency: match[2],
    description: `Health factor alerts for ${plan.days} days, paid in ${match[2]} from your wallet. No auto-renew.`,
    url: absoluteUrl("/aave"),
  };
};

/** SoftwareApplication for the homepage (marketing plan §4.4). Never aggregateRating: there are no reviews. */
export const softwareApplicationJsonLd = (plan: AlertPlan | null) => {
  const offer = getAlertPlanOffer(plan);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: getHomeDescription(),
    publisher: { "@id": ORGANIZATION_ID },
    ...(offer && { offers: offer }),
  };
};
