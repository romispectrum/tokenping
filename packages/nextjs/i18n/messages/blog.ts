import { formatDecimal, joinList, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The blog around the articles: /blog, a post's header, byline and end area, the article components (ShortAnswer,
// ScopeNote, Callout, AlertPrice, the table regions) and the liquidation price calculator. The articles themselves
// are content/blog/*.mdx and content/blog/cs/*.mdx. Rich text is split into the words around the markup, so each
// language keeps its own word order.

type EndBoxFields = {
  minutes: number;
  networks: number;
  /** The alert channels, already joined for the language ("Signal or email"). */
  channels: string;
  /** formatAlertPrice in the same language. */
  price: string;
  /** The network alerts are paid on; undefined when no target network has a paywall. */
  paymentChain?: string;
};

type BlogMessages = {
  crumbs: { home: string; blog: string };
  index: {
    /** The page title (metadata) and the H1. */
    title: string;
    description: string;
    kicker: string;
    lead: string;
    dashboardCta: string;
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

const csMinutes = (minutes: number) =>
  plural("cs", minutes, {
    one: `${minutes} minuta`,
    few: `${minutes} minuty`,
    many: `${formatDecimal("cs", minutes)} minuty`,
    other: `${minutes} minut`,
  });

/** "každých 5 minut", "každé 2 minuty", "každou minutu". */
const csEveryMinutes = (minutes: number) =>
  plural("cs", minutes, {
    one: "každou minutu",
    few: `každé ${minutes} minuty`,
    many: `každých ${formatDecimal("cs", minutes)} minuty`,
    other: `každých ${minutes} minut`,
  });

/** "na 22 sítích", "na 1 síti". */
const csOnNetworks = (networks: number) =>
  plural("cs", networks, { one: `na ${networks} síti`, other: `na ${networks} sítích` });

/** "na 30 dní", "na 1 den", "na 2 dny", "na 1,5 dne". */
const csForDays = (days: number) =>
  `na ${plural("cs", days, {
    one: `${days} den`,
    few: `${days} dny`,
    many: `${formatDecimal("cs", days)} dne`,
    other: `${days} dní`,
  })}`;

export const BLOG_MESSAGES: Localized<BlogMessages> = {
  en: {
    crumbs: { home: "Home", blog: "Blog" },
    index: {
      title: "Aave health factor and liquidation guides",
      description:
        "Guides to the Aave V3 health factor, liquidation thresholds, liquidation prices and alerts, with worked examples and dated, sourced figures.",
      kicker: "Aave V3 guides",
      lead: "How the Aave V3 health factor works, what happens in a liquidation, how to calculate your liquidation price and how to get warned before it gets close. Every figure in these guides names its source and the date it was checked.",
      dashboardCta: "Open the dashboard",
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
  },
  cs: {
    crumbs: { home: "Domů", blog: "Blog" },
    index: {
      title: "Průvodci health factorem a likvidací na Aave",
      description:
        "Průvodci health factorem na Aave V3, likvidačními prahy, likvidační cenou a upozorněními, s propočítanými příklady a datovanými údaji se zdroji.",
      kicker: "Průvodci Aave V3",
      lead: "Jak funguje health factor na Aave V3, co se děje při likvidaci, jak spočítat likvidační cenu vaší pozice a jak dostat varování dřív, než se k ní cena přiblíží. Každý údaj v těchto průvodcích uvádí svůj zdroj a datum, kdy byl ověřen.",
      dashboardCta: "Otevřít přehled",
      rss: "Odebírat přes RSS",
      startHere: "Začněte tady",
      allGuides: "Všichni průvodci",
      empty: {
        title: "Zatím tu nejsou žádní průvodci",
        description: "České překlady průvodců se připravují. Odebírejte blog přes RSS a dostanete je, jakmile vyjdou.",
        otherLanguage: "Číst průvodce v angličtině",
      },
    },
    post: {
      kicker: "Průvodce Aave V3",
      morphoKicker: "Průvodce Morpho",
      byline: { author: "Napsal tým Tokenpingu", published: "Publikováno", updated: "Aktualizováno" },
      readingTime: minutes => `${csMinutes(minutes)} čtení`,
      readGuide: "Číst průvodce",
      related: "Související průvodci",
    },
    endBox: {
      label: "O Tokenpingu",
      title: "Upozornění na health factor od Tokenpingu",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping kontroluje health factor vaší pozice na Aave V3 a V4 ${csEveryMinutes(minutes)} ${csOnNetworks(networks)} a pošle vám zprávu přes ${channels}, když je pod vaším prahem. Upozornění stojí ${price}${paymentChain ? ` s platbou na síti ${paymentChain}` : ""}; prohlížení pozic nevyžaduje žádnou platbu. Upozornění vám dají čas jednat, likvidaci ale nezabrání.`,
      cta: "Otevřít přehled",
      morpho: {
        title: "Upozornění na health factor na Morpho od Tokenpingu",
        body: ({ minutes, networks, channels, price, paymentChain }) =>
          `Tokenping kontroluje health factor vašich půjček na Morpho Blue a Midnight ${csEveryMinutes(minutes)} ${csOnNetworks(networks)} a pošle vám zprávu přes ${channels}, když je pod vaším prahem; před splatností půjčky s pevnou sazbou vám to připomene. Upozornění stojí ${price}${paymentChain ? ` s platbou na síti ${paymentChain}` : ""}, stejně jako upozornění na Aave; prohlížení pozic nevyžaduje žádnou platbu. Upozornění vám dají čas jednat, likvidaci ale nezabrání.`,
        cta: "Otevřít přehled Morpho",
      },
    },
    alertPrice: {
      fallback: "malý poplatek v USDC (aktuální cenu najdete v přehledu)",
      plan: ({ priceLabel, days }) => `${formatDecimal("cs", priceLabel)} ${csForDays(days)}`,
    },
    callout: { info: "Poznámka", warning: "Varování" },
    shortAnswer: "Stručná odpověď",
    scopeNote: {
      text: "Platí pro Aave V3.7, ověřeno na trzích Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche a Gnosis. Jiné trhy a sítě V3 mohou používat starší verze. Rozdíly u Aave V4 uvádíme tam, kde se pravidla liší.",
      morphoText:
        "Platí pro trhy Morpho Blue a Morpho Midnight uvedené v aplikaci Morpho. Každý trh má vlastní kolaterál, orákulum a LLTV, proto si ověřte údaje toho svého.",
      figuresAsOf: "Údaje k",
    },
    table: {
      fallbackLabel: "Tabulka, posouvá se vodorovně",
      label: (heading, index) => (index === undefined ? `Tabulka: ${heading}` : `Tabulka ${index}: ${heading}`),
      scrollHint: "Posuňte tabulku do strany, abyste viděli všechny sloupce.",
    },
  },
};

// The calculator keeps the app's number format in both languages ("$1,445.78", "1.66", "39.8%"), like the
// dashboard, and its inputs take a dot for decimals; only the words change.

type DebtLoan = { kind: "stable" } | { kind: "volatile"; name: string };

type EModeConflictFields = {
  market: string;
  category: string;
  /** The assets the category can borrow, as a list item array. */
  borrowable: readonly string[];
  loan: DebtLoan;
  thresholdPercent: number;
  /** "Ethereum Core WETH: 83%" entries, the collateral's own thresholds; may be empty. */
  ownThresholds: readonly string[];
};

type PriceMove = {
  name: string;
  /** formatPercent of the move. */
  change: string;
  /** The current price, formatted. */
  now: string;
};

type CalculatorMessages = {
  title: string;
  intro: string;
  examplesLabel: string;
  /** The worked examples' button labels, by example id. */
  examples: Record<"one-collateral" | "two-collaterals" | "volatile-debt", string>;
  defaultCollateralName: (index: number) => string;
  defaultDebtName: string;
  collateralLegend: (index: number) => string;
  presetLabel: string;
  eModeHint: (collateral: readonly string[], borrowable: readonly string[]) => string;
  otherAsset: string;
  /** An optgroup: the market and the day its thresholds were read. */
  presetGroup: (market: string, date: string) => string;
  /** Overrides of a preset's English label (liquidationMath), by preset id. */
  presetLabels: Partial<Record<string, string>>;
  nameLabel: string;
  namePlaceholder: (symbols: readonly string[]) => string;
  amountSupplied: string;
  price: string;
  priceHint: string;
  threshold: string;
  thresholdHint: string;
  removeCollateral: (index: number) => string;
  addCollateral: string;
  debtLegend: string;
  debtKindLegend: string;
  debtKinds: Record<"stable" | "volatile", string>;
  debtAmount: Record<"stable" | "volatile", string>;
  debtAmountHint: string;
  debtPrice: string;
  errors: {
    number: string;
    price: string;
    threshold: string;
    samePrice: (name: string, price: string) => string;
  };
  eModeLead: string;
  eModeConflict: (fields: EModeConflictFields) => string;
  results: {
    heading: string;
    empty: string;
    /** One result line for the screen-reader summary. */
    summaryLine: (title: string, value: string) => string;
    healthFactor: string;
    noDebt: string;
    liquidatableNow: string;
    liquidatableBelow: string;
    none: string;
    priceTitle: (name: string) => string;
    priceTitleBorrowed: (name: string) => string;
    priceTitleShared: (name: string) => string;
    /** The move that brings a liquidatable position back to 1.00; `alike` when supplied and borrowed rows move. */
    recover: (move: PriceMove & { rises: boolean; alike?: boolean }) => string;
    collateralFall: (move: PriceMove) => string;
    collateralNone: (name: string) => string;
    debtRise: (move: PriceMove) => string;
    sharedRise: (move: PriceMove) => string;
    sharedFallBorrowed: (move: PriceMove) => string;
    sharedFallRows: (move: PriceMove) => string;
    bothSidesNeutral: (name: string) => string;
    bothSidesRecover: (name: string) => string;
    bothSidesSafe: (name: string) => string;
    uniformTitle: string;
    uniformDescription: (prices: readonly { name: string; price: string }[]) => string;
    ratioTitle: (numerator: string, denominator: string) => string;
    ratioDescription: (now: string, change: string, falls: boolean) => string;
    breakdown: (fields: { collateral: string; weighted: string; debt: string; healthFactor: string }) => string;
  };
  noscript: string;
  disclaimer: {
    lead: string;
    /** The words before the thresholds' date. */
    beforeDate: string;
    afterDate: string;
  };
};

export const CALCULATOR_MESSAGES: Localized<CalculatorMessages> = {
  en: {
    title: "Aave liquidation price calculator",
    intro:
      "Enter each collateral asset and your debt to get the health factor and the prices at which the position can be liquidated. It uses the Aave V3 formula: Σ(collateral value × liquidation threshold) ÷ debt value.",
    examplesLabel: "Load a worked example:",
    examples: {
      "one-collateral": "10 WETH, 12,000 USDC debt",
      "two-collaterals": "10 WETH + 0.2 WBTC, 20,000 USDC debt",
      "volatile-debt": "10,000 USDC, 2.5 WETH borrowed",
    },
    defaultCollateralName: index => `Collateral ${index}`,
    defaultDebtName: "Debt asset",
    collateralLegend: index => `Collateral ${index}`,
    presetLabel: "Aave V3 asset (fills the threshold)",
    eModeHint: (collateral, borrowable) =>
      `Counts at this threshold for ${joinList("en", collateral)}; other collateral keeps its own. In this E-Mode you can borrow only ${joinList("en", borrowable)}.`,
    otherAsset: "Other asset: enter the threshold yourself",
    presetGroup: (market, date) => `${market} (read ${date})`,
    presetLabels: {},
    nameLabel: "Asset name",
    namePlaceholder: symbols => `e.g. ${symbols.join(" or ")}`,
    amountSupplied: "Amount supplied",
    price: "Price (USD)",
    priceHint: "Aave's oracle price, shown on the asset's page in the Aave app.",
    threshold: "Liquidation threshold (%)",
    thresholdHint: "In E-Mode, the category's threshold. On Aave V4, the collateral factor.",
    removeCollateral: index => `Remove collateral ${index}`,
    addCollateral: "Add a second collateral",
    debtLegend: "Debt",
    debtKindLegend: "What did you borrow?",
    debtKinds: { stable: "A stablecoin (counted at $1.00)", volatile: "A volatile asset, such as WETH" },
    debtAmount: { stable: "Amount borrowed (USD)", volatile: "Amount borrowed (tokens)" },
    debtAmountHint: "Include the interest accrued so far.",
    debtPrice: "Price of the borrowed asset (USD)",
    errors: {
      number: "Enter a number such as 10 or 0.25, with a dot for decimals.",
      price: "Enter a price above 0.",
      threshold: "Enter a percentage above 0 and at most 100.",
      samePrice: (name, price) =>
        `${name} is already entered above at ${price}. Use the same price: one asset has one price.`,
    },
    eModeLead: "No result: Aave does not allow this combination.",
    eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
      const borrowableList = joinList("en", borrowable);
      const loanText = loan.kind === "stable" ? "a stablecoin loan" : `borrowed ${loan.name}`;
      const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
      return (
        `${market}’s “${category}” E-Mode only lets you borrow ${borrowableList}, so an account with ${loanText} ` +
        `cannot use its ${thresholdPercent}% threshold. Pick the collateral’s own threshold instead${own}, or borrow ${borrowableList}.`
      );
    },
    results: {
      heading: "Result",
      empty: "Enter a number in every field to see the result.",
      summaryLine: (title, value) => `${title}: ${value}.`,
      healthFactor: "Health factor",
      noDebt: "No debt, so there is nothing to liquidate.",
      liquidatableNow: "Below 1.00: the position can be liquidated now.",
      liquidatableBelow: "The position can be liquidated below 1.00.",
      none: "None",
      priceTitle: name => `${name} liquidation price`,
      priceTitleBorrowed: name => `${name} liquidation price (borrowed)`,
      priceTitleShared: name => `${name} liquidation price (supplied and borrowed)`,
      recover: ({ name, change, now, rises, alike }) =>
        `The health factor gets back to 1.00 if ${name} ${rises ? "rises" : "falls"} ${change} from ${now}${
          alike ? ", supplied and borrowed alike" : ""
        }, other prices unchanged.`,
      collateralFall: ({ change, now }) => `${change} below ${now}, if every other price stays the same.`,
      collateralNone: name =>
        `Even at $0, ${name} alone cannot take the health factor below 1.00: the other collateral covers the debt.`,
      debtRise: ({ change, now }) =>
        `${change} above ${now}: borrowed assets push the health factor down as they rise.`,
      sharedRise: ({ name, change, now }) =>
        `${change} above ${now}: you borrowed more ${name} than your ${name} collateral counts for, so a rise pushes the health factor down. Other prices unchanged.`,
      sharedFallBorrowed: ({ name, change, now }) =>
        `${change} below ${now}, with the borrowed ${name} at the same price and every other price unchanged.`,
      sharedFallRows: ({ name, change, now }) =>
        `${change} below ${now} for every ${name} row, if every other price stays the same.`,
      bothSidesNeutral: name =>
        `${name} is both your collateral and your debt, so the two move together and its price does not change the health factor. Interest, a threshold change or your own transactions still do.`,
      bothSidesRecover: name =>
        `${name} is on both sides, so the two move together: no ${name} price alone brings the health factor back to 1.00.`,
      bothSidesSafe: name =>
        `${name} is on both sides, so the two move together: its price alone cannot take the health factor below 1.00.`,
      uniformTitle: "All collateral falls together",
      uniformDescription: prices =>
        `If every collateral price falls this much and the debt price does not move, the health factor reaches 1.00: ${prices
          .map(({ name, price }) => `${name} at ${price}`)
          .join(" and ")}.`,
      ratioTitle: (numerator, denominator) => `${numerator} ÷ ${denominator} price at liquidation`,
      ratioDescription: (now, change, falls) =>
        `Now ${now}. If both prices move, a ${change} ${falls ? "fall" : "rise"} in this ratio takes the health factor to 1.00.`,
      breakdown: ({ collateral, weighted, debt, healthFactor }) =>
        `Collateral ${collateral}, counted at its liquidation thresholds: ${weighted}. Health factor = ${weighted} ÷ ${debt} of debt = ${healthFactor}.`,
    },
    noscript:
      "The calculator needs JavaScript to recalculate. The result above is for 10 WETH at $2,400 (liquidation threshold 83%) against 12,000 USDC; the worked examples on this page use the same formula.",
    disclaimer: {
      lead: "Educational estimate, not financial advice.",
      beforeDate:
        "It uses only the numbers you enter. Live Aave parameters can change: the thresholds above were read on-chain on",
      afterDate:
        ", and governance or the Risk Stewards can change them at any time. Oracle prices move, interest keeps adding to your debt, and each liquidation price assumes every other price stays the same. Check your position in the Aave app before you act.",
    },
  },
  cs: {
    title: "Kalkulačka likvidační ceny na Aave",
    intro:
      "Zadejte každé aktivum v kolaterálu a svůj dluh a uvidíte health factor a ceny, při kterých může být pozice zlikvidována. Kalkulačka používá vzorec Aave V3: Σ(hodnota kolaterálu × likvidační práh) ÷ hodnota dluhu.",
    examplesLabel: "Načíst propočítaný příklad:",
    examples: {
      "one-collateral": "10 WETH, dluh 12\u00a0000 USDC",
      "two-collaterals": "10 WETH + 0.2 WBTC, dluh 20\u00a0000 USDC",
      "volatile-debt": "10\u00a0000 USDC, vypůjčeno 2.5 WETH",
    },
    defaultCollateralName: index => `Kolaterál ${index}`,
    defaultDebtName: "Vypůjčené aktivum",
    collateralLegend: index => `Kolaterál ${index}`,
    presetLabel: "Aktivum na Aave V3 (vyplní práh)",
    eModeHint: (collateral, borrowable) =>
      `Tento práh platí pro ${joinList("cs", collateral)}, ostatní kolaterál si ponechá svůj vlastní. V tomto E-Mode si můžete půjčit jen ${joinList("cs", borrowable)}.`,
    otherAsset: "Jiné aktivum: práh zadáte sami",
    presetGroup: (market, date) => `${market} (načteno ${date})`,
    presetLabels: {
      "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (např. WETH, wstETH, weETH)",
      "arbitrum-usdc": "USDC (nativní)",
    },
    nameLabel: "Název aktiva",
    namePlaceholder: symbols => `např. ${symbols.join(" nebo ")}`,
    amountSupplied: "Vložené množství",
    price: "Cena (USD)",
    priceHint: "Cena z orákula Aave, kterou najdete na stránce aktiva v aplikaci Aave.",
    threshold: "Likvidační práh (%)",
    thresholdHint: "V E-Mode práh dané kategorie. Na Aave V4 collateral factor.",
    removeCollateral: index => `Odebrat kolaterál ${index}`,
    addCollateral: "Přidat druhý kolaterál",
    debtLegend: "Dluh",
    debtKindLegend: "Co jste si vypůjčili?",
    debtKinds: { stable: "Stablecoin (počítá se za $1.00)", volatile: "Volatilní aktivum, například WETH" },
    debtAmount: { stable: "Vypůjčená částka (USD)", volatile: "Vypůjčené množství (tokeny)" },
    debtAmountHint: "Včetně dosud naběhlého úroku.",
    debtPrice: "Cena vypůjčeného aktiva (USD)",
    errors: {
      number: "Zadejte číslo, například 10 nebo 0.25. Desetinná místa oddělte tečkou.",
      price: "Zadejte cenu vyšší než 0.",
      threshold: "Zadejte procento vyšší než 0 a nejvýše 100.",
      samePrice: (name, price) =>
        `${name} už je výše zadané za ${price}. Použijte stejnou cenu: jedno aktivum má jednu cenu.`,
    },
    eModeLead: "Bez výsledku: Aave tuto kombinaci nedovoluje.",
    eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
      const borrowableList = joinList("cs", borrowable);
      const loanText = loan.kind === "stable" ? "s vypůjčeným stablecoinem" : `s vypůjčeným ${loan.name}`;
      const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
      return (
        `E-Mode „${category}“ na trhu ${market} dovoluje půjčit si jen ${borrowableList}, takže účet ${loanText} ` +
        `nemůže použít jeho práh ${thresholdPercent}%. Zvolte místo toho vlastní práh kolaterálu${own}, nebo si půjčte ${borrowableList}.`
      );
    },
    results: {
      heading: "Výsledek",
      empty: "Pro výsledek zadejte číslo do každého pole.",
      summaryLine: (title, value) => `${title}: ${value}.`,
      healthFactor: "Health factor",
      noDebt: "Žádný dluh, takže není co likvidovat.",
      liquidatableNow: "Pod 1.00: pozici lze zlikvidovat už teď.",
      liquidatableBelow: "Pozici lze zlikvidovat pod 1.00.",
      none: "Žádná",
      priceTitle: name => `Likvidační cena ${name}`,
      priceTitleBorrowed: name => `Likvidační cena ${name} (vypůjčeno)`,
      priceTitleShared: name => `Likvidační cena ${name} (vloženo i vypůjčeno)`,
      recover: ({ name, change, now, rises, alike }) =>
        `Health factor se vrátí na 1.00, pokud cena ${name}${alike ? " (vloženého i vypůjčeného)" : ""} ${
          rises ? "vzroste" : "klesne"
        } o ${change} z ${now} a ostatní ceny se nezmění.`,
      collateralFall: ({ change, now }) => `O ${change} pod ${now}, pokud všechny ostatní ceny zůstanou stejné.`,
      collateralNone: name =>
        `Ani při ceně $0 samotné ${name} nesrazí health factor pod 1.00: dluh pokryje ostatní kolaterál.`,
      debtRise: ({ change, now }) =>
        `O ${change} nad ${now}: vypůjčená aktiva tlačí health factor dolů, když jejich cena roste.`,
      sharedRise: ({ name, change, now }) =>
        `O ${change} nad ${now}: vypůjčili jste si víc ${name}, než kolik se započítá z vašeho kolaterálu ${name}, takže růst ceny tlačí health factor dolů. Ostatní ceny se nemění.`,
      sharedFallBorrowed: ({ name, change, now }) =>
        `O ${change} pod ${now}, při stejné ceně vypůjčeného ${name} a beze změny všech ostatních cen.`,
      sharedFallRows: ({ name, change, now }) =>
        `O ${change} pod ${now} pro každý řádek ${name}, pokud všechny ostatní ceny zůstanou stejné.`,
      bothSidesNeutral: name =>
        `${name} je zároveň vaším kolaterálem i dluhem, takže se obojí hýbe spolu a jeho cena health factor nemění. Úrok, změna prahu nebo vaše vlastní transakce ho ale změnit mohou.`,
      bothSidesRecover: name =>
        `${name} je na obou stranách, takže se obojí hýbe spolu: žádná cena ${name} sama nevrátí health factor na 1.00.`,
      bothSidesSafe: name =>
        `${name} je na obou stranách, takže se obojí hýbe spolu: jeho cena sama nesrazí health factor pod 1.00.`,
      uniformTitle: "Celý kolaterál klesne najednou",
      uniformDescription: prices =>
        `Pokud cena každého kolaterálu klesne o tolik a cena dluhu se nezmění, health factor dosáhne 1.00: ${prices
          .map(({ name, price }) => `${name} za ${price}`)
          .join(" a ")}.`,
      ratioTitle: (numerator, denominator) => `Poměr cen ${numerator} ÷ ${denominator} při likvidaci`,
      ratioDescription: (now, change, falls) =>
        `Teď ${now}. Pokud se pohnou obě ceny, ${falls ? "pokles" : "růst"} tohoto poměru o ${change} dostane health factor na 1.00.`,
      breakdown: ({ collateral, weighted, debt, healthFactor }) =>
        `Kolaterál ${collateral}, započtený podle likvidačních prahů: ${weighted}. Health factor = ${weighted} ÷ ${debt} dluhu = ${healthFactor}.`,
    },
    noscript:
      "Kalkulačka potřebuje k přepočítání JavaScript. Výsledek výše platí pro 10 WETH za $2,400 (likvidační práh 83%) proti dluhu 12\u00a0000 USDC. Propočítané příklady na této stránce používají stejný vzorec.",
    disclaimer: {
      lead: "Vzdělávací odhad, nikoli finanční poradenství.",
      beforeDate:
        "Vychází jen z čísel, která zadáte. Živé parametry Aave se mohou měnit: prahy výše byly načteny z blockchainu",
      afterDate:
        " a governance nebo Risk Stewards je mohou kdykoli změnit. Ceny z orákula se hýbou, k dluhu stále přibývá úrok a každá likvidační cena předpokládá, že ostatní ceny zůstanou stejné. Než začnete jednat, zkontrolujte svou pozici v aplikaci Aave.",
    },
  },
};
