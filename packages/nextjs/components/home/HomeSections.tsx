import Link from "next/link";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { PostSummary } from "~~/components/blog/PostSummary";
import { HOME_BLOG_SLUGS, PROBLEM_SOURCES, getPricingCtaLabel, getPublishedPost } from "~~/components/home/homeContent";
import {
  DashboardCta,
  ExternalLink,
  HOME_LINK_CLASS_NAME,
  HOME_TEXT_CLASS_NAME,
  HomeSection,
} from "~~/components/home/homeUi";
import { AAVE_MARKETS } from "~~/config/aaveConfig";
import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
} from "~~/constants/notifications";
import type { Post } from "~~/content/blog/types";
import { formatAlertChannels } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { formatUtcTimestamp } from "~~/utils/format";
import { postPath } from "~~/utils/seo";

const NETWORK_COUNT = AAVE_MARKETS.length;
const CHECK_MINUTES = NOTIFICATION_CHECK_INTERVAL_MINUTES;

/** " on Arbitrum One", or nothing when no target network has a paywall. */
const paidOnSuffix = () => {
  const chainName = getPaymentChainName();
  return chainName ? ` on ${chainName}` : "";
};

/** Illustrative values for the real alert template; the section says they are examples. */
const EXAMPLE_ALERT = {
  chainName: "Arbitrum",
  healthFactor: "1.42",
  threshold: DEFAULT_HEALTH_FACTOR_THRESHOLD,
  timestamp: formatUtcTimestamp(new Date("2026-10-14T03:05:00Z")),
};

/** Product evidence allowed today (marketing plan §2.6): the exact message, built by the code that sends it. */
export const ExampleAlertSection = () => (
  <HomeSection id="example-alert" title="What an alert says">
    <p className={HOME_TEXT_CLASS_NAME}>
      {`Every channel gets the same text. This is the template the alert service sends, filled in with example numbers:`}
    </p>
    <figure className="m-0 my-4">
      <blockquote className="m-0 whitespace-pre-line rounded-2xl border border-base-300 bg-base-200 p-4 font-mono text-sm leading-relaxed text-base-content dark:border-white/10 dark:bg-gray-950/60 dark:text-gray-100">
        {buildAlertText(EXAMPLE_ALERT)}
      </blockquote>
      <figcaption className="mt-2 text-sm text-base-content/70 dark:text-gray-400">
        {`Example only: the network, numbers and time are made up. Emails arrive with the subject "${buildAlertEmail(EXAMPLE_ALERT).subject}".`}
      </figcaption>
    </figure>
  </HomeSection>
);

/** The push: what goes wrong without an alert, with each forum account linked to its own thread (plan §2.3). */
export const ProblemSection = () => {
  const liquidationGuide = getPublishedPost("how-aave-liquidation-works");
  return (
    <HomeSection id="problem" title="Health factors fall while you sleep">
      <p className={HOME_TEXT_CLASS_NAME}>
        Aave shows your health factor in its app and warns you inside its transaction screens, but as of October 2026 it
        doesn&apos;t send alerts. ETH drops overnight, interest keeps accruing on your debt, or a governance update
        trims a liquidation threshold, and nothing messages you about any of it.
      </p>
      <p className={HOME_TEXT_CLASS_NAME}>
        On Aave&apos;s governance forum, one borrower describes{" "}
        <ExternalLink href={PROBLEM_SOURCES.morningLiquidation}>
          checking in the morning to find the position liquidated again
        </ExternalLink>
        ; another,{" "}
        <ExternalLink href={PROBLEM_SOURCES.failedRepays}>
          an hour of repay transactions that kept failing until the position was liquidated
        </ExternalLink>
        . On the Polygon forum in 2021, before Aave V3, one borrower{" "}
        <ExternalLink href={PROBLEM_SOURCES.polygonRepay}>tried to repay at a health factor of 1.01</ExternalLink> and
        was liquidated before the transaction went through.
      </p>
      <p className={HOME_TEXT_CLASS_NAME}>
        By the time you look, a liquidator may have taken collateral worth the repaid debt plus a bonus: 5% on WETH in
        the Ethereum Core market as of October 2026.
        {liquidationGuide && (
          <>
            {" "}
            <Link href={postPath(liquidationGuide.meta.slug)} className={HOME_LINK_CLASS_NAME}>
              What happens in an Aave liquidation
            </Link>{" "}
            walks through the rules.
          </>
        )}
      </p>
    </HomeSection>
  );
};

type HowItWorksSectionProps = {
  plan: AlertPlan | null;
};

/** The four real steps, payment included (plan §2.7 item 5). */
export const HowItWorksSection = ({ plan }: HowItWorksSectionProps) => {
  const paidOn = paidOnSuffix();
  const steps = [
    {
      title: "Connect the wallet you borrow with (read-only, free)",
      body: `The dashboard shows that wallet's Aave V3 collateral, debt and health factor on all ${NETWORK_COUNT} networks. Tokenping watches the wallet you connect; you can't add another address.`,
    },
    {
      title: plan
        ? `Unlock alerts: ${plan.priceLabel} for ${plan.days} days, paid${paidOn} (approve, then pay)`
        : `Unlock alerts with a small USDC payment${paidOn} (approve, then pay)`,
      body: "Two wallet transactions: an approval for exactly the price, never an unlimited one, then the payment. Nothing renews automatically.",
    },
    {
      title: `Pick a threshold and your channels for each network (${HEALTH_FACTOR_THRESHOLD_MIN}–${HEALTH_FACTOR_THRESHOLD_MAX}, default ${DEFAULT_HEALTH_FACTOR_THRESHOLD})`,
      body: `Each network is a separate alert. Send it to ${formatAlertChannels("or")}, or to more than one.`,
    },
    {
      title: `We check every ${CHECK_MINUTES} minutes and message you while you're below it`,
      body: `Every check sends one message per channel until your health factor is back at or above your threshold, or you delete the alert. A fast drop can cross 1.0 between two checks.`,
    },
  ];

  return (
    <HomeSection id="how-it-works" title="How it works, in 4 steps">
      <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {steps.map(({ title, body }, index) => (
          <li
            key={title}
            className="m-0 rounded-2xl border border-base-300/80 bg-base-200/60 p-4 dark:border-white/10 dark:bg-gray-900/40"
          >
            {/* One template string keeps the step number and title a single text node in the server HTML. */}
            <h3 className="m-0 mb-1 text-base font-semibold leading-snug text-base-content">{`${index + 1}. ${title}`}</h3>
            <p className="m-0 text-sm leading-relaxed text-base-content/80 dark:text-gray-300">{body}</p>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
};

type PricingSectionProps = {
  plan: AlertPlan | null;
};

/** Answers "can I afford this" with the live plan, or a fallback that names no number (plan §2.7 item 6). */
export const PricingSection = ({ plan }: PricingSectionProps) => {
  const chainName = getPaymentChainName();
  const alertPrice = formatAlertPrice(plan);
  const rows = [
    { term: "Dashboard", detail: "Free" },
    { term: "Alerts", detail: alertPrice.charAt(0).toUpperCase() + alertPrice.slice(1) },
    { term: "Renewal", detail: "None automatic: you pay again when you want more time" },
    {
      term: "Payment",
      detail: chainName ? `USDC on ${chainName}, from your wallet (approve, then pay)` : "USDC, from your wallet",
    },
  ];

  return (
    <HomeSection id="pricing" title="Pricing">
      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        {rows.map(({ term, detail }) => (
          <div
            key={term}
            className="rounded-2xl border border-base-300/80 bg-base-200/60 p-4 dark:border-white/10 dark:bg-gray-900/40"
          >
            <dt className="text-sm font-medium text-base-content/70 dark:text-gray-400">{term}</dt>
            <dd className="m-0 mt-1 font-semibold text-base-content">{detail}</dd>
          </div>
        ))}
      </dl>
      {plan && (
        <p className="mt-3 mb-0 text-sm text-base-content/70 dark:text-gray-400">
          The price is read from the payment contract and refreshed hourly.
        </p>
      )}
      <div className="mt-5 flex flex-col items-start gap-2">
        <Link href="/aave" className="btn btn-primary rounded-full">
          {getPricingCtaLabel(plan)}
        </Link>
        <p className="m-0 text-sm text-base-content/70 dark:text-gray-400">
          {`Paid in USDC${paidOnSuffix()}. No auto-renew.`}
        </p>
      </div>
    </HomeSection>
  );
};

/** A documented limit lowers anxiety more than adjectives do (plan §2.7 item 8, product limits). */
export const LimitsSection = () => {
  const limits = [
    `Aave V3 only, on ${NETWORK_COUNT} networks, and on Ethereum only the Core market. No Aave V4 and no other protocols.`,
    `Checks run every ${CHECK_MINUTES} minutes, not in real time. A fast drop can liquidate a position between two checks.`,
    "While you're below your threshold, every check sends another message on each channel. There is no snooze, digest or recovery message.",
    "One threshold per network, for the connected wallet only. No watch-only addresses, price alerts or portfolio-wide alerts.",
    `Payment is in USDC${paidOnSuffix()} only: no card payments, and the contract has no refund function.`,
    "Emails have no unsubscribe link yet, and deleting an alert needs active access.",
    "Tokenping is in beta. Delivery depends on third-party services, and there is no uptime guarantee.",
  ];

  return (
    <HomeSection id="limits" title="Limits, stated plainly">
      <ul className="m-0 list-disc space-y-2 pl-6 marker:text-base-content/50">
        {limits.map(limit => (
          <li key={limit} className="leading-relaxed text-base-content/90 dark:text-gray-200">
            {limit}
          </li>
        ))}
      </ul>
    </HomeSection>
  );
};

/** Three guides from the cluster; hidden while none of them is published. */
export const FromTheBlogSection = () => {
  const posts = HOME_BLOG_SLUGS.map(getPublishedPost).filter((post): post is Post => post !== undefined);
  if (posts.length === 0) return null;

  return (
    <HomeSection id="from-the-blog" title="From the blog">
      <ul className="m-0 grid list-none gap-4 p-0">
        {posts.map(({ meta }) => (
          <li key={meta.slug} className="m-0 p-0">
            <PostSummary meta={meta} as="h3" />
          </li>
        ))}
      </ul>
      <p className="mt-4 mb-0">
        <Link href="/blog" className={HOME_LINK_CLASS_NAME}>
          All Aave health factor and liquidation guides
        </Link>
      </p>
    </HomeSection>
  );
};

/** Same action as the hero, never a competing one. */
export const ClosingCtaSection = () => (
  <HomeSection id="closing" title="Check your Aave V3 health factor, free">
    <p className={`${HOME_TEXT_CLASS_NAME} mb-5`}>
      {`The dashboard shows collateral, debt and health factor for the wallet you connect on all ${NETWORK_COUNT} networks. Alerts are optional and paid.`}
    </p>
    <DashboardCta />
  </HomeSection>
);
