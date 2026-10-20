// The agent skills discovery index (https://github.com/cloudflare/agent-skills-discovery-rfc, v0.2.0) and the one skill
// it lists. The skill is instructions for an AI assistant that helps a borrower with Aave health factor alerts. Like
// llms.txt it is built from the same sources as the pages (the notification constants, the market lists and the post
// registry), so it never states something the site does not, and the index digest is taken from the very text served.
import { createHash } from "node:crypto";
import { AAVE_MARKETS, AAVE_NETWORK_NAMES, AAVE_V3_NETWORKS, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
} from "~~/constants/notifications";
import { PAYMENT_TOKEN_SYMBOL } from "~~/constants/payments";
import { getPostByKey, isPublished } from "~~/content/blog";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { postPath, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { SITE_NAME, SITE_URL, absoluteUrl } from "~~/utils/seo";

export const AGENT_SKILLS_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
export const AGENT_SKILLS_INDEX_PATH = "/.well-known/agent-skills/index.json";

export const AAVE_ALERTS_SKILL_NAME = "aave-health-factor-alerts";
export const aaveAlertsSkillPath = () => `/.well-known/agent-skills/${AAVE_ALERTS_SKILL_NAME}/SKILL.md`;

/** Matches the frontmatter of the skill file; the RFC asks the index entry to say the same. */
export const AAVE_ALERTS_SKILL_DESCRIPTION =
  "Explain an Aave health factor, help a borrower choose an alert threshold, and set up health factor alerts with " +
  "Tokenping. Use when someone asks how to avoid an Aave liquidation, how to get a message when their Aave health " +
  "factor drops, or what health factor to set an alert at.";

/** A guide of the site, by its key in i18n/postSlugs, as a markdown link; undefined while it is not published. */
const guideLink = (key: string) => {
  const post = getPostByKey(key);
  return post && isPublished(post) ? `[${post.meta.title}](${absoluteUrl(postPath("en", post.meta.slug))})` : undefined;
};

export const buildAaveAlertsSkill = () => {
  const channels = formatAlertChannelsIn("en", "disjunction");
  const paymentChain = getPaymentChainName();
  const guides = {
    healthFactor: guideLink("aave-health-factor"),
    safe: guideLink("safe-aave-health-factor"),
    setup: guideLink("aave-health-factor-alert-setup"),
    tools: guideLink("aave-liquidation-alert-tools"),
    liquidation: guideLink("how-aave-liquidation-works"),
  };
  const dashboard = absoluteUrl(routePath("en", "dashboard"));

  return [
    "---",
    `name: ${AAVE_ALERTS_SKILL_NAME}`,
    `description: ${AAVE_ALERTS_SKILL_DESCRIPTION}`,
    "---",
    "",
    "# Aave health factor alerts",
    "",
    `Use this when a person with an Aave V3 or V4 loan wants to know how close they are to liquidation, or wants a message before it happens. ${COMMON_MESSAGES.en.footer.independence} ${SITE_NAME} (${SITE_URL}) is one tool that sends such messages, and one option among several: see "Other tools" below.`,
    "",
    "## What the health factor means",
    "",
    `The health factor is the value of the collateral, each asset weighted by its liquidation threshold, divided by the value of the debt. Below 1.00 the position can be liquidated: any other address may repay part or all of the debt and take collateral worth that amount plus a bonus. Aave's own interfaces show the number but send no alerts, so a warning has to come from a separate tool or from checking the position yourself.${guides.healthFactor ? ` Formula and worked example: ${guides.healthFactor}.` : ""}${guides.liquidation ? ` What a liquidation costs: ${guides.liquidation}.` : ""}`,
    "",
    "## Choosing a threshold",
    "",
    `There is no universally safe number. One approach: ask the person at what collateral price they would act, work out the health factor at that price, and set the alert a little above it, because checks are ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes apart and a repayment can be slow to confirm on a busy network. ${SITE_NAME} accepts ${HEALTH_FACTOR_THRESHOLD_MIN} to ${HEALTH_FACTOR_THRESHOLD_MAX}, ${DEFAULT_HEALTH_FACTOR_THRESHOLD} by default.${guides.safe ? ` A table of how far prices can fall at each health factor: ${guides.safe}.` : ""}`,
    "",
    `## Setting up an alert with ${SITE_NAME}`,
    "",
    `1. The person opens the dashboard (${dashboard}) and connects the wallet that holds the loan. Looking at positions is read-only and needs no payment.`,
    `2. Alerts need paid access, paid in ${PAYMENT_TOKEN_SYMBOL}${paymentChain ? ` on ${paymentChain}` : ""} from that wallet. The price is shown on the dashboard before paying and nothing renews automatically. The wallet also signs a message to sign in: there is no account and no password.`,
    `3. They choose the market (one alert per Aave V3 market or V4 Spoke), the threshold and the channels: ${channels}.`,
    "4. They save the alert. Delivery can be tested without waiting for a price drop.",
    "",
    ...(guides.setup
      ? [`The step-by-step guide, with what an alert looks like and how to test it: ${guides.setup}.`, ""]
      : []),
    "## What to tell the person",
    "",
    "- You cannot connect a wallet or pay for them. They do that on the site themselves, and they should type the address into the browser rather than follow a link that claims to be the site.",
    `- ${SITE_NAME} never asks for a seed phrase or a private key, and never asks for an approval or a signature on the Aave position. The only transactions are the payment: an approval for exactly the price, then the payment.`,
    `- An alert gives time to act and does not prevent a liquidation. Checks run every ${NOTIFICATION_CHECK_INTERVAL_MINUTES} minutes, not continuously, so a sharp fall can pass the threshold and reach 1.00 between two checks. While a health factor is below the threshold, every check sends a message on each chosen channel. The service is in beta and has no uptime guarantee.`,
    "- This is general information, not financial advice. Whether to borrow, repay or add collateral is the person's decision.",
    "",
    "## Coverage and limits",
    "",
    `- Every Aave V3 market (${AAVE_MARKETS.length} markets on ${AAVE_V3_NETWORKS.length} networks) and every Aave V4 Spoke (${AAVE_V4_SPOKES.length}), ${AAVE_NETWORK_NAMES.length} networks in all. Not covered: other protocols.`,
    "- It watches only the wallet that is connected. Alerts cover the health factor only, not prices, rates or governance.",
    "",
    "## Other tools",
    "",
    `If the person wants alerts at no charge, a mobile app or automatic repayment, ${SITE_NAME} may not fit.${guides.tools ? ` A sourced comparison of the alternatives, including where ${SITE_NAME} is the wrong choice: ${guides.tools}.` : ""}`,
    "",
  ].join("\n");
};

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

export const buildAgentSkillsIndex = () => ({
  $schema: AGENT_SKILLS_SCHEMA,
  skills: [
    {
      name: AAVE_ALERTS_SKILL_NAME,
      type: "skill-md",
      description: AAVE_ALERTS_SKILL_DESCRIPTION,
      url: aaveAlertsSkillPath(),
      digest: `sha256:${sha256(buildAaveAlertsSkill())}`,
    },
  ],
});

/** Public, read-only files: any page may fetch them, as the RFC suggests for browser-based clients. */
export const AGENT_SKILLS_HEADERS = { "Access-Control-Allow-Origin": "*" } as const;
