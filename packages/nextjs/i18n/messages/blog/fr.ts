import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "toutes les 5 minutes", "chaque minute". */
const frEveryMinutes = (minutes: number) =>
  plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` });

/** "sur 22 réseaux", "sur 1 réseau". */
const frOnNetworks = (networks: number) =>
  plural("fr", networks, { one: `sur ${networks} réseau`, other: `sur ${networks} réseaux` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Accueil", blog: "Blog" },
  index: {
    title: "Guides Aave et Morpho : facteur de santé et liquidation",
    description:
      "Guides sur le facteur de santé Aave et Morpho, la liquidation, le prix de liquidation et les alertes, avec exemples chiffrés et chiffres datés et sourcés.",
    kicker: "Guides Aave et Morpho",
    lead: "Comment fonctionne le facteur de santé sur Aave et sur Morpho, ce qui se passe lors d'une liquidation, comment calculer votre prix de liquidation et comment être prévenu avant que le prix s'en approche. Chaque chiffre de ces guides cite sa source et la date à laquelle il a été vérifié.",
    dashboardCta: "Ouvrir le tableau de bord Aave",
    morphoDashboardCta: "Ouvrir le tableau de bord Morpho",
    rss: "S'abonner par RSS",
    startHere: "Pour commencer",
    allGuides: "Tous les guides",
    empty: {
      title: "Pas encore de guides",
      description:
        "Nous préparons les guides en français. Abonnez-vous par RSS pour les recevoir dès leur publication.",
      otherLanguage: "Lire les guides en anglais",
    },
  },
  post: {
    kicker: "Guide Aave V3",
    morphoKicker: "Guide Morpho",
    byline: { author: "Par l'équipe Tokenping", published: "Publié le", updated: "Mis à jour le" },
    readingTime: minutes => `${minutes} min de lecture`,
    readGuide: "Lire le guide",
    related: "Guides associés",
  },
  endBox: {
    label: "À propos de Tokenping",
    title: "Alertes de facteur de santé par Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping vérifie le facteur de santé de vos positions Aave V3 et V4 ${frEveryMinutes(minutes)} ${frOnNetworks(networks)} et vous écrit par ${channels} quand il passe sous votre seuil. Les alertes coûtent ${price}${paymentChain ? `, à payer sur ${paymentChain}` : ""} ; consulter vos positions ne demande aucun paiement. Les alertes vous laissent le temps d'agir ; elles n'empêchent pas la liquidation.`,
    cta: "Ouvrir le tableau de bord",
    morpho: {
      title: "Alertes de facteur de santé Morpho par Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping vérifie le facteur de santé de vos prêts Morpho Blue et Midnight ${frEveryMinutes(minutes)} ${frOnNetworks(networks)} et vous écrit par ${channels} quand il passe sous votre seuil, avec des rappels avant l'échéance d'un prêt à taux fixe. Les alertes coûtent ${price}${paymentChain ? `, à payer sur ${paymentChain}` : ""}, la même formule que les alertes Aave ; consulter vos positions ne demande aucun paiement. Les alertes vous laissent le temps d'agir ; elles n'empêchent pas la liquidation.`,
      cta: "Ouvrir le tableau de bord Morpho",
    },
  },
  alertPrice: {
    fallback: "de faibles frais en USDC (le prix actuel est indiqué dans le tableau de bord)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("fr", priceLabel)} ${plural("fr", days, { one: "par jour", other: `pour ${days} jours` })}`,
  },
  callout: { info: "Remarque", warning: "Attention" },
  shortAnswer: "Réponse courte",
  scopeNote: {
    text: "S'applique à Aave V3.7, vérifié sur les marchés Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche et Gnosis. D'autres marchés et réseaux V3 peuvent utiliser des versions plus anciennes. Les différences d'Aave V4 sont signalées là où les règles diffèrent.",
    morphoText:
      "S'applique aux marchés Morpho Blue et Morpho Midnight listés dans l'app Morpho. Chaque marché fixe son propre collatéral, son oracle et sa LLTV : vérifiez donc les chiffres du vôtre.",
    figuresAsOf: "Chiffres au",
  },
  table: {
    fallbackLabel: "Tableau, défilement horizontal",
    label: (heading, index) => (index === undefined ? `Tableau : ${heading}` : `Tableau ${index} : ${heading}`),
    scrollHint: "Faites défiler latéralement pour voir toutes les colonnes.",
  },
};
