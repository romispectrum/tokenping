import { type HomeMessages, rich } from "./shared";
import { capitalize } from "~~/i18n/format";

const enDays = (days: number) => (days === 1 ? "1 day" : `${days} days`);

export const MESSAGES: HomeMessages = {
  headline: channels => `Aave and Morpho health factor alerts on ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `${channels} alerts when your Aave or Morpho health factor is below your threshold, on ${networks} networks, every ${minutes} minutes.`
      : `${channels} alerts when your Aave or Morpho health factor drops below your threshold, on ${networks} networks. Checked every ${minutes} minutes.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Set up alerts: ${plan.priceLabel} for ${enDays(plan.days)}` : "Set up alerts"),
  offerDescription: ({ days, currency }) =>
    `Health factor alerts for ${days} days, paid in ${currency} from your wallet. No auto-renew.`,

  kicker: "Aave V3 and V4, Morpho Blue and Midnight",
  heroLead: ({ minutes, channels }) =>
    `Checked every ${minutes} minutes. A message on ${channels} while you are below your line. Read-only, no approvals.`,
  networksLabel: "Networks",
  heroCoverage: networks => `${networks} networks`,
  channelsLabel: "Alerts by:",
  exampleAlertLabel: "What an alert says",
  exampleAlertCaption: subject => `Example. Emails arrive with the subject "${subject}".`,

  dashboardCta: "Open the Aave dashboard",
  morphoDashboardCta: "Open the Morpho dashboard",
  dashboardCtaMicrocopy: alertPrice => `Connect a wallet, see every position. Alerts cost ${alertPrice}.`,

  problemTitle: "Health factors fall while you sleep",
  problemLead: "Aave shows your health factor but sends no alerts (October 2026). Three things move it overnight:",
  problemCauses: [
    { title: "Prices drop", body: "ETH falls and your collateral is worth less." },
    { title: "Interest accrues", body: "Your debt grows every second." },
    { title: "Thresholds change", body: "On Aave, governance can trim a liquidation threshold." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Borrowers describe ",
      morning("waking up to a liquidated position"),
      ", ",
      failedRepays("an hour of failing repay transactions"),
      " and ",
      polygon("a repay at 1.01 that came too late"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "The liquidator keeps a bonus on top: 5% on WETH in the Ethereum Core market (October 2026).",
      guide && rich(" See ", guide("how a liquidation works"), "."),
    ),
  chart: {
    threshold: "your threshold",
    liquidation: "liquidation",
    alertSent: "Alert sent",
    youCheck: "You check your phone",
    caption: "An example night. The alert goes out at 03:05, the first check below 1.5, five hours before you look.",
  },

  howItWorksTitle: "How it works",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` on ${paymentChain}` : "";
    return [
      {
        title: "Connect the wallet you borrow with",
        body: "Read-only. Aave and Morpho, one page each.",
      },
      {
        title: plan ? `Unlock alerts for ${plan.priceLabel}` : "Unlock alerts with a small USDC payment",
        body: `${plan ? `${enDays(plan.days)}, paid` : "Paid"} in USDC${paidOn}. No auto-renew.`,
      },
      {
        title: "Pick a line for each market",
        body: `From ${threshold.min} (${morphoMin} on Morpho) to ${threshold.max}, default ${threshold.default}.`,
      },
      {
        title: "Get a message while you're below it",
        body: `Every ${minutes} minutes, on ${channels}, until you're back above your line.`,
      },
    ];
  },
  scaleTitle: "Where to put your line",
  scale: {
    liquidation: "liquidation",
    critical: "Critical",
    risky: "Risky",
    safe: "Safe",
    defaultThreshold: value => `Default ${value}`,
    below: value => `Below ${value}`,
    between: (from, to) => `${from} to ${to}`,
    andAbove: value => `${value} and above`,
    range: (min, max) => `Any value from ${min} to ${max}.`,
  },
  scaleGuide: "How to choose a threshold",

  coverageTitle: "Every Aave market and every listed Morpho market",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${v3Markets} Aave V3 markets on ${v3Networks} networks and ${spokes} Aave V4 Spokes on ${v4Networks} networks, as of 16 October 2026, plus every listed Morpho market on ${morphoNetworks} networks.`,
  coverage: {
    v3Markets: count => (count === 1 ? "1 V3 market" : `${count} V3 markets`),
    v4Spokes: count => (count === 1 ? "1 V4 Spoke" : `${count} V4 Spokes`),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave governance and are still watched. Not covered: Aave V3 on Harmony, unlisted Morpho markets and other protocols.",

  pricingTitle: "Pricing",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alerts", detail: capitalize(alertPrice) },
    { term: "Renewal", detail: "None automatic: pay again when you want more time" },
    {
      term: "Payment",
      detail: paymentChain ? `USDC on ${paymentChain}, from your wallet (approve, then pay)` : "USDC, from your wallet",
    },
  ],
  priceSource: "The price is read from the payment contract and refreshed hourly.",
  pricingFootnote: "Looking at your positions needs no payment.",

  questionsTitle: "Questions to ask before you connect a wallet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const chainName = paymentChain ?? "the payment network";
    return [
      {
        question: "Can Tokenping touch my funds?",
        answer: rich(
          "No. Tokenping only reads your positions and never asks for an approval or a signature on Aave or Morpho. The only transactions are the payment on ",
          chainName,
          ": an approval for exactly the price, then the payment. The contract",
          links.sourcify && rich(" ", "is ", links.sourcify("verified on Sourcify"), " and its"),
          " ",
          links.sourceCode("source code is public"),
          "; the team's wallet can change its price, pause it and upgrade it.",
        ),
      },
      {
        question: "What do you store?",
        answer: rich(
          "Your wallet address, your alerts and the contact details you give (email, Signal username",
          hasTelegram ? ", Telegram chat" : "",
          "). No history and no tracking cookies; page views are counted anonymously. Only someone who can sign with your wallet can read those contact details, but payments are public on ",
          chainName,
          ". The ",
          links.privacy("privacy page"),
          " has the full list.",
        ),
      },
      {
        question: "What does it cost?",
        answer: rich(
          "Alerts cost ",
          alertPrice,
          ", in USDC on ",
          chainName,
          ", plus a little ETH for gas. Looking at your positions needs no payment. No auto-renew, no refunds.",
        ),
      },
      {
        question: "Which Morpho loans are covered?",
        answer: rich(
          `Morpho Blue (variable rate) and Morpho Midnight (fixed rate) loans in markets the Morpho app lists, with thresholds from ${morphoMin}. A fixed-rate loan also gets reminders before it matures. The same plan covers them: open the `,
          links.morphoDashboard("Morpho dashboard"),
          ".",
        ),
      },
      {
        question: "What if an alert doesn't arrive?",
        answer: rich(
          "The next check, ",
          minutes,
          " minutes later, tries again. Delivery relies on Resend, a Signal relay,",
          hasTelegram ? " the Telegram Bot API," : "",
          " public RPC nodes and Vercel's scheduler, with no uptime guarantee. Pick two channels and leave room to act.",
        ),
      },
      {
        question: "How do I stop the alerts?",
        answer: rich(
          "They stop once your health factor is back above your line, or when you delete the alert (needs active access). Access expired? Message us on ",
          links.x("X"),
          " or in our community on ",
          links.telegramCommunity("Telegram"),
          " or ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " In Telegram, /stop works too." : "",
          " No snooze and no unsubscribe link yet.",
        ),
      },
      {
        question: "Can I watch a wallet I don't connect?",
        answer: rich("Not today. One wallet, the one you connect; access is per wallet."),
      },
      {
        question: "Other tools cost nothing. Why pay?",
        answer: rich(
          "If a Telegram bot or a mobile app suits you, use one",
          links.comparison ? rich(": ", links.comparison("our comparison"), " covers them") : null,
          ". Tokenping is for alerts on Signal or email, in every Aave and listed Morpho market.",
        ),
      },
    ];
  },

  limitsTitle: "Limits, stated plainly",
  limits: ({ minutes, paymentChain }) => [
    `Checks every ${minutes} minutes, not in real time.`,
    "Every check below your line sends another message: no snooze or digest.",
    "One line per market, for the connected wallet only.",
    `USDC${paymentChain ? ` on ${paymentChain}` : ""} only: no cards, no refunds.`,
    "No unsubscribe link in emails yet; deleting an alert needs active access.",
    "Beta: third-party delivery, no uptime guarantee.",
  ],

  blogTitle: "From the blog",
  allGuides: "All Aave and Morpho guides",

  closingTitle: "Set up your Aave or Morpho health factor alert",
  closingLead: alertPrice => `${capitalize(alertPrice)}, paid from your wallet. No auto-renew.`,
};
