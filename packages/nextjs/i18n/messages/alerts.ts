import {
  type MarketNameKind,
  capitalize,
  csForMarket,
  csOnMarket,
  deForMarket,
  deOnMarket,
  esMarket,
  hiMarket,
  plural,
  viMarket,
} from "~~/i18n/format";
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
  hi: "आपको Tokenping के बारे में कैसे पता चला?",
  de: "Wie hast du von Tokenping erfahren?",
  vi: "Bạn biết đến Tokenping qua đâu?",
};

/** The email badge's word ("Correo"), written out in running text. */
const ES_EMAIL_BADGE = "Correo";

/** The email badge's word, written in lower case in running text ("qua email"). */
const VI_EMAIL_BADGE = "Email";

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
  hi: {
    cardTitle: "अलर्ट सेटिंग",
    active: "सक्रिय",
    payToEdit: "संपादित करने के लिए एक्सेस का भुगतान करें",
    editAlert: "अलर्ट संपादित करें",
    signInTitle: "अपने अलर्ट प्रबंधित करने के लिए साइन इन करें",
    signInDescription:
      "आपका वॉलेट एक संदेश पर हस्ताक्षर करता है, जो साबित करता है कि यह पता आपका है। यह कोई ट्रांज़ैक्शन नहीं है और इसमें कोई गैस नहीं लगती।",
    signIn: "वॉलेट से साइन इन करें",
    signingIn: "आपके वॉलेट की प्रतीक्षा है",
    signInStatement: "अपने हेल्थ फ़ैक्टर अलर्ट देखने और संपादित करने के लिए Tokenping में साइन इन करें।",
    signInRejected: "आपने हस्ताक्षर का अनुरोध अस्वीकार कर दिया। अपने अलर्ट देखने और संपादित करने के लिए साइन इन करें।",
    signInFailed: "साइन इन नहीं हो सका। फिर से कोशिश करें।",
    signInExpired: "आपका साइन इन समाप्त हो गया। अपने वॉलेट से फिर से साइन इन करें।",
    emptyTitle: (chainName, kind) => `${hiMarket(chainName, kind)} पर अभी कोई अलर्ट नहीं है`,
    emptyDescription: "जब आपका हेल्थ फ़ैक्टर आपकी चुनी हुई सीमा से नीचे गिरे, तो संदेश पाएं।",
    createAlert: "अलर्ट बनाएं",
    loadErrorTitle: "अलर्ट सेटिंग लोड नहीं हुई",
    loadErrorDescription: "अपना कनेक्शन जांचें और फिर से कोशिश करें।",
    tryAgain: "फिर से कोशिश करें",
    retrying: "फिर से कोशिश हो रही है",
    servicesLegend: "अलर्ट चैनल",
    servicesDescription: "चुनें कि अलर्ट कहां जाएं। आप एक से ज़्यादा चैनल चुन सकते हैं।",
    serviceNames: { email: "ईमेल", signal: "Signal", telegram: "Telegram" },
    emailLabel: "ईमेल पता",
    emailDescription: "अलर्ट इस पते पर भेजे जाते हैं।",
    emailPlaceholder: "naam@example.com",
    signalLabel: "Signal यूज़रनेम",
    signalDescription: "Signal में सेटिंग खोलें, फिर प्रोफ़ाइल। यह alice.42 जैसा दिखता है।",
    telegramLabel: "Telegram यूज़रनेम",
    telegramDescription:
      "अलर्ट इस Telegram खाते पर जाते हैं। अपना यूज़रनेम Telegram में सेटिंग, फिर यूज़रनेम में देखें।",
    telegramPlaceholder: "alice_eth",
    telegramChecking: "जांच हो रही है",
    telegramLinked: username => `@${username} लिंक है: अलर्ट आपकी Telegram चैट में आएंगे।`,
    telegramPressStart: bot => `अभी लिंक नहीं है: ${bot ? `@${bot}` : "Tokenping बॉट"} में एक बार Start दबाएं।`,
    openBot: bot => `@${bot} खोलें`,
    telegramStatusUnknown: "यह जांच नहीं हो सकी कि यह यूज़रनेम लिंक है या नहीं। आप फिर भी सहेज सकते हैं।",
    opensInNewTab: "(नए टैब में खुलता है)",
    channelLanguageLabels: { email: "ईमेल की भाषा", signal: "Signal की भाषा", telegram: "Telegram की भाषा" },
    thresholdLabel: "हेल्थ फ़ैक्टर सीमा (threshold)",
    thresholdExactValue: "(सटीक मान)",
    thresholdScale: { critical: "गंभीर", safe: "सुरक्षित", verySafe: "बहुत सुरक्षित" },
    thresholdDescription: (threshold, chainName, kind) =>
      `जब ${hiMarket(chainName, kind)} पर आपका हेल्थ फ़ैक्टर ${threshold} से नीचे गिरेगा, तो आपको सूचना मिलेगी।`,
    saveAlert: "अलर्ट सहेजें",
    saving: "सहेजा जा रहा है",
    cancel: "रद्द करें",
    deleteAlert: "अलर्ट हटाएं",
    deleting: "हटाया जा रहा है",
    keepAlert: "अलर्ट रखें",
    deleteTitle: "यह अलर्ट हटाएं?",
    deleteDescription: (chainName, kind) =>
      `Tokenping ${hiMarket(chainName, kind)} के लिए हेल्थ फ़ैक्टर अलर्ट भेजना बंद कर देगा।`,
    // Hindi counts "फ़ील्ड" the same for one and many.
    errorSummaryTitle: count => `सहेजने के लिए ${count} फ़ील्ड ठीक करें`,
    formErrors: {
      noService: "कम से कम एक अलर्ट चैनल चुनें।",
      noEmail: "अपना ईमेल पता लिखें।",
      invalidEmail: "naam@example.com जैसा ईमेल पता लिखें।",
      noSignal: "अपना Signal यूज़रनेम लिखें।",
      invalidSignal: "alice.42 जैसा Signal यूज़रनेम लिखें। अपना यूज़रनेम Signal में सेटिंग, फिर प्रोफ़ाइल में देखें।",
      noTelegram: "अपना Telegram यूज़रनेम लिखें।",
      invalidTelegram:
        "alice_eth जैसा Telegram यूज़रनेम लिखें: 4 से 32 अक्षर, अंक या अंडरस्कोर, जो अक्षर से शुरू हो और _ पर खत्म न हो।",
    },
    summaryServices: "चैनल",
    summaryNoServices: "कोई नहीं चुना",
    summaryEmail: "ईमेल",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryLanguage: "भाषा",
    summaryTelegramNotLinked: bot => `अभी लिंक नहीं है: @${bot} में एक बार Start दबाएं।`,
    summaryThreshold: "सीमा",
    sendTest: "टेस्ट भेजें",
    sendingTest: "भेजा जा रहा है",
    testAgainIn: minutes => `${minutes} मिनट में फिर से`,
    testSent: channel => `${channel} से टेस्ट संदेश भेजा गया। जांच लें कि वह पहुंचा।`,
    testFailed: "टेस्ट संदेश नहीं भेजा गया",
    testLimitNote: minutes =>
      `टेस्ट यह अलर्ट और आपकी पोज़िशन वैसे ही भेजता है, जैसी वे अभी हैं। हर चैनल पर ${plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट` })} में एक।`,
    belowThresholdTitle: "आपकी अलर्ट सीमा से नीचे",
    belowThresholdDescription: (healthFactor, threshold) =>
      `आपका मौजूदा हेल्थ फ़ैक्टर (${healthFactor}) आपकी ${threshold} की सीमा से नीचे है।`,
    alertSaved: "अलर्ट सहेजा गया",
    saveFailed: "आपका अलर्ट सहेजा नहीं जा सका",
    alertDeleted: "अलर्ट हटाया गया",
    deleteFailed: "आपका अलर्ट हटाया नहीं जा सका",
    attributionQuestion: ATTRIBUTION_QUESTION.hi,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.hi} (वैकल्पिक)`,
    attributionDescription: "इससे हमें पता चलता है कि कौन से चैनल काम करते हैं। आपके वॉलेट पते के साथ सहेजा जाता है।",
    attributionEmpty: "जवाब लिखें, या छोड़ें चुनें।",
    // The checks behind it (length, hidden control characters) only fail for pasted text.
    attributionInvalid: () => "जवाब बहुत लंबा है या उसमें छिपे हुए अक्षर हैं। उसे फिर से लिखें और दोबारा कोशिश करें।",
    attributionSendFailed: "आपका जवाब नहीं भेजा जा सका। फिर से कोशिश करें या छोड़ें।",
    sendAnswer: "जवाब भेजें",
    sending: "भेजा जा रहा है",
    skip: "छोड़ें",
    answerSent: "जवाब भेजा गया",
  },
  de: {
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
    telegramPressStart: bot =>
      `Noch nicht verknüpft: Drück einmal auf Start ${bot ? `in @${bot}` : "im Tokenping-Bot"}.`,
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
    attributionQuestion: ATTRIBUTION_QUESTION.de,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.de} (optional)`,
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
  },
  vi: {
    cardTitle: "Cài đặt cảnh báo",
    active: "Đang bật",
    payToEdit: "Thanh toán quyền truy cập để chỉnh sửa",
    editAlert: "Sửa cảnh báo",
    signInTitle: "Đăng nhập để quản lý cảnh báo",
    signInDescription:
      "Ví của bạn ký một tin nhắn để chứng minh địa chỉ này là của bạn. Đây không phải giao dịch và không tốn gas.",
    signIn: "Đăng nhập bằng ví",
    signingIn: "Đang chờ ví của bạn",
    signInStatement: "Đăng nhập vào Tokenping để xem và sửa cảnh báo hệ số sức khỏe của bạn.",
    signInRejected: "Bạn đã từ chối yêu cầu ký. Hãy đăng nhập để xem và sửa cảnh báo.",
    signInFailed: "Không thể đăng nhập. Hãy thử lại.",
    signInExpired: "Phiên đăng nhập của bạn đã hết. Hãy đăng nhập lại bằng ví.",
    emptyTitle: (chainName, kind) => `Chưa có cảnh báo nào trên ${viMarket(chainName, kind)}`,
    emptyDescription: "Nhận tin nhắn khi hệ số sức khỏe của bạn giảm xuống dưới ngưỡng bạn chọn.",
    createAlert: "Tạo cảnh báo",
    loadErrorTitle: "Không tải được cài đặt cảnh báo",
    loadErrorDescription: "Hãy kiểm tra kết nối rồi thử lại.",
    tryAgain: "Thử lại",
    retrying: "Đang thử lại",
    servicesLegend: "Kênh cảnh báo",
    servicesDescription: "Chọn nơi nhận cảnh báo. Bạn có thể chọn nhiều kênh.",
    serviceNames: { email: VI_EMAIL_BADGE, signal: "Signal", telegram: "Telegram" },
    emailLabel: "Địa chỉ email",
    emailDescription: "Cảnh báo được gửi đến địa chỉ này.",
    emailPlaceholder: "ten@example.com",
    signalLabel: "Tên người dùng Signal",
    signalDescription: "Trong Signal, mở Cài đặt, rồi Hồ sơ. Tên có dạng alice.42.",
    telegramLabel: "Tên người dùng Telegram",
    telegramDescription:
      "Cảnh báo được gửi đến tài khoản Telegram này. Tìm tên người dùng trong Telegram ở Cài đặt, rồi Tên người dùng.",
    telegramPlaceholder: "alice_eth",
    telegramChecking: "Đang kiểm tra",
    telegramLinked: username => `@${username} đã được liên kết: cảnh báo sẽ đến cuộc trò chuyện Telegram của bạn.`,
    telegramPressStart: bot => `Chưa liên kết: hãy nhấn Start trong ${bot ? `@${bot}` : "bot Tokenping"} một lần.`,
    openBot: bot => `Mở @${bot}`,
    telegramStatusUnknown: "Không kiểm tra được tên người dùng này đã liên kết hay chưa. Bạn vẫn có thể lưu.",
    opensInNewTab: "(mở trong thẻ mới)",
    channelLanguageLabels: { email: "Ngôn ngữ email", signal: "Ngôn ngữ Signal", telegram: "Ngôn ngữ Telegram" },
    thresholdLabel: "Ngưỡng hệ số sức khỏe",
    thresholdExactValue: "(giá trị chính xác)",
    thresholdScale: { critical: "Nguy cấp", safe: "An toàn", verySafe: "Rất an toàn" },
    thresholdDescription: (threshold, chainName, kind) =>
      `Bạn sẽ nhận được thông báo khi hệ số sức khỏe của bạn trên ${viMarket(chainName, kind)} giảm xuống dưới ${threshold}.`,
    saveAlert: "Lưu cảnh báo",
    saving: "Đang lưu",
    cancel: "Hủy",
    deleteAlert: "Xóa cảnh báo",
    deleting: "Đang xóa",
    keepAlert: "Giữ cảnh báo",
    deleteTitle: "Xóa cảnh báo này?",
    deleteDescription: (chainName, kind) =>
      `Tokenping sẽ ngừng gửi cảnh báo hệ số sức khỏe cho ${viMarket(chainName, kind)}.`,
    // Vietnamese nouns do not change after a number.
    errorSummaryTitle: count => `Sửa ${count} trường để lưu`,
    formErrors: {
      noService: "Hãy chọn ít nhất một kênh cảnh báo.",
      noEmail: "Hãy nhập địa chỉ email của bạn.",
      invalidEmail: "Hãy nhập địa chỉ email có dạng ten@example.com.",
      noSignal: "Hãy nhập tên người dùng Signal của bạn.",
      invalidSignal:
        "Hãy nhập tên người dùng Signal có dạng alice.42. Tìm tên của bạn trong Signal ở Cài đặt, rồi Hồ sơ.",
      noTelegram: "Hãy nhập tên người dùng Telegram của bạn.",
      invalidTelegram:
        "Hãy nhập tên người dùng Telegram có dạng alice_eth: từ 4 đến 32 chữ cái, chữ số hoặc dấu gạch dưới, bắt đầu bằng chữ cái và không kết thúc bằng _.",
    },
    summaryServices: "Kênh",
    summaryNoServices: "Chưa chọn kênh nào",
    summaryEmail: "Email",
    summarySignal: "Signal",
    summaryTelegram: "Telegram",
    summaryLanguage: "Ngôn ngữ",
    summaryTelegramNotLinked: bot => `Chưa liên kết: hãy nhấn Start trong @${bot} một lần.`,
    summaryThreshold: "Ngưỡng",
    sendTest: "Gửi thử",
    sendingTest: "Đang gửi",
    testAgainIn: minutes => `Gửi lại sau ${minutes} phút`,
    testSent: channel =>
      `Đã gửi tin nhắn thử qua ${channel === VI_EMAIL_BADGE ? "email" : channel}. Hãy kiểm tra xem tin nhắn đã đến chưa.`,
    testFailed: "Không gửi được tin nhắn thử",
    testLimitNote: minutes =>
      `Tin nhắn thử gửi cảnh báo này và vị thế của bạn như hiện tại. Mỗi kênh được gửi thử một lần mỗi ${minutes} phút.`,
    belowThresholdTitle: "Dưới ngưỡng cảnh báo của bạn",
    belowThresholdDescription: (healthFactor, threshold) =>
      `Hệ số sức khỏe hiện tại của bạn (${healthFactor}) đang dưới ngưỡng ${threshold} của bạn.`,
    alertSaved: "Đã lưu cảnh báo",
    saveFailed: "Không lưu được cảnh báo của bạn",
    alertDeleted: "Đã xóa cảnh báo",
    deleteFailed: "Không xóa được cảnh báo của bạn",
    attributionQuestion: ATTRIBUTION_QUESTION.vi,
    attributionFormLabel: `${ATTRIBUTION_QUESTION.vi} (không bắt buộc)`,
    attributionDescription: "Giúp chúng tôi biết kênh nào hiệu quả. Được lưu cùng địa chỉ ví của bạn.",
    attributionEmpty: "Hãy nhập câu trả lời, hoặc chọn Bỏ qua.",
    // The checks behind it (length, hidden control characters) only fail for pasted text.
    attributionInvalid: () => "Câu trả lời quá dài hoặc chứa ký tự ẩn. Hãy nhập lại rồi thử lại.",
    attributionSendFailed: "Không gửi được câu trả lời. Hãy thử lại hoặc bỏ qua.",
    sendAnswer: "Gửi câu trả lời",
    sending: "Đang gửi",
    skip: "Bỏ qua",
    answerSent: "Đã gửi câu trả lời",
  },
};

/**
 * A failed request's message for a toast. The API answers in English, so English shows the server's reason and every
 * other language shows its own fallback. An ended session says so in every language.
 */
export const requestErrorMessage = (locale: Locale, error: unknown, fallback: string) => {
  if (error instanceof SignInRequiredError) return ALERTS_MESSAGES[locale].signInExpired;
  return locale === "en" ? getErrorMessage(error, fallback) : fallback;
};
