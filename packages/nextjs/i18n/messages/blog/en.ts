import type { BlogMessages } from "./shared";

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Home", blog: "Blog" },
  index: {
    title: "Aave and Morpho health factor and liquidation guides",
    description:
      "Guides to the Aave and Morpho health factor, liquidations, liquidation prices and alerts, with worked examples and dated, sourced figures.",
    kicker: "Aave and Morpho guides",
    lead: "How the health factor works on Aave and on Morpho, what happens in a liquidation, how to calculate your liquidation price and how to get warned before it gets close. Every figure in these guides names its source and the date it was checked.",
    dashboardCta: "Open the Aave dashboard",
    morphoDashboardCta: "Open the Morpho dashboard",
    rss: "Subscribe with RSS",
    startHere: "Start here",
    allGuides: "All guides",
    empty: {
      title: "No guides yet",
      description: "The first guides are being written. Subscribe with RSS to get them when they are published.",
    },
  },
  post: {
    kicker: "Aave V3 guide",
    morphoKicker: "Morpho guide",
    byline: { author: "By the Tokenping team", published: "Published", updated: "Updated" },
    readingTime: minutes => `${minutes} min read`,
    readGuide: "Read the guide",
    related: "Related guides",
  },
  endBox: {
    label: "About Tokenping",
    title: "Health factor alerts from Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping checks your Aave V3 and V4 health factor every ${minutes} minutes on ${networks} networks and messages you on ${channels} when it is below your threshold. Alerts cost ${price}${paymentChain ? `, paid on ${paymentChain}` : ""}; looking at your positions needs no payment. Alerts give you time to act; they don't prevent liquidation.`,
    cta: "Open the dashboard",
    morpho: {
      title: "Morpho health factor alerts from Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping checks your Morpho Blue and Midnight health factor every ${minutes} minutes on ${networks} networks and messages you on ${channels} when it is below your threshold, with reminders before a fixed-rate loan matures. Alerts cost ${price}${paymentChain ? `, paid on ${paymentChain}` : ""}, the same plan as Aave alerts; looking at your positions needs no payment. Alerts give you time to act; they don't prevent liquidation.`,
      cta: "Open the Morpho dashboard",
    },
  },
  alertPrice: {
    fallback: "a small USDC fee (see the dashboard for the current price)",
    plan: ({ priceLabel, days }) => `${priceLabel} per ${days === 1 ? "day" : `${days} days`}`,
  },
  callout: { info: "Note", warning: "Warning" },
  shortAnswer: "Short answer",
  scopeNote: {
    text: "Applies to Aave V3.7, checked on the Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche and Gnosis markets. Other V3 markets and networks may run older versions. Aave V4 differences are noted where rules differ.",
    morphoText:
      "Applies to Morpho Blue and Morpho Midnight markets listed in the Morpho app. Each market sets its own collateral, oracle and LLTV, so check the figures of yours.",
    figuresAsOf: "Figures as of",
  },
  table: {
    fallbackLabel: "Table, scrolls horizontally",
    label: (heading, index) => (index === undefined ? `Table: ${heading}` : `Table ${index}: ${heading}`),
    scrollHint: "Scroll sideways to see every column.",
  },
};
