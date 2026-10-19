import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Coins,
  type LucideIcon,
  Percent,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { formatAlertPrice } from "~~/components/blog/AlertPrice";
import { PostSummary } from "~~/components/blog/PostSummary";
import { CoverageGrid } from "~~/components/home/CoverageGrid";
import { HealthFactorChart } from "~~/components/home/HealthFactorChart";
import { ThresholdScale } from "~~/components/home/ThresholdScale";
import { HOME_BLOG_SLUGS, PROBLEM_SOURCES, getPricingCtaLabel, getPublishedPost } from "~~/components/home/homeContent";
import {
  DashboardCta,
  HOME_CARD_CLASS_NAME,
  HOME_TEXT_CLASS_NAME,
  HomeSection,
  externalLinkText,
} from "~~/components/home/homeUi";
import { Container, SECTION_CLASS_NAME, SectionDivider } from "~~/components/home/marketingLayout";
import { GlowWash } from "~~/components/ui/Glow";
import { buttonClasses } from "~~/components/ui/buttonClasses";
import { cx } from "~~/components/ui/classNames";
import { AAVE_MARKETS, AAVE_V3_NETWORKS, AAVE_V4_NETWORK_NAMES, AAVE_V4_SPOKES } from "~~/config/aaveConfig";
import {
  DEFAULT_HEALTH_FACTOR_THRESHOLD,
  HEALTH_FACTOR_THRESHOLD_MAX,
  HEALTH_FACTOR_THRESHOLD_MIN,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
} from "~~/constants/notifications";
import type { Post } from "~~/content/blog/types";
import { formatDecimal } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { HOME_MESSAGES } from "~~/i18n/messages/home";
import { postPath, routePath } from "~~/i18n/routes";
import { formatAlertChannelsIn } from "~~/services/marketing/alertChannels";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { getPaymentChainName } from "~~/services/marketing/paymentChain";

const CHECK_MINUTES = NOTIFICATION_CHECK_INTERVAL_MINUTES;

type LocaleProps = {
  locale: Locale;
};

/** A glyph per cause of a falling health factor, in the order of `problemCauses`. */
const CAUSE_ICONS: readonly LucideIcon[] = [TrendingDown, Percent, Scale];

/** A glyph per step, in the order of `steps`. */
const STEP_ICONS: readonly LucideIcon[] = [Wallet, Coins, SlidersHorizontal, BellRing];

/** A disc with a glyph, drawn for the eye next to a heading that says the same in words. */
const IconDisc = ({ Icon, className }: { Icon: LucideIcon; className?: string }) => (
  <span
    aria-hidden="true"
    className={cx(
      "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-plum text-brand-white dark:outline dark:outline-border",
      className,
    )}
  >
    <Icon className="size-5" strokeWidth={1.5} />
  </span>
);

/**
 * The push: a night on a chart, then what moves a health factor in three lines, the forum accounts (each
 * linked to its thread) and the liquidator's bonus. The chart carries the section; the prose is a column beside it.
 */
export const ProblemSection = ({ locale }: LocaleProps) => {
  const t = HOME_MESSAGES[locale];
  const liquidationGuide = getPublishedPost("how-aave-liquidation-works", locale);
  return (
    <HomeSection id="problem" title={t.problemTitle} width="wide">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className={cx(HOME_CARD_CLASS_NAME, "lg:col-span-7")}>
          <HealthFactorChart labels={t.chart} formatNumber={value => formatDecimal(locale, value)} />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5">
          <p className={HOME_TEXT_CLASS_NAME}>{t.problemLead}</p>
          <ul className="m-0 grid list-none gap-3 p-0">
            {t.problemCauses.map(({ title, body }, index) => {
              const Icon = CAUSE_ICONS[index];
              return (
                <li key={title} className="m-0 flex items-start gap-3 p-0">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{title}</span>
                    <span className="text-sm text-muted-foreground">{body}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            {t.problemEvidence({
              morning: externalLinkText(PROBLEM_SOURCES.morningLiquidation),
              failedRepays: externalLinkText(PROBLEM_SOURCES.failedRepays),
              polygon: externalLinkText(PROBLEM_SOURCES.polygonRepay),
            })}
          </p>
          <p className="m-0 text-sm leading-relaxed text-muted-foreground">
            {t.problemLiquidator(
              liquidationGuide && (text => <Link href={postPath(locale, liquidationGuide.meta.slug)}>{text}</Link>),
            )}
          </p>
        </div>
      </div>
    </HomeSection>
  );
};

type PlanProps = LocaleProps & {
  plan: AlertPlan | null;
};

/**
 * The four real steps, payment included, one short card each, then the scale a threshold sits on
 * (the dashboard's own zones) with the guide that helps choose one.
 */
export const HowItWorksSection = ({ plan, locale }: PlanProps) => {
  const t = HOME_MESSAGES[locale];
  const steps = t.steps({
    plan,
    paymentChain: getPaymentChainName(),
    minutes: CHECK_MINUTES,
    channels: formatAlertChannelsIn(locale, "disjunction"),
    threshold: {
      min: HEALTH_FACTOR_THRESHOLD_MIN,
      max: HEALTH_FACTOR_THRESHOLD_MAX,
      default: DEFAULT_HEALTH_FACTOR_THRESHOLD,
    },
  });
  const thresholdGuide = getPublishedPost("safe-aave-health-factor", locale);

  return (
    <HomeSection id="how-it-works" title={t.howItWorksTitle} width="wide">
      <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ title, body }, index) => (
          <li key={title} className={cx(HOME_CARD_CLASS_NAME, "m-0 flex flex-col gap-3")}>
            <span className="flex items-center justify-between gap-3">
              <IconDisc Icon={STEP_ICONS[index]} />
              {/* The numeral is drawn for the eye; the heading carries it for everyone else. 700: a key number. */}
              <span aria-hidden="true" className="font-data text-sm font-bold text-muted-foreground tabular-nums">
                {index + 1}
              </span>
            </span>
            <h3 className="m-0 text-base leading-snug font-medium">
              {/* the space sits outside the hidden numeral, so accessible names keep it */}
              <span className="sr-only">{`${index + 1}.`}</span>
              {` ${title}`}
            </h3>
            <p className="m-0 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
      <div className={cx(HOME_CARD_CLASS_NAME, "mt-6 md:mt-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-10")}>
        <div className="lg:col-span-4">
          <h3 className="m-0 text-lg leading-snug font-medium">{t.scaleTitle}</h3>
          {thresholdGuide ? (
            <p className="mt-2 mb-0 text-sm">
              <Link
                href={postPath(locale, thresholdGuide.meta.slug)}
                className="inline-flex items-center gap-1.5 font-medium text-link underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11"
              >
                {t.scaleGuide}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </p>
          ) : null}
        </div>
        <ThresholdScale
          labels={t.scale}
          formatNumber={value => formatDecimal(locale, value)}
          className="mt-6 lg:col-span-8 lg:mt-0"
        />
      </div>
    </HomeSection>
  );
};

/** Every network as a tile with its logo and what is read there; the wind-down and Harmony in one line under it. */
export const CoverageSection = ({ locale }: LocaleProps) => {
  const t = HOME_MESSAGES[locale];
  return (
    <HomeSection
      id="coverage"
      title={t.coverageTitle}
      lead={t.coverageLead({
        v3Markets: AAVE_MARKETS.length,
        v3Networks: AAVE_V3_NETWORKS.length,
        spokes: AAVE_V4_SPOKES.length,
        v4Networks: AAVE_V4_NETWORK_NAMES.length,
      })}
      width="wide"
    >
      <CoverageGrid labels={t.coverage} />
      <p className="mx-auto mt-6 mb-0 max-w-[72ch] text-center text-sm text-muted-foreground">{t.coverageNote}</p>
    </HomeSection>
  );
};

/**
 * Answers "can I afford this" with the live plan, or a fallback that names no number. Its call
 * to action is inverse: the pink stays with the hero and the closing band.
 */
export const PricingSection = ({ plan, locale }: PlanProps) => {
  const t = HOME_MESSAGES[locale];
  const paymentChain = getPaymentChainName();
  const rows = t.pricingRows({ alertPrice: formatAlertPrice(plan, locale), paymentChain });

  return (
    <HomeSection id="pricing" title={t.pricingTitle} width="wide">
      {/* One price list beside its action from lg: the eye crosses once instead of dropping through five rows. */}
      <div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12">
        <dl className={cx(HOME_CARD_CLASS_NAME, "m-0 flex flex-col py-2 md:py-3 lg:col-span-7")}>
          {rows.map(({ term, detail }) => (
            <div
              key={term}
              className="flex flex-col gap-0.5 border-t border-border py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <dt className="text-sm font-medium text-muted-foreground sm:w-28 sm:shrink-0">{term}</dt>
              <dd className="m-0 text-lg leading-snug font-medium">{detail}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-col items-center gap-3 lg:col-span-5 lg:mt-0 lg:items-start">
          {plan && <p className="m-0 text-center text-sm text-muted-foreground lg:text-left">{t.priceSource}</p>}
          <Link
            href={routePath(locale, "dashboard")}
            className={buttonClasses({ variant: "inverse", size: "lg", className: "w-full max-w-sm sm:w-auto" })}
          >
            {getPricingCtaLabel(plan, locale)}
          </Link>
          <p className="m-0 text-center text-sm text-muted-foreground lg:text-left">{t.pricingFootnote}</p>
        </div>
      </div>
    </HomeSection>
  );
};

/** A documented limit lowers anxiety more than adjectives do. One line each. */
export const LimitsSection = ({ locale }: LocaleProps) => {
  const t = HOME_MESSAGES[locale];
  const limits = t.limits({ minutes: CHECK_MINUTES, paymentChain: getPaymentChainName() });

  return (
    <HomeSection id="limits" title={t.limitsTitle} width="wide">
      {/* A checklist in two columns from md; the margin is the gap, because multicol ignores space-y. */}
      <ul className="m-0 list-disc pl-6 marker:text-muted-foreground md:columns-2 md:gap-x-12">
        {limits.map(limit => (
          <li key={limit} className="mb-3 break-inside-avoid leading-relaxed">
            {limit}
          </li>
        ))}
      </ul>
    </HomeSection>
  );
};

/**
 * Three guides from the cluster in the page's language, after a divider; both are left out while none of those
 * guides is published in that language (an untranslated guide is never replaced by the English one).
 */
export const FromTheBlogSection = ({ locale }: LocaleProps) => {
  const t = HOME_MESSAGES[locale];
  const posts = HOME_BLOG_SLUGS.map(key => getPublishedPost(key, locale)).filter(
    (post): post is Post => post !== undefined,
  );
  if (posts.length === 0) return null;

  return (
    <>
      <SectionDivider />
      <HomeSection id="from-the-blog" title={t.blogTitle} width="wide">
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
          {posts.map(({ meta }) => (
            <li key={meta.slug} className="m-0 flex p-0 [&>*]:w-full">
              <PostSummary meta={meta} locale={locale} as="h3" />
            </li>
          ))}
        </ul>
        <p className="mt-8 mb-0 text-center">
          <Link
            href={routePath(locale, "blog")}
            className="inline-flex items-center gap-1.5 font-medium text-link underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11"
          >
            {t.allGuides}
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
export const ClosingCtaSection = ({ plan, locale }: PlanProps) => (
  <section id="closing" aria-labelledby="closing-title" className={SECTION_CLASS_NAME}>
    <Container>
      <div className="dark relative isolate overflow-hidden rounded-3xl border border-border bg-background px-6 py-12 text-center md:px-16 md:py-16">
        <GlowWash />
        <div
          aria-hidden="true"
          className="grain pointer-events-none absolute inset-0 -z-10 opacity-30 mix-blend-overlay print:hidden"
        />
        <h2 id="closing-title" className="text-section mx-auto my-0 max-w-3xl text-balance">
          {HOME_MESSAGES[locale].closingTitle}
        </h2>
        <p className="text-lead mx-auto mt-4 mb-0 max-w-[56ch] text-pretty text-muted-foreground">
          {HOME_MESSAGES[locale].closingLead(formatAlertPrice(plan, locale))}
        </p>
        <DashboardCta locale={locale} plan={plan} />
      </div>
    </Container>
  </section>
);
