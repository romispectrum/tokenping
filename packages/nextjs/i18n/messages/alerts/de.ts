import type { AlertsMessages } from "./shared";
import { deForMarket, deOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Wie hast du von Tokenping erfahren?";

export const MESSAGES: AlertsMessages = {
  cardTitle: "Alert-Einstellungen",
  active: "Aktiv",
  payToEdit: "Zum Bearbeiten Zugang bezahlen",
  editAlert: "Alert bearbeiten",
  signInTitle: "Melde dich an, um deine Alerts zu verwalten",
  signInDescription:
    "Deine Wallet signiert eine Nachricht, die beweist, dass die Adresse dir gehört. Das ist keine Transaktion und kostet kein Gas.",
  signIn: "Mit Wallet anmelden",
  signingIn: "Warte auf deine Wallet",
  signInStatement: "Melde dich bei Tokenping an, um deine Health-Factor-Alerts zu sehen und zu bearbeiten.",
  signInRejected: "Du hast die Signaturanfrage abgelehnt. Melde dich an, um deine Alerts zu sehen und zu bearbeiten.",
  signInFailed: "Die Anmeldung hat nicht geklappt. Versuch es noch einmal.",
  signInExpired: "Deine Anmeldung ist abgelaufen. Melde dich noch einmal mit deiner Wallet an.",
  emptyTitle: (chainName, kind) => `Noch keine Alerts ${deOnMarket(chainName, kind)}`,
  emptyDescription: "Erhalte eine Nachricht, wenn dein Health Factor unter einen Schwellenwert fällt, den du wählst.",
  createAlert: "Alert erstellen",
  loadErrorTitle: "Die Alert-Einstellungen wurden nicht geladen",
  loadErrorDescription: "Prüfe deine Verbindung und versuch es noch einmal.",
  tryAgain: "Erneut versuchen",
  retrying: "Neuer Versuch",
  servicesLegend: "Alert-Kanäle",
  servicesDescription: "Wähle, wohin die Alerts gehen. Du kannst mehr als einen Kanal wählen.",
  serviceNames: { email: "E-Mail", signal: "Signal", telegram: "Telegram" },
  emailLabel: "E-Mail-Adresse",
  emailDescription: "Die Alerts gehen an diese Adresse.",
  emailPlaceholder: "name@example.com",
  signalLabel: "Signal-Benutzername",
  signalDescription: "Öffne in Signal die Einstellungen, dann Profil. Er sieht aus wie alice.42.",
  telegramLabel: "Telegram-Benutzername",
  telegramDescription:
    "Die Alerts gehen an dieses Telegram-Konto. Deinen Benutzernamen findest du in Telegram unter Einstellungen, dann Benutzername.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Wird geprüft",
  telegramLinked: username => `@${username} ist verknüpft: Die Alerts kommen in deinem Telegram-Chat an.`,
  telegramPressStart: bot => `Noch nicht verknüpft: Drück einmal auf Start ${bot ? `in @${bot}` : "im Tokenping-Bot"}.`,
  openBot: bot => `@${bot} öffnen`,
  telegramStatusUnknown:
    "Wir konnten nicht prüfen, ob dieser Benutzername verknüpft ist. Speichern kannst du trotzdem.",
  opensInNewTab: "(öffnet sich in einem neuen Tab)",
  channelLanguageLabels: {
    email: "Sprache der E-Mails",
    signal: "Sprache auf Signal",
    telegram: "Sprache auf Telegram",
  },
  thresholdLabel: "Health-Factor-Schwellenwert",
  thresholdExactValue: "(genauer Wert)",
  thresholdScale: { critical: "Kritisch", safe: "Sicher", verySafe: "Sehr sicher" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Du wirst benachrichtigt, wenn dein Health Factor ${deOnMarket(chainName, kind)} unter ${threshold} fällt.`,
  saveAlert: "Alert speichern",
  saving: "Wird gespeichert",
  cancel: "Abbrechen",
  deleteAlert: "Alert löschen",
  deleting: "Wird gelöscht",
  keepAlert: "Alert behalten",
  deleteTitle: "Diesen Alert löschen?",
  deleteDescription: (chainName, kind) =>
    `Tokenping sendet keine Health-Factor-Alerts mehr ${deForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("de", count, {
      one: `Korrigiere ${count} Feld, um zu speichern`,
      other: `Korrigiere ${count} Felder, um zu speichern`,
    }),
  formErrors: {
    noService: "Wähle mindestens einen Alert-Kanal.",
    noEmail: "Gib deine E-Mail-Adresse ein.",
    invalidEmail: "Gib eine E-Mail-Adresse wie name@example.com ein.",
    noSignal: "Gib deinen Signal-Benutzernamen ein.",
    invalidSignal:
      "Gib einen Signal-Benutzernamen wie alice.42 ein. Deinen findest du in Signal unter Einstellungen, dann Profil.",
    noTelegram: "Gib deinen Telegram-Benutzernamen ein.",
    invalidTelegram:
      "Gib einen Telegram-Benutzernamen wie alice_eth ein: 4 bis 32 Buchstaben, Ziffern oder Unterstriche, mit einem Buchstaben am Anfang und ohne _ am Ende.",
  },
  summaryServices: "Kanäle",
  summaryNoServices: "Keiner ausgewählt",
  summaryEmail: "E-Mail",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Sprache",
  summaryTelegramNotLinked: bot => `Noch nicht verknüpft: Drück einmal auf Start in @${bot}.`,
  summaryThreshold: "Schwellenwert",
  sendTest: "Test senden",
  sendingTest: "Wird gesendet",
  testAgainIn: minutes => `Wieder in ${minutes} Min.`,
  testSent: channel => `Testnachricht über ${channel} gesendet. Prüfe, ob sie angekommen ist.`,
  testFailed: "Die Testnachricht wurde nicht gesendet",
  testLimitNote: minutes =>
    `Ein Test sendet diesen Alert und deine Position, wie sie gerade sind. Einer pro Kanal ${plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` })}.`,
  belowThresholdTitle: "Unter deinem Alert-Schwellenwert",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Dein aktueller Health Factor (${healthFactor}) liegt unter deinem Schwellenwert von ${threshold}.`,
  alertSaved: "Alert gespeichert",
  saveFailed: "Dein Alert konnte nicht gespeichert werden",
  alertDeleted: "Alert gelöscht",
  deleteFailed: "Dein Alert konnte nicht gelöscht werden",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (optional)`,
  attributionDescription:
    "Hilft uns zu verstehen, welche Kanäle funktionieren. Wird mit deiner Wallet-Adresse gespeichert.",
  attributionEmpty: "Gib eine Antwort ein oder wähle Überspringen.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () =>
    "Die Antwort ist zu lang oder enthält versteckte Zeichen. Schreib sie neu und versuch es noch einmal.",
  attributionSendFailed: "Deine Antwort konnte nicht gesendet werden. Versuch es noch einmal oder überspring sie.",
  sendAnswer: "Antwort senden",
  sending: "Wird gesendet",
  skip: "Überspringen",
  answerSent: "Antwort gesendet",
};
