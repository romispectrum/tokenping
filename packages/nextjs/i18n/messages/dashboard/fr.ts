import type { DashboardMessages } from "./shared";
import { frForMarket, frOnMarket, plural } from "~~/i18n/format";

/** "30 jours", "1 jour". */
const frDays = (days: number) => plural("fr", days, { one: `${days} jour`, other: `${days} jours` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Positions Aave V3 et V4 et facteur de santé",
    metaDescription: (networkCount, channels) =>
      `Collatéral, dette et facteur de santé Aave V3 et V4 sur ${networkCount} réseaux, puis des alertes par ${channels}, un seuil par marché.`,
    title: "Positions Aave V3 et V4 et alertes de facteur de santé",
    networkMarkets: (name, markets) => `${name} (marchés ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Connectez le wallet avec lequel vous empruntez pour voir son collatéral, sa dette et son facteur de santé sur Aave V3 sur ${v3Networks}, et dans chaque Spoke d'Aave V4 sur ${v4Networks}. La consultation ne demande aucune transaction.`,
    disclosureSummary: "Ce que coûtent les alertes et à quelle fréquence nous vérifions",
    alertsCost: (channels, paymentChain) =>
      `Pour recevoir un message par ${channels} quand le facteur de santé d'un marché passe sous un seuil que vous choisissez, débloquez les alertes avec un paiement en USDC${paymentChain ? ` sur ${paymentChain}` : ""}. Le prix actuel est affiché avant que vous payiez.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping vérifie ${plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` })}. Tant que le facteur de santé reste sous votre seuil, vous recevez un message toutes les ${repeatMinutes} minutes sur chaque canal que vous avez choisi.`,
    guideThreshold: "Comment choisir un seuil",
    guideAlerts: "Comment fonctionnent les alertes",
    morphoDashboard: "Vous empruntez sur Morpho ? Ouvrez le tableau de bord Morpho",
  },
  gate: {
    title: "Connectez un wallet pour continuer",
    description:
      "Tokenping a besoin de l'adresse de votre wallet pour afficher vos positions Aave. La connexion ne déplace aucun fonds et se fait sans frais.",
    connect: "Connecter le wallet",
    connecting: "Connexion en cours",
    approveInWallet: "Approuvez la connexion dans votre wallet.",
  },
  positionsHeading: "Vos positions Aave",
  loadingDashboard: "Chargement de votre tableau de bord",
  toolbar: {
    wallet: "Wallet",
    refresh: "Actualiser les positions",
    refreshing: "Actualisation",
    loadingPositions: "Chargement des positions",
  },
  errors: {
    positionsDidNotLoad: "Les positions n'ont pas pu être chargées",
    refreshFailed: "L'actualisation a échoué",
    showingLastPositions: "Affichage des positions du dernier chargement réussi.",
    tryAgain: "Réessayer",
    fetchPositionsFailed: "Impossible de récupérer les positions Aave",
  },
  totals: {
    supplied: "Total déposé",
    borrowed: "Total emprunté",
    netWorth: "Valeur nette",
    noData: "Aucune donnée",
  },
  networks: {
    heading: "Marchés",
    active: count => plural("fr", count, { one: `${count} actif`, other: `${count} actifs` }),
    noPositions: "Aucune position Aave active détectée dans les marchés pris en charge.",
    selectedRegion: "Marché sélectionné",
    noneSelectedTitle: "Aucun marché sélectionné",
    noneSelectedDescription: "Sélectionnez un marché pour voir votre position Aave.",
    otherMarkets: count => `Autres marchés (${count})`,
    otherMarketsHint: "Marchés vérifiés par Tokenping où ce wallet n'a ni position ni alerte.",
    alertSet: "Alerte configurée",
    supplied: usd => `${usd} déposés,`,
    borrowed: usd => `${usd} empruntés`,
    noPosition: "Aucune position",
  },
  healthFactor: {
    srPrefix: "Facteur de santé ",
    noDebt: "Aucune dette",
    critical: "Critique",
    risky: "Risqué",
    safe: "Sûr",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Marché Aave V3"),
    noPositionTitle: chainName => `Aucune position active ${frOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave n'indique ni collatéral ni dette pour ce wallet ${frOnMarket(chainName)}.`,
    collateral: "Collatéral",
    debt: "Dette",
    netWorth: "Valeur nette",
    suppliedTitle: "Déposé",
    borrowedTitle: "Emprunté",
    noCollateral: "Aucun collatéral déposé",
    noDebt: "Aucune dette en cours",
    tokenIconsFrom: "Icônes des tokens et des réseaux fournies par",
    tokenDetailsFailedTitle: "Les détails des tokens n'ont pas pu être chargés",
    tokenDetailsFailedBody:
      "Les totaux ci-dessus proviennent du résumé de compte d'Aave. Actualisez les positions pour réessayer.",
  },
  tokens: {
    asset: "Actif",
    supplied: "Déposé",
    supplyApy: "APY de dépôt",
    collateral: "Collatéral",
    borrowed: "Emprunté",
    rateType: "Type de taux",
    enabled: "Activé",
    disabled: "Désactivé",
    stable: amount => `Stable ${amount}`,
    variable: amount => `Variable ${amount}`,
    count: count => plural("fr", count, { one: `${count} actif`, other: `${count} actifs` }),
  },
  address: {
    defaultLabel: "Adresse",
    copy: (_label, address) => `Copier l'adresse ${address}`,
    copied: "Adresse copiée",
    copyFailed: "Copie impossible. Sélectionnez l'adresse et copiez-la manuellement.",
  },
  opensInNewTab: "(s'ouvre dans un nouvel onglet)",
  paywall: {
    unlockedUntil: date => `Alertes débloquées jusqu'au ${date}`,
    titleNew: "Débloquer les alertes de facteur de santé",
    titleExtend: "Prolonger l'accès pour modifier vos alertes",
    descriptionNew:
      "Payez une fois pour débloquer les paramètres d'alerte et fixer un seuil de facteur de santé pour chaque réseau. Rien ne se renouvelle automatiquement : vous payez depuis votre wallet quand vous voulez prolonger.",
    descriptionExtend:
      "Vos précédents paramètres d'alerte sont enregistrés. Payez à nouveau pour prolonger l'accès et les modifier.",
    networkDescriptionNew: chainName =>
      `Payez une fois pour configurer des alertes de facteur de santé ${frOnMarket(chainName)} et sur d'autres marchés. Rien ne se renouvelle automatiquement : vous payez depuis votre wallet quand vous voulez prolonger.`,
    networkDescriptionExtend: chainName =>
      `Vos paramètres d'alerte enregistrés ${frForMarket(chainName)} sont toujours dans votre compte. Payez à nouveau pour prolonger l'accès et les modifier.`,
    connectWallet: "Connectez votre wallet pour payer l'accès.",
    unconfigured: "Aucun contrat de paiement n'est configuré pour ce réseau.",
    noPlan: "Aucune formule payante n'est disponible pour le moment.",
    paused: "Les paiements sont suspendus pour le moment. Réessayez plus tard.",
    statusUnavailable: "Impossible de charger l'état du paiement. Rechargez la page pour réessayer.",
    wrongNetworkTitle: "Mauvais réseau",
    wrongNetworkBody: (walletChain, target) =>
      `Votre wallet est ${walletChain ? `sur ${walletChain}` : "sur un autre réseau"}. Passez ${target ? `à ${target}` : "au réseau de paiement"} pour payer.`,
    switchTo: target => (target ? `Passer à ${target}` : "Passer au réseau de paiement"),
    switching: "Changement de réseau",
    loadingDetails: "Chargement des détails du paiement",
    price: "Prix",
    access: "Accès",
    network: "Réseau",
    networkFee: "Frais de réseau",
    networkFeeValue: symbol => `Payés en ${symbol} à chaque étape, affichés dans votre wallet`,
    period: (days, about) => (about ? `Environ ${frDays(days)}` : frDays(days)),
    pay: amount => `Payer ${amount}`,
    extend: (days, amount) => `Ajouter ${frDays(days)} pour ${amount}`,
    extendHint: days =>
      `Chaque paiement ajoute ${frDays(days)} après votre date de fin actuelle. Payez autant de fois que vous le souhaitez ; rien ne se renouvelle tout seul.`,
    accessExtended: date => `Accès prolongé jusqu'au ${date}.`,
    accessActive: "Accès actif. Vous pouvez maintenant configurer les alertes.",
    paymentPending: "Paiement confirmé. L'accès apparaîtra sous peu.",
    loading: {
      processing: "Traitement en cours",
      waitingForWallet: "En attente de votre wallet",
      approving: "Autorisation en cours",
      paying: "Paiement en cours",
    },
    unavailable: "L'accès payant n'est pas disponible pour le moment.",
    checkFailed: "Impossible de vérifier l'état du paiement. Réessayez dans un instant.",
    approvalNotVisible: "L'autorisation est confirmée mais pas encore visible. Réessayez dans un instant.",
  },
  payment: {
    stepsLabel: "Étapes du paiement",
    approveTitle: amount => `Autoriser ${amount}`,
    approveHint:
      "Permet au contrat de paiement de prélever exactement ce montant. Étape sautée si une autorisation précédente le couvre déjà.",
    payTitle: amount => `Payer ${amount}`,
    payHint: "Envoie le paiement et débloque les alertes.",
    inProgress: "En cours",
    done: "Terminé",
    notNeeded: "Pas nécessaire",
    transaction: "Transaction ",
    viewOn: explorer => `Voir sur ${explorer}`,
    preparingTitle: "Préparation du paiement",
    preparingBody: "Vérification du prix actuel et de votre autorisation.",
    confirmTitle: "Confirmez dans votre wallet",
    approveSignBody: amount =>
      `Étape 1 sur 2 : autoriser ${amount}. Rien n'est envoyé tant que vous n'avez pas confirmé.`,
    processingOn: network => (network ? `Traitement sur ${network}` : "Traitement sur le réseau"),
    approvePendingBody:
      "Étape 1 sur 2 : autorisation envoyée. Votre wallet vous demandera ensuite de confirmer le paiement.",
    paySignBody: amount => `Étape 2 sur 2 : payer ${amount}. Rien n'est envoyé tant que vous n'avez pas confirmé.`,
    payPendingBody: "Étape 2 sur 2 : paiement envoyé. Les alertes se débloquent dès que le réseau le confirme.",
  },
};
