import { Fragment, type ReactNode, createElement } from "react";
import type { CoverageGridLabels } from "~~/components/home/CoverageGrid";
import type { HealthFactorChartLabels } from "~~/components/home/HealthFactorChart";
import type { ThresholdScaleLabels } from "~~/components/home/ThresholdScale";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The homepage's copy (components/home), both languages. Numbers and names that depend on the deployment (networks,
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
  /** Headline A: "Aave health factor alerts on Signal and email" (channels joined with "and"). */
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
  seeHowItWorks: string;
  /** Names the logo strip for assistive tech; `heroCoverage` reads next to it: "22 networks, 44 markets". */
  networksLabel: string;
  heroCoverage: (input: { networks: number; markets: number }) => string;
  channelsLabel: string;
  exampleAlertLabel: string;
  exampleAlertCaption: (subject: string) => string;

  // The primary action, in the hero and the closing band
  dashboardCta: string;
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
  }) => { title: string; body: string }[];
  scaleTitle: string;
  scale: ThresholdScaleLabels;
  /** Links the safe health factor guide under the scale, while it is published in this language. */
  scaleGuide: string;

  // Coverage
  coverageTitle: string;
  coverageLead: (input: { v3Markets: number; v3Networks: number; spokes: number; v4Networks: number }) => string;
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

export const HOME_MESSAGES: Localized<HomeMessages> = {
  en: {
    headline: channels => `Aave health factor alerts on ${channels}`,
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `${channels} alerts when your Aave V3 or V4 health factor is below your threshold, on ${networks} networks, every ${minutes} minutes. No approvals on Aave.`
        : `${channels} alerts when your Aave V3 or V4 health factor drops below your threshold on ${networks} networks. Checked every ${minutes} minutes. No approvals on Aave.`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `Set up alerts: ${plan.priceLabel} for ${enDays(plan.days)}` : "Set up alerts"),
    offerDescription: ({ days, currency }) =>
      `Health factor alerts for ${days} days, paid in ${currency} from your wallet. No auto-renew.`,

    kicker: "Aave V3 and V4 health factor alerts",
    heroLead: ({ minutes, channels }) =>
      `Checked every ${minutes} minutes. A message on ${channels} while you are below your line. Read-only, no approvals.`,
    seeHowItWorks: "See how it works",
    networksLabel: "Networks",
    heroCoverage: ({ networks, markets }) => `${networks} networks, ${markets} markets`,
    channelsLabel: "Alerts by:",
    exampleAlertLabel: "What an alert says",
    exampleAlertCaption: subject => `Example. Emails arrive with the subject "${subject}".`,

    dashboardCta: "Open the dashboard",
    dashboardCtaMicrocopy: alertPrice => `Connect a wallet, see every position. Alerts cost ${alertPrice}.`,

    problemTitle: "Health factors fall while you sleep",
    problemLead: "Aave shows your health factor but sends no alerts (October 2026). Three things move it overnight:",
    problemCauses: [
      { title: "Prices drop", body: "ETH falls and your collateral is worth less." },
      { title: "Interest accrues", body: "Your debt grows every second." },
      { title: "Thresholds change", body: "Governance can trim a liquidation threshold." },
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
    steps: ({ plan, paymentChain, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` on ${paymentChain}` : "";
      return [
        {
          title: "Connect the wallet you borrow with",
          body: "Read-only. Every market on one page.",
        },
        {
          title: plan ? `Unlock alerts for ${plan.priceLabel}` : "Unlock alerts with a small USDC payment",
          body: `${plan ? `${enDays(plan.days)}, paid` : "Paid"} in USDC${paidOn}. No auto-renew.`,
        },
        {
          title: "Pick a line for each market",
          body: `From ${threshold.min} to ${threshold.max}, default ${threshold.default}.`,
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

    coverageTitle: "Every Aave market, one alert each",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks }) =>
      `${v3Markets} Aave V3 markets on ${v3Networks} networks and ${spokes} Aave V4 Spokes on ${v4Networks} networks, as of 16 October 2026.`,
    coverage: {
      v3Markets: count => (count === 1 ? "1 V3 market" : `${count} V3 markets`),
      v4Spokes: count => (count === 1 ? "1 V4 Spoke" : `${count} V4 Spokes`),
    },
    coverageNote:
      "Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave governance and are still watched. Not covered: Aave V3 on Harmony, and other protocols.",

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
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, links }) => {
      const chainName = paymentChain ?? "the payment network";
      return [
        {
          question: "Can Tokenping touch my funds?",
          answer: rich(
            "No. Tokenping only reads your positions and never asks for an approval or a signature on Aave. The only transactions are the payment on ",
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
            ". Tokenping is for alerts on Signal or email, in every Aave market.",
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
    allGuides: "All Aave health factor and liquidation guides",

    closingTitle: "Set up your Aave health factor alert",
    closingLead: alertPrice => `${capitalize(alertPrice)}, paid from your wallet. No auto-renew.`,
  },
  cs: {
    // The headline is also the page title: the Telegram variant (63 characters with "přes") takes a colon to stay ≤ 60.
    headline: channels => {
      const headline = `Upozornění na Aave health factor přes ${channels}`;
      return headline.length <= 60 ? headline : `Upozornění na Aave health factor: ${channels}`;
    },
    description: ({ channels, networks, minutes, short }) =>
      short
        ? `Upozornění přes ${channels}, když je health factor na Aave V3 či V4 pod prahem (${networks} sítí), kontrola ${csEveryMinutes(minutes)}. Bez schválení na Aave.`
        : `Upozornění přes ${channels}, když health factor na Aave V3 či V4 klesne pod váš práh, na ${networks} sítích. Kontrola ${csEveryMinutes(minutes)}. Bez schválení na Aave.`,
    channelBadge: capitalize,
    pricingCta: plan => (plan ? `Nastavit upozornění: ${csPrice(plan)}` : "Nastavit upozornění"),
    offerDescription: ({ days, currency }) =>
      `Upozornění na health factor ${csForDays(days)}, placená v ${currency} z vaší peněženky. Bez automatického obnovení.`,

    kicker: "Upozornění na health factor v Aave V3 a V4",
    heroLead: ({ minutes, channels }) =>
      `Kontrola ${csEveryMinutes(minutes)}. Zpráva přes ${channels}, dokud jste pod svou hranicí. Jen pro čtení, bez schválení.`,
    seeHowItWorks: "Zjistit, jak to funguje",
    networksLabel: "Sítě",
    heroCoverage: ({ networks, markets }) => `${csNetworks(networks)}, ${csMarkets(markets)}`,
    channelsLabel: "Upozornění přes:",
    exampleAlertLabel: "Co vám upozornění napíše",
    exampleAlertCaption: subject => `Ukázka. E-maily chodí s předmětem „${subject}“.`,

    dashboardCta: "Otevřít přehled",
    dashboardCtaMicrocopy: alertPrice => `Připojte peněženku a uvidíte všechny pozice. Upozornění stojí ${alertPrice}.`,

    problemTitle: "Health factor klesá, i když spíte",
    problemLead: "Aave váš health factor ukazuje, ale upozornění neposílá (říjen 2026). Přes noc s ním hýbou tři věci:",
    problemCauses: [
      { title: "Ceny klesají", body: "ETH spadne a váš kolaterál má nižší hodnotu." },
      { title: "Úrok přibývá", body: "Váš dluh roste každou vteřinu." },
      { title: "Prahy se mění", body: "Governance může snížit likvidační práh." },
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
    steps: ({ plan, paymentChain, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` na síti ${paymentChain}` : "";
      return [
        {
          title: "Připojte peněženku, se kterou si půjčujete",
          body: "Jen pro čtení. Všechny trhy na jedné stránce.",
        },
        {
          title: plan
            ? `Odemkněte upozornění za ${formatDecimal("cs", plan.priceLabel)}`
            : "Odemkněte upozornění malou platbou v USDC",
          body: `${plan ? `${capitalize(csForDays(plan.days))}, platba` : "Platba"} v USDC${paidOn}. Bez automatického obnovení.`,
        },
        {
          title: "Pro každý trh zvolte hranici",
          body: `Od ${formatDecimal("cs", threshold.min)} do ${formatDecimal("cs", threshold.max)}, výchozí ${formatDecimal("cs", threshold.default)}.`,
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

    coverageTitle: "Všechny trhy Aave, každý s vlastním upozorněním",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks }) =>
      `${csMarkets(v3Markets)} Aave V3 ${csOnNetworks(v3Networks)} a ${csMarkets(spokes)} (Spoke) Aave V4 ${csOnNetworks(v4Networks)}, ke 16. říjnu 2026.`,
    coverage: {
      v3Markets: count => `${csMarkets(count)} V3`,
      v4Spokes: count => `${csMarkets(count)} V4 (Spoke)`,
    },
    coverageNote:
      "Trhy na sítích Scroll, ZKsync, Metis, Soneium a Sonic governance Aave postupně ukončuje a dál je hlídáme. Nepokrýváme trh Aave V3 na síti Harmony ani jiné protokoly.",

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
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, links }) => {
      const onChain = csOnChain(paymentChain);
      return [
        {
          question: "Může Tokenping sáhnout na mé prostředky?",
          answer: rich(
            `Ne. Tokenping vaše pozice jen čte a na Aave nikdy nežádá o schválení ani o podpis. Jediné transakce jsou platba ${onChain}: schválení přesně této částky, pak platba. `,
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
            ". Tokenping je pro upozornění přes Signal nebo e-mail, na každém trhu Aave.",
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
    allGuides: "Všichni průvodci health factorem a likvidací na Aave",

    closingTitle: "Nastavte si upozornění na health factor v Aave",
    closingLead: alertPrice => `${capitalize(alertPrice)}, platí se z vaší peněženky. Bez automatického obnovení.`,
  },
};
