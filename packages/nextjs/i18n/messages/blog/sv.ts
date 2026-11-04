import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "var 5:e minut" reads oddly for some numbers, so "en gång i minuten" and "var 5 minuter". */
const svEveryMinutes = (minutes: number) =>
  plural("sv", minutes, { one: "en gång i minuten", other: `var ${minutes} minuter` });

/** "på 22 nätverk", "på 1 nätverk". */
const svOnNetworks = (networks: number) => `på ${networks} nätverk`;

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Hem", blog: "Blogg" },
  index: {
    title: "Guider om health factor och likvidation på Aave och Morpho",
    description:
      "Guider om health factor på Aave och Morpho, likvidationer, likvidationspriser och larm, med räkneexempel och daterade siffror med källor.",
    kicker: "Guider om Aave och Morpho",
    lead: "Hur health factor fungerar på Aave och på Morpho, vad som händer vid en likvidation, hur du räknar ut ditt likvidationspris och hur du får en varning innan det blir nära. Varje siffra i guiderna anger sin källa och datumet då den kontrollerades.",
    dashboardCta: "Öppna översikten för Aave",
    morphoDashboardCta: "Öppna översikten för Morpho",
    rss: "Prenumerera via RSS",
    startHere: "Börja här",
    allGuides: "Alla guider",
    empty: {
      title: "Inga guider än",
      description: "Guiderna på svenska förbereds. Prenumerera via RSS för att få dem när de publiceras.",
      otherLanguage: "Läs guiderna på engelska",
    },
  },
  post: {
    kicker: "Guide om Aave V3",
    morphoKicker: "Guide om Morpho",
    byline: { author: "Av Tokenping-teamet", published: "Publicerad", updated: "Uppdaterad" },
    readingTime: minutes => `${minutes} min läsning`,
    readGuide: "Läs guiden",
    related: "Relaterade guider",
  },
  endBox: {
    label: "Om Tokenping",
    title: "Health factor-larm från Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping kontrollerar health factor för dina positioner på Aave V3 och V4 ${svEveryMinutes(minutes)} ${svOnNetworks(networks)} och skickar ett meddelande via ${channels} när den ligger under ditt tröskelvärde. Larm kostar ${price}${paymentChain ? `, som betalas på ${paymentChain}` : ""}; att se dina positioner kräver ingen betalning. Larm ger dig tid att agera; de förhindrar inte likvidation.`,
    cta: "Öppna översikten",
    morpho: {
      title: "Health factor-larm för Morpho från Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping kontrollerar health factor för dina lån på Morpho Blue och Midnight ${svEveryMinutes(minutes)} ${svOnNetworks(networks)} och skickar ett meddelande via ${channels} när den ligger under ditt tröskelvärde, med påminnelser före förfallodagen för ett lån med fast ränta. Larm kostar ${price}${paymentChain ? `, som betalas på ${paymentChain}` : ""}, samma plan som för Aave-larm; att se dina positioner kräver ingen betalning. Larm ger dig tid att agera; de förhindrar inte likvidation.`,
      cta: "Öppna översikten för Morpho",
    },
  },
  alertPrice: {
    fallback: "en liten avgift i USDC (aktuellt pris står i översikten)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("sv", priceLabel)} ${plural("sv", days, { one: "per dag", other: `per ${days} dagar` })}`,
  },
  callout: { info: "Obs", warning: "Varning" },
  shortAnswer: "Kort svar",
  scopeNote: {
    text: "Gäller Aave V3.7, kontrollerat på marknaderna Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche och Gnosis. Andra V3-marknader och nätverk kan köra äldre versioner. Skillnader i Aave V4 anges där reglerna skiljer sig.",
    morphoText:
      "Gäller marknaderna på Morpho Blue och Morpho Midnight som listas i Morpho-appen. Varje marknad bestämmer sin egen säkerhet, sitt eget orakel och sin egen LLTV, så kontrollera siffrorna för din marknad.",
    figuresAsOf: "Siffror per",
  },
  table: {
    fallbackLabel: "Tabell, rullar i sidled",
    label: (heading, index) => (index === undefined ? `Tabell: ${heading}` : `Tabell ${index}: ${heading}`),
    scrollHint: "Rulla i sidled för att se alla kolumner.",
  },
};
