import type { NotificationMessages } from "./shared";
import { frOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Votre facteur de santé Aave ${frOnMarket(chainName)} est de ${healthFactor}, ` +
    `sous votre seuil de ${threshold}. ` +
    `Envisagez d'ajouter du collatéral ou de rembourser de la dette pour éviter la liquidation.\n\nEnvoyé : ${timestamp}`,
  alertSubject: chainName => `Alerte de facteur de santé Aave - ${chainName}`,
  // The html footer says "Créé" where the text says "Envoyé", as the English does.
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Votre facteur de santé Aave ${frOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} est de ` +
    `<strong>${healthFactor}</strong>, sous votre seuil de ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Envisagez d'ajouter du collatéral ou de rembourser de la dette pour éviter la liquidation.</p>` +
    `<p><small>Créé : ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "critique", risky: "risqué", safe: "sûr" };
    const now =
      position.kind === "debt"
        ? `En ce moment : facteur de santé ${position.healthFactor} (${statusWord[position.status]}), collatéral ${position.collateral}, dette ${position.debt}.`
        : position.kind === "noDebt"
          ? `En ce moment : aucune dette, donc rien ne peut être liquidé${position.collateral ? ` (collatéral ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "En ce moment : aucune position ouverte sur ce marché."
            : "En ce moment : votre position n'a pas pu être lue. Les vraies alertes réessaient à chaque vérification.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "C'est sous votre seuil : la prochaine vérification enverra une vraie alerte."
          : "C'est au-dessus de votre seuil : aucune alerte ne serait envoyée maintenant."
        : null;
    const every = plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` });
    return [
      "Message de test de Tokenping : les alertes sur ce canal fonctionnent.",
      `Votre alerte : ${chainName}, quand le facteur de santé passe sous ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Vérification ${every}. Envoyé : ${timestamp}`,
    ];
  },
  testSubject: chainName => `Message de test Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} à taux fixe, échéance le ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Votre facteur de santé Morpho ${frOnMarket(chainName, "network")} est de ${healthFactor}, sous votre seuil de ${threshold}.`,
    `Marché : ${market}.`,
    ...(preLiquidation
      ? [
          "Vous avez activé la préliquidation (pre-liquidation) sur ce marché : le facteur de santé est donc mesuré par rapport à son seuil plus précoce. Sous 1, une partie de votre position peut être vendue.",
        ]
      : []),
    "Envisagez d'ajouter du collatéral ou de rembourser de la dette pour éviter la liquidation.",
    `Envoyé : ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Alerte de facteur de santé Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Votre prêt à taux fixe Morpho ${frOnMarket(chainName, "network")} est arrivé à échéance le ${when} et il reste ${debt} de dette.`,
          `Marché : ${market}.`,
          "Il peut maintenant être liquidé à tout moment, quel que soit son facteur de santé. Remboursez-le pour éviter la liquidation.",
          `Envoyé : ${timestamp}`,
        ]
      : [
          `Votre prêt à taux fixe Morpho ${frOnMarket(chainName, "network")} arrive à échéance dans les ${stage === "7d" ? "7 jours" : "24 heures"}, le ${when}.`,
          `Marché : ${market}.`,
          `Dette : ${debt}.`,
          "Après l'échéance, toute dette non remboursée peut être liquidée : remboursez-la avant.",
          `Envoyé : ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Prêt Morpho arrivé à échéance - ${chainName}`
      : `Prêt Morpho à échéance dans les ${stage === "7d" ? "7 jours" : "24 heures"} - ${chainName}`,
};
