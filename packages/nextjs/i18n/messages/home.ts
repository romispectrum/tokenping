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
// purpose: each section says one thing next to its visual; the guides and the privacy page carry the detail.

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
  /** Names the logo strip for assistive tech and reads next to it: "22 networks, 44 markets". */
  networksLabel: string;
  heroCoverage: (input: { networks: number; markets: number }) => string;
  channelsLabel: string;
  exampleAlertLabel: string;
  exampleAlertCaption: (subject: string) => string;

  // The primary action, in the hero and the closing band
  dashboardCta: string;
  dashboardCtaMicrocopy: (networks: number) => string;

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
  pricingFootnote: (paymentChain: string | undefined) => string;

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
  closingLead: (networks: number) => string;
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
      `Read-only, no minimum size. Every ${minutes} minutes we check your health factor and message you on ${channels} whenever it is below the line you set.`,
    seeHowItWorks: "See how it works",
    networksLabel: "Networks",
    heroCoverage: ({ networks, markets }) => `${networks} networks, ${markets} markets`,
    channelsLabel: "Alerts by:",
    exampleAlertLabel: "What an alert says",
    exampleAlertCaption: subject =>
      `Example only: the network, numbers and time are made up. Emails arrive with the subject "${subject}".`,

    dashboardCta: "Open the free dashboard",
    dashboardCtaMicrocopy: networks =>
      `Connect a wallet to see your Aave V3 and V4 health factors on ${networks} networks. Viewing is read-only.`,

    problemTitle: "Health factors fall while you sleep",
    problemLead:
      "Aave shows your health factor in its app but, as of October 2026, sends no alerts. Three things move it while you're away:",
    problemCauses: [
      { title: "Prices drop", body: "ETH falls overnight and your collateral is worth less." },
      { title: "Interest accrues", body: "Your debt grows every second, even while prices hold." },
      { title: "Thresholds change", body: "A governance update can trim a liquidation threshold." },
    ],
    problemEvidence: ({ morning, failedRepays, polygon }) =>
      rich(
        "On Aave's forum, borrowers describe ",
        morning("checking in the morning to find the position liquidated again"),
        " and ",
        failedRepays("an hour of repay transactions that kept failing until the position was liquidated"),
        "; on the Polygon forum (2021), one borrower ",
        polygon("tried to repay at a health factor of 1.01"),
        " and was liquidated first.",
      ),
    problemLiquidator: guide =>
      rich(
        "A liquidator then takes collateral worth the repaid debt plus a bonus: 5% on WETH in the Ethereum Core market as of October 2026.",
        guide && rich(" The rules: ", guide("how an Aave liquidation works"), "."),
      ),
    chart: {
      threshold: "your threshold",
      liquidation: "liquidation",
      alertSent: "Alert sent",
      youCheck: "You check your phone",
      caption:
        "An example night, numbers made up: the alert goes out at 03:05, the first check that finds the health factor below 1.5, five hours before you look.",
    },

    howItWorksTitle: "How it works",
    steps: ({ plan, paymentChain, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` on ${paymentChain}` : "";
      return [
        {
          title: "Connect the wallet you borrow with",
          body: "Read-only and free. The dashboard shows its collateral, debt and health factor in every market.",
        },
        {
          title: plan ? `Unlock alerts for ${plan.priceLabel}` : "Unlock alerts with a small USDC payment",
          body: `${plan ? `${enDays(plan.days)}, paid` : "Paid"} in USDC${paidOn}: an approval for exactly the price, then the payment. No auto-renew.`,
        },
        {
          title: "Pick a line for each market",
          body: `From ${threshold.min} to ${threshold.max}, default ${threshold.default}. Each V3 market and each V4 Spoke is its own alert.`,
        },
        {
          title: "Get a message while you're below it",
          body: `Every ${minutes} minutes, on ${channels}, until your health factor is back at or above your line or you delete the alert.`,
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
      range: (min, max) => `Any value from ${min} to ${max}. The dashboard's badges use the same zones.`,
    },
    scaleGuide: "How to choose a threshold",

    coverageTitle: "Every Aave market, one alert each",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks }) =>
      `Aave V3: ${v3Markets} markets on ${v3Networks} networks. Aave V4: ${spokes} Spokes on ${v4Networks} networks. From Aave's address book and V4 API, 16 October 2026.`,
    coverage: {
      v3Markets: count => (count === 1 ? "1 V3 market" : `${count} V3 markets`),
      v4Spokes: count => (count === 1 ? "1 V4 Spoke" : `${count} V4 Spokes`),
    },
    coverageNote:
      "Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave governance; open positions there are still watched. Not covered: Aave V3 on Harmony, frozen since 2022, and other protocols.",

    pricingTitle: "Pricing",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Dashboard", detail: "Free" },
      { term: "Alerts", detail: capitalize(alertPrice) },
      { term: "Renewal", detail: "None automatic: you pay again when you want more time" },
      {
        term: "Payment",
        detail: paymentChain
          ? `USDC on ${paymentChain}, from your wallet (approve, then pay)`
          : "USDC, from your wallet",
      },
    ],
    priceSource: "The price is read from the payment contract and refreshed hourly.",
    pricingFootnote: paymentChain => `Paid in USDC${paymentChain ? ` on ${paymentChain}` : ""}. No auto-renew.`,

    questionsTitle: "Questions to ask before you connect a wallet",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, links }) => {
      const chainName = paymentChain ?? "the payment network";
      return [
        {
          question: "Can Tokenping touch my funds?",
          answer: rich(
            "No. Positions are read with read-only calls, and Tokenping never asks for an approval or a signature on Aave. The only transactions are the payment for alerts on ",
            chainName,
            ": an approval for exactly the price, then the payment. The contract",
            links.sourcify && rich(" ", "is ", links.sourcify("verified on Sourcify"), " and its"),
            " ",
            links.sourceCode("source code is public"),
            "; the Tokenping team's wallet can change its price, pause it, withdraw payments and upgrade it.",
          ),
        },
        {
          question: "What do you store?",
          answer: rich(
            "Your wallet address, your alerts (market, line, channels) and the contact details you give: email, Signal username",
            hasTelegram ? ", Telegram chat" : "",
            ". No health factor history, no alert log, no analytics. Your address goes to RPC providers to read positions, and payments are public on ",
            chainName,
            ". Until wallet signatures are checked, anyone who knows your address can read the contact details saved for it. The ",
            links.privacy("privacy page"),
            " has the full list.",
          ),
        },
        {
          question: "What does it cost?",
          answer: rich(
            "The dashboard is free. Alerts cost ",
            alertPrice,
            ", in USDC on ",
            chainName,
            " (plus a little ETH for gas), whatever network your position is on. No auto-renew and no refunds; paying again extends your access.",
          ),
        },
        {
          question: "What if an alert doesn't arrive?",
          answer: rich(
            "The next check, ",
            minutes,
            " minutes later, tries again while you're below your line. Delivery relies on Resend, a Signal relay,",
            hasTelegram ? " the Telegram Bot API," : "",
            " public RPC nodes and Vercel's scheduler, and Tokenping is in beta with no uptime guarantee. Pick two channels and leave room to act.",
          ),
        },
        {
          question: "How do I stop the alerts?",
          answer: rich(
            "They stop when your health factor is back at or above your line, or when you delete the alert, which needs active access. If your access has expired, message us on ",
            links.x("X"),
            " or in our ",
            links.telegramCommunity("Telegram community"),
            ".",
            hasTelegram ? " In Telegram, /stop to the bot also works." : "",
            " No snooze and no unsubscribe link in the emails yet.",
          ),
        },
        {
          question: "Can I watch a wallet I don't connect?",
          answer: rich("Not today. Tokenping watches the wallet you connect, and access is per paying wallet."),
        },
        {
          question: "Other tools are free. Why pay?",
          answer: rich(
            "If a Telegram bot or a mobile app suits you, free tools exist",
            links.comparison
              ? rich(": ", links.comparison("our comparison"), " covers them, including where they beat Tokenping")
              : null,
            ". Tokenping is for alerts on Signal or email, in every Aave market.",
          ),
        },
      ];
    },

    limitsTitle: "Limits, stated plainly",
    limits: ({ minutes, paymentChain }) => [
      `Checks every ${minutes} minutes, not in real time: a fast drop can cross 1.0 between two checks.`,
      "Every check below your line sends another message: no snooze, digest or recovery message.",
      "One line per market, for the connected wallet only: no watch-only addresses or portfolio-wide alerts.",
      `USDC${paymentChain ? ` on ${paymentChain}` : ""} only: no card payments and no refunds.`,
      "Emails have no unsubscribe link yet, and deleting an alert needs active access.",
      "Beta: delivery depends on third-party services, with no uptime guarantee.",
    ],

    blogTitle: "From the blog",
    allGuides: "All Aave health factor and liquidation guides",

    closingTitle: "Check your Aave V3 and V4 health factor, free",
    closingLead: networks =>
      `The dashboard shows collateral, debt and health factor for the wallet you connect on all ${networks} networks. Alerts are optional and paid.`,
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
      `Jen pro čtení, bez minimální velikosti. ${capitalize(csEveryMinutes(minutes))} zkontrolujeme váš health factor a pokaždé, když je pod hranicí, kterou si nastavíte, vám napíšeme přes ${channels}.`,
    seeHowItWorks: "Zjistit, jak to funguje",
    networksLabel: "Sítě",
    heroCoverage: ({ networks, markets }) => `${csNetworks(networks)}, ${csMarkets(markets)}`,
    channelsLabel: "Upozornění přes:",
    exampleAlertLabel: "Co vám upozornění napíše",
    exampleAlertCaption: subject =>
      `Jen ukázka: síť, čísla i čas jsou smyšlené. E-maily chodí s předmětem „${subject}“.`,

    dashboardCta: "Otevřít přehled zdarma",
    dashboardCtaMicrocopy: networks =>
      `Připojte peněženku a uvidíte svůj health factor na Aave V3 a V4 napříč ${networks} sítěmi. Zobrazení je jen pro čtení.`,

    problemTitle: "Health factor klesá, i když spíte",
    problemLead:
      "Aave ukazuje váš health factor ve své aplikaci, ale k říjnu 2026 žádná upozornění neposílá. Zatímco jste pryč, hýbou s ním tři věci:",
    problemCauses: [
      { title: "Ceny klesají", body: "ETH přes noc spadne a váš kolaterál má nižší hodnotu." },
      { title: "Úrok přibývá", body: "Váš dluh roste každou vteřinu, i když ceny stojí." },
      { title: "Prahy se mění", body: "Změna schválená v governance může snížit likvidační práh." },
    ],
    problemEvidence: ({ morning, failedRepays, polygon }) =>
      rich(
        "Na fóru Aave dlužníci popisují, ",
        morning("jak ráno zjistili, že jejich pozice byla znovu zlikvidována"),
        ", i ",
        failedRepays("hodinu transakcí na splacení, které selhávaly, dokud pozice nebyla zlikvidována"),
        "; na fóru Polygonu (2021) se jeden ",
        polygon("pokusil splatit dluh při health factoru 1,01"),
        " a likvidace byla rychlejší.",
      ),
    problemLiquidator: guide =>
      rich(
        "Likvidátor pak převezme kolaterál v hodnotě splaceného dluhu plus bonus: k říjnu 2026 je to 5 % u WETH na trhu Core na Ethereu.",
        guide && rich(" Pravidla: ", guide("jak funguje likvidace na Aave"), "."),
      ),
    chart: {
      threshold: "váš práh",
      liquidation: "likvidace",
      alertSent: "Upozornění odesláno",
      youCheck: "Podíváte se do telefonu",
      caption:
        "Ukázková noc se smyšlenými čísly: upozornění odchází ve 3:05, při první kontrole, která najde health factor pod 1,5, pět hodin předtím, než se podíváte.",
    },

    howItWorksTitle: "Jak to funguje",
    steps: ({ plan, paymentChain, minutes, channels, threshold }) => {
      const paidOn = paymentChain ? ` na síti ${paymentChain}` : "";
      return [
        {
          title: "Připojte peněženku, se kterou si půjčujete",
          body: "Jen pro čtení a zdarma. Přehled ukáže její kolaterál, dluh a health factor na každém trhu.",
        },
        {
          title: plan
            ? `Odemkněte upozornění za ${formatDecimal("cs", plan.priceLabel)}`
            : "Odemkněte upozornění malou platbou v USDC",
          body: `${plan ? `${capitalize(csForDays(plan.days))}, platba` : "Platba"} v USDC${paidOn}: schválení přesně této částky, pak platba. Bez automatického obnovení.`,
        },
        {
          title: "Pro každý trh zvolte hranici",
          body: `Od ${formatDecimal("cs", threshold.min)} do ${formatDecimal("cs", threshold.max)}, výchozí ${formatDecimal("cs", threshold.default)}. Každý trh V3 i každý Spoke V4 má vlastní upozornění.`,
        },
        {
          title: "Dostávejte zprávy, dokud jste pod ní",
          body: `${capitalize(csEveryMinutes(minutes))}, přes ${channels}, dokud se health factor nevrátí na hranici nebo nad ni, nebo dokud upozornění nesmažete.`,
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
      range: (min, max) => `Libovolná hodnota od ${min} do ${max}. Štítky v přehledu používají stejná pásma.`,
    },
    scaleGuide: "Jak zvolit práh",

    coverageTitle: "Všechny trhy Aave, každý s vlastním upozorněním",
    coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks }) =>
      `Aave V3: ${csMarkets(v3Markets)} ${csOnNetworks(v3Networks)}. Aave V4: ${csMarkets(spokes)} (Spoke) ${csOnNetworks(v4Networks)}. Podle Aave Address Book a API Aave V4 ke 16. říjnu 2026.`,
    coverage: {
      v3Markets: count => `${csMarkets(count)} V3`,
      v4Spokes: count => `${csMarkets(count)} V4 (Spoke)`,
    },
    coverageNote:
      "Trhy na sítích Scroll, ZKsync, Metis, Soneium a Sonic governance Aave postupně ukončuje; otevřené pozice tam dál hlídáme. Nepokrýváme trh Aave V3 na síti Harmony, zamrzlý od roku 2022, ani jiné protokoly.",

    pricingTitle: "Ceník",
    pricingRows: ({ alertPrice, paymentChain }) => [
      { term: "Přehled", detail: "Zdarma" },
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
    pricingFootnote: paymentChain =>
      `Platba v USDC${paymentChain ? ` na síti ${paymentChain}` : ""}. Bez automatického obnovení.`,

    questionsTitle: "Na co se zeptat, než připojíte peněženku",
    questions: ({ alertPrice, paymentChain, hasTelegram, minutes, links }) => {
      const onChain = csOnChain(paymentChain);
      return [
        {
          question: "Může Tokenping sáhnout na mé prostředky?",
          answer: rich(
            `Ne. Pozice čteme voláními jen pro čtení a na Aave nikdy nežádáme o schválení ani o podpis. Jediné transakce jsou platba za upozornění ${onChain}: schválení přesně této částky, pak platba. `,
            links.sourcify
              ? rich(
                  "Kontrakt je ",
                  links.sourcify("ověřený na Sourcify"),
                  " a jeho ",
                  links.sourceCode("zdrojový kód je veřejný"),
                )
              : links.sourceCode("Zdrojový kód kontraktu je veřejný"),
            "; peněženka týmu Tokenping mu může změnit cenu, pozastavit ho, vybrat platby a upgradovat ho.",
          ),
        },
        {
          question: "Co ukládáte?",
          answer: rich(
            "Adresu vaší peněženky, vaše upozornění (trh, hranici, kanály) a kontakty, které zadáte: e-mail, jméno na Signalu",
            hasTelegram ? ", chat na Telegramu" : "",
            `. Žádnou historii health factoru, žádný záznam upozornění, žádnou analytiku. Adresa jde poskytovatelům RPC kvůli načtení pozic a platby jsou ${onChain} veřejné. Dokud neověřujeme podpisy peněženky, může si kontakty uložené k adrese zobrazit kdokoli, kdo ji zná. Úplný seznam má `,
            links.privacy("stránka o ochraně soukromí"),
            ".",
          ),
        },
        {
          question: "Kolik to stojí?",
          answer: rich(
            `Přehled je zdarma. Upozornění stojí ${alertPrice}, v USDC ${onChain} (plus trochu ETH na gas), ať je vaše pozice na kterékoli síti. Bez automatického obnovení a bez vracení peněz; další platba přístup prodlouží.`,
          ),
        },
        {
          question: "Co když upozornění nedorazí?",
          answer: rich(
            `Další kontrola o ${plural("cs", minutes, { one: "minutu", few: `${minutes} minuty`, other: `${minutes} minut` })} později to zkusí znovu, pokud jste stále pod hranicí. Doručení závisí na Resendu, relayi pro Signal, `,
            hasTelegram ? "Telegram Bot API, " : "",
            "veřejných RPC uzlech a plánovači Vercelu a Tokenping je v betě bez záruky dostupnosti. Zvolte dva kanály a nechte si rezervu na reakci.",
          ),
        },
        {
          question: "Jak upozornění zastavím?",
          answer: rich(
            "Přestanou, když se health factor vrátí na hranici nebo nad ni, nebo když upozornění smažete, k čemuž potřebujete aktivní přístup. Pokud přístup vypršel, napište nám na ",
            links.x("X"),
            " nebo do naší ",
            links.telegramCommunity("komunity na Telegramu"),
            ".",
            hasTelegram ? " V Telegramu stačí poslat botovi /stop." : "",
            " Odložení ani odkaz pro odhlášení v e-mailech zatím nejsou.",
          ),
        },
        {
          question: "Můžu sledovat peněženku, kterou nepřipojím?",
          answer: rich(
            "Zatím ne. Tokenping hlídá peněženku, kterou připojíte, a přístup platí pro každou platící peněženku zvlášť.",
          ),
        },
        {
          question: "Jiné nástroje jsou zdarma. Proč platit?",
          answer: rich(
            "Pokud vám vyhovuje bot na Telegramu nebo mobilní aplikace, bezplatné nástroje existují",
            links.comparison
              ? rich(
                  ": popisuje je naše ",
                  links.comparison("srovnání"),
                  ", včetně toho, v čem jsou lepší než Tokenping",
                )
              : null,
            ". Tokenping je pro upozornění přes Signal nebo e-mail, na každém trhu Aave.",
          ),
        },
      ];
    },

    limitsTitle: "Omezení bez příkras",
    limits: ({ minutes, paymentChain }) => [
      `Kontroly ${csEveryMinutes(minutes)}, ne v reálném čase: při rychlém propadu může health factor klesnout pod 1,0 mezi dvěma kontrolami.`,
      "Každá kontrola pod hranicí pošle další zprávu: bez odložení, souhrnu i zprávy o návratu nad práh.",
      "Jedna hranice na trh, jen pro připojenou peněženku: žádné adresy jen ke sledování ani upozornění na celé portfolio.",
      `Jen USDC${paymentChain ? ` na síti ${paymentChain}` : ""}: bez platby kartou a bez vracení peněz.`,
      "E-maily zatím nemají odkaz pro odhlášení a smazání upozornění vyžaduje aktivní přístup.",
      "Beta: doručení závisí na službách třetích stran a dostupnost není zaručená.",
    ],

    blogTitle: "Z blogu",
    allGuides: "Všichni průvodci health factorem a likvidací na Aave",

    closingTitle: "Zkontrolujte svůj health factor na Aave V3 a V4 zdarma",
    closingLead: networks =>
      `Přehled ukáže kolaterál, dluh a health factor připojené peněženky na všech ${networks} sítích. Upozornění jsou volitelná a placená.`,
  },
};
