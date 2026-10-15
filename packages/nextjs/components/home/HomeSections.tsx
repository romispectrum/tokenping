import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { PostSummary } from "~~/components/blog/PostSummary";
import { HOME_BLOG_SLUGS, PROBLEM_SOURCES, getPricingCtaLabel, getPublishedPost } from "~~/components/home/homeContent";
import {
  DashboardCta,
  ExternalLink,
  HOME_CARD_CLASS_NAME,
  HOME_TEXT_CLASS_NAME,
  HomeSection,
} from "~~/components/home/homeUi";
import { Container, SECTION_CLASS_NAME, SectionDivider } from "~~/components/home/marketingLayout";
import { GlowWash } from "~~/components/ui/Glow";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
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
    <figure className="mx-0 mt-6 mb-0">
      {/* A message, not data: Satoshi, line breaks kept */}
      <blockquote className={cx(HOME_CARD_CLASS_NAME, "m-0 leading-relaxed whitespace-pre-line")}>
        {buildAlertText(EXAMPLE_ALERT)}
      </blockquote>
      <figcaption className="mt-3 text-sm text-muted-foreground">
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
      <div className="grid gap-4">
        <p className={HOME_TEXT_CLASS_NAME}>
          Aave shows your health factor in its app and warns you inside its transaction screens, but as of October 2026
          it doesn&apos;t send alerts. ETH drops overnight, interest keeps accruing on your debt, or a governance update
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
              <Link href={postPath(liquidationGuide.meta.slug)}>What happens in an Aave liquidation</Link> walks through
              the rules.
            </>
          )}
        </p>
      </div>
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
      title: `Pick a threshold and your channels for each network (${HEALTH_FACTOR_THRESHOLD_MIN} to ${HEALTH_FACTOR_THRESHOLD_MAX}, default ${DEFAULT_HEALTH_FACTOR_THRESHOLD})`,
      body: `Each network is a separate alert. Send it to ${formatAlertChannels("or")}, or to more than one.`,
    },
    {
      title: `We check every ${CHECK_MINUTES} minutes and message you while you're below it`,
      body: `Every check sends one message per channel until your health factor is back at or above your threshold, or you delete the alert. A fast drop can cross 1.0 between two checks.`,
    },
  ];

  return (
    <HomeSection id="how-it-works" title="How it works, in 4 steps" width="wide">
      <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
        {steps.map(({ title, body }, index) => (
          <li key={title} className={cx(HOME_CARD_CLASS_NAME, "m-0 flex gap-5")}>
            {/* The numeral is drawn for the eye; the heading carries it for everyone else. 700: a key number. */}
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-plum text-lg font-bold text-brand-white dark:outline dark:outline-border"
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <h3 className="m-0 text-lg leading-snug font-medium">
                {/* the space sits outside the hidden number, so accessible names keep it */}
                <span className="sr-only">{`${index + 1}.`}</span>
                {` ${title}`}
              </h3>
              <p className="mt-2 mb-0 text-[0.9375rem] leading-relaxed text-muted-foreground md:text-base">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
};

type PricingSectionProps = {
  plan: AlertPlan | null;
};

/**
 * Answers "can I afford this" with the live plan, or a fallback that names no number (plan §2.7 item 6). Its call
 * to action is inverse: the pink stays with the hero and the closing band.
 */
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
    <HomeSection id="pricing" title="Pricing" width="list">
      <dl className="m-0 grid gap-4 sm:grid-cols-2">
        {rows.map(({ term, detail }) => (
          <div key={term} className={HOME_CARD_CLASS_NAME}>
            <dt className="text-sm font-medium text-muted-foreground">{term}</dt>
            <dd className="m-0 mt-1 text-lg leading-snug font-medium">{detail}</dd>
          </div>
        ))}
      </dl>
      {plan && (
        <p className="mt-4 mb-0 text-center text-sm text-muted-foreground">
          The price is read from the payment contract and refreshed hourly.
        </p>
      )}
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link
          href="/aave"
          className={buttonClasses({ variant: "inverse", size: "lg", className: "w-full max-w-sm sm:w-auto" })}
        >
          {getPricingCtaLabel(plan)}
        </Link>
        <p className="m-0 text-center text-sm text-muted-foreground">{`Paid in USDC${paidOnSuffix()}. No auto-renew.`}</p>
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
      <ul className="m-0 list-disc space-y-3 pl-6 marker:text-muted-foreground">
        {limits.map(limit => (
          <li key={limit} className="leading-[1.75]">
            {limit}
          </li>
        ))}
      </ul>
    </HomeSection>
  );
};

/** Three guides from the cluster, after a divider; both are left out while none of the guides is published. */
export const FromTheBlogSection = () => {
  const posts = HOME_BLOG_SLUGS.map(getPublishedPost).filter((post): post is Post => post !== undefined);
  if (posts.length === 0) return null;

  return (
    <>
      <SectionDivider />
      <HomeSection id="from-the-blog" title="From the blog" width="wide">
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
          {posts.map(({ meta }) => (
            <li key={meta.slug} className="m-0 flex p-0 [&>*]:w-full">
              <PostSummary meta={meta} as="h3" />
            </li>
          ))}
        </ul>
        <p className="mt-8 mb-0 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-medium text-link underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11"
          >
            All Aave health factor and liquidation guides
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </p>
      </HomeSection>
    </>
  );
};

/**
 * Same action as the hero, never a competing one. The closing moment is a contained dark band: the `dark` class
 * switches every token inside it in both themes, the glow wash is the page's second glow, the grain sits on top at
 * 30%. The section padding keeps it apart from the dark footer.
 */
export const ClosingCtaSection = () => (
  <section id="closing" aria-labelledby="closing-title" className={SECTION_CLASS_NAME}>
    <Container>
      <div className="dark relative isolate overflow-hidden rounded-3xl border border-border bg-background px-6 py-12 text-center md:px-16 md:py-16">
        <GlowWash />
        <div
          aria-hidden="true"
          className="grain pointer-events-none absolute inset-0 -z-10 opacity-30 mix-blend-overlay print:hidden"
        />
        <h2 id="closing-title" className="text-section mx-auto my-0 max-w-3xl text-balance">
          Check your Aave V3 health factor, free
        </h2>
        <p className="text-lead mx-auto mt-4 mb-0 max-w-[56ch] text-pretty text-muted-foreground">
          {`The dashboard shows collateral, debt and health factor for the wallet you connect on all ${NETWORK_COUNT} networks. Alerts are optional and paid.`}
        </p>
        <DashboardCta />
      </div>
    </Container>
  </section>
);
