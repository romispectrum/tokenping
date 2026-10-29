import { Fragment, type ReactNode, createElement } from "react";
import type { CoverageGridLabels } from "~~/components/home/CoverageGrid";
import type { HealthFactorChartLabels } from "~~/components/home/HealthFactorChart";
import type { ThresholdScaleLabels } from "~~/components/home/ThresholdScale";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The homepage's copy (components/home), every language. Numbers and names that depend on the deployment (networks,
// channels, price, payment network) arrive as arguments, so the visible text, the metadata and the JSON-LD agree.
// Paragraphs with links take a function per link and place it in their own word order. The page is short on
// purpose: each section says one thing next to its visual; the guides and the privacy page carry the detail. It
// says what alerts cost and leaves it there: nothing on the page is described by what it does not cost.

/** Renders a link around its text; the component decides the target. */
type LinkText = (text: string) => ReactNode;

/** Rich text: the parts as one fragment, split into text nodes exactly where they are listed. */
const rich = (...parts: ReactNode[]) => createElement(Fragment, null, ...parts);

type HomeMessages = {
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
  limits: (input: { minutes: number; paymentChain: string | undefined }) => string[];

  // From the blog
  blogTitle: string;
  allGuides: string;

  // Closing band
  closingTitle: string;
  closingLead: (alertPrice: string) => string;
};

const enDays = (days: number) => (days === 1 ? "1 day" : `${days} days`);

/** "na 30 dní", "na 1 den", "na 2 dny". */
const csForDays = (days: number) =>
  `na ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, many: `${days} dne`, other: `${days} dní` })}`;

/** "každých 5 minut", "každé 2 minuty", "každou minutu". */
const csEveryMinutes = (minutes: number) =>
  plural("cs", minutes, {
    one: "každou minutu",
    few: `každé ${minutes} minuty`,
    many: `každých ${formatDecimal("cs", minutes)} minuty`,
    other: `každých ${minutes} minut`,
  });

const csPrice = (plan: AlertPlan) => `${formatDecimal("cs", plan.priceLabel)} ${csForDays(plan.days)}`;

/** "na 21 sítích", "na 1 síti". */
const csOnNetworks = (networks: number) =>
  plural("cs", networks, { one: `na ${networks} síti`, other: `na ${networks} sítích` });

/** "22 sítí", "2 sítě", "1 síť". */
const csNetworks = (networks: number) =>
  plural("cs", networks, { one: `${networks} síť`, few: `${networks} sítě`, other: `${networks} sítí` });

/** "24 trhů", "2 trhy", "1 trh". */
const csMarkets = (markets: number) =>
  plural("cs", markets, { one: `${markets} trh`, few: `${markets} trhy`, other: `${markets} trhů` });

/** "na síti Arbitrum One", or the payment network unnamed. */
const csOnChain = (chainName: string | undefined) => (chainName ? `na síti ${chainName}` : "na platební síti");

/** "30 días", "1 día". */
const esDays = (days: number) => plural("es", days, { one: `${days} día`, other: `${days} días` });

/** "cada 5 minutos", "cada minuto". */
const esEveryMinutes = (minutes: number) =>
  plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });

/** "29 redes", "1 red". */
const esNetworks = (networks: number) => plural("es", networks, { one: `${networks} red`, other: `${networks} redes` });

/** "24 mercados", "1 mercado". */
const esMarkets = (markets: number) =>
  plural("es", markets, { one: `${markets} mercado`, other: `${markets} mercados` });

/** "13 Spokes", "1 Spoke". */
const esSpokes = (spokes: number) => plural("es", spokes, { one: `${spokes} Spoke`, other: `${spokes} Spokes` });

/** "en la red Arbitrum One", or the payment network unnamed. */
const esOnChain = (chainName: string | undefined) => (chainName ? `en la red ${chainName}` : "en la red de pago");

// Hindi counts with the bare noun ("1 दिन", "30 दिन", "29 नेटवर्क"), so only "हर मिनट" needs a plural form.
const hiDays = (days: number) => `${days} दिन`;

/** "हर 5 मिनट में", "हर मिनट". */
const hiEveryMinutes = (minutes: number) => plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट में` });

const hiNetworks = (networks: number) => `${networks} नेटवर्क`;

const hiMarkets = (markets: number) => `${markets} मार्केट`;

/** "13 Spoke": the Aave term, uncounted in Hindi. */
const hiSpokes = (spokes: number) => `${spokes} Spoke`;

/** "Arbitrum One नेटवर्क पर", or the payment network unnamed. */
const hiOnChain = (chainName: string | undefined) => (chainName ? `${chainName} नेटवर्क पर` : "भुगतान नेटवर्क पर");

export const HOME_MESSAGES: Localized<HomeMessages> = {
  en: {
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
        detail: paymentChain
          ? `USDC on ${paymentChain}, from your wallet (approve, then pay)`
          : "USDC, from your wallet",
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
  },
  cs: {
    headline: channels => `Upozornění na health factor na Aave a Morpho přes ${channels}`,
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `Upozornění přes ${channels}, když je health factor na Aave či Morpho pod prahem (${csNetworks(networks)}), kontrola ${csEveryMinutes(minutes)}.`
        : `Upozornění přes ${channels}, když health factor na Aave či Morpho klesne pod váš práh, ${csOnNetworks(networks)}. Kontrola ${csEveryMinutes(minutes)}.`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `Nastavit upozornění: ${csPrice(plan)}` : "Nastavit upozornění"),
    offerDescription: ({ days, currency }) =>
      `Upozornění na health factor ${csForDays(days)}, placená v ${currency} z vaší peněženky. Bez automatického obnovení.`,

    kicker: "Aave V3 a V4, Morpho Blue a Midnight",
    heroLead: ({ minutes, channels }) =>
      `Kontrola ${csEveryMinutes(minutes)}. Zpráva přes ${channels}, dokud jste pod svou hranicí. Jen pro čtení, bez schválení.`,
    networksLabel: "Sítě",
    heroCoverage: networks => csNetworks(networks),
    channelsLabel: "Upozornění přes:",
    exampleAlertLabel: "Co vám upozornění napíše",
    exampleAlertCaption: subject => `Ukázka. E-maily chodí s předmětem „${subject}“.`,

    dashboardCta: "Otevřít přehled Aave",
    morphoDashboardCta: "Otevřít přehled Morpho",
    dashboardCtaMicrocopy: alertPrice => `Připojte peněženku a uvidíte všechny pozice. Upozornění stojí ${alertPrice}.`,

    problemTitle: "Health factor klesá, i když spíte",
    problemLead: "Aave váš health factor ukazuje, ale upozornění neposílá (říjen 2026). Přes noc s ním hýbou tři věci:",
    problemCauses: [
      { title: "Ceny klesají", body: "ETH spadne a váš kolaterál má nižší hodnotu." },
      { title: "Úrok přibývá", body: "Váš dluh roste každou vteřinu." },
      { title: "Prahy se mění", body: "Na Aave může governance snížit likvidační práh." },
    ],
    problemEvidence: ({ morning, failedRepays, polygon }) =>
      rich(
        "Dlužníci popisují, ",
        morning("jak se ráno probudili se zlikvidovanou pozicí"),
        ", ",
        failedRepays("hodinu selhávajících transakcí na splacení"),
        " i ",
        polygon("splátku při 1,01, která přišla pozdě"),
        ".",
      ),
    problemLiquidator: guide =>
      rich(
        "Likvidátor si k tomu nechá bonus: 5 % u WETH na trhu Core na Ethereu (říjen 2026).",
        guide && rich(" Podrobnosti: ", guide("jak funguje likvidace"), "."),
      ),
    chart: {
      threshold: "váš práh",
      liquidation: "likvidace",
      alertSent: "Upozornění odesláno",
      youCheck: "Podíváte se do telefonu",
      caption:
        "Ukázková noc. Upozornění odchází ve 3:05, při první kontrole pod 1,5, pět hodin předtím, než se podíváte.",
    },

    howItWorksTitle: "Jak to funguje",
    steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
      const paidOn = paymentChain ? ` na síti ${paymentChain}` : "";
      return [
        {
          title: "Připojte peněženku, se kterou si půjčujete",
          body: "Jen pro čtení. Aave a Morpho, každý na své stránce.",
        },
        {
          title: plan
            ? `Odemkněte upozornění za ${formatDecimal("cs", plan.priceLabel)}`
            : "Odemkněte upozornění malou platbou v USDC",
          body: `${plan ? `${capitalize(csForDays(plan.days))}, platba` : "Platba"} v USDC${paidOn}. Bez automatického obnovení.`,
        },
        {
          title: "Pro každý trh zvolte hranici",
          body: `Od ${formatDecimal("cs", threshold.min)} (na Morpho od ${formatDecimal("cs", morphoMin)}) do ${formatDecimal("cs", threshold.max)}, výchozí ${formatDecimal("cs", threshold.default)}.`,
        },
        {
          title: "Dostávejte zprávy, dokud jste pod ní",
          body: `${capitalize(csEveryMinutes(minutes))}, přes ${channels}, dokud se nevrátíte nad svou hranici.`,
        },
      ];
    },
    scaleTitle: "Kam hranici umístit",
    scale: {
      liquidation: "likvidace",
      critical: "Kritický",
      risky: "Rizikový",
      safe: "Bezpečný",
      defaultThreshold: value => `Výchozí ${value}`,
      below: value => `Pod ${value}`,
      between: (from, to) => `${from} až ${to}`,
      andAbove: value => `${value} a více`,
      range: (min, max) => `Libovolná hodnota od ${min} do ${max}.`,
    },
    scaleGuide: "Jak zvolit práh",

    coverageTitle: "Všechny trhy Aave a všechny uvedené trhy Morpho",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
      `${csMarkets(v3Markets)} Aave V3 ${csOnNetworks(v3Networks)} a ${csMarkets(spokes)} (Spoke) Aave V4 ${csOnNetworks(v4Networks)}, ke 16. říjnu 2026, a k tomu všechny uvedené trhy Morpho ${csOnNetworks(morphoNetworks)}.`,
    coverage: {
      v3Markets: count => `${csMarkets(count)} V3`,
      v4Spokes: count => `${csMarkets(count)} V4 (Spoke)`,
      morpho: "Morpho",
    },
    coverageNote:
      "Trhy na sítích Scroll, ZKsync, Metis, Soneium a Sonic governance Aave postupně ukončuje a dál je hlídáme. Nepokrýváme trh Aave V3 na síti Harmony, neuvedené trhy Morpho ani jiné protokoly.",

    pricingTitle: "Ceník",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Upozornění", detail: capitalize(alertPrice) },
      { term: "Obnovení", detail: "Žádné automatické: když chcete delší přístup, zaplatíte znovu" },
      {
        term: "Platba",
        detail: paymentChain
          ? `USDC na síti ${paymentChain} z vaší peněženky (schválení, pak platba)`
          : "USDC z vaší peněženky",
      },
    ],
    priceSource: "Cena se načítá z platebního kontraktu a obnovuje se každou hodinu.",
    pricingFootnote: "Prohlížení pozic nevyžaduje žádnou platbu.",

    questionsTitle: "Na co se zeptat, než připojíte peněženku",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
      const onChain = csOnChain(paymentChain);
      return [
        {
          question: "Může Tokenping sáhnout na mé prostředky?",
          answer: rich(
            `Ne. Tokenping vaše pozice jen čte a na Aave ani na Morpho nikdy nežádá o schválení ani o podpis. Jediné transakce jsou platba ${onChain}: schválení přesně této částky, pak platba. `,
            links.sourcify
              ? rich(
                  "Kontrakt je ",
                  links.sourcify("ověřený na Sourcify"),
                  " a jeho ",
                  links.sourceCode("zdrojový kód je veřejný"),
                )
              : links.sourceCode("Zdrojový kód kontraktu je veřejný"),
            "; peněženka týmu mu může změnit cenu, pozastavit ho a upgradovat.",
          ),
        },
        {
          question: "Co ukládáte?",
          answer: rich(
            "Adresu vaší peněženky, vaše upozornění a kontakty, které zadáte (e-mail, jméno na Signalu",
            hasTelegram ? ", chat na Telegramu" : "",
            `). Žádnou historii a žádné sledovací cookies; zobrazení stránek počítáme anonymně. Uložené kontakty si zobrazí jen ten, kdo umí podepisovat vaší peněženkou, ale platby jsou ${onChain} veřejné. Úplný seznam má `,
            links.privacy("stránka o ochraně soukromí"),
            ".",
          ),
        },
        {
          question: "Kolik to stojí?",
          answer: rich(
            `Upozornění stojí ${alertPrice}, v USDC ${onChain}, plus trochu ETH na gas. Prohlížení pozic nevyžaduje žádnou platbu. Bez automatického obnovení, bez vracení peněz.`,
          ),
        },
        {
          question: "Které půjčky na Morpho pokrýváte?",
          answer: rich(
            `Půjčky na Morpho Blue (variabilní sazba) a Morpho Midnight (pevná sazba) na trzích, které uvádí aplikace Morpho, s prahem už od ${formatDecimal("cs", morphoMin)}. Půjčka s pevnou sazbou navíc dostane připomínky před splatností. Pokrývá je stejná platba: otevřete `,
            links.morphoDashboard("přehled Morpho"),
            ".",
          ),
        },
        {
          question: "Co když upozornění nedorazí?",
          answer: rich(
            `Další kontrola o ${plural("cs", minutes, { one: "minutu", few: `${minutes} minuty`, other: `${minutes} minut` })} později to zkusí znovu. Doručení závisí na Resendu, relayi pro Signal, `,
            hasTelegram ? "Telegram Bot API, " : "",
            "veřejných RPC uzlech a plánovači Vercelu, bez záruky dostupnosti. Zvolte dva kanály a nechte si rezervu na reakci.",
          ),
        },
        {
          question: "Jak upozornění zastavím?",
          answer: rich(
            "Přestanou, jakmile se health factor vrátí nad vaši hranici, nebo když upozornění smažete (vyžaduje aktivní přístup). Přístup vypršel? Napište nám na ",
            links.x("X"),
            " nebo do naší komunity na ",
            links.telegramCommunity("Telegramu"),
            " či ",
            links.signalCommunity("Signalu"),
            ".",
            hasTelegram ? " V Telegramu funguje i /stop." : "",
            " Odložení ani odkaz pro odhlášení zatím nejsou.",
          ),
        },
        {
          question: "Můžu sledovat peněženku, kterou nepřipojím?",
          answer: rich("Zatím ne. Jedna peněženka, ta připojená; přístup platí pro každou peněženku zvlášť."),
        },
        {
          question: "Jiné nástroje nic nestojí. Proč platit?",
          answer: rich(
            "Pokud vám vyhovuje bot na Telegramu nebo mobilní aplikace, použijte je",
            links.comparison ? rich(": popisuje je naše ", links.comparison("srovnání")) : null,
            ". Tokenping je pro upozornění přes Signal nebo e-mail, na každém trhu Aave a uvedeném trhu Morpho.",
          ),
        },
      ];
    },

    limitsTitle: "Omezení bez příkras",
    limits: ({ minutes, paymentChain }) => [
      `Kontroly ${csEveryMinutes(minutes)}, ne v reálném čase.`,
      "Každá kontrola pod hranicí pošle další zprávu: bez odložení i souhrnu.",
      "Jedna hranice na trh, jen pro připojenou peněženku.",
      `Jen USDC${paymentChain ? ` na síti ${paymentChain}` : ""}: bez karty, bez vracení peněz.`,
      "E-maily zatím nemají odkaz pro odhlášení; smazání upozornění vyžaduje aktivní přístup.",
      "Beta: doručení přes třetí strany, bez záruky dostupnosti.",
    ],

    blogTitle: "Z blogu",
    allGuides: "Všichni průvodci k Aave a Morpho",

    closingTitle: "Nastavte si upozornění na health factor na Aave nebo Morpho",
    closingLead: alertPrice => `${capitalize(alertPrice)}, platí se z vaší peněženky. Bez automatického obnovení.`,
  },
  es: {
    headline: channels => `Alertas del factor de salud en Aave y Morpho por ${channels}`,
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `Alertas por ${channels} si tu factor de salud en Aave o Morpho está por debajo de tu umbral, en ${esNetworks(networks)}, ${esEveryMinutes(minutes)}.`
        : `Alertas por ${channels} si tu factor de salud en Aave o Morpho cae por debajo de tu umbral, en ${esNetworks(networks)}. Revisión ${esEveryMinutes(minutes)}.`,
    channelBadge: capitalize,
    pricingCta: plan =>
      plan ? `Configurar alertas: ${plan.priceLabel} por ${esDays(plan.days)}` : "Configurar alertas",
    offerDescription: ({ days, currency }) =>
      `Alertas del factor de salud por ${esDays(days)}, pagadas en ${currency} desde tu billetera. Sin renovación automática.`,

    kicker: "Aave V3 y V4, Morpho Blue y Midnight",
    heroLead: ({ minutes, channels }) =>
      `Revisión ${esEveryMinutes(minutes)}. Un mensaje por ${channels} mientras sigas por debajo de tu límite. Solo lectura, sin aprobaciones.`,
    networksLabel: "Redes",
    heroCoverage: networks => esNetworks(networks),
    channelsLabel: "Alertas por:",
    exampleAlertLabel: "Qué dice una alerta",
    exampleAlertCaption: subject => `Ejemplo. Los correos llegan con el asunto "${subject}".`,

    dashboardCta: "Abrir el panel de Aave",
    morphoDashboardCta: "Abrir el panel de Morpho",
    dashboardCtaMicrocopy: alertPrice =>
      `Conecta tu billetera y ve todas tus posiciones. Las alertas cuestan ${alertPrice}.`,

    problemTitle: "El factor de salud cae mientras duermes",
    problemLead:
      "Aave muestra tu factor de salud, pero no envía alertas (octubre de 2026). Tres cosas lo mueven durante la noche:",
    problemCauses: [
      { title: "Bajan los precios", body: "ETH cae y tu colateral vale menos." },
      { title: "Se acumulan intereses", body: "Tu deuda crece cada segundo." },
      { title: "Cambian los umbrales", body: "En Aave, la gobernanza puede recortar un umbral de liquidación." },
    ],
    problemEvidence: ({ morning, failedRepays, polygon }) =>
      rich(
        "Hay prestatarios que cuentan que ",
        morning("despertaron con la posición liquidada"),
        ", que ",
        failedRepays("sus transacciones para pagar la deuda fallaron durante una hora"),
        " y que ",
        polygon("un pago con el factor de salud en 1.01 llegó demasiado tarde"),
        ".",
      ),
    problemLiquidator: guide =>
      rich(
        "Además, el liquidador se queda con una bonificación: 5% sobre WETH en el mercado Core en Ethereum (octubre de 2026).",
        guide && rich(" Consulta ", guide("cómo funciona una liquidación"), "."),
      ),
    chart: {
      threshold: "tu umbral",
      liquidation: "liquidación",
      alertSent: "Alerta enviada",
      youCheck: "Revisas tu teléfono",
      caption:
        "Una noche de ejemplo. La alerta sale a las 03:05, en la primera revisión por debajo de 1.5, cinco horas antes de que mires.",
    },

    howItWorksTitle: "Cómo funciona",
    steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
      const paidOn = paymentChain ? ` en la red ${paymentChain}` : "";
      return [
        {
          title: "Conecta la billetera con la que pides prestado",
          body: "Solo lectura. Aave y Morpho, cada uno en su página.",
        },
        {
          title: plan
            ? `Desbloquea las alertas por ${plan.priceLabel}`
            : "Desbloquea las alertas con un pequeño pago en USDC",
          body: `${plan ? `Acceso por ${esDays(plan.days)}, pagado` : "Pago"} en USDC${paidOn}. Sin renovación automática.`,
        },
        {
          title: "Elige un límite para cada mercado",
          body: `Desde ${threshold.min} (${morphoMin} en Morpho) hasta ${threshold.max}, ${threshold.default} por defecto.`,
        },
        {
          title: "Recibe un mensaje mientras estés por debajo",
          body: `${capitalize(esEveryMinutes(minutes))}, por ${channels}, hasta que vuelvas a superar tu límite.`,
        },
      ];
    },
    scaleTitle: "Dónde poner tu límite",
    scale: {
      liquidation: "liquidación",
      critical: "Crítico",
      risky: "En riesgo",
      safe: "Seguro",
      defaultThreshold: value => `Por defecto: ${value}`,
      below: value => `Menos de ${value}`,
      between: (from, to) => `De ${from} a ${to}`,
      andAbove: value => `${value} o más`,
      range: (min, max) => `Cualquier valor de ${min} a ${max}.`,
    },
    scaleGuide: "Cómo elegir un umbral",

    coverageTitle: "Todos los mercados de Aave y todos los mercados listados de Morpho",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
      `${esMarkets(v3Markets)} de Aave V3 en ${esNetworks(v3Networks)} y ${esSpokes(spokes)} de Aave V4 en ${esNetworks(v4Networks)}, a 16 de octubre de 2026, además de todos los mercados listados de Morpho en ${esNetworks(morphoNetworks)}.`,
    coverage: {
      v3Markets: count => `${esMarkets(count)} V3`,
      v4Spokes: count => `${esSpokes(count)} V4`,
      morpho: "Morpho",
    },
    coverageNote:
      "La gobernanza de Aave está retirando poco a poco los mercados en Scroll, ZKsync, Metis, Soneium y Sonic, y los seguimos vigilando. No cubrimos Aave V3 en Harmony, los mercados de Morpho no listados ni otros protocolos.",

    pricingTitle: "Precios",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Alertas", detail: capitalize(alertPrice) },
      { term: "Renovación", detail: "No es automática: vuelve a pagar cuando quieras más tiempo" },
      {
        term: "Pago",
        detail: paymentChain
          ? `USDC en la red ${paymentChain}, desde tu billetera (aprobación y luego pago)`
          : "USDC, desde tu billetera",
      },
    ],
    priceSource: "El precio se lee del contrato de pago y se actualiza cada hora.",
    pricingFootnote: "Ver tus posiciones no requiere pago.",

    questionsTitle: "Qué preguntar antes de conectar una billetera",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
      const onChain = esOnChain(paymentChain);
      return [
        {
          question: "¿Puede Tokenping tocar mis fondos?",
          answer: rich(
            `No. Tokenping solo lee tus posiciones y nunca pide aprobaciones ni firmas en Aave ni en Morpho. Las únicas transacciones son el pago ${onChain}: una aprobación por exactamente el precio y luego el pago. `,
            links.sourcify
              ? rich(
                  "El contrato está ",
                  links.sourcify("verificado en Sourcify"),
                  " y su ",
                  links.sourceCode("código fuente es público"),
                )
              : links.sourceCode("El código fuente del contrato es público"),
            "; la billetera del equipo puede cambiar su precio, pausarlo y actualizarlo.",
          ),
        },
        {
          question: "¿Qué datos se guardan?",
          answer: rich(
            "La dirección de tu billetera, tus alertas y los datos de contacto que nos des (correo electrónico, nombre de usuario de Signal",
            hasTelegram ? ", chat de Telegram" : "",
            `). Sin historial y sin cookies de seguimiento; las visitas se cuentan de forma anónima. Solo quien pueda firmar con tu billetera puede leer esos datos de contacto, pero los pagos son públicos ${onChain}. La `,
            links.privacy("página de privacidad"),
            " tiene la lista completa.",
          ),
        },
        {
          question: "¿Cuánto cuesta?",
          answer: rich(
            `Las alertas cuestan ${alertPrice}, en USDC ${onChain}, más un poco de ETH para el gas. Ver tus posiciones no requiere pago. Sin renovación automática y sin reembolsos.`,
          ),
        },
        {
          question: "¿Qué préstamos de Morpho se cubren?",
          answer: rich(
            `Préstamos de Morpho Blue (tasa variable) y Morpho Midnight (tasa fija) en los mercados que lista la aplicación de Morpho, con umbrales desde ${morphoMin}. Un préstamo a tasa fija también recibe recordatorios antes del vencimiento. El mismo plan los cubre: abre el `,
            links.morphoDashboard("panel de Morpho"),
            ".",
          ),
        },
        {
          question: "¿Y si una alerta no llega?",
          answer: rich(
            `La siguiente revisión, ${plural("es", minutes, { one: "1 minuto", other: `${minutes} minutos` })} después, lo vuelve a intentar. La entrega depende de Resend, un relay de Signal,`,
            hasTelegram ? " la Telegram Bot API," : "",
            " nodos RPC públicos y el programador de tareas de Vercel, sin garantía de disponibilidad. Elige dos canales y deja margen para actuar.",
          ),
        },
        {
          question: "¿Cómo detengo las alertas?",
          answer: rich(
            "Se detienen cuando tu factor de salud vuelve a estar por encima de tu límite, o cuando eliminas la alerta (requiere acceso activo). ¿Expiró tu acceso? Escríbenos en ",
            links.x("X"),
            " o en nuestra comunidad de ",
            links.telegramCommunity("Telegram"),
            " o de ",
            links.signalCommunity("Signal"),
            ".",
            hasTelegram ? " En Telegram, /stop también funciona." : "",
            " Todavía no hay forma de posponerlas ni enlace para darte de baja.",
          ),
        },
        {
          question: "¿Puedo vigilar una billetera que no conecto?",
          answer: rich("Por ahora no. Una billetera, la que conectas; el acceso es por billetera."),
        },
        {
          question: "Otras herramientas no cuestan nada. ¿Por qué pagar?",
          answer: rich(
            "Si te basta con un bot de Telegram o una aplicación móvil, úsalos",
            links.comparison ? rich(": ", links.comparison("nuestra comparativa"), " los repasa") : null,
            ". Tokenping es para alertas por Signal o correo electrónico, en cada mercado de Aave y cada mercado listado de Morpho.",
          ),
        },
      ];
    },

    limitsTitle: "Límites, sin rodeos",
    limits: ({ minutes, paymentChain }) => [
      `Revisiones ${esEveryMinutes(minutes)}, no de forma continua.`,
      "Cada revisión por debajo de tu límite envía otro mensaje: sin opción de posponer ni resumen.",
      "Un límite por mercado, solo para la billetera conectada.",
      `Solo USDC${paymentChain ? ` en la red ${paymentChain}` : ""}: sin tarjetas, sin reembolsos.`,
      "Los correos aún no tienen enlace para darte de baja; eliminar una alerta requiere acceso activo.",
      "Beta: entrega a través de terceros, sin garantía de disponibilidad.",
    ],

    blogTitle: "Del blog",
    allGuides: "Todas las guías de Aave y Morpho",

    closingTitle: "Configura tu alerta del factor de salud en Aave o Morpho",
    closingLead: alertPrice => `${capitalize(alertPrice)}, con pago desde tu billetera. Sin renovación automática.`,
  },
  hi: {
    headline: channels => `${channels} पर Aave और Morpho हेल्थ फ़ैक्टर अलर्ट`,
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `${channels} पर अलर्ट, जब Aave या Morpho पर आपका हेल्थ फ़ैक्टर आपकी सीमा से नीचे हो, ${hiNetworks(networks)} पर, ${hiEveryMinutes(minutes)}।`
        : `${channels} पर अलर्ट, जब Aave या Morpho पर आपका हेल्थ फ़ैक्टर आपकी सीमा से नीचे गिरे, ${hiNetworks(networks)} पर। जाँच ${hiEveryMinutes(minutes)}।`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `अलर्ट सेट करें: ${hiDays(plan.days)} के लिए ${plan.priceLabel}` : "अलर्ट सेट करें"),
    offerDescription: ({ days, currency }) =>
      `${hiDays(days)} के हेल्थ फ़ैक्टर अलर्ट, ${currency} में आपके वॉलेट से भुगतान। अपने आप रिन्यू नहीं होता।`,

    kicker: "Aave V3 और V4, Morpho Blue और Midnight",
    heroLead: ({ minutes, channels }) =>
      `जाँच ${hiEveryMinutes(minutes)}। जब तक आप अपनी सीमा से नीचे हैं, ${channels} पर संदेश। केवल पढ़ने के लिए, कोई अप्रूवल नहीं।`,
    networksLabel: "नेटवर्क",
    heroCoverage: networks => hiNetworks(networks),
    channelsLabel: "अलर्ट इनके ज़रिए:",
    exampleAlertLabel: "अलर्ट में क्या लिखा होता है",
    exampleAlertCaption: subject => `उदाहरण। ईमेल इस विषय के साथ आते हैं: "${subject}"।`,

    dashboardCta: "Aave डैशबोर्ड खोलें",
    morphoDashboardCta: "Morpho डैशबोर्ड खोलें",
    dashboardCtaMicrocopy: alertPrice => `वॉलेट कनेक्ट करें और अपनी हर पोज़िशन देखें। अलर्ट की कीमत ${alertPrice} है।`,

    problemTitle: "हेल्थ फ़ैक्टर आपके सोते समय गिरता है",
    problemLead:
      "Aave आपका हेल्थ फ़ैक्टर दिखाता है, पर अलर्ट नहीं भेजता (अक्टूबर 2026)। रात भर में इसे तीन चीज़ें बदलती हैं:",
    problemCauses: [
      { title: "कीमतें गिरती हैं", body: "ETH गिरता है और आपके कोलैटरल की कीमत घट जाती है।" },
      { title: "ब्याज जुड़ता रहता है", body: "आपका कर्ज़ हर सेकंड बढ़ता है।" },
      { title: "सीमाएँ बदलती हैं", body: "Aave पर गवर्नेंस लिक्विडेशन सीमा घटा सकती है।" },
    ],
    problemEvidence: ({ morning, failedRepays, polygon }) =>
      rich(
        "उधार लेने वाले बताते हैं कि ",
        morning("सुबह उठे तो पोज़िशन लिक्विडेट हो चुकी थी"),
        ", ",
        failedRepays("कर्ज़ चुकाने की ट्रांज़ैक्शन एक घंटे तक फ़ेल होती रहीं"),
        " और ",
        polygon("1.01 पर किया गया भुगतान बहुत देर से पहुँचा"),
        "।",
      ),
    problemLiquidator: guide =>
      rich(
        "ऊपर से लिक्विडेटर को बोनस मिलता है: Ethereum के Core मार्केट में WETH पर 5% (अक्टूबर 2026)।",
        guide && rich(" जानें ", guide("लिक्विडेशन कैसे काम करता है"), "।"),
      ),
    chart: {
      threshold: "आपकी सीमा",
      liquidation: "लिक्विडेशन",
      alertSent: "अलर्ट भेजा गया",
      youCheck: "आप फ़ोन देखते हैं",
      caption: "एक उदाहरण रात। अलर्ट 03:05 पर जाता है, 1.5 से नीचे की पहली जाँच पर, आपके देखने से पाँच घंटे पहले।",
    },

    howItWorksTitle: "यह कैसे काम करता है",
    steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
      const paidOn = paymentChain ? `${paymentChain} नेटवर्क पर ` : "";
      return [
        {
          title: "उस वॉलेट को कनेक्ट करें जिससे आप उधार लेते हैं",
          body: "केवल पढ़ने के लिए। Aave और Morpho, हर एक का अपना पेज।",
        },
        {
          title: plan ? `${plan.priceLabel} में अलर्ट अनलॉक करें` : "एक छोटे USDC भुगतान से अलर्ट अनलॉक करें",
          body: `${plan ? `${hiDays(plan.days)} का एक्सेस, ` : ""}${paidOn}USDC में भुगतान। अपने आप रिन्यू नहीं होता।`,
        },
        {
          title: "हर मार्केट के लिए एक सीमा चुनें",
          body: `${threshold.min} (Morpho पर ${morphoMin}) से ${threshold.max} तक, डिफ़ॉल्ट ${threshold.default}।`,
        },
        {
          title: "जब तक आप उससे नीचे हैं, संदेश पाएँ",
          body: `${capitalize(hiEveryMinutes(minutes))}, ${channels} पर, जब तक आप फिर से अपनी सीमा से ऊपर न आ जाएँ।`,
        },
      ];
    },
    scaleTitle: "अपनी सीमा कहाँ रखें",
    scale: {
      liquidation: "लिक्विडेशन",
      critical: "गंभीर",
      risky: "जोखिम भरा",
      safe: "सुरक्षित",
      defaultThreshold: value => `डिफ़ॉल्ट ${value}`,
      below: value => `${value} से नीचे`,
      between: (from, to) => `${from} से ${to} तक`,
      andAbove: value => `${value} और ऊपर`,
      range: (min, max) => `${min} से ${max} तक कोई भी मान।`,
    },
    scaleGuide: "सीमा कैसे चुनें",

    coverageTitle: "Aave का हर मार्केट और Morpho का हर लिस्टेड मार्केट",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
      `${hiNetworks(v3Networks)} पर Aave V3 के ${hiMarkets(v3Markets)} और ${hiNetworks(v4Networks)} पर Aave V4 के ${hiSpokes(spokes)}, 16 अक्टूबर 2026 तक, साथ में ${hiNetworks(morphoNetworks)} पर Morpho का हर लिस्टेड मार्केट।`,
    coverage: {
      v3Markets: count => `${count} V3 मार्केट`,
      v4Spokes: count => `${count} V4 Spoke`,
      morpho: "Morpho",
    },
    coverageNote:
      "Scroll, ZKsync, Metis, Soneium और Sonic को Aave गवर्नेंस धीरे-धीरे बंद कर रही है, पर उन पर अभी भी नज़र रखी जाती है। इनमें शामिल नहीं: Harmony पर Aave V3, Morpho के बिना लिस्टेड मार्केट और दूसरे प्रोटोकॉल।",

    pricingTitle: "कीमत",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "अलर्ट", detail: capitalize(alertPrice) },
      { term: "रिन्यूअल", detail: "अपने आप नहीं: जब और समय चाहिए, फिर से भुगतान करें" },
      {
        term: "भुगतान",
        detail: paymentChain
          ? `${paymentChain} नेटवर्क पर USDC, आपके वॉलेट से (पहले अप्रूव, फिर भुगतान)`
          : "USDC, आपके वॉलेट से",
      },
    ],
    priceSource: "कीमत भुगतान कॉन्ट्रैक्ट से पढ़ी जाती है और हर घंटे रीफ़्रेश होती है।",
    pricingFootnote: "अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं।",

    questionsTitle: "वॉलेट कनेक्ट करने से पहले पूछने लायक सवाल",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
      const onChain = hiOnChain(paymentChain);
      return [
        {
          question: "क्या Tokenping मेरे फ़ंड छू सकता है?",
          answer: rich(
            `नहीं। Tokenping सिर्फ़ आपकी पोज़िशन पढ़ता है और Aave या Morpho पर कभी अप्रूवल या सिग्नेचर नहीं माँगता। ट्रांज़ैक्शन सिर्फ़ ${onChain} भुगतान की होती हैं: ठीक कीमत जितना अप्रूवल, फिर भुगतान। `,
            links.sourcify
              ? rich(
                  "कॉन्ट्रैक्ट ",
                  links.sourcify("Sourcify पर वेरिफ़ाइड है"),
                  " और उसका ",
                  links.sourceCode("सोर्स कोड सार्वजनिक है"),
                )
              : links.sourceCode("कॉन्ट्रैक्ट का सोर्स कोड सार्वजनिक है"),
            "; टीम का वॉलेट उसकी कीमत बदल सकता है, उसे रोक सकता है और अपग्रेड कर सकता है।",
          ),
        },
        {
          question: "आप कौन सा डेटा रखते हैं?",
          answer: rich(
            "आपके वॉलेट का पता, आपके अलर्ट और वे संपर्क विवरण जो आप देते हैं (ईमेल, Signal यूज़रनेम",
            hasTelegram ? ", Telegram चैट" : "",
            `)। कोई इतिहास नहीं और कोई ट्रैकिंग कुकी नहीं; पेज व्यू गुमनाम रूप से गिने जाते हैं। वे संपर्क विवरण सिर्फ़ वही पढ़ सकता है जो आपके वॉलेट से साइन कर सकता है, पर भुगतान ${onChain} सार्वजनिक होते हैं। पूरी सूची `,
            links.privacy("गोपनीयता पेज"),
            " पर है।",
          ),
        },
        {
          question: "इसकी कीमत क्या है?",
          answer: rich(
            `अलर्ट की कीमत ${alertPrice} है, ${onChain} USDC में, साथ में गैस के लिए थोड़ा ETH। अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अपने आप रिन्यू नहीं होता, कोई रिफ़ंड नहीं।`,
          ),
        },
        {
          question: "Morpho के कौन से लोन कवर होते हैं?",
          answer: rich(
            `Morpho ऐप में लिस्टेड मार्केट के Morpho Blue (वेरिएबल रेट) और Morpho Midnight (फ़िक्स्ड रेट) लोन, ${morphoMin} से शुरू होने वाली सीमाओं के साथ। फ़िक्स्ड रेट लोन को मैच्योरिटी से पहले रिमाइंडर भी मिलते हैं। एक ही प्लान इन सबको कवर करता है: `,
            links.morphoDashboard("Morpho डैशबोर्ड"),
            " खोलें।",
          ),
        },
        {
          question: "अगर कोई अलर्ट न पहुँचे तो?",
          answer: rich(
            `अगली जाँच, ${plural("hi", minutes, { one: "1 मिनट", other: `${minutes} मिनट` })} बाद, फिर कोशिश करती है। डिलीवरी Resend, एक Signal रिले,`,
            hasTelegram ? " Telegram Bot API," : "",
            " सार्वजनिक RPC नोड और Vercel के शेड्यूलर पर निर्भर है, बिना अपटाइम की गारंटी के। दो चैनल चुनें और कदम उठाने की गुंजाइश रखें।",
          ),
        },
        {
          question: "अलर्ट कैसे रोकूँ?",
          answer: rich(
            "जब आपका हेल्थ फ़ैक्टर फिर से आपकी सीमा से ऊपर आ जाता है, या जब आप अलर्ट हटा देते हैं (सक्रिय एक्सेस चाहिए), तब वे रुक जाते हैं। एक्सेस खत्म हो गया? हमें ",
            links.x("X"),
            " पर या हमारी ",
            links.telegramCommunity("Telegram"),
            " या ",
            links.signalCommunity("Signal"),
            " कम्युनिटी में संदेश भेजें।",
            hasTelegram ? " Telegram में /stop भी काम करता है।" : "",
            " अभी न स्नूज़ है और न अनसब्सक्राइब लिंक।",
          ),
        },
        {
          question: "क्या बिना कनेक्ट किए किसी वॉलेट पर नज़र रखी जा सकती है?",
          answer: rich("अभी नहीं। एक वॉलेट, वही जो आप कनेक्ट करते हैं; एक्सेस हर वॉलेट के लिए अलग है।"),
        },
        {
          question: "दूसरे टूल कुछ नहीं लेते। फिर भुगतान क्यों?",
          answer: rich(
            "अगर Telegram बॉट या मोबाइल ऐप आपके लिए काफ़ी है, तो उसे इस्तेमाल करें",
            links.comparison ? rich(": ", links.comparison("हमारी तुलना"), " उन्हें कवर करती है") : null,
            "। Tokenping Signal या ईमेल पर अलर्ट के लिए है, Aave के हर मार्केट और Morpho के हर लिस्टेड मार्केट में।",
          ),
        },
      ];
    },

    limitsTitle: "हदें, साफ़ शब्दों में",
    limits: ({ minutes, paymentChain }) => [
      `जाँच ${hiEveryMinutes(minutes)}, लगातार नहीं।`,
      "आपकी सीमा से नीचे की हर जाँच एक और संदेश भेजती है: न स्नूज़, न डाइजेस्ट।",
      "हर मार्केट के लिए एक सीमा, सिर्फ़ कनेक्ट किए गए वॉलेट के लिए।",
      `${paymentChain ? `${paymentChain} नेटवर्क पर ` : ""}सिर्फ़ USDC: न कार्ड, न रिफ़ंड।`,
      "ईमेल में अभी अनसब्सक्राइब लिंक नहीं है; अलर्ट हटाने के लिए सक्रिय एक्सेस चाहिए।",
      "बीटा: डिलीवरी तीसरे पक्ष के ज़रिए, अपटाइम की कोई गारंटी नहीं।",
    ],

    blogTitle: "ब्लॉग से",
    allGuides: "Aave और Morpho की सभी गाइड",

    closingTitle: "अपना Aave या Morpho हेल्थ फ़ैक्टर अलर्ट सेट करें",
    closingLead: alertPrice => `${capitalize(alertPrice)}, भुगतान आपके वॉलेट से। अपने आप रिन्यू नहीं होता।`,
  },
};
