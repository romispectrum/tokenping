import { Fragment, type ReactNode, createElement } from "react";
import type { CoverageGridLabels } from "~~/components/home/CoverageGrid";
import type { HealthFactorChartLabels } from "~~/components/home/HealthFactorChart";
import type { ThresholdScaleLabels } from "~~/components/home/ThresholdScale";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

/** Renders a link around its text; the component decides the target. */
export type LinkText = (text: string) => ReactNode;

/** Rich text: the parts as one fragment, split into text nodes exactly where they are listed. */
export const rich = (...parts: ReactNode[]) => createElement(Fragment, null, ...parts);

export type HomeMessages = {
  // Metadata, headline and JSON-LD (homeContent)
  /** Headline A: "Aave and Morpho health factor alerts on Signal and email" (channels joined with "and"). */
  headline: (channels: string) => string;
  /** The meta description; `short` is the fallback once the full one passes 155 characters. */
  description: (input: { channels: string; networks: number; minutes: number; short: boolean }) => string;
  /** A channel as a badge: "Email" / "E-mail". */
  channelBadge: (name: string) => string;
  pricingCta: (plan: AlertPlan | null) => string;
  offerDescription: (input: { days: number; currency: string }) => string;

  // Hero
  kicker: string;
  heroLead: (input: { minutes: number; channels: string }) => string;
  /** Names the logo strip for assistive tech; `heroCoverage` reads next to it: "29 networks". */
  networksLabel: string;
  heroCoverage: (networks: number) => string;
  channelsLabel: string;
  exampleAlertLabel: string;
  exampleAlertCaption: (subject: string) => string;

  // The primary action (the Aave dashboard) and the Morpho dashboard beside it, in the hero and the closing band
  dashboardCta: string;
  morphoDashboardCta: string;
  /** Under the button: what it opens and what alerts cost (`alertPrice` is "3 USDC per 30 days" or the fallback). */
  dashboardCtaMicrocopy: (alertPrice: string) => string;

  // The problem: a night on a chart, and what moves a health factor
  problemTitle: string;
  problemLead: string;
  problemCauses: { title: string; body: string }[];
  /** The forum accounts, each linked to its thread. */
  problemEvidence: (links: { morning: LinkText; failedRepays: LinkText; polygon: LinkText }) => ReactNode;
  /** `guide` is there only while the liquidation guide is published in this language. */
  problemLiquidator: (guide?: LinkText) => ReactNode;
  chart: HealthFactorChartLabels;

  // How it works
  howItWorksTitle: string;
  steps: (input: {
    plan: AlertPlan | null;
    paymentChain: string | undefined;
    minutes: number;
    channels: string;
    threshold: { min: number; max: number; default: number };
    /** Morpho's lowest threshold, below Aave's. */
    morphoMin: number;
  }) => { title: string; body: string }[];
  scaleTitle: string;
  scale: ThresholdScaleLabels;
  /** Links the safe health factor guide under the scale, while it is published in this language. */
  scaleGuide: string;

  // Coverage
  coverageTitle: string;
  coverageLead: (input: {
    v3Markets: number;
    v3Networks: number;
    spokes: number;
    v4Networks: number;
    morphoNetworks: number;
  }) => string;
  coverage: CoverageGridLabels;
  /** The wind-down markets and what is left out. */
  coverageNote: string;

  // Pricing
  pricingTitle: string;
  /** `alertPrice`: "3 USDC per 30 days", or the priceless fallback, as it reads inside a sentence (AlertPrice). */
  pricingRows: (input: { alertPrice: string; paymentChain: string | undefined }) => { term: string; detail: string }[];
  priceSource: string;
  pricingFootnote: string;

  // Questions
  questionsTitle: string;
  questions: (input: {
    /** As in the pricing rows: "3 USDC per 30 days" or the fallback. */
    alertPrice: string;
    paymentChain: string | undefined;
    hasTelegram: boolean;
    minutes: number;
    /** Morpho's lowest threshold, below Aave's. */
    morphoMin: number;
    links: {
      /** Undefined while the paywall is not verified anywhere (a local build). */
      sourcify?: LinkText;
      sourceCode: LinkText;
      privacy: LinkText;
      x: LinkText;
      telegramCommunity: LinkText;
      signalCommunity: LinkText;
      /** Undefined while the comparison post is not published in this language. */
      comparison?: LinkText;
      morphoDashboard: LinkText;
    };
  }) => { question: string; answer: ReactNode }[];

  // Limits
  limitsTitle: string;
  limits: (input: { minutes: number; repeatMinutes: number; paymentChain: string | undefined }) => string[];

  // From the blog
  blogTitle: string;
  allGuides: string;

  // Closing band
  closingTitle: string;
  closingLead: (alertPrice: string) => string;
};
