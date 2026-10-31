import type { AlertsMessages } from "./shared";
import { esMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "¿Cómo te enteraste de Tokenping?";

/** The email badge's word ("Correo"), written out in running text. */
const ES_EMAIL_BADGE = "Correo";

export const MESSAGES: AlertsMessages = {
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
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (opcional)`,
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
};
