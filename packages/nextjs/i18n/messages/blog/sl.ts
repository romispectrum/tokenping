import type { BlogMessages } from "./shared";
// The alert price ("3 USDC za 30 dni" or the fallback) stands after a colon, where the nominative reads: "Cena opozoril: ...".
// The channels ("Signal, Telegram ali e-pošta") stand after a colon too, so no name takes a case ending.
import { formatDecimal, plural } from "~~/i18n/format";

/** "vsako minuto", "vsaki 2 minuti", "vsake 3 minute", "vsakih 5 minut". */
const everyMinutes = (minutes: number) =>
  plural("sl", minutes, {
    one: minutes === 1 ? "vsako minuto" : `vsako ${minutes} minuto`,
    two: `vsaki ${minutes} minuti`,
    few: `vsake ${minutes} minute`,
    other: `vsakih ${formatDecimal("sl", minutes)} minut`,
  });

/** "na 1 omrežju", "na 22 omrežjih". */
const onNetworks = (networks: number) =>
  plural("sl", networks, { one: `na ${networks} omrežju`, other: `na ${networks} omrežjih` });

/** "za en dan", "za 2 dneva", "za 30 dni". */
const forDays = (days: number) =>
  plural("sl", days, {
    one: days === 1 ? "za en dan" : `za ${days} dan`,
    two: `za ${days} dneva`,
    few: `za ${days} dni`,
    other: `za ${formatDecimal("sl", days)} dni`,
  });

const paidOn = (paymentChain?: string) => (paymentChain ? `, plačilo na omrežju ${paymentChain}` : "");

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Domov", blog: "Blog" },
  index: {
    title: "Vodniki za health factor in likvidacije: Aave in Morpho",
    description:
      "Vodniki za health factor, likvidacije, likvidacijske cene in opozorila v Aave in Morpho, s primeri izračunov ter datiranimi podatki z viri.",
    kicker: "Vodniki za Aave in Morpho",
    lead: "Kako deluje health factor v protokolih Aave in Morpho, kaj se zgodi ob likvidaciji, kako izračunaš svojo likvidacijsko ceno in kako dobiš opozorilo, preden se ji cena približa. Vsak podatek v teh vodnikih navaja svoj vir in datum, ko je bil preverjen.",
    dashboardCta: "Odpri nadzorno ploščo Aave",
    morphoDashboardCta: "Odpri nadzorno ploščo Morpho",
    rss: "Naroči se prek RSS",
    startHere: "Začni tukaj",
    allGuides: "Vsi vodniki",
    empty: {
      title: "Vodnikov še ni",
      description: "Slovenske različice vodnikov so v pripravi. Naroči se prek RSS in jih prejmeš takoj, ko izidejo.",
      otherLanguage: "Preberi vodnike v angleščini",
    },
  },
  post: {
    kicker: "Vodnik za Aave V3",
    morphoKicker: "Vodnik za Morpho",
    byline: { author: "Ekipa Tokenping", published: "Objavljeno", updated: "Posodobljeno" },
    readingTime: minutes => `${minutes} min branja`,
    readGuide: "Preberi vodnik",
    related: "Sorodni vodniki",
  },
  endBox: {
    label: "O storitvi Tokenping",
    title: "Tokenping: opozorila za health factor",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping ${everyMinutes(minutes)} ${onNetworks(networks)} preveri tvoj health factor v Aave V3 in V4 in ti pošlje sporočilo, ko je pod tvojim pragom. Kanali: ${channels}. Cena opozoril: ${price}${paidOn(paymentChain)}; ogled pozicij ne stane ničesar. Opozorila ti dajo čas za ukrepanje, likvidacije pa ne preprečijo.`,
    cta: "Odpri nadzorno ploščo",
    morpho: {
      title: "Tokenping: opozorila za health factor v Morpho",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping ${everyMinutes(minutes)} ${onNetworks(networks)} preveri tvoj health factor v Morpho Blue in Midnight in ti pošlje sporočilo, ko je pod tvojim pragom, pred zapadlostjo posojila s fiksno obrestno mero pa te tudi opomni. Kanali: ${channels}. Cena opozoril: ${price}${paidOn(paymentChain)}, isti paket kot za opozorila Aave; ogled pozicij ne stane ničesar. Opozorila ti dajo čas za ukrepanje, likvidacije pa ne preprečijo.`,
      cta: "Odpri nadzorno ploščo Morpho",
    },
  },
  alertPrice: {
    fallback: "majhen znesek v USDC (trenutno ceno najdeš na nadzorni plošči)",
    plan: ({ priceLabel, days }) => `${formatDecimal("sl", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Opomba", warning: "Opozorilo" },
  shortAnswer: "Kratek odgovor",
  scopeNote: {
    text: "Velja za Aave V3.7, preverjeno na trgih Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche in Gnosis. Drugi trgi in omrežja V3 morda uporabljajo starejše različice. Razlike v Aave V4 navajamo tam, kjer se pravila razlikujejo.",
    morphoText:
      "Velja za trge Morpho Blue in Morpho Midnight, ki so navedeni v aplikaciji Morpho. Vsak trg določa svoje zavarovanje, orakelj in LLTV, zato preveri podatke svojega trga.",
    figuresAsOf: "Podatki na dan",
  },
  table: {
    fallbackLabel: "Tabela, pomika se vodoravno",
    label: (heading, index) => (index === undefined ? `Tabela: ${heading}` : `Tabela ${index}: ${heading}`),
    scrollHint: "Pomakni se vstran, da vidiš vse stolpce.",
  },
};
