import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "elke 5 minuten", "elke minuut". */
const nlEveryMinutes = (minutes: number) =>
  plural("nl", minutes, { one: "elke minuut", other: `elke ${minutes} minuten` });

/** "op 22 netwerken", "op 1 netwerk". */
const nlOnNetworks = (networks: number) =>
  plural("nl", networks, { one: `op ${networks} netwerk`, other: `op ${networks} netwerken` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Home", blog: "Blog" },
  index: {
    title: "Gidsen over health factor en liquidatie bij Aave en Morpho",
    description:
      "Gidsen over de health factor van Aave en Morpho, liquidaties, liquidatieprijzen en alerts, met rekenvoorbeelden en gedateerde cijfers met bron.",
    kicker: "Gidsen over Aave en Morpho",
    lead: "Hoe de health factor werkt op Aave en op Morpho, wat er gebeurt bij een liquidatie, hoe je je liquidatieprijs berekent en hoe je een waarschuwing krijgt voordat het zover is. Elk cijfer in deze gidsen noemt zijn bron en de datum waarop het is gecontroleerd.",
    dashboardCta: "Aave-dashboard openen",
    morphoDashboardCta: "Morpho-dashboard openen",
    rss: "Abonneren via RSS",
    startHere: "Begin hier",
    allGuides: "Alle gidsen",
    empty: {
      title: "Nog geen gidsen",
      description:
        "De gidsen in het Nederlands worden voorbereid. Abonneer je via RSS om ze te krijgen zodra ze verschijnen.",
      otherLanguage: "Gidsen in het Engels lezen",
    },
  },
  post: {
    kicker: "Gids over Aave V3",
    morphoKicker: "Gids over Morpho",
    byline: { author: "Door het Tokenping-team", published: "Gepubliceerd", updated: "Bijgewerkt" },
    readingTime: minutes => `${minutes} min lezen`,
    readGuide: "Gids lezen",
    related: "Verwante gidsen",
  },
  endBox: {
    label: "Over Tokenping",
    title: "Health factor-alerts van Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping controleert de health factor van je posities op Aave V3 en V4 ${nlEveryMinutes(minutes)} ${nlOnNetworks(networks)} en stuurt je een bericht via ${channels} als hij onder je drempel ligt. Alerts kosten ${price}${paymentChain ? `, betaald op ${paymentChain}` : ""}; je posities bekijken kost niets. Alerts geven je tijd om te handelen; ze voorkomen geen liquidatie.`,
    cta: "Dashboard openen",
    morpho: {
      title: "Health factor-alerts voor Morpho van Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping controleert de health factor van je leningen op Morpho Blue en Midnight ${nlEveryMinutes(minutes)} ${nlOnNetworks(networks)} en stuurt je een bericht via ${channels} als hij onder je drempel ligt, met herinneringen vóór de vervaldatum van een lening met vaste rente. Alerts kosten ${price}${paymentChain ? `, betaald op ${paymentChain}` : ""}, hetzelfde plan als voor Aave-alerts; je posities bekijken kost niets. Alerts geven je tijd om te handelen; ze voorkomen geen liquidatie.`,
      cta: "Morpho-dashboard openen",
    },
  },
  alertPrice: {
    fallback: "een kleine vergoeding in USDC (de actuele prijs staat op het dashboard)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("nl", priceLabel)} ${plural("nl", days, { one: "per dag", other: `per ${days} dagen` })}`,
  },
  callout: { info: "Let op", warning: "Waarschuwing" },
  shortAnswer: "Kort antwoord",
  scopeNote: {
    text: "Geldt voor Aave V3.7, gecontroleerd op de markten Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche en Gnosis. Andere V3-markten en netwerken draaien mogelijk oudere versies. Verschillen bij Aave V4 staan vermeld waar de regels afwijken.",
    morphoText:
      "Geldt voor de markten van Morpho Blue en Morpho Midnight die in de Morpho-app staan. Elke markt bepaalt zijn eigen onderpand, oracle en LLTV, dus controleer de cijfers van jouw markt.",
    figuresAsOf: "Cijfers per",
  },
  table: {
    fallbackLabel: "Tabel, scrolt horizontaal",
    label: (heading, index) => (index === undefined ? `Tabel: ${heading}` : `Tabel ${index}: ${heading}`),
    scrollHint: "Scrol opzij om alle kolommen te zien.",
  },
};
