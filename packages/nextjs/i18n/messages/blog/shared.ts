import type { AlertPlan } from "~~/services/marketing/alertPlan";

export type EndBoxFields = {
  minutes: number;
  networks: number;
  /** The alert channels, already joined for the language ("Signal or email"). */
  channels: string;
  /** formatAlertPrice in the same language. */
  price: string;
  /** The network alerts are paid on; undefined when no target network has a paywall. */
  paymentChain?: string;
};

export type BlogMessages = {
  crumbs: { home: string; blog: string };
  index: {
    /** The page title (metadata) and the H1. */
    title: string;
    description: string;
    kicker: string;
    lead: string;
    dashboardCta: string;
    morphoDashboardCta: string;
    rss: string;
    startHere: string;
    allGuides: string;
    empty: {
      title: string;
      description: string;
      /** A link to the other language's guides while this one has none; absent in English. */
      otherLanguage?: string;
    };
  };
  post: {
    kicker: string;
    /** The kicker of a Morpho guide. */
    morphoKicker: string;
    byline: {
      author: string;
      published: string;
      updated: string;
    };
    readingTime: (minutes: number) => string;
    readGuide: string;
    related: string;
  };
  endBox: {
    label: string;
    title: string;
    body: (fields: EndBoxFields) => string;
    cta: string;
    /** Under a Morpho guide: the Morpho alerts, and the Morpho dashboard as the action. */
    morpho: { title: string; body: (fields: EndBoxFields) => string; cta: string };
  };
  alertPrice: {
    /** Shown when the plan cannot be read; reads correctly where "3 USDC per 30 days" would. No digits. */
    fallback: string;
    plan: (plan: AlertPlan) => string;
  };
  callout: { info: string; warning: string };
  shortAnswer: string;
  scopeNote: {
    /** The scope sentences, up to the figures date. */
    text: string;
    /** The same for a Morpho guide. */
    morphoText: string;
    figuresAsOf: string;
  };
  table: {
    /** The region's name before hydration, without JavaScript, or with no heading above the table. */
    fallbackLabel: string;
    /** Named after the heading above; `index` (from 1) only when several tables share the heading. */
    label: (heading: string, index?: number) => string;
    scrollHint: string;
  };
};
