import { capitalize, csForMarket, csOnMarket, plural } from "~~/i18n/format";
import type { Locale, Localized } from "~~/i18n/locales";
import type { NotificationService } from "~~/types/notifications";
import { getErrorMessage } from "~~/utils/errors";

// The alert settings card on the dashboard: the empty state, the form, the summary, the Telegram handshake, the
// toasts and the attribution question. The alert message itself is in notifications.ts.

/** What a failed Save says under a field (and in the error summary). Each one says how to fix the field. */
export type NotificationFormErrorMessages = {
  noService: string;
  noEmail: string;
  invalidEmail: string;
  noSignal: string;
  invalidSignal: string;
  telegramUnknown: string;
  telegramNotLinked: string;
};

type AlertsMessages = {
  // The card
  cardTitle: string;
  active: string;
  payToEdit: string;
  editAlert: string;
  // First use on a network
  emptyTitle: (chainName: string) => string;
  emptyDescription: string;
  createAlert: string;
  // The configs did not load; also the Telegram status
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
  // Telegram
  telegramLegend: string;
  telegramStatusUnknown: string;
  telegramConnected: (username: string | null | undefined) => string;
  disconnectTelegram: string;
  disconnecting: string;
  connectTelegram: string;
  waitingForTelegram: string;
  telegramDidNotOpen: string;
  openTelegram: string;
  opensInNewTab: string;
  /** The help under Connect, around the bot's Start button, which is set in bold. */
  telegramHelp: { beforeStart: string; start: string; afterStart: string };
  // Threshold
  thresholdLabel: string;
  thresholdExactValue: string;
  thresholdScale: { critical: string; safe: string; verySafe: string };
  thresholdDescription: (threshold: string, chainName: string) => string;
  // Form actions and the delete confirmation
  saveAlert: string;
  saving: string;
  cancel: string;
  deleteAlert: string;
  deleting: string;
  keepAlert: string;
  deleteTitle: string;
  deleteDescription: (chainName: string) => string;
  // Errors
  errorSummaryTitle: (count: number) => string;
  formErrors: NotificationFormErrorMessages;
  // Summary
  summaryServices: string;
  summaryNoServices: string;
  summaryEmail: string;
  summarySignal: string;
  summaryTelegram: string;
  summaryTelegramLinked: string;
  summaryThreshold: string;
  belowThresholdTitle: string;
  belowThresholdDescription: (healthFactor: string, threshold: string) => string;
  // Toasts and live-region announcements
  alertSaved: string;
  saveFailed: string;
  alertDeleted: string;
  deleteFailed: string;
  telegramConnectedToast: (username: string | null | undefined) => string;
  telegramDisconnectedToast: string;
  telegramConnectFailed: string;
  telegramDisconnectFailed: string;
  telegramTimedOut: string;
  connectWalletFirst: string;
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

const ATTRIBUTION_QUESTION: Localized<string> = {
  en: "How did you hear about Tokenping?",
  cs: "Jak jste se o Tokenpingu dozvěděli?",
};

export const ALERTS_MESSAGES: Localized<AlertsMessages> = {
  en: {
    cardTitle: "Notification settings",
    active: "Active",
    payToEdit: "Pay for access to edit",
    editAlert: "Edit alert",
    emptyTitle: chainName => `No alerts on ${chainName} yet`,
    emptyDescription: "Get a message when your health factor drops below a threshold you choose.",
    createAlert: "Create alert",
    loadErrorTitle: "Notification settings did not load",
    loadErrorDescription: "Check your connection and try again.",
    tryAgain: "Try again",
    retrying: "Retrying",
    servicesLegend: "Notification services",
    servicesDescription: "Choose where alerts go. You can pick more than one.",
    serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
    emailLabel: "Email address",
    emailDescription: "Alerts are sent to this address.",
    emailPlaceholder: "you@example.com",
    signalLabel: "Signal username",
    signalDescription: "In Signal, open Settings, then Profile. It looks like alice.42.",
    telegramLegend: "Telegram",
    telegramStatusUnknown: "Couldn't check your Telegram link",
    telegramConnected: username => (username ? `Connected as @${username}` : "Connected"),
    disconnectTelegram: "Disconnect Telegram",
    disconnecting: "Disconnecting",
    connectTelegram: "Connect Telegram",
    waitingForTelegram: "Waiting for Telegram",
    telegramDidNotOpen: "Telegram did not open?",
    openTelegram: "Open Telegram",
    opensInNewTab: "(opens in a new tab)",
    telegramHelp: {
      beforeStart: "Opens our bot in Telegram. Press ",
      start: "Start",
      afterStart: " there to link this wallet to your chat.",
    },
    thresholdLabel: "Health factor threshold",
    thresholdExactValue: "(exact value)",
    thresholdScale: { critical: "Critical", safe: "Safe", verySafe: "Very safe" },
    thresholdDescription: (threshold, chainName) =>
      `You'll be notified when your health factor drops below ${threshold} on ${chainName}.`,
    saveAlert: "Save alert",
    saving: "Saving",
    cancel: "Cancel",
    deleteAlert: "Delete alert",
    deleting: "Deleting",
    keepAlert: "Keep alert",
    deleteTitle: "Delete this alert?",
    deleteDescription: chainName => `Tokenping stops sending health factor alerts for ${chainName}.`,
    errorSummaryTitle: count =>
      plural("en", count, { one: `Fix ${count} field to save`, other: `Fix ${count} fields to save` }),
    formErrors: {
      noService: "Select at least one notification service.",
      noEmail: "Enter your email address.",
      invalidEmail: "Enter an email address like name@example.com.",
      noSignal: "Enter your Signal username.",
      invalidSignal: "Enter a Signal username like alice.42. Find yours in Signal under Settings, then Profile.",
      telegramUnknown: "Select Try again to check your Telegram link, then save.",
      telegramNotLinked: "Connect Telegram before you save.",
    },
    summaryServices: "Services",
    summaryNoServices: "None selected",
    summaryEmail: "Email",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryTelegramLinked: "Linked",
    summaryThreshold: "Threshold",
    belowThresholdTitle: "Below your alert threshold",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Your current health factor (${healthFactor}) is below your threshold of ${threshold}.`,
    alertSaved: "Alert saved",
    saveFailed: "Couldn't save your alert",
    alertDeleted: "Alert deleted",
    deleteFailed: "Couldn't delete your alert",
    telegramConnectedToast: username => (username ? `Telegram connected as @${username}` : "Telegram connected"),
    telegramDisconnectedToast: "Telegram disconnected",
    telegramConnectFailed: "Failed to connect Telegram",
    telegramDisconnectFailed: "Failed to disconnect Telegram",
    telegramTimedOut: "Telegram link timed out. Try again.",
    connectWalletFirst: "Connect your wallet first",
    attributionQuestion: ATTRIBUTION_QUESTION.en,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.en} (optional)`,
    attributionDescription: "Helps us learn which channels work. Saved with your wallet address.",
    attributionEmpty: "Enter an answer, or select Skip.",
    attributionInvalid: reason => reason,
    attributionSendFailed: "Couldn't send your answer. Try again or skip.",
    sendAnswer: "Send answer",
    sending: "Sending",
    skip: "Skip",
    answerSent: "Answer sent",
  },
  cs: {
    cardTitle: "Nastavení upozornění",
    active: "Aktivní",
    payToEdit: "Pro úpravy zaplaťte přístup",
    editAlert: "Upravit upozornění",
    emptyTitle: chainName => `${capitalize(csOnMarket(chainName))} zatím nemáte žádné upozornění`,
    emptyDescription: "Dostanete zprávu, když váš health factor klesne pod práh, který si zvolíte.",
    createAlert: "Vytvořit upozornění",
    loadErrorTitle: "Nastavení upozornění se nenačetlo",
    loadErrorDescription: "Zkontrolujte připojení a zkuste to znovu.",
    tryAgain: "Zkusit znovu",
    retrying: "Zkoušíme znovu",
    servicesLegend: "Kanály upozornění",
    servicesDescription: "Vyberte, kam upozornění posílat. Můžete zvolit i více kanálů.",
    serviceNames: { email: "E-mail", signal: "Signal", telegram: "Telegram" },
    emailLabel: "E-mailová adresa",
    emailDescription: "Upozornění pošleme na tuto adresu.",
    emailPlaceholder: "jmeno@example.com",
    signalLabel: "Uživatelské jméno v Signalu",
    signalDescription: "V Signalu otevřete Nastavení a potom Profil. Vypadá jako alice.42.",
    telegramLegend: "Telegram",
    telegramStatusUnknown: "Propojení s Telegramem se nepodařilo ověřit",
    telegramConnected: username => (username ? `Připojeno jako @${username}` : "Připojeno"),
    disconnectTelegram: "Odpojit Telegram",
    disconnecting: "Odpojujeme",
    connectTelegram: "Připojit Telegram",
    waitingForTelegram: "Čekáme na Telegram",
    telegramDidNotOpen: "Telegram se neotevřel?",
    openTelegram: "Otevřít Telegram",
    opensInNewTab: "(otevře se v nové kartě)",
    telegramHelp: {
      beforeStart: "Otevře našeho bota v Telegramu. Stiskněte tam ",
      start: "Start",
      afterStart: " a tato peněženka se propojí s vaším chatem.",
    },
    thresholdLabel: "Prahová hodnota health factoru",
    thresholdExactValue: "(přesná hodnota)",
    thresholdScale: { critical: "Kritický", safe: "Bezpečný", verySafe: "Velmi bezpečný" },
    thresholdDescription: (threshold, chainName) =>
      `Upozorníme vás, když váš health factor ${csOnMarket(chainName)} klesne pod ${threshold}.`,
    saveAlert: "Uložit upozornění",
    saving: "Ukládáme",
    cancel: "Zrušit",
    deleteAlert: "Smazat upozornění",
    deleting: "Mažeme",
    keepAlert: "Ponechat upozornění",
    deleteTitle: "Smazat toto upozornění?",
    deleteDescription: chainName => `Tokenping přestane posílat upozornění na health factor ${csForMarket(chainName)}.`,
    errorSummaryTitle: count =>
      plural("cs", count, {
        one: `Před uložením opravte ${count} pole`,
        few: `Před uložením opravte ${count} pole`,
        other: `Před uložením opravte ${count} polí`,
      }),
    formErrors: {
      noService: "Vyberte alespoň jeden kanál upozornění.",
      noEmail: "Zadejte svou e-mailovou adresu.",
      invalidEmail: "Zadejte e-mailovou adresu ve tvaru jmeno@example.com.",
      noSignal: "Zadejte své uživatelské jméno v Signalu.",
      invalidSignal:
        "Zadejte uživatelské jméno v Signalu ve tvaru alice.42. Najdete ho v Signalu v Nastavení, v části Profil.",
      telegramUnknown: "Ověřte propojení s Telegramem tlačítkem Zkusit znovu a potom uložte.",
      telegramNotLinked: "Před uložením připojte Telegram.",
    },
    summaryServices: "Kanály",
    summaryNoServices: "Žádný nevybrán",
    summaryEmail: "E-mail",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryTelegramLinked: "Propojeno",
    summaryThreshold: "Práh",
    belowThresholdTitle: "Pod prahem vašeho upozornění",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Váš aktuální health factor (${healthFactor}) je pod vaším prahem ${threshold}.`,
    alertSaved: "Upozornění uloženo",
    saveFailed: "Upozornění se nepodařilo uložit",
    alertDeleted: "Upozornění smazáno",
    deleteFailed: "Upozornění se nepodařilo smazat",
    telegramConnectedToast: username => (username ? `Telegram připojen jako @${username}` : "Telegram připojen"),
    telegramDisconnectedToast: "Telegram odpojen",
    telegramConnectFailed: "Telegram se nepodařilo připojit",
    telegramDisconnectFailed: "Telegram se nepodařilo odpojit",
    telegramTimedOut: "Čas na propojení s Telegramem vypršel. Zkuste to znovu.",
    connectWalletFirst: "Nejdřív připojte peněženku",
    attributionQuestion: ATTRIBUTION_QUESTION.cs,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.cs} (nepovinné)`,
    attributionDescription: "Pomůže nám zjistit, které kanály fungují. Uloží se s adresou vaší peněženky.",
    attributionEmpty: "Napište odpověď, nebo vyberte Přeskočit.",
    // The checks behind it (length, hidden control characters) only fail for pasted text.
    attributionInvalid: () => "Odpověď je příliš dlouhá nebo obsahuje skryté znaky. Přepište ji a zkuste to znovu.",
    attributionSendFailed: "Odpověď se nepodařilo odeslat. Zkuste to znovu, nebo ji přeskočte.",
    sendAnswer: "Odeslat odpověď",
    sending: "Odesíláme",
    skip: "Přeskočit",
    answerSent: "Odpověď odeslána",
  },
};

/**
 * A failed request's message for a toast. The API answers in English, so English shows the server's reason and Czech
 * shows its own fallback.
 */
export const requestErrorMessage = (locale: Locale, error: unknown, fallback: string) =>
  locale === "en" ? getErrorMessage(error, fallback) : fallback;
