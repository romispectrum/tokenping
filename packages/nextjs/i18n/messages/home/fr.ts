import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 jours", "1 jour". */
const frDays = (days: number) => plural("fr", days, { one: `${days} jour`, other: `${days} jours` });

/** "toutes les 5 minutes", "chaque minute". */
const frEveryMinutes = (minutes: number) =>
  plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` });

/** "29 réseaux", "1 réseau". */
const frNetworks = (networks: number) =>
  plural("fr", networks, { one: `${networks} réseau`, other: `${networks} réseaux` });

/** "sur 29 réseaux", "sur 1 réseau". */
const frOnNetworks = (networks: number) => `sur ${frNetworks(networks)}`;

/** "24 marchés V3", "1 marché V3". */
const frV3Markets = (markets: number) =>
  plural("fr", markets, { one: `${markets} marché V3`, other: `${markets} marchés V3` });

/** "13 Spokes V4", "1 Spoke V4". */
const frV4Spokes = (spokes: number) =>
  plural("fr", spokes, { one: `${spokes} Spoke V4`, other: `${spokes} Spokes V4` });

/** "sur Arbitrum One", or the payment network unnamed. */
const frOnChain = (chainName: string | undefined) => (chainName ? `sur ${chainName}` : "sur le réseau de paiement");

export const MESSAGES: HomeMessages = {
  headline: channels => `Alertes de facteur de santé Aave et Morpho par ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alertes par ${channels} quand votre facteur de santé Aave ou Morpho est sous votre seuil, ${frOnNetworks(networks)}, ${frEveryMinutes(minutes)}.`
      : `Alertes par ${channels} quand votre facteur de santé Aave ou Morpho passe sous votre seuil, ${frOnNetworks(networks)}. Vérification ${frEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Configurer les alertes : ${formatDecimal("fr", plan.priceLabel)} pour ${frDays(plan.days)}`
      : "Configurer les alertes",
  offerDescription: ({ days, currency }) =>
    `Alertes de facteur de santé pendant ${frDays(days)}, payées en ${currency} depuis votre wallet. Sans renouvellement automatique.`,

  kicker: "Aave V3 et V4, Morpho Blue et Midnight",
  heroLead: ({ minutes, channels }) =>
    `Vérification ${frEveryMinutes(minutes)}. Un message par ${channels} tant que vous êtes sous votre seuil. En lecture seule, aucune autorisation.`,
  networksLabel: "Réseaux",
  heroCoverage: networks => frNetworks(networks),
  channelsLabel: "Alertes par :",
  exampleAlertLabel: "Ce que dit une alerte",
  exampleAlertCaption: subject => `Exemple. Les e-mails arrivent avec l'objet « ${subject} ».`,

  dashboardCta: "Ouvrir le tableau de bord Aave",
  morphoDashboardCta: "Ouvrir le tableau de bord Morpho",
  dashboardCtaMicrocopy: alertPrice =>
    `Connectez un wallet et voyez toutes vos positions. Les alertes coûtent ${alertPrice}.`,

  problemTitle: "Le facteur de santé baisse pendant que vous dormez",
  problemLead:
    "Aave affiche votre facteur de santé mais n'envoie aucune alerte (octobre 2026). Trois choses le font bouger pendant la nuit :",
  problemCauses: [
    { title: "Les prix baissent", body: "L'ETH chute et votre collatéral vaut moins." },
    { title: "Les intérêts s'accumulent", body: "Votre dette augmente à chaque seconde." },
    { title: "Les seuils changent", body: "Sur Aave, la gouvernance peut abaisser un seuil de liquidation." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Des emprunteurs racontent ",
      morning("s'être réveillés avec une position liquidée"),
      ", ",
      failedRepays("une heure de remboursements en échec"),
      " et ",
      polygon("un remboursement à 1,01 arrivé trop tard"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Le liquidateur garde en plus un bonus : 5 % sur le WETH dans le marché Core d'Ethereum (octobre 2026).",
      guide && rich(" Pour en savoir plus : ", guide("comment se déroule une liquidation"), "."),
    ),
  chart: {
    threshold: "votre seuil",
    liquidation: "liquidation",
    alertSent: "Alerte envoyée",
    youCheck: "Vous regardez votre téléphone",
    caption:
      "Une nuit d'exemple. L'alerte part à 03:05, à la première vérification sous 1,5, cinq heures avant que vous regardiez.",
  },

  howItWorksTitle: "Comment ça fonctionne",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` sur ${paymentChain}` : "";
    return [
      {
        title: "Connectez le wallet avec lequel vous empruntez",
        body: "En lecture seule. Aave et Morpho, une page pour chacun.",
      },
      {
        title: plan
          ? `Débloquez les alertes pour ${formatDecimal("fr", plan.priceLabel)}`
          : "Débloquez les alertes avec un petit paiement en USDC",
        body: `${plan ? `${frDays(plan.days)} d'accès, paiement` : "Paiement"} en USDC${paidOn}. Sans renouvellement automatique.`,
      },
      {
        title: "Choisissez un seuil pour chaque marché",
        body: `De ${formatDecimal("fr", threshold.min)} (${formatDecimal("fr", morphoMin)} sur Morpho) à ${formatDecimal("fr", threshold.max)}, ${formatDecimal("fr", threshold.default)} par défaut.`,
      },
      {
        title: "Recevez un message tant que vous êtes en dessous",
        body: `${capitalize(frEveryMinutes(minutes))}, par ${channels}, jusqu'à ce que vous repassiez au-dessus de votre seuil.`,
      },
    ];
  },
  scaleTitle: "Où placer votre seuil",
  scale: {
    liquidation: "liquidation",
    critical: "Critique",
    risky: "Risqué",
    safe: "Sûr",
    defaultThreshold: value => `Par défaut : ${value}`,
    below: value => `Sous ${value}`,
    between: (from, to) => `De ${from} à ${to}`,
    andAbove: value => `${value} et plus`,
    range: (min, max) => `Toute valeur de ${min} à ${max}.`,
  },
  scaleGuide: "Comment choisir un seuil",

  coverageTitle: "Tous les marchés Aave et tous les marchés Morpho listés",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${frV3Markets(v3Markets)} d'Aave ${frOnNetworks(v3Networks)} et ${frV4Spokes(spokes)} d'Aave ${frOnNetworks(v4Networks)}, au 4 novembre 2026, ainsi que tous les marchés Morpho listés ${frOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => frV3Markets(count),
    v4Spokes: count => frV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium et Sonic sont en cours de fermeture par la gouvernance d'Aave et restent surveillés. Non couverts : Aave V3 sur Harmony, les marchés Morpho non listés et les autres protocoles.",

  pricingTitle: "Tarifs",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alertes", detail: capitalize(alertPrice) },
    { term: "Renouvellement", detail: "Jamais automatique : payez à nouveau quand vous voulez plus de temps" },
    {
      term: "Paiement",
      detail: paymentChain
        ? `USDC sur ${paymentChain}, depuis votre wallet (autoriser, puis payer)`
        : "USDC, depuis votre wallet",
    },
  ],
  priceSource: "Le prix est lu dans le contrat de paiement et actualisé toutes les heures.",
  pricingFootnote: "Consulter vos positions ne demande aucun paiement.",

  questionsTitle: "Les questions à poser avant de connecter un wallet",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = frOnChain(paymentChain);
    return [
      {
        question: "Tokenping peut-il toucher à mes fonds ?",
        answer: rich(
          `Non. Tokenping lit uniquement vos positions et ne demande jamais d'autorisation ni de signature sur Aave ou Morpho. Les seules transactions sont le paiement ${onChain} : une autorisation pour exactement le prix, puis le paiement. `,
          links.sourcify
            ? rich(
                "Le contrat est ",
                links.sourcify("vérifié sur Sourcify"),
                " et son ",
                links.sourceCode("code source est public"),
              )
            : links.sourceCode("Le code source du contrat est public"),
          " ; le wallet de l'équipe peut modifier son prix, le mettre en pause et le mettre à jour.",
        ),
      },
      {
        question: "Que stockez-vous ?",
        answer: rich(
          "L'adresse de votre wallet, vos alertes et les coordonnées que vous indiquez (e-mail, nom d'utilisateur Signal",
          hasTelegram ? ", chat Telegram" : "",
          `). Aucun historique et aucun cookie de suivi ; les pages vues sont comptées de façon anonyme. Seule une personne capable de signer avec votre wallet peut lire ces coordonnées, mais les paiements sont publics ${onChain}. La `,
          links.privacy("page de confidentialité"),
          " donne la liste complète.",
        ),
      },
      {
        question: "Combien ça coûte ?",
        answer: rich(
          `Les alertes coûtent ${alertPrice}, en USDC ${onChain}, plus un peu d'ETH pour le gas. Consulter vos positions ne demande aucun paiement. Pas de renouvellement automatique, pas de remboursement.`,
        ),
      },
      {
        question: "Quels prêts Morpho sont couverts ?",
        answer: rich(
          `Les prêts Morpho Blue (taux variable) et Morpho Midnight (taux fixe) dans les marchés listés par l'app Morpho, avec des seuils à partir de ${formatDecimal("fr", morphoMin)}. Un prêt à taux fixe reçoit aussi des rappels avant son échéance. La même formule les couvre : ouvrez le `,
          links.morphoDashboard("tableau de bord Morpho"),
          ".",
        ),
      },
      {
        question: "Et si une alerte n'arrive pas ?",
        answer: rich(
          `La vérification suivante, ${plural("fr", minutes, { one: `${minutes} minute`, other: `${minutes} minutes` })} plus tard, réessaie. L'envoi dépend de Resend, d'un relais Signal,`,
          hasTelegram ? " de la Telegram Bot API," : "",
          " de nœuds RPC publics et du planificateur de Vercel, sans garantie de disponibilité. Choisissez deux canaux et gardez de la marge pour agir.",
        ),
      },
      {
        question: "Comment arrêter les alertes ?",
        answer: rich(
          "Elles s'arrêtent dès que votre facteur de santé repasse au-dessus de votre seuil, ou quand vous supprimez l'alerte (accès actif nécessaire). Accès expiré ? Écrivez-nous sur ",
          links.x("X"),
          " ou dans notre communauté sur ",
          links.telegramCommunity("Telegram"),
          " ou ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " Dans Telegram, /stop fonctionne aussi." : "",
          " Pas encore de mise en pause ni de lien de désabonnement.",
        ),
      },
      {
        question: "Puis-je surveiller un wallet que je ne connecte pas ?",
        answer: rich("Pas pour l'instant. Un seul wallet, celui que vous connectez ; l'accès est lié au wallet."),
      },
      {
        question: "D'autres outils ne coûtent rien. Pourquoi payer ?",
        answer: rich(
          "Si un bot Telegram ou une app mobile vous convient, utilisez-le",
          links.comparison ? rich(" : ", links.comparison("notre comparatif"), " les présente") : null,
          ". Tokenping sert aux alertes par Signal ou e-mail, sur chaque marché Aave et chaque marché Morpho listé.",
        ),
      },
    ];
  },

  limitsTitle: "Les limites, sans détour",
  limits: ({ minutes, paymentChain }) => [
    `Vérification ${frEveryMinutes(minutes)}, pas en continu.`,
    "Chaque vérification sous votre seuil envoie un nouveau message : pas de mise en pause ni de récapitulatif.",
    "Un seuil par marché, uniquement pour le wallet connecté.",
    `USDC${paymentChain ? ` sur ${paymentChain}` : ""} uniquement : pas de carte, pas de remboursement.`,
    "Pas encore de lien de désabonnement dans les e-mails ; supprimer une alerte nécessite un accès actif.",
    "Bêta : envoi par des services tiers, sans garantie de disponibilité.",
  ],

  blogTitle: "Sur le blog",
  allGuides: "Tous les guides Aave et Morpho",

  closingTitle: "Configurez votre alerte de facteur de santé Aave ou Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, payés depuis votre wallet. Sans renouvellement automatique.`,
};
