import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "hvert minut", "hvert 5. minut". */
const daEveryMinutes = (minutes: number) =>
  plural("da", minutes, { one: "hvert minut", other: `hvert ${minutes}. minut` });

/** "på 22 netværk", "på 1 netværk". */
const daOnNetworks = (networks: number) => `på ${networks} netværk`;

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Forside", blog: "Blog" },
  index: {
    title: "Guider om health factor og likvidation på Aave og Morpho",
    description:
      "Guider om health factor på Aave og Morpho, likvidationer, likvidationspriser og alarmer, med regneeksempler og daterede tal med kilder.",
    kicker: "Guider om Aave og Morpho",
    lead: "Hvordan health factor fungerer på Aave og på Morpho, hvad der sker ved en likvidation, hvordan du beregner din likvidationspris, og hvordan du får en advarsel, før det bliver tæt på. Hvert tal i guiderne angiver sin kilde og datoen, hvor det blev tjekket.",
    dashboardCta: "Åbn oversigten for Aave",
    morphoDashboardCta: "Åbn oversigten for Morpho",
    rss: "Abonner via RSS",
    startHere: "Start her",
    allGuides: "Alle guider",
    empty: {
      title: "Ingen guider endnu",
      description: "Guiderne på dansk er under forberedelse. Abonner via RSS for at få dem, når de udkommer.",
      otherLanguage: "Læs guiderne på engelsk",
    },
  },
  post: {
    kicker: "Guide om Aave V3",
    morphoKicker: "Guide om Morpho",
    byline: { author: "Af Tokenping-teamet", published: "Udgivet", updated: "Opdateret" },
    readingTime: minutes => `${minutes} min. læsning`,
    readGuide: "Læs guiden",
    related: "Relaterede guider",
  },
  endBox: {
    label: "Om Tokenping",
    title: "Health factor-alarmer fra Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping tjekker health factor for dine positioner på Aave V3 og V4 ${daEveryMinutes(minutes)} ${daOnNetworks(networks)} og sender dig en besked via ${channels}, når den ligger under din tærskel. Alarmer koster ${price}${paymentChain ? `, som betales på ${paymentChain}` : ""}; det kræver ingen betaling at se dine positioner. Alarmer giver dig tid til at handle; de forhindrer ikke likvidation.`,
    cta: "Åbn oversigten",
    morpho: {
      title: "Health factor-alarmer for Morpho fra Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping tjekker health factor for dine lån på Morpho Blue og Midnight ${daEveryMinutes(minutes)} ${daOnNetworks(networks)} og sender dig en besked via ${channels}, når den ligger under din tærskel, med påmindelser før forfaldsdatoen for et lån med fast rente. Alarmer koster ${price}${paymentChain ? `, som betales på ${paymentChain}` : ""}, samme plan som for Aave-alarmer; det kræver ingen betaling at se dine positioner. Alarmer giver dig tid til at handle; de forhindrer ikke likvidation.`,
      cta: "Åbn oversigten for Morpho",
    },
  },
  alertPrice: {
    fallback: "et lille gebyr i USDC (den aktuelle pris står i oversigten)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("da", priceLabel)} ${plural("da", days, { one: "pr. dag", other: `pr. ${days} dage` })}`,
  },
  callout: { info: "Bemærk", warning: "Advarsel" },
  shortAnswer: "Kort svar",
  scopeNote: {
    text: "Gælder Aave V3.7, tjekket på markederne Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche og Gnosis. Andre V3-markeder og netværk kan køre ældre versioner. Forskelle i Aave V4 er nævnt, hvor reglerne er anderledes.",
    morphoText:
      "Gælder markederne på Morpho Blue og Morpho Midnight, som er opført i Morpho-appen. Hvert marked fastsætter sin egen sikkerhed, sit eget orakel og sin egen LLTV, så tjek tallene for dit marked.",
    figuresAsOf: "Tal pr.",
  },
  table: {
    fallbackLabel: "Tabel, ruller vandret",
    label: (heading, index) => (index === undefined ? `Tabel: ${heading}` : `Tabel ${index}: ${heading}`),
    scrollHint: "Rul til siden for at se alle kolonner.",
  },
};
