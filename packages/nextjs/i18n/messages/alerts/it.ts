import type { AlertsMessages } from "./shared";
import { itForMarket, itOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Come hai conosciuto Tokenping?";

const everyMinutes = (minutes: number) =>
  plural("it", minutes, { one: "ogni minuto", many: `ogni ${minutes} minuti`, other: `ogni ${minutes} minuti` });

export const MESSAGES: AlertsMessages = {
  cardTitle: "Impostazioni degli avvisi",
  active: "Attivo",
  payToEdit: "Paga l'accesso per modificare",
  editAlert: "Modifica avviso",
  signInTitle: "Accedi per gestire i tuoi avvisi",
  signInDescription:
    "Il tuo wallet firma un messaggio che dimostra che l'indirizzo è tuo. Non è una transazione e non costa gas.",
  signIn: "Accedi con il wallet",
  signingIn: "In attesa del tuo wallet",
  signInStatement: "Accedi a Tokenping per vedere e modificare i tuoi avvisi sul fattore di salute.",
  signInRejected: "Hai rifiutato la richiesta di firma. Accedi per vedere e modificare i tuoi avvisi.",
  signInFailed: "Accesso non riuscito. Riprova.",
  signInExpired: "La tua sessione è terminata. Accedi di nuovo con il wallet.",
  emptyTitle: (chainName, kind) => `Ancora nessun avviso ${itOnMarket(chainName, kind)}`,
  emptyDescription: "Ricevi un messaggio quando il tuo fattore di salute scende sotto una soglia che scegli tu.",
  createAlert: "Crea avviso",
  loadErrorTitle: "Impossibile caricare le impostazioni degli avvisi",
  loadErrorDescription: "Controlla la connessione e riprova.",
  tryAgain: "Riprova",
  retrying: "Nuovo tentativo",
  servicesLegend: "Canali degli avvisi",
  servicesDescription: "Scegli dove inviare gli avvisi. Puoi sceglierne più di uno.",
  serviceNames: { email: "Email", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Indirizzo email",
  emailDescription: "Gli avvisi vengono inviati a questo indirizzo.",
  emailPlaceholder: "nome@example.com",
  signalLabel: "Nome utente Signal",
  signalDescription: "In Signal, apri Impostazioni, poi Profilo. Ha questo aspetto: alice.42.",
  telegramLabel: "Nome utente Telegram",
  telegramDescription:
    "Gli avvisi arrivano a questo account Telegram. Lo trovi in Telegram in Impostazioni, poi Nome utente.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Verifica in corso",
  telegramLinked: username => `@${username} è collegato: gli avvisi arriveranno nella tua chat Telegram.`,
  telegramPressStart: bot =>
    `Non ancora collegato: premi Start una volta in ${bot ? `@${bot}` : "il bot di Tokenping"}.`,
  openBot: bot => `Apri @${bot}`,
  telegramStatusUnknown: "Non è stato possibile verificare se questo nome utente è collegato. Puoi salvare lo stesso.",
  opensInNewTab: "(si apre in una nuova scheda)",
  channelLanguageLabels: {
    email: "Lingua delle email",
    signal: "Lingua su Signal",
    telegram: "Lingua su Telegram",
  },
  thresholdLabel: "Soglia del fattore di salute",
  thresholdExactValue: "(valore esatto)",
  thresholdScale: { critical: "Critico", safe: "Sicuro", verySafe: "Molto sicuro" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Riceverai un avviso quando il tuo fattore di salute ${itOnMarket(chainName, kind)} scende sotto ${threshold}.`,
  saveAlert: "Salva avviso",
  saving: "Salvataggio",
  cancel: "Annulla",
  deleteAlert: "Elimina avviso",
  deleting: "Eliminazione",
  keepAlert: "Mantieni avviso",
  deleteTitle: "Eliminare questo avviso?",
  deleteDescription: (chainName, kind) =>
    `Tokenping smetterà di inviare avvisi sul fattore di salute ${itForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("it", count, {
      one: `Correggi ${count} campo per salvare`,
      many: `Correggi ${count} campi per salvare`,
      other: `Correggi ${count} campi per salvare`,
    }),
  formErrors: {
    noService: "Seleziona almeno un canale per gli avvisi.",
    noEmail: "Inserisci il tuo indirizzo email.",
    invalidEmail: "Inserisci un indirizzo email come nome@example.com.",
    noSignal: "Inserisci il tuo nome utente Signal.",
    invalidSignal:
      "Inserisci un nome utente Signal come alice.42. Trovi il tuo in Signal in Impostazioni, poi Profilo.",
    noTelegram: "Inserisci il tuo nome utente Telegram.",
    invalidTelegram:
      "Inserisci un nome utente Telegram come alice_eth: da 4 a 32 lettere, cifre o trattini bassi, che inizi con una lettera e non finisca con _.",
  },
  summaryServices: "Canali",
  summaryNoServices: "Nessuno selezionato",
  summaryEmail: "Email",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Lingua",
  summaryTelegramNotLinked: bot => `Non ancora collegato: premi Start una volta in @${bot}.`,
  summaryThreshold: "Soglia",
  sendTest: "Invia test",
  sendingTest: "Invio in corso",
  testAgainIn: minutes => `Di nuovo tra ${minutes} min`,
  testSent: channel =>
    `Messaggio di prova inviato via ${channel === "Email" ? "email" : channel}. Controlla che sia arrivato.`,
  testFailed: "Il messaggio di prova non è stato inviato",
  testLimitNote: minutes =>
    `Un test invia questo avviso e la tua posizione così come sono adesso. Uno per canale ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Sotto la tua soglia di avviso",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Il tuo fattore di salute attuale (${healthFactor}) è sotto la tua soglia di ${threshold}.`,
  alertSaved: "Avviso salvato",
  saveFailed: "Impossibile salvare il tuo avviso",
  alertDeleted: "Avviso eliminato",
  deleteFailed: "Impossibile eliminare il tuo avviso",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (facoltativo)`,
  attributionDescription: "Ci aiuta a capire quali canali funzionano. Salvata con l'indirizzo del tuo wallet.",
  attributionEmpty: "Inserisci una risposta oppure seleziona Salta.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "La risposta è troppo lunga o contiene caratteri nascosti. Riscrivila e riprova.",
  attributionSendFailed: "Impossibile inviare la tua risposta. Riprova oppure salta.",
  sendAnswer: "Invia risposta",
  sending: "Invio in corso",
  skip: "Salta",
  answerSent: "Risposta inviata",
};
