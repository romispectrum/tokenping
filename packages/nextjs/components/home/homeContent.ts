import { hardhat } from "viem/chains";
import { SUPPORTED_NETWORKS } from "~~/config/networks";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import { PAYMENT_CHAIN_ID, PAYMENT_CONTRACT_ADDRESS } from "~~/constants/payments";
import { getPostByKey, isPublished } from "~~/content/blog";
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { SEO_MESSAGES } from "~~/i18n/messages/seo";
import { routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn, getAlertChannelNames } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { ORGANIZATION_ID, SITE_NAME, absoluteUrl } from "~~/utils/seo";

// Copy and data for the homepage and the /aave shell, per language (the words are in
// i18n/messages/home). Everything that depends on the deployment (channels, networks, price, payment contract) is
// derived here, so the visible text, the metadata and the JSON-LD cannot disagree.

const MAX_DESCRIPTION_LENGTH = 155;

/** "a", "a and b", "a, b and c" (no serial comma, matching the site copy). English; i18n/format has every language. */
export const joinList = (items: readonly string[], conjunction: "and" | "or" = "and") =>
  items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`;

// A badge's short name for email where a language has its own: "E-mail", "Correo".
const EMAIL_BADGE: Partial<Record<Locale, string>> = { cs: "e-mail", es: "correo", hi: "ईमेल", de: "E-Mail" };

/** Channel names for badges: "Signal", "Email" ("E-mail", "Correo") and, once the bot is configured, "Telegram". */
export const getChannelBadgeNames = (locale: Locale = DEFAULT_LOCALE) =>
  getAlertChannelNames().map(name =>
    HOME_MESSAGES[locale].channelBadge(name === "email" ? (EMAIL_BADGE[locale] ?? name) : name),
  );

/** The homepage headline, in its Telegram variant once the bot is configured. */
export const getHomeHeadline = (locale: Locale = DEFAULT_LOCALE) =>
  HOME_MESSAGES[locale].headline(formatAlertChannelsIn(locale, "conjunction"));

/**
 * The home page's title: brand first, as a home page names the site it opens ("Tokenping: Aave and Morpho health factor
 * alerts"), within 60 characters. Every other page puts the brand last through the title template.
 */
export const getHomeTitle = (locale: Locale = DEFAULT_LOCALE) => SEO_MESSAGES[locale].defaultTitle;

/**
 * The meta description and SoftwareApplication description, with every network Tokenping reads (Aave's and Morpho's).
 * Never a bare "Read-only": paying for alerts takes an approval and a payment on Arbitrum.
 */
export const getHomeDescription = (locale: Locale = DEFAULT_LOCALE) => {
  const input = {
    channels: formatAlertChannelsIn(locale, "disjunction"),
    networks: SUPPORTED_NETWORKS.length,
    minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
  };
  const full = HOME_MESSAGES[locale].description({ ...input, short: false });
  return full.length <= MAX_DESCRIPTION_LENGTH ? full : HOME_MESSAGES[locale].description({ ...input, short: true });
};

/** The hero's logo strip: every network Tokenping reads (Aave and Morpho), with the chain id its logo is keyed by. */
export const getNetworkBadges = () => SUPPORTED_NETWORKS.map(({ chain, name }) => ({ chainId: chain.id, name }));

/** The paywall's public Sourcify page, or undefined on a local build, where the contract is not verified anywhere. */
export const getPaywallSourcifyUrl = () => {
  // Widened: the generated chain-id type only names the configured networks, which may not include hardhat.
  const chainId: number | undefined = PAYMENT_CHAIN_ID;
  return chainId === undefined || chainId === hardhat.id || !PAYMENT_CONTRACT_ADDRESS
    ? undefined
    : `https://repo.sourcify.dev/${chainId}/${PAYMENT_CONTRACT_ADDRESS}`;
};

/**
 * A post that readers can see, in `locale`, by its key (the English slug): placeholders are never linked from site
 * pages, and a page never links a post in another language instead.
 */
export const getPublishedPost = (key: string, locale: Locale = DEFAULT_LOCALE) => {
  const post = getPostByKey(key, locale);
  return post && isPublished(post) ? post : undefined;
};

/** "From the blog" on the homepage, by key: the Aave hub, the Morpho hub and the alert how-to. */
export const HOME_BLOG_SLUGS = ["aave-health-factor", "morpho-health-factor", "aave-health-factor-alert-setup"];

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
export const getPricingCtaLabel = (plan: AlertPlan | null, locale: Locale = DEFAULT_LOCALE) =>
  HOME_MESSAGES[locale].pricingCta(plan);

/**
 * The Offer for the price the page shows: `{ price: "3", priceCurrency: "USDC" }` from the plan's "3 USDC" label.
 * Undefined when there is no plan, so the JSON-LD never carries a price the visitor cannot see. A plan exists only
 * while the paywall sells it (services/marketing/alertPlan), so it is always InStock.
 */
export const getAlertPlanOffer = (plan: AlertPlan | null, locale: Locale = DEFAULT_LOCALE) => {
  const match = plan?.priceLabel.match(/^(\d+(?:\.\d+)?) ([A-Za-z0-9.]+)$/);
  if (!plan || !match) return undefined;
  return {
    "@type": "Offer",
    price: match[1],
    priceCurrency: match[2],
    availability: "https://schema.org/InStock",
    description: HOME_MESSAGES[locale].offerDescription({ days: plan.days, currency: match[2] }),
    url: absoluteUrl(routePath(locale, "dashboard")),
  };
};

/** SoftwareApplication for the homepage. Never aggregateRating: there are no reviews. */
export const softwareApplicationJsonLd = (plan: AlertPlan | null, locale: Locale = DEFAULT_LOCALE) => {
  const offer = getAlertPlanOffer(plan, locale);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: absoluteUrl(routePath(locale, "home")),
    inLanguage: LOCALE_INFO[locale].htmlLang,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description: getHomeDescription(locale),
    publisher: { "@id": ORGANIZATION_ID },
    ...(offer && { offers: offer }),
  };
};
