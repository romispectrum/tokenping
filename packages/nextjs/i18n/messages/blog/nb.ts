import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "hvert minutt" for one minute, "hvert 5. minutt" otherwise. */
const nbEveryMinutes = (minutes: number) =>
  plural("nb", minutes, { one: "hvert minutt", other: `hvert ${minutes}. minutt` });

/** "på 22 nettverk", "på 1 nettverk". */
const nbOnNetworks = (networks: number) => `på ${networks} nettverk`;

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Hjem", blog: "Blogg" },
  index: {
    title: "Guider om health factor og likvidasjon på Aave og Morpho",
    description:
      "Guider om health factor på Aave og Morpho, likvidasjoner, likvidasjonspriser og varsler, med regneeksempler og daterte tall med kilder.",
    kicker: "Guider om Aave og Morpho",
    lead: "Hvordan health factor fungerer på Aave og på Morpho, hva som skjer ved en likvidasjon, hvordan du regner ut likvidasjonsprisen din og hvordan du får en advarsel før det blir nært. Hvert tall i guidene oppgir kilden og datoen det ble sjekket.",
    dashboardCta: "Åpne oversikten for Aave",
    morphoDashboardCta: "Åpne oversikten for Morpho",
    rss: "Abonner via RSS",
    startHere: "Start her",
    allGuides: "Alle guider",
    empty: {
      title: "Ingen guider ennå",
      description: "Guidene på norsk er under arbeid. Abonner via RSS for å få dem når de publiseres.",
      otherLanguage: "Les guidene på engelsk",
    },
  },
  post: {
    kicker: "Guide om Aave V3",
    morphoKicker: "Guide om Morpho",
    byline: { author: "Av Tokenping-teamet", published: "Publisert", updated: "Oppdatert" },
    readingTime: minutes => `${minutes} min lesing`,
    readGuide: "Les guiden",
    related: "Relaterte guider",
  },
  endBox: {
    label: "Om Tokenping",
    title: "Health factor-varsler fra Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping sjekker health factor for posisjonene dine på Aave V3 og V4 ${nbEveryMinutes(minutes)} ${nbOnNetworks(networks)} og sender deg en melding via ${channels} når den er under terskelen din. Varsler koster ${price}${paymentChain ? `, betalt på ${paymentChain}` : ""}; å se posisjonene dine krever ingen betaling. Varsler gir deg tid til å handle; de hindrer ikke likvidasjon.`,
    cta: "Åpne oversikten",
    morpho: {
      title: "Health factor-varsler for Morpho fra Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping sjekker health factor for lånene dine på Morpho Blue og Midnight ${nbEveryMinutes(minutes)} ${nbOnNetworks(networks)} og sender deg en melding via ${channels} når den er under terskelen din, med påminnelser før forfallsdatoen for et lån med fast rente. Varsler koster ${price}${paymentChain ? `, betalt på ${paymentChain}` : ""}, samme plan som for Aave-varsler; å se posisjonene dine krever ingen betaling. Varsler gir deg tid til å handle; de hindrer ikke likvidasjon.`,
      cta: "Åpne oversikten for Morpho",
    },
  },
  alertPrice: {
    fallback: "et lite gebyr i USDC (gjeldende pris står i oversikten)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("nb", priceLabel)} ${plural("nb", days, { one: "per dag", other: `per ${days} dager` })}`,
  },
  callout: { info: "Merk", warning: "Advarsel" },
  shortAnswer: "Kort svar",
  scopeNote: {
    text: "Gjelder Aave V3.7, sjekket på markedene Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche og Gnosis. Andre V3-markeder og nettverk kan kjøre eldre versjoner. Forskjeller i Aave V4 er nevnt der reglene er ulike.",
    morphoText:
      "Gjelder markedene på Morpho Blue og Morpho Midnight som er oppført i Morpho-appen. Hvert marked fastsetter sin egen sikkerhet, sitt eget orakel og sin egen LLTV, så sjekk tallene for markedet ditt.",
    figuresAsOf: "Tall per",
  },
  table: {
    fallbackLabel: "Tabell, rulles sidelengs",
    label: (heading, index) => (index === undefined ? `Tabell: ${heading}` : `Tabell ${index}: ${heading}`),
    scrollHint: "Rull sidelengs for å se alle kolonnene.",
  },
};
