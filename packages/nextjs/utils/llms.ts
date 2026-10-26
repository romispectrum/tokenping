// /llms.txt (https://llmstxt.org): a short markdown map of the site for AI tools. Built from the same sources as the
// pages (the SEO and page messages, the post registry, the market list and the notification constants), so it never
// states something the site does not.
import { getHomeDescription } from "~~/components/home/homeContent";
import { AAVE_MARKETS, AAVE_NETWORK_NAMES, AAVE_V3_NETWORKS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import { MORPHO_CHAINS } from "~~/config/morpho";
import {
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  MORPHO_HEALTH_FACTOR_THRESHOLD_MIN,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
} from "~~/constants/notifications";
import { PAYMENT_TOKEN_SYMBOL } from "~~/constants/payments";
import { getPublishedPosts, hubSlug, newestFirst } from "~~/content/blog";
import type { Post } from "~~/content/blog/types";
import type { Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";
import { PRIVACY_MESSAGES } from "~~/i18n/messages/privacy";
import { SEO_MESSAGES } from "~~/i18n/messages/seo";
import { postPath, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import {
  AAVE_ALERTS_SKILL_DESCRIPTION,
  MORPHO_ALERTS_SKILL_DESCRIPTION,
  aaveAlertsSkillPath,
  morphoAlertsSkillPath,
} from "~~/utils/agentSkills";
import { SITE_NAME, absoluteUrl } from "~~/utils/seo";

const link = (title: string, path: string, notes?: string) =>
  `- [${title}](${absoluteUrl(path)})${notes ? `: ${notes}` : ""}`;

/** The hub first, then every other guide latest first, as /blog lists them. */
const guides = (locale: Locale): Post[] => {
  const posts = getPublishedPosts(locale);
  const hub = posts.find(({ meta }) => meta.slug === hubSlug(locale));
  return [...(hub ? [hub] : []), ...newestFirst(posts.filter(post => post !== hub))];
};

const pageLinks = (locale: Locale) => {
  const dashboard = DASHBOARD_MESSAGES[locale].page;
  const channels = formatAlertChannelsIn(locale, "disjunction");
  return [
    link(SITE_NAME, routePath(locale, "home"), getHomeDescription(locale)),
    link(
      dashboard.metaTitle,
      routePath(locale, "dashboard"),
      dashboard.metaDescription(AAVE_NETWORK_NAMES.length, channels),
    ),
    link(
      MORPHO_MESSAGES[locale].page.metaTitle,
      routePath(locale, "morpho"),
      MORPHO_MESSAGES[locale].page.metaDescription(MORPHO_CHAINS.length, channels),
    ),
    link(BLOG_MESSAGES[locale].index.title, routePath(locale, "blog"), BLOG_MESSAGES[locale].index.description),
    link(PRIVACY_MESSAGES[locale].metaTitle, routePath(locale, "privacy"), PRIVACY_MESSAGES[locale].metaDescription),
  ];
};

const guideLinks = (locale: Locale) =>
  guides(locale).map(({ meta }) => link(meta.title, postPath(locale, meta.slug), meta.description));

export const buildLlmsTxt = () => {
  const channels = formatAlertChannelsIn("en", "disjunction");
  const paymentChain = getPaymentChainName();
  const facts = [
    `- Checks: every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes for the connected wallet's positions. While a health factor is below the threshold its owner chose (${HEALTH_FACTOR_THRESHOLD_MIN} to ${HEALTH_FACTOR_THRESHOLD_MAX} on Aave, ${MORPHO_HEALTH_FACTOR_THRESHOLD_MIN} to ${HEALTH_FACTOR_THRESHOLD_MAX} on Morpho), every check sends an alert by ${channels}.`,
    `- Aave coverage: every Aave V3 market (${AAVE_MARKETS.length} markets on ${AAVE_V3_NETWORKS.length} networks) and every Aave V4 Spoke (${AAVE_V4_SPOKES.length}), with one alert per market or Spoke.`,
    `- Morpho coverage: every Morpho Blue (variable-rate) and Morpho Midnight (fixed-rate) market the Morpho app lists, on ${MORPHO_CHAINS.length} networks, with one alert per market. A Midnight loan also gets reminders 7 days and 1 day before it matures. One plan covers Aave and Morpho alerts.`,
    `- Access: looking at positions on the dashboard needs no payment. Alerts need paid access, paid in ${PAYMENT_TOKEN_SYMBOL}${paymentChain ? ` on ${paymentChain}` : ""} from the wallet. Nothing renews automatically; each payment adds one plan period after the current end date.`,
    "- Sign-in: the wallet signs a message. There is no account and no password.",
    "- Languages: English, and Czech under /cz.",
    `- ${COMMON_MESSAGES.en.footer.independence}`,
  ];

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SEO_MESSAGES.en.organizationDescription}`,
    "",
    ...facts,
    "",
    "## Pages",
    "",
    ...pageLinks("en"),
    "",
    "## Guides",
    "",
    ...guideLinks("en"),
    "",
    "## Czech",
    "",
    ...pageLinks("cs"),
    ...guideLinks("cs"),
    "",
    "## Optional",
    "",
    link("Sitemap", "/sitemap.xml", "every page, with its English and Czech versions"),
    link("Agent skill: Aave health factor alerts", aaveAlertsSkillPath(), AAVE_ALERTS_SKILL_DESCRIPTION),
    link("Agent skill: Morpho health factor alerts", morphoAlertsSkillPath(), MORPHO_ALERTS_SKILL_DESCRIPTION),
    link(SEO_MESSAGES.en.rssTitle, routePath("en", "blogFeed"), "new guides in English"),
    link(SEO_MESSAGES.cs.rssTitle, routePath("cs", "blogFeed"), "new guides in Czech"),
    "",
  ].join("\n");
};
