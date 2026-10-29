import { formatDecimal, joinList, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The blog around the articles: /blog, a post's header, byline and end area, the article components (ShortAnswer,
// ScopeNote, Callout, AlertPrice, the table regions) and the liquidation price calculator. The articles themselves
// are content/blog/*.mdx, content/blog/cs/*.mdx and content/blog/es/*.mdx. Rich text is split into the words around
// the markup, so each language keeps its own word order.

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

/** "cada 5 minutos", "cada minuto". */
const esEveryMinutes = (minutes: number) =>
  plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });

/** "en 22 redes", "en 1 red". */
const esOnNetworks = (networks: number) =>
  plural("es", networks, { one: `en ${networks} red`, other: `en ${networks} redes` });

/** "हर 5 मिनट में", "हर मिनट". */
const hiEveryMinutes = (minutes: number) => plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट में` });

/** "22 नेटवर्क पर", "1 नेटवर्क पर": the noun does not change with the count. */
const hiOnNetworks = (networks: number) => `${networks} नेटवर्क पर`;

export const BLOG_MESSAGES: Localized<BlogMessages> = {
  en: {
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
  },
  cs: {
    crumbs: { home: "Domů", blog: "Blog" },
    index: {
      title: "Průvodci health factorem a likvidací na Aave a Morpho",
      description:
        "Průvodci health factorem na Aave a Morpho, likvidacemi, likvidační cenou a upozorněními, s propočítanými příklady a datovanými údaji se zdroji.",
      kicker: "Průvodci Aave a Morpho",
      lead: "Jak funguje health factor na Aave a na Morpho, co se děje při likvidaci, jak spočítat likvidační cenu vaší pozice a jak dostat varování dřív, než se k ní cena přiblíží. Každý údaj v těchto průvodcích uvádí svůj zdroj a datum, kdy byl ověřen.",
      dashboardCta: "Otevřít přehled Aave",
      morphoDashboardCta: "Otevřít přehled Morpho",
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
  es: {
    crumbs: { home: "Inicio", blog: "Blog" },
    index: {
      title: "Guías del factor de salud y la liquidación en Aave y Morpho",
      description:
        "Guías sobre el factor de salud en Aave y Morpho, liquidaciones, precios de liquidación y alertas, con ejemplos resueltos y cifras con fecha y fuente.",
      kicker: "Guías de Aave y Morpho",
      lead: "Cómo funciona el factor de salud en Aave y en Morpho, qué pasa en una liquidación, cómo calcular tu precio de liquidación y cómo recibir un aviso antes de que el precio se acerque a ese nivel. Cada cifra de estas guías indica su fuente y la fecha en que se verificó.",
      dashboardCta: "Abrir el panel de Aave",
      morphoDashboardCta: "Abrir el panel de Morpho",
      rss: "Suscribirse por RSS",
      startHere: "Empieza aquí",
      allGuides: "Todas las guías",
      empty: {
        title: "Aún no hay guías",
        description: "Estamos preparando las guías en español. Suscríbete por RSS para recibirlas cuando se publiquen.",
        otherLanguage: "Leer las guías en inglés",
      },
    },
    post: {
      kicker: "Guía de Aave V3",
      morphoKicker: "Guía de Morpho",
      byline: { author: "Por el equipo de Tokenping", published: "Publicado", updated: "Actualizado" },
      readingTime: minutes => `${minutes} min de lectura`,
      readGuide: "Leer la guía",
      related: "Guías relacionadas",
    },
    endBox: {
      label: "Sobre Tokenping",
      title: "Alertas del factor de salud con Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping revisa el factor de salud de tus posiciones en Aave V3 y V4 ${esEveryMinutes(minutes)} ${esOnNetworks(networks)} y te envía un mensaje por ${channels} cuando está por debajo de tu umbral. Las alertas cuestan ${price}${paymentChain ? `, con pago en la red ${paymentChain}` : ""}; ver tus posiciones no requiere pago. Las alertas te dan tiempo para actuar, pero no evitan la liquidación.`,
      cta: "Abrir el panel",
      morpho: {
        title: "Alertas del factor de salud en Morpho con Tokenping",
        body: ({ minutes, networks, channels, price, paymentChain }) =>
          `Tokenping revisa el factor de salud de tus préstamos en Morpho Blue y Midnight ${esEveryMinutes(minutes)} ${esOnNetworks(networks)} y te envía un mensaje por ${channels} cuando está por debajo de tu umbral, con recordatorios antes de que venza un préstamo a tasa fija. Las alertas cuestan ${price}${paymentChain ? `, con pago en la red ${paymentChain}` : ""}, el mismo plan que las alertas de Aave; ver tus posiciones no requiere pago. Las alertas te dan tiempo para actuar, pero no evitan la liquidación.`,
        cta: "Abrir el panel de Morpho",
      },
    },
    alertPrice: {
      fallback: "una pequeña tarifa en USDC (consulta el precio actual en el panel)",
      plan: ({ priceLabel, days }) => `${priceLabel} por ${plural("es", days, { one: "día", other: `${days} días` })}`,
    },
    callout: { info: "Nota", warning: "Advertencia" },
    shortAnswer: "Respuesta breve",
    scopeNote: {
      text: "Se aplica a Aave V3.7 y se verificó en los mercados Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche y Gnosis. Otros mercados y redes de V3 pueden usar versiones anteriores. Las diferencias de Aave V4 se indican donde las reglas no son las mismas.",
      morphoText:
        "Se aplica a los mercados de Morpho Blue y Morpho Midnight que figuran en la aplicación de Morpho. Cada mercado define su propio colateral, oráculo y LLTV, así que revisa las cifras del tuyo.",
      figuresAsOf: "Cifras consultadas el",
    },
    table: {
      fallbackLabel: "Tabla, se desplaza en horizontal",
      label: (heading, index) => (index === undefined ? `Tabla: ${heading}` : `Tabla ${index}: ${heading}`),
      scrollHint: "Desplázate hacia los lados para ver todas las columnas.",
    },
  },
  hi: {
    crumbs: { home: "होम", blog: "ब्लॉग" },
    index: {
      title: "Aave और Morpho हेल्थ फ़ैक्टर और लिक्विडेशन गाइड",
      description:
        "Aave और Morpho के हेल्थ फ़ैक्टर, लिक्विडेशन, लिक्विडेशन कीमत और अलर्ट पर गाइड, हल किए गए उदाहरणों और तारीख़ व स्रोत वाले आंकड़ों के साथ।",
      kicker: "Aave और Morpho गाइड",
      lead: "Aave और Morpho पर हेल्थ फ़ैक्टर कैसे काम करता है, लिक्विडेशन में क्या होता है, अपनी लिक्विडेशन कीमत कैसे निकालें और कीमत उसके पास आने से पहले चेतावनी कैसे पाएं। इन गाइड का हर आंकड़ा अपना स्रोत और जांच की तारीख़ बताता है।",
      dashboardCta: "Aave डैशबोर्ड खोलें",
      morphoDashboardCta: "Morpho डैशबोर्ड खोलें",
      rss: "RSS से सब्सक्राइब करें",
      startHere: "यहां से शुरू करें",
      allGuides: "सभी गाइड",
      empty: {
        title: "अभी कोई गाइड नहीं",
        description: "हिंदी गाइड तैयार की जा रही हैं। RSS से सब्सक्राइब करें और प्रकाशित होते ही उन्हें पाएं।",
        otherLanguage: "गाइड अंग्रेज़ी में पढ़ें",
      },
    },
    post: {
      kicker: "Aave V3 गाइड",
      morphoKicker: "Morpho गाइड",
      byline: { author: "Tokenping टीम द्वारा", published: "प्रकाशित", updated: "अपडेट किया गया" },
      readingTime: minutes => `${minutes} मिनट में पढ़ें`,
      readGuide: "गाइड पढ़ें",
      related: "संबंधित गाइड",
    },
    endBox: {
      label: "Tokenping के बारे में",
      title: "Tokenping से हेल्थ फ़ैक्टर अलर्ट",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping ${hiOnNetworks(networks)} ${hiEveryMinutes(minutes)} आपका Aave V3 और V4 हेल्थ फ़ैक्टर जांचता है और जब वह आपकी सीमा से नीचे होता है तो आपको ${channels} पर संदेश भेजता है। अलर्ट की कीमत ${price} है${paymentChain ? `, भुगतान ${paymentChain} नेटवर्क पर` : ""}; अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अलर्ट आपको कार्रवाई करने का समय देते हैं; वे लिक्विडेशन नहीं रोकते।`,
      cta: "डैशबोर्ड खोलें",
      morpho: {
        title: "Tokenping से Morpho हेल्थ फ़ैक्टर अलर्ट",
        body: ({ minutes, networks, channels, price, paymentChain }) =>
          `Tokenping ${hiOnNetworks(networks)} ${hiEveryMinutes(minutes)} आपका Morpho Blue और Midnight हेल्थ फ़ैक्टर जांचता है और जब वह आपकी सीमा से नीचे होता है तो आपको ${channels} पर संदेश भेजता है, साथ ही फ़िक्स्ड रेट लोन की मैच्योरिटी से पहले रिमाइंडर भेजता है। अलर्ट की कीमत ${price} है${paymentChain ? `, भुगतान ${paymentChain} नेटवर्क पर` : ""}, Aave अलर्ट वाला ही प्लान; अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अलर्ट आपको कार्रवाई करने का समय देते हैं; वे लिक्विडेशन नहीं रोकते।`,
        cta: "Morpho डैशबोर्ड खोलें",
      },
    },
    alertPrice: {
      fallback: "USDC में एक छोटा शुल्क (मौजूदा कीमत डैशबोर्ड पर देखें)",
      plan: ({ priceLabel, days }) => `${priceLabel} प्रति ${plural("hi", days, { one: "दिन", other: `${days} दिन` })}`,
    },
    callout: { info: "नोट", warning: "चेतावनी" },
    shortAnswer: "संक्षिप्त जवाब",
    scopeNote: {
      text: "Aave V3.7 पर लागू, Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche और Gnosis मार्केट पर जांचा गया। दूसरे V3 मार्केट और नेटवर्क पुराने वर्ज़न चला सकते हैं। जहां नियम अलग हैं, वहां Aave V4 के अंतर बताए गए हैं।",
      morphoText:
        "Morpho ऐप में सूचीबद्ध Morpho Blue और Morpho Midnight मार्केट पर लागू। हर मार्केट अपना कोलैटरल, ओरेकल और LLTV खुद तय करता है, इसलिए अपने मार्केट के आंकड़े जांचें।",
      figuresAsOf: "आंकड़ों की तारीख़:",
    },
    table: {
      fallbackLabel: "तालिका, बगल में स्क्रॉल होती है",
      label: (heading, index) => (index === undefined ? `तालिका: ${heading}` : `तालिका ${index}: ${heading}`),
      scrollHint: "सभी कॉलम देखने के लिए बगल में स्क्रॉल करें।",
    },
  },
};

// The calculator keeps the app's number format in every language ("$1,445.78", "1.66", "39.8%"), like the
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
  es: {
    title: "Calculadora del precio de liquidación en Aave",
    intro:
      "Indica cada activo de tu colateral y tu deuda para obtener el factor de salud y los precios a los que la posición puede ser liquidada. La calculadora usa la fórmula de Aave V3: Σ(valor del colateral × umbral de liquidación) ÷ valor de la deuda.",
    examplesLabel: "Cargar un ejemplo resuelto:",
    examples: {
      "one-collateral": "10 WETH, deuda de 12,000 USDC",
      "two-collaterals": "10 WETH + 0.2 WBTC, deuda de 20,000 USDC",
      "volatile-debt": "10,000 USDC, deuda de 2.5 WETH",
    },
    defaultCollateralName: index => `Colateral ${index}`,
    defaultDebtName: "Activo de la deuda",
    collateralLegend: index => `Colateral ${index}`,
    presetLabel: "Activo de Aave V3 (el umbral se completa solo)",
    eModeHint: (collateral, borrowable) =>
      `Este umbral cuenta para ${joinList("es", collateral)}; el resto del colateral conserva el suyo. En este E-Mode solo puedes pedir prestado ${joinList("es", borrowable)}.`,
    otherAsset: "Otro activo: indica tú el umbral",
    presetGroup: (market, date) => `${market} (datos del ${date})`,
    presetLabels: {
      "ethereum-core-emode-eth": "E-Mode “ETH correlated” (p. ej., WETH, wstETH, weETH)",
      "arbitrum-usdc": "USDC (nativo)",
    },
    nameLabel: "Nombre del activo",
    namePlaceholder: symbols => `p. ej., ${joinList("es", symbols, "disjunction")}`,
    amountSupplied: "Cantidad depositada",
    price: "Precio (USD)",
    priceHint: "El precio del oráculo de Aave, que aparece en la página del activo en la aplicación de Aave.",
    threshold: "Umbral de liquidación (%)",
    thresholdHint: "En E-Mode, el umbral de la categoría. En Aave V4, el factor de colateral (collateral factor).",
    removeCollateral: index => `Quitar el colateral ${index}`,
    addCollateral: "Agregar un segundo colateral",
    debtLegend: "Deuda",
    debtKindLegend: "¿Qué pediste prestado?",
    debtKinds: { stable: "Una stablecoin (se cuenta a $1.00)", volatile: "Un activo volátil, como WETH" },
    debtAmount: { stable: "Monto de la deuda (USD)", volatile: "Cantidad de la deuda (tokens)" },
    debtAmountHint: "Incluye los intereses acumulados hasta ahora.",
    debtPrice: "Precio del activo de la deuda (USD)",
    errors: {
      number: "Escribe un número como 10 o 0.25, con punto para los decimales.",
      price: "Escribe un precio mayor que 0.",
      threshold: "Escribe un porcentaje mayor que 0 y de 100 como máximo.",
      samePrice: (name, price) =>
        `Ya indicaste ${name} arriba a ${price}. Usa el mismo precio: un activo tiene un solo precio.`,
    },
    eModeLead: "Sin resultado: Aave no permite esta combinación.",
    eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
      const borrowableList = joinList("es", borrowable);
      const loanText = loan.kind === "stable" ? "un préstamo en stablecoin" : `deuda en ${loan.name}`;
      const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
      return (
        `El E-Mode “${category}” de ${market} solo permite pedir prestado ${borrowableList}, así que una cuenta con ${loanText} ` +
        `no puede usar el umbral del ${thresholdPercent}% de ese E-Mode. Elige en su lugar el umbral propio del colateral${own}, o pide prestado ${borrowableList}.`
      );
    },
    results: {
      heading: "Resultado",
      empty: "Escribe un número en cada campo para ver el resultado.",
      summaryLine: (title, value) => `${title}: ${value}.`,
      healthFactor: "Factor de salud",
      noDebt: "Sin deuda, así que no hay nada que liquidar.",
      liquidatableNow: "Por debajo de 1.00: la posición se puede liquidar ahora.",
      liquidatableBelow: "La posición se puede liquidar por debajo de 1.00.",
      none: "Ninguno",
      priceTitle: name => `Precio de liquidación de ${name}`,
      priceTitleBorrowed: name => `Precio de liquidación de ${name} (deuda)`,
      priceTitleShared: name => `Precio de liquidación de ${name} (depositado y en deuda)`,
      recover: ({ name, change, now, rises, alike }) =>
        `El factor de salud vuelve a 1.00 si ${name}${alike ? " (el depositado y el de la deuda)" : ""} ${
          rises ? "sube" : "baja"
        } ${change} desde ${now}, con los demás precios sin cambios.`,
      collateralFall: ({ change, now }) =>
        `${change} por debajo de ${now}, si todos los demás precios se mantienen iguales.`,
      collateralNone: name =>
        `Incluso a $0, ${name} por sí solo no puede llevar el factor de salud por debajo de 1.00: el resto del colateral cubre la deuda.`,
      debtRise: ({ change, now }) =>
        `${change} por encima de ${now}: los activos de la deuda bajan el factor de salud cuando su precio sube.`,
      sharedRise: ({ name, change, now }) =>
        `${change} por encima de ${now}: pediste prestado más ${name} de lo que cuenta tu colateral en ${name}, así que una subida baja el factor de salud. Los demás precios, sin cambios.`,
      sharedFallBorrowed: ({ name, change, now }) =>
        `${change} por debajo de ${now}, con el ${name} de la deuda al mismo precio y todos los demás precios sin cambios.`,
      sharedFallRows: ({ name, change, now }) =>
        `${change} por debajo de ${now} en cada fila de ${name}, si todos los demás precios se mantienen iguales.`,
      bothSidesNeutral: name =>
        `${name} es a la vez tu colateral y tu deuda, así que ambos se mueven juntos y su precio no cambia el factor de salud. Los intereses, un cambio de umbral o tus propias transacciones sí lo cambian.`,
      bothSidesRecover: name =>
        `${name} está en ambos lados, así que ambos se mueven juntos: ningún precio de ${name} por sí solo devuelve el factor de salud a 1.00.`,
      bothSidesSafe: name =>
        `${name} está en ambos lados, así que ambos se mueven juntos: su precio por sí solo no puede llevar el factor de salud por debajo de 1.00.`,
      uniformTitle: "Todo el colateral baja a la vez",
      uniformDescription: prices =>
        `Si el precio de cada colateral baja este porcentaje y el precio de la deuda no se mueve, el factor de salud llega a 1.00: ${joinList(
          "es",
          prices.map(({ name, price }) => `${name} a ${price}`),
        )}.`,
      ratioTitle: (numerator, denominator) => `Relación de precios ${numerator} ÷ ${denominator} en la liquidación`,
      ratioDescription: (now, change, falls) =>
        `Ahora ${now}. Si ambos precios se mueven, ${falls ? "una baja" : "una subida"} de ${change} en esta relación lleva el factor de salud a 1.00.`,
      breakdown: ({ collateral, weighted, debt, healthFactor }) =>
        `Colateral ${collateral}, contado según sus umbrales de liquidación: ${weighted}. Factor de salud = ${weighted} ÷ ${debt} de deuda = ${healthFactor}.`,
    },
    noscript:
      "La calculadora necesita JavaScript para recalcular. El resultado de arriba corresponde a 10 WETH a $2,400 (umbral de liquidación del 83%) frente a una deuda de 12,000 USDC; los ejemplos resueltos de esta página usan la misma fórmula.",
    disclaimer: {
      lead: "Estimación educativa, no asesoramiento financiero.",
      beforeDate:
        "Se basa solo en los números que indicas. Los parámetros vigentes de Aave pueden cambiar: los umbrales de arriba se leyeron de la blockchain el",
      afterDate:
        ", y la gobernanza o los Risk Stewards pueden cambiarlos en cualquier momento. Los precios del oráculo se mueven, los intereses siguen sumándose a tu deuda y cada precio de liquidación supone que todos los demás precios se mantienen iguales. Revisa tu posición en la aplicación de Aave antes de actuar.",
    },
  },
  hi: {
    title: "Aave लिक्विडेशन कीमत कैलकुलेटर",
    intro:
      "हेल्थ फ़ैक्टर और वे कीमतें जानने के लिए जिन पर पोज़िशन लिक्विडेट हो सकती है, हर कोलैटरल एसेट और अपना कर्ज़ दर्ज करें। कैलकुलेटर Aave V3 का फ़ॉर्मूला इस्तेमाल करता है: Σ(कोलैटरल का मूल्य × लिक्विडेशन सीमा) ÷ कर्ज़ का मूल्य।",
    examplesLabel: "हल किया गया उदाहरण लोड करें:",
    examples: {
      "one-collateral": "10 WETH, 12,000 USDC कर्ज़",
      "two-collaterals": "10 WETH + 0.2 WBTC, 20,000 USDC कर्ज़",
      "volatile-debt": "10,000 USDC, 2.5 WETH उधार लिया",
    },
    defaultCollateralName: index => `कोलैटरल ${index}`,
    defaultDebtName: "कर्ज़ वाला एसेट",
    collateralLegend: index => `कोलैटरल ${index}`,
    presetLabel: "Aave V3 एसेट (सीमा अपने आप भरती है)",
    eModeHint: (collateral, borrowable) =>
      `यह सीमा ${joinList("hi", collateral)} के लिए गिनी जाती है; बाकी कोलैटरल अपनी सीमा रखता है। इस E-Mode में आप सिर्फ़ ${joinList("hi", borrowable)} उधार ले सकते हैं।`,
    otherAsset: "दूसरा एसेट: सीमा खुद दर्ज करें",
    presetGroup: (market, date) => `${market} (${date} को पढ़ा गया)`,
    presetLabels: {
      "ethereum-core-emode-eth": 'E-Mode "ETH correlated" (जैसे WETH, wstETH, weETH)',
      "arbitrum-usdc": "USDC (नेटिव)",
    },
    nameLabel: "एसेट का नाम",
    namePlaceholder: symbols => `जैसे ${joinList("hi", symbols, "disjunction")}`,
    amountSupplied: "जमा की गई राशि",
    price: "कीमत (USD)",
    priceHint: "Aave के ओरेकल की कीमत, जो Aave ऐप में एसेट के पेज पर दिखती है।",
    threshold: "लिक्विडेशन सीमा (%)",
    thresholdHint: "E-Mode में, श्रेणी की सीमा। Aave V4 पर, कोलैटरल फ़ैक्टर (collateral factor)।",
    removeCollateral: index => `कोलैटरल ${index} हटाएं`,
    addCollateral: "दूसरा कोलैटरल जोड़ें",
    debtLegend: "कर्ज़",
    debtKindLegend: "आपने क्या उधार लिया?",
    debtKinds: { stable: "एक स्टेबलकॉइन ($1.00 पर गिना जाता है)", volatile: "एक अस्थिर एसेट, जैसे WETH" },
    debtAmount: { stable: "उधार ली गई राशि (USD)", volatile: "उधार ली गई राशि (टोकन)" },
    debtAmountHint: "अब तक जुड़ा ब्याज शामिल करें।",
    debtPrice: "उधार लिए गए एसेट की कीमत (USD)",
    errors: {
      number: "10 या 0.25 जैसी संख्या दर्ज करें, दशमलव के लिए बिंदु के साथ।",
      price: "0 से ऊपर की कीमत दर्ज करें।",
      threshold: "0 से ऊपर और ज़्यादा से ज़्यादा 100 का प्रतिशत दर्ज करें।",
      samePrice: (name, price) =>
        `${name} ऊपर पहले से ${price} पर दर्ज है। वही कीमत इस्तेमाल करें: एक एसेट की एक ही कीमत होती है।`,
    },
    eModeLead: "कोई नतीजा नहीं: Aave इस संयोजन की अनुमति नहीं देता।",
    eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
      const borrowableList = joinList("hi", borrowable);
      const loanText = loan.kind === "stable" ? "स्टेबलकॉइन लोन" : `उधार लिए गए ${loan.name}`;
      const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
      return (
        `${market} का "${category}" E-Mode सिर्फ़ ${borrowableList} उधार लेने देता है, इसलिए ${loanText} वाला अकाउंट ` +
        `उसकी ${thresholdPercent}% सीमा इस्तेमाल नहीं कर सकता। इसके बजाय कोलैटरल की अपनी सीमा चुनें${own}, या ${borrowableList} उधार लें।`
      );
    },
    results: {
      heading: "नतीजा",
      empty: "नतीजा देखने के लिए हर फ़ील्ड में संख्या दर्ज करें।",
      summaryLine: (title, value) => `${title}: ${value}।`,
      healthFactor: "हेल्थ फ़ैक्टर",
      noDebt: "कोई कर्ज़ नहीं, इसलिए लिक्विडेट करने को कुछ नहीं है।",
      liquidatableNow: "1.00 से नीचे: पोज़िशन अभी लिक्विडेट हो सकती है।",
      liquidatableBelow: "पोज़िशन 1.00 से नीचे लिक्विडेट हो सकती है।",
      none: "कोई नहीं",
      priceTitle: name => `${name} लिक्विडेशन कीमत`,
      priceTitleBorrowed: name => `${name} लिक्विडेशन कीमत (उधार लिया गया)`,
      priceTitleShared: name => `${name} लिक्विडेशन कीमत (जमा और उधार दोनों)`,
      recover: ({ name, change, now, rises, alike }) =>
        `हेल्थ फ़ैक्टर 1.00 पर वापस आ जाता है अगर ${name}${alike ? " (जमा और उधार दोनों)" : ""} ${now} से ${change} ${
          rises ? "बढ़ता" : "गिरता"
        } है और बाकी कीमतें नहीं बदलतीं।`,
      collateralFall: ({ change, now }) => `${now} से ${change} नीचे, अगर बाकी हर कीमत वैसी ही रहे।`,
      collateralNone: name =>
        `$0 पर भी अकेला ${name} हेल्थ फ़ैक्टर को 1.00 से नीचे नहीं ले जा सकता: बाकी कोलैटरल कर्ज़ को कवर करता है।`,
      debtRise: ({ change, now }) =>
        `${now} से ${change} ऊपर: उधार लिए गए एसेट की कीमत बढ़ने पर वे हेल्थ फ़ैक्टर को नीचे धकेलते हैं।`,
      sharedRise: ({ name, change, now }) =>
        `${now} से ${change} ऊपर: आपने उतने ${name} से ज़्यादा उधार लिया है जितना आपका ${name} कोलैटरल गिना जाता है, इसलिए कीमत बढ़ने पर हेल्थ फ़ैक्टर नीचे जाता है। बाकी कीमतें नहीं बदलतीं।`,
      sharedFallBorrowed: ({ name, change, now }) =>
        `${now} से ${change} नीचे, उधार लिए गए ${name} की वही कीमत रहने और बाकी हर कीमत न बदलने पर।`,
      sharedFallRows: ({ name, change, now }) =>
        `हर ${name} पंक्ति के लिए ${now} से ${change} नीचे, अगर बाकी हर कीमत वैसी ही रहे।`,
      bothSidesNeutral: name =>
        `${name} आपका कोलैटरल भी है और कर्ज़ भी, इसलिए दोनों साथ चलते हैं और इसकी कीमत हेल्थ फ़ैक्टर नहीं बदलती। ब्याज, सीमा में बदलाव या आपके अपने ट्रांज़ैक्शन उसे फिर भी बदलते हैं।`,
      bothSidesRecover: name =>
        `${name} दोनों तरफ़ है, इसलिए दोनों साथ चलते हैं: अकेली कोई ${name} कीमत हेल्थ फ़ैक्टर को 1.00 पर वापस नहीं लाती।`,
      bothSidesSafe: name =>
        `${name} दोनों तरफ़ है, इसलिए दोनों साथ चलते हैं: अकेली इसकी कीमत हेल्थ फ़ैक्टर को 1.00 से नीचे नहीं ले जा सकती।`,
      uniformTitle: "सारा कोलैटरल एक साथ गिरता है",
      uniformDescription: prices =>
        `अगर हर कोलैटरल की कीमत इतनी गिरे और कर्ज़ की कीमत न हिले, तो हेल्थ फ़ैक्टर 1.00 पर पहुंचता है: ${joinList(
          "hi",
          prices.map(({ name, price }) => `${name} ${price} पर`),
        )}।`,
      ratioTitle: (numerator, denominator) => `लिक्विडेशन पर ${numerator} ÷ ${denominator} कीमत`,
      ratioDescription: (now, change, falls) =>
        `अभी ${now}। अगर दोनों कीमतें हिलें, तो इस अनुपात में ${change} की ${falls ? "गिरावट" : "बढ़त"} हेल्थ फ़ैक्टर को 1.00 पर ले जाती है।`,
      breakdown: ({ collateral, weighted, debt, healthFactor }) =>
        `कोलैटरल ${collateral}, अपनी लिक्विडेशन सीमाओं पर गिना गया: ${weighted}। हेल्थ फ़ैक्टर = ${weighted} ÷ ${debt} कर्ज़ = ${healthFactor}।`,
    },
    noscript:
      "कैलकुलेटर को दोबारा गणना के लिए JavaScript चाहिए। ऊपर का नतीजा 12,000 USDC के मुकाबले $2,400 पर 10 WETH (लिक्विडेशन सीमा 83%) के लिए है; इस पेज के हल किए गए उदाहरण वही फ़ॉर्मूला इस्तेमाल करते हैं।",
    disclaimer: {
      lead: "शैक्षिक अनुमान, वित्तीय सलाह नहीं।",
      beforeDate:
        "यह सिर्फ़ आपके दर्ज किए गए नंबरों का इस्तेमाल करता है। Aave के लाइव पैरामीटर बदल सकते हैं: ऊपर की सीमाएं ऑन-चेन",
      afterDate:
        " को पढ़ी गई थीं, और गवर्नेंस या Risk Stewards उन्हें कभी भी बदल सकते हैं। ओरेकल कीमतें हिलती हैं, ब्याज आपके कर्ज़ में जुड़ता रहता है, और हर लिक्विडेशन कीमत मानती है कि बाकी हर कीमत वैसी ही रहे। कार्रवाई से पहले Aave ऐप में अपनी पोज़िशन जांचें।",
    },
  },
};
