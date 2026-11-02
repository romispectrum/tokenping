import type { MorphoMessages } from "./shared";
import { frForMarket, frOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Alertes de facteur de santé pour Morpho Blue et Midnight",
    metaDescription: (networkCount, channels) =>
      `Alertes de facteur de santé Morpho Blue et Midnight (taux fixe) par ${channels}, sur ${networkCount} réseaux, avec un rappel avant l'échéance.`,
    title: "Positions Morpho Blue et Midnight et alertes de facteur de santé",
    intro: networks =>
      `Vos positions d'emprunt dans les marchés listés par l'app Morpho, sur ${networks} : prêts à taux variable (Morpho Blue) et prêts à taux fixe (Morpho Midnight). Les facteurs de santé sont lus directement sur la blockchain.`,
    checks: minutes =>
      `Les alertes sont vérifiées ${plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` })}. Un prêt à taux fixe reçoit aussi un rappel 7 jours et 1 jour avant l'échéance, puis une alerte à chaque vérification après l'échéance tant qu'il reste une dette.`,
    access: "Un seul paiement d'accès couvre vos alertes Aave et Morpho.",
    notAffiliated: "Tokenping n'est pas affilié à Morpho.",
    guideHealthFactor: "Comment fonctionne le facteur de santé Morpho",
    guideLiquidation: "Comment fonctionne la liquidation sur Morpho",
    guideMidnight: "Les prêts à taux fixe de Morpho Midnight",
    aaveDashboard: "Vous empruntez sur Aave ? Ouvrez le tableau de bord Aave",
  },
  positionsHeading: "Vos positions Morpho",
  gate: {
    title: "Connectez un wallet pour continuer",
    description:
      "Tokenping a besoin de l'adresse de votre wallet pour trouver vos positions Morpho. La connexion ne déplace aucun fonds et se fait sans frais.",
    connect: "Connecter le wallet",
    connecting: "Connexion en cours",
    approveInWallet: "Approuvez la connexion dans votre wallet.",
  },
  list: {
    heading: "Marchés",
    count: count => `${count} avec dette`,
    none: "Aucun emprunt trouvé dans les marchés listés par l'app Morpho.",
    discoveryFailed: "L'API de Morpho n'a pas répondu : seuls les marchés avec une alerte enregistrée sont affichés.",
    variableRate: "Taux variable",
    fixedRate: "Taux fixe",
    matures: date => `Échéance le ${date}`,
    matured: "Échéance dépassée",
    unreadable: "Lecture impossible",
    noneSelectedDescription: "Sélectionnez un marché pour voir votre position Morpho.",
  },
  details: {
    collateralValue: "Valeur du collatéral",
    debt: "Dette",
    ltv: "LTV",
    lltv: "LTV de liquidation",
    maturity: "Échéance",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("fr", days, { one: `dans ${days} jour`, other: `dans ${days} jours` })
        : plural("fr", hours, { one: `dans ${hours} heure`, other: `dans ${hours} heures` }),
    pastMaturity:
      "Ce prêt a dépassé son échéance : toute dette restante peut être liquidée à tout moment, quel que soit son facteur de santé. Remboursez-la pour éviter la liquidation.",
    preLiquidation: "Préliquidation",
    preLiquidationNote:
      "Vous avez activé la préliquidation (pre-liquidation) sur ce marché : le facteur de santé est donc mesuré par rapport à son seuil plus précoce. Sous 1, une partie de votre position peut être vendue.",
    amountsIn: token => `Les montants sont en ${token}, valorisés par l'oracle du marché.`,
    noDebtTitle: "Aucune dette sur ce marché",
    noDebtDetail: "Une alerte enregistrée reste enregistrée et n'envoie rien tant qu'il n'y a pas de dette.",
    unreadableTitle: "Cette position n'a pas pu être lue",
    unreadableDetail: "Le réseau n'a pas répondu. Votre alerte continue d'être vérifiée.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Payez une fois pour configurer des alertes de facteur de santé ${frOnMarket(marketName, "market")} et sur d'autres marchés. Rien ne se renouvelle automatiquement : vous payez depuis votre wallet quand vous voulez prolonger.`,
    descriptionExtend: marketName =>
      `Vos paramètres d'alerte enregistrés ${frForMarket(marketName, "market")} sont toujours dans votre compte. Payez à nouveau pour prolonger l'accès et les modifier.`,
  },
};
