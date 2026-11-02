import type { AlertsMessages } from "./shared";
import { frForMarket, frOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Comment avez-vous connu Tokenping ?";

export const MESSAGES: AlertsMessages = {
  cardTitle: "Paramètres d'alerte",
  active: "Active",
  payToEdit: "Payer l'accès pour modifier",
  editAlert: "Modifier l'alerte",
  signInTitle: "Connectez-vous pour gérer vos alertes",
  signInDescription:
    "Votre wallet signe un message qui prouve que l'adresse vous appartient. Ce n'est pas une transaction et cela ne coûte aucun gas.",
  signIn: "Se connecter avec le wallet",
  signingIn: "En attente de votre wallet",
  signInStatement: "Connectez-vous à Tokenping pour voir et modifier vos alertes de facteur de santé.",
  signInRejected: "Vous avez refusé la demande de signature. Connectez-vous pour voir et modifier vos alertes.",
  signInFailed: "La connexion a échoué. Réessayez.",
  signInExpired: "Votre session a expiré. Reconnectez-vous avec votre wallet.",
  emptyTitle: (chainName, kind) => `Pas encore d'alerte ${frOnMarket(chainName, kind)}`,
  emptyDescription: "Recevez un message quand votre facteur de santé passe sous un seuil que vous choisissez.",
  createAlert: "Créer une alerte",
  loadErrorTitle: "Les paramètres d'alerte n'ont pas pu être chargés",
  loadErrorDescription: "Vérifiez votre connexion et réessayez.",
  tryAgain: "Réessayer",
  retrying: "Nouvelle tentative",
  servicesLegend: "Canaux d'alerte",
  servicesDescription: "Choisissez où envoyer les alertes. Vous pouvez en choisir plusieurs.",
  serviceNames: { email: "E-mail", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Adresse e-mail",
  emailDescription: "Les alertes sont envoyées à cette adresse.",
  emailPlaceholder: "nom@example.com",
  signalLabel: "Nom d'utilisateur Signal",
  signalDescription: "Dans Signal, ouvrez Paramètres, puis Profil. Il ressemble à alice.42.",
  telegramLabel: "Nom d'utilisateur Telegram",
  telegramDescription:
    "Les alertes sont envoyées à ce compte Telegram. Vous le trouverez dans Telegram sous Paramètres, puis Nom d'utilisateur.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Vérification",
  telegramLinked: username => `@${username} est lié : les alertes arriveront dans votre chat Telegram.`,
  telegramPressStart: bot =>
    `Pas encore lié : appuyez une fois sur Start dans ${bot ? `@${bot}` : "le bot Tokenping"}.`,
  openBot: bot => `Ouvrir @${bot}`,
  telegramStatusUnknown: "Impossible de vérifier si ce nom d'utilisateur est lié. Vous pouvez quand même enregistrer.",
  opensInNewTab: "(s'ouvre dans un nouvel onglet)",
  channelLanguageLabels: {
    email: "Langue des e-mails",
    signal: "Langue sur Signal",
    telegram: "Langue sur Telegram",
  },
  thresholdLabel: "Seuil du facteur de santé",
  thresholdExactValue: "(valeur exacte)",
  thresholdScale: { critical: "Critique", safe: "Sûr", verySafe: "Très sûr" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Vous serez prévenu quand votre facteur de santé ${frOnMarket(chainName, kind)} passera sous ${threshold}.`,
  saveAlert: "Enregistrer l'alerte",
  saving: "Enregistrement",
  cancel: "Annuler",
  deleteAlert: "Supprimer l'alerte",
  deleting: "Suppression",
  keepAlert: "Garder l'alerte",
  deleteTitle: "Supprimer cette alerte ?",
  deleteDescription: (chainName, kind) =>
    `Tokenping cessera d'envoyer des alertes de facteur de santé ${frForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("fr", count, {
      one: `Corrigez ${count} champ pour enregistrer`,
      other: `Corrigez ${count} champs pour enregistrer`,
    }),
  formErrors: {
    noService: "Sélectionnez au moins un canal d'alerte.",
    noEmail: "Saisissez votre adresse e-mail.",
    invalidEmail: "Saisissez une adresse e-mail comme nom@example.com.",
    noSignal: "Saisissez votre nom d'utilisateur Signal.",
    invalidSignal:
      "Saisissez un nom d'utilisateur Signal comme alice.42. Vous trouverez le vôtre dans Signal sous Paramètres, puis Profil.",
    noTelegram: "Saisissez votre nom d'utilisateur Telegram.",
    invalidTelegram:
      "Saisissez un nom d'utilisateur Telegram comme alice_eth : de 4 à 32 lettres, chiffres ou tirets bas, commençant par une lettre et ne finissant pas par _.",
  },
  summaryServices: "Canaux",
  summaryNoServices: "Aucun sélectionné",
  summaryEmail: "E-mail",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Langue",
  summaryTelegramNotLinked: bot => `Pas encore lié : appuyez une fois sur Start dans @${bot}.`,
  summaryThreshold: "Seuil",
  sendTest: "Envoyer un test",
  sendingTest: "Envoi",
  testAgainIn: minutes => `À nouveau dans ${minutes} min`,
  testSent: channel =>
    `Message de test envoyé par ${channel === "E-mail" ? "e-mail" : channel}. Vérifiez qu'il est bien arrivé.`,
  testFailed: "Le message de test n'a pas été envoyé",
  testLimitNote: minutes =>
    `Un test envoie cette alerte et votre position telles qu'elles sont maintenant. Un par canal ${plural("fr", minutes, { one: "chaque minute", other: `toutes les ${minutes} minutes` })}.`,
  belowThresholdTitle: "Sous votre seuil d'alerte",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Votre facteur de santé actuel (${healthFactor}) est sous votre seuil de ${threshold}.`,
  alertSaved: "Alerte enregistrée",
  saveFailed: "Impossible d'enregistrer votre alerte",
  alertDeleted: "Alerte supprimée",
  deleteFailed: "Impossible de supprimer votre alerte",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (facultatif)`,
  attributionDescription:
    "Cela nous aide à savoir quels canaux fonctionnent. Enregistré avec l'adresse de votre wallet.",
  attributionEmpty: "Saisissez une réponse ou sélectionnez Passer.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "La réponse est trop longue ou contient des caractères cachés. Réécrivez-la et réessayez.",
  attributionSendFailed: "Impossible d'envoyer votre réponse. Réessayez ou passez.",
  sendAnswer: "Envoyer la réponse",
  sending: "Envoi",
  skip: "Passer",
  answerSent: "Réponse envoyée",
};
