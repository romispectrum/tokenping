import type { MarketNameKind } from "~~/i18n/format";
import type { NotificationService } from "~~/types/notifications";

/** What a failed Save says under a field (and in the error summary). Each one says how to fix the field. */
export type NotificationFormErrorMessages = {
  noService: string;
  noEmail: string;
  invalidEmail: string;
  noSignal: string;
  invalidSignal: string;
  noTelegram: string;
  invalidTelegram: string;
};

export type AlertsMessages = {
  // The card
  cardTitle: string;
  active: string;
  payToEdit: string;
  editAlert: string;
  // Signing in with the wallet before alerts load (Sign-in with Ethereum)
  signInTitle: string;
  signInDescription: string;
  signIn: string;
  signingIn: string;
  /** The wallet's "Sign in" line, in the message it signs. One line, no line breaks. */
  signInStatement: string;
  signInRejected: string;
  signInFailed: string;
  /** A request answered 401: the session ended (expired, or signed in with another wallet in another tab). */
  signInExpired: string;
  // First use on a network
  /** `kind` says what the name names, for Czech and Spanish; an Aave label's own form when left out. */
  emptyTitle: (chainName: string, kind?: MarketNameKind) => string;
  emptyDescription: string;
  createAlert: string;
  // The configs did not load
  loadErrorTitle: string;
  loadErrorDescription: string;
  tryAgain: string;
  retrying: string;
  // Channels
  servicesLegend: string;
  servicesDescription: string;
  serviceNames: Record<NotificationService, string>;
  // Recipients
  emailLabel: string;
  emailDescription: string;
  emailPlaceholder: string;
  signalLabel: string;
  signalDescription: string;
  // Telegram: a username, then whether it has pressed Start in the bot
  telegramLabel: string;
  telegramDescription: string;
  telegramPlaceholder: string;
  telegramChecking: string;
  telegramLinked: (username: string) => string;
  /** Not linked yet: the person has to press Start in the bot (`bot`, without "@"; undefined while none is set). */
  telegramPressStart: (bot: string | undefined) => string;
  /** The link to the bot next to it. */
  openBot: (bot: string) => string;
  telegramStatusUnknown: string;
  opensInNewTab: string;
  // The language each channel's alerts are written in
  channelLanguageLabels: Record<NotificationService, string>;
  // Threshold
  thresholdLabel: string;
  thresholdExactValue: string;
  thresholdScale: { critical: string; safe: string; verySafe: string };
  thresholdDescription: (threshold: string, chainName: string, kind?: MarketNameKind) => string;
  // Form actions and the delete confirmation
  saveAlert: string;
  saving: string;
  cancel: string;
  deleteAlert: string;
  deleting: string;
  keepAlert: string;
  deleteTitle: string;
  deleteDescription: (chainName: string, kind?: MarketNameKind) => string;
  // Errors
  errorSummaryTitle: (count: number) => string;
  formErrors: NotificationFormErrorMessages;
  // Summary
  summaryServices: string;
  summaryNoServices: string;
  summaryEmail: string;
  summarySignal: string;
  summaryTelegram: string;
  /** Read before the channel's language in the summary ("Language: English"); visually hidden. */
  summaryLanguage: string;
  /** Under the username in the summary while it has not pressed Start. */
  summaryTelegramNotLinked: (bot: string) => string;
  summaryThreshold: string;
  // "Send test" in the summary, one per channel every 15 minutes
  sendTest: string;
  sendingTest: string;
  /** The button while its channel cools down: "Again in 12 min". */
  testAgainIn: (minutes: number) => string;
  testSent: (channel: string) => string;
  testFailed: string;
  testLimitNote: (minutes: number) => string;
  belowThresholdTitle: string;
  belowThresholdDescription: (healthFactor: string, threshold: string) => string;
  // Toasts and live-region announcements
  alertSaved: string;
  saveFailed: string;
  alertDeleted: string;
  deleteFailed: string;
  // The attribution question after the first save
  attributionQuestion: string;
  /** The form's accessible name: the question plus the label's "(optional)". */
  attributionFormLabel: string;
  attributionDescription: string;
  attributionEmpty: string;
  /** A rejected answer; `reason` is the English check's message (services/notifications/attributionInput). */
  attributionInvalid: (reason: string) => string;
  attributionSendFailed: string;
  sendAnswer: string;
  sending: string;
  skip: string;
  answerSent: string;
};
