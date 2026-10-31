import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

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

export const MESSAGES: BlogMessages = {
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
};
