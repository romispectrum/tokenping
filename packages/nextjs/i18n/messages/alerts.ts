import { type MarketNameKind, capitalize, csForMarket, csOnMarket, esMarket, plural } from "~~/i18n/format";
import type { Locale, Localized } from "~~/i18n/locales";
import { SignInRequiredError } from "~~/services/api/apiClient";
import type { NotificationService } from "~~/types/notifications";
import { getErrorMessage } from "~~/utils/errors";

// The alert settings card on the dashboard: signing in, the empty state, the form, the summary, the Telegram
// username's link status, the toasts and the attribution question. The alert message itself is in notifications.ts.

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

type AlertsMessages = {
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

const ATTRIBUTION_QUESTION: Localized<string> = {
  en: "How did you hear about Tokenping?",
  cs: "Jak jste se o Tokenpingu dozvěděli?",
  es: "¿Cómo te enteraste de Tokenping?",
};

/** The email badge's word ("Correo"), written out in running text. */
const ES_EMAIL_BADGE = "Correo";

export const ALERTS_MESSAGES: Localized<AlertsMessages> = {
  en: {
    cardTitle: "Notification settings",
    active: "Active",
    payToEdit: "Pay for access to edit",
    editAlert: "Edit alert",
    signInTitle: "Sign in to manage your alerts",
    signInDescription:
      "Your wallet signs a message that proves the address is yours. It is not a transaction and costs no gas.",
    signIn: "Sign in with wallet",
    signingIn: "Waiting for your wallet",
    signInStatement: "Sign in to Tokenping to see and edit your health factor alerts.",
    signInRejected: "You declined the signature request. Sign in to see and edit your alerts.",
    signInFailed: "Couldn't sign you in. Try again.",
    signInExpired: "Your sign-in has ended. Sign in with your wallet again.",
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
    telegramLabel: "Telegram username",
    telegramDescription: "Alerts go to this Telegram account. Find it in Telegram under Settings, then Username.",
    telegramPlaceholder: "alice_eth",
    telegramChecking: "Checking",
    telegramLinked: username => `@${username} is linked: alerts will arrive in your Telegram chat.`,
    telegramPressStart: bot => `Not linked yet: press Start in ${bot ? `@${bot}` : "the Tokenping bot"} once.`,
    openBot: bot => `Open @${bot}`,
    telegramStatusUnknown: "Couldn't check whether this username is linked. You can still save.",
    opensInNewTab: "(opens in a new tab)",
    channelLanguageLabels: { email: "Email language", signal: "Signal language", telegram: "Telegram language" },
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
      noTelegram: "Enter your Telegram username.",
      invalidTelegram:
        "Enter a Telegram username like alice_eth: 4 to 32 letters, digits or underscores, starting with a letter and not ending with _.",
    },
    summaryServices: "Services",
    summaryNoServices: "None selected",
    summaryEmail: "Email",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryLanguage: "Language",
    summaryTelegramNotLinked: bot => `Not linked yet: press Start in @${bot} once.`,
    summaryThreshold: "Threshold",
    sendTest: "Send test",
    sendingTest: "Sending",
    testAgainIn: minutes => `Again in ${minutes} min`,
    testSent: channel => `Test message sent by ${channel}. Check that it arrived.`,
    testFailed: "The test message was not sent",
    testLimitNote: minutes =>
      `A test sends this alert and your position as they are now. One per channel every ${minutes} minutes.`,
    belowThresholdTitle: "Below your alert threshold",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Your current health factor (${healthFactor}) is below your threshold of ${threshold}.`,
    alertSaved: "Alert saved",
    saveFailed: "Couldn't save your alert",
    alertDeleted: "Alert deleted",
    deleteFailed: "Couldn't delete your alert",
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
    signInTitle: "Přihlaste se ke správě upozornění",
    signInDescription:
      "Peněženka podepíše zprávu, která potvrdí, že adresa patří vám. Nejde o transakci, takže neplatíte žádný gas.",
    signIn: "Přihlásit se peněženkou",
    signingIn: "Čekáme na vaši peněženku",
    signInStatement: "Přihlášení do Tokenpingu pro zobrazení a úpravy upozornění na health factor.",
    signInRejected: "Žádost o podpis jste odmítli. Pro zobrazení a úpravy upozornění se přihlaste.",
    signInFailed: "Přihlášení se nepodařilo. Zkuste to znovu.",
    signInExpired: "Vaše přihlášení skončilo. Přihlaste se peněženkou znovu.",
    emptyTitle: (chainName, kind) => `${capitalize(csOnMarket(chainName, kind))} zatím nemáte žádné upozornění`,
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
    telegramLabel: "Uživatelské jméno na Telegramu",
    telegramDescription:
      "Upozornění půjdou na tento účet na Telegramu. Uživatelské jméno najdete v Telegramu v Nastavení, v části Uživatelské jméno.",
    telegramPlaceholder: "alice_eth",
    telegramChecking: "Ověřujeme",
    telegramLinked: username => `Propojeno: @${username}. Upozornění budou chodit do vašeho chatu na Telegramu.`,
    telegramPressStart: bot =>
      `Zatím nepropojeno: jednou stiskněte Start ${bot ? `v @${bot}` : "v botovi Tokenpingu"}.`,
    openBot: bot => `Otevřít @${bot}`,
    telegramStatusUnknown: "Nepodařilo se ověřit, jestli je toto jméno propojené. Uložit můžete i tak.",
    opensInNewTab: "(otevře se v nové kartě)",
    channelLanguageLabels: {
      email: "Jazyk e-mailů",
      signal: "Jazyk zpráv na Signalu",
      telegram: "Jazyk zpráv na Telegramu",
    },
    thresholdLabel: "Prahová hodnota health factoru",
    thresholdExactValue: "(přesná hodnota)",
    thresholdScale: { critical: "Kritický", safe: "Bezpečný", verySafe: "Velmi bezpečný" },
    thresholdDescription: (threshold, chainName, kind) =>
      `Upozorníme vás, když váš health factor ${csOnMarket(chainName, kind)} klesne pod ${threshold}.`,
    saveAlert: "Uložit upozornění",
    saving: "Ukládáme",
    cancel: "Zrušit",
    deleteAlert: "Smazat upozornění",
    deleting: "Mažeme",
    keepAlert: "Ponechat upozornění",
    deleteTitle: "Smazat toto upozornění?",
    deleteDescription: (chainName, kind) =>
      `Tokenping přestane posílat upozornění na health factor ${csForMarket(chainName, kind)}.`,
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
      noTelegram: "Zadejte své uživatelské jméno na Telegramu.",
      invalidTelegram:
        "Zadejte uživatelské jméno na Telegramu ve tvaru alice_eth: 4 až 32 písmen, číslic nebo podtržítek, na začátku písmeno a na konci ne _.",
    },
    summaryServices: "Kanály",
    summaryNoServices: "Žádný nevybrán",
    summaryEmail: "E-mail",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryLanguage: "Jazyk",
    summaryTelegramNotLinked: bot => `Zatím nepropojeno: jednou stiskněte Start v @${bot}.`,
    summaryThreshold: "Práh",
    sendTest: "Poslat test",
    sendingTest: "Odesíláme",
    testAgainIn: minutes => `Znovu za ${minutes} min`,
    testSent: channel => `Testovací zpráva odeslána přes ${channel}. Zkontrolujte, že dorazila.`,
    testFailed: "Testovací zprávu se nepodařilo odeslat",
    testLimitNote: minutes =>
      `Test pošle toto upozornění a vaši pozici tak, jak jsou teď. Jeden na kanál ${plural("cs", minutes, { one: `za ${minutes} minutu`, few: `za ${minutes} minuty`, other: `za ${minutes} minut` })}.`,
    belowThresholdTitle: "Pod prahem vašeho upozornění",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Váš aktuální health factor (${healthFactor}) je pod vaším prahem ${threshold}.`,
    alertSaved: "Upozornění uloženo",
    saveFailed: "Upozornění se nepodařilo uložit",
    alertDeleted: "Upozornění smazáno",
    deleteFailed: "Upozornění se nepodařilo smazat",
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
  es: {
    cardTitle: "Configuración de alertas",
    active: "Activa",
    payToEdit: "Paga el acceso para editar",
    editAlert: "Editar alerta",
    signInTitle: "Inicia sesión para gestionar tus alertas",
    signInDescription:
      "Tu billetera firma un mensaje que demuestra que la dirección es tuya. No es una transacción y no cuesta gas.",
    signIn: "Iniciar sesión con la billetera",
    signingIn: "Esperando tu billetera",
    signInStatement: "Inicia sesión en Tokenping para ver y editar tus alertas del factor de salud.",
    signInRejected: "Rechazaste la solicitud de firma. Inicia sesión para ver y editar tus alertas.",
    signInFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
    signInExpired: "Tu sesión terminó. Vuelve a iniciar sesión con tu billetera.",
    emptyTitle: (chainName, kind) => `Aún no tienes alertas en ${esMarket(chainName, kind)}`,
    emptyDescription: "Recibe un mensaje cuando tu factor de salud caiga por debajo de un umbral que tú elijas.",
    createAlert: "Crear alerta",
    loadErrorTitle: "La configuración de alertas no se cargó",
    loadErrorDescription: "Revisa tu conexión e inténtalo de nuevo.",
    tryAgain: "Intentar de nuevo",
    retrying: "Reintentando",
    servicesLegend: "Canales de alerta",
    servicesDescription: "Elige a dónde van las alertas. Puedes elegir más de un canal.",
    serviceNames: { email: ES_EMAIL_BADGE, signal: "Signal", telegram: "Telegram" },
    emailLabel: "Dirección de correo electrónico",
    emailDescription: "Las alertas se envían a esta dirección.",
    emailPlaceholder: "nombre@example.com",
    signalLabel: "Nombre de usuario de Signal",
    signalDescription: "En Signal, abre Ajustes y luego Perfil. Se parece a alice.42.",
    telegramLabel: "Nombre de usuario de Telegram",
    telegramDescription:
      "Las alertas llegan a esta cuenta de Telegram. Encuentra tu nombre de usuario en Telegram, en Ajustes y luego Alias.",
    telegramPlaceholder: "alice_eth",
    telegramChecking: "Verificando",
    telegramLinked: username => `@${username} está vinculado: las alertas llegarán a tu chat de Telegram.`,
    telegramPressStart: bot =>
      `Aún no está vinculado: pulsa Iniciar en ${bot ? `@${bot}` : "el bot de Tokenping"} una vez.`,
    openBot: bot => `Abrir @${bot}`,
    telegramStatusUnknown: "No se pudo verificar si este nombre de usuario está vinculado. Puedes guardar igualmente.",
    opensInNewTab: "(se abre en una pestaña nueva)",
    channelLanguageLabels: {
      email: "Idioma del correo",
      signal: "Idioma en Signal",
      telegram: "Idioma en Telegram",
    },
    thresholdLabel: "Umbral del factor de salud",
    thresholdExactValue: "(valor exacto)",
    thresholdScale: { critical: "Crítico", safe: "Seguro", verySafe: "Muy seguro" },
    thresholdDescription: (threshold, chainName, kind) =>
      `Te avisaremos cuando tu factor de salud caiga por debajo de ${threshold} en ${esMarket(chainName, kind)}.`,
    saveAlert: "Guardar alerta",
    saving: "Guardando",
    cancel: "Cancelar",
    deleteAlert: "Eliminar alerta",
    deleting: "Eliminando",
    keepAlert: "Conservar alerta",
    deleteTitle: "¿Eliminar esta alerta?",
    deleteDescription: (chainName, kind) =>
      `Tokenping deja de enviar alertas del factor de salud para ${esMarket(chainName, kind)}.`,
    errorSummaryTitle: count =>
      plural("es", count, {
        one: `Corrige ${count} campo para guardar`,
        other: `Corrige ${count} campos para guardar`,
      }),
    formErrors: {
      noService: "Selecciona al menos un canal de alerta.",
      noEmail: "Escribe tu dirección de correo electrónico.",
      invalidEmail: "Escribe una dirección de correo electrónico como nombre@example.com.",
      noSignal: "Escribe tu nombre de usuario de Signal.",
      invalidSignal:
        "Escribe un nombre de usuario de Signal como alice.42. Encuentra el tuyo en Signal, en Ajustes y luego Perfil.",
      noTelegram: "Escribe tu nombre de usuario de Telegram.",
      invalidTelegram:
        "Escribe un nombre de usuario de Telegram como alice_eth: de 4 a 32 letras, números o guiones bajos, que empiece con una letra y no termine en _.",
    },
    summaryServices: "Canales",
    summaryNoServices: "Ninguno seleccionado",
    summaryEmail: "Correo electrónico",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryLanguage: "Idioma",
    summaryTelegramNotLinked: bot => `Aún no está vinculado: pulsa Iniciar en @${bot} una vez.`,
    summaryThreshold: "Umbral",
    sendTest: "Enviar prueba",
    sendingTest: "Enviando",
    testAgainIn: minutes => `De nuevo en ${minutes} min`,
    testSent: channel =>
      `Mensaje de prueba enviado por ${channel === ES_EMAIL_BADGE ? "correo electrónico" : channel}. Comprueba que haya llegado.`,
    testFailed: "No se envió el mensaje de prueba",
    testLimitNote: minutes =>
      `Una prueba envía esta alerta y tu posición tal como están ahora. Una por canal ${plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` })}.`,
    belowThresholdTitle: "Por debajo de tu umbral de alerta",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Tu factor de salud actual (${healthFactor}) está por debajo de tu umbral de ${threshold}.`,
    alertSaved: "Alerta guardada",
    saveFailed: "No se pudo guardar tu alerta",
    alertDeleted: "Alerta eliminada",
    deleteFailed: "No se pudo eliminar tu alerta",
    attributionQuestion: ATTRIBUTION_QUESTION.es,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.es} (opcional)`,
    attributionDescription: "Nos ayuda a saber qué canales funcionan. Se guarda con la dirección de tu billetera.",
    attributionEmpty: "Escribe una respuesta o selecciona Omitir.",
    // The checks behind it (length, hidden control characters) only fail for pasted text.
    attributionInvalid: () =>
      "La respuesta es demasiado larga o contiene caracteres ocultos. Vuelve a escribirla e inténtalo de nuevo.",
    attributionSendFailed: "No se pudo enviar tu respuesta. Inténtalo de nuevo u omítela.",
    sendAnswer: "Enviar respuesta",
    sending: "Enviando",
    skip: "Omitir",
    answerSent: "Respuesta enviada",
  },
};

/**
 * A failed request's message for a toast. The API answers in English, so English shows the server's reason and Czech
 * and Spanish show their own fallback. An ended session says so in every language.
 */
export const requestErrorMessage = (locale: Locale, error: unknown, fallback: string) => {
  if (error instanceof SignInRequiredError) return ALERTS_MESSAGES[locale].signInExpired;
  return locale === "en" ? getErrorMessage(error, fallback) : fallback;
};
