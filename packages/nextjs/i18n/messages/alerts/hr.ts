import type { AlertsMessages } from "./shared";
import { hrForMarket, hrOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Odakle znaš za Tokenping?";

/** "svakih 15 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${minutes} minuta`,
      });

// The channel's name comes from serviceNames, where email is the badge "E-pošta"; in a sentence it is "putem e-pošte",
// and Signal or Telegram follow "kanala" so the name keeps its form.
const via = (channel: string) => (channel === "E-pošta" ? "putem e-pošte" : `putem kanala ${channel}`);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Postavke upozorenja",
  active: "Aktivno",
  payToEdit: "Plati pristup za uređivanje",
  editAlert: "Uredi upozorenje",
  signInTitle: "Prijavi se da upravljaš upozorenjima",
  signInDescription:
    "Tvoj novčanik potpisuje poruku koja dokazuje da je adresa tvoja. To nije transakcija i ne troši gas.",
  signIn: "Prijavi se novčanikom",
  signingIn: "Čeka se tvoj novčanik",
  signInStatement: "Prijavi se na Tokenping da vidiš i urediš svoja upozorenja za health factor.",
  signInRejected: "Zahtjev za potpis je odbijen. Prijavi se da vidiš i urediš svoja upozorenja.",
  signInFailed: "Prijava nije uspjela. Pokušaj ponovno.",
  signInExpired: "Tvoja prijava je istekla. Ponovno se prijavi novčanikom.",
  emptyTitle: (chainName, kind) => `Još nema upozorenja ${hrOnMarket(chainName, kind)}`,
  emptyDescription: "Primi poruku kad tvoj health factor padne ispod praga koji odabereš.",
  createAlert: "Izradi upozorenje",
  loadErrorTitle: "Postavke upozorenja nisu učitane",
  loadErrorDescription: "Provjeri vezu i pokušaj ponovno.",
  tryAgain: "Pokušaj ponovno",
  retrying: "Ponovni pokušaj",
  servicesLegend: "Kanali upozorenja",
  servicesDescription: "Odaberi kamo stižu upozorenja. Možeš odabrati više kanala.",
  serviceNames: { email: "E-pošta", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Adresa e-pošte",
  emailDescription: "Upozorenja se šalju na ovu adresu.",
  emailPlaceholder: "ti@primjer.hr",
  signalLabel: "Korisničko ime na Signalu",
  signalDescription: "U Signalu otvori Postavke, zatim Profil. Izgleda ovako: alice.42.",
  telegramLabel: "Korisničko ime na Telegramu",
  telegramDescription:
    "Upozorenja stižu na ovaj Telegram račun. Pronađi ga u Telegramu pod Postavke, zatim Korisničko ime.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Provjera",
  telegramLinked: username => `@${username} je povezan: upozorenja će stizati u tvoj razgovor na Telegramu.`,
  telegramPressStart: bot => `Još nije povezano: jednom pritisni Start u ${bot ? `botu @${bot}` : "Tokenping botu"}.`,
  openBot: bot => `Otvori @${bot}`,
  telegramStatusUnknown: "Nije bilo moguće provjeriti je li ovo korisničko ime povezano. I dalje možeš spremiti.",
  opensInNewTab: "(otvara se u novoj kartici)",
  channelLanguageLabels: { email: "Jezik e-pošte", signal: "Jezik za Signal", telegram: "Jezik za Telegram" },
  thresholdLabel: "Prag za health factor",
  thresholdExactValue: "(točna vrijednost)",
  thresholdScale: { critical: "Kritično", safe: "Sigurno", verySafe: "Vrlo sigurno" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Dobit ćeš obavijest kad tvoj health factor ${hrOnMarket(chainName, kind)} padne ispod ${threshold}.`,
  saveAlert: "Spremi upozorenje",
  saving: "Spremanje",
  cancel: "Odustani",
  deleteAlert: "Izbriši upozorenje",
  deleting: "Brisanje",
  keepAlert: "Zadrži upozorenje",
  deleteTitle: "Izbrisati ovo upozorenje?",
  deleteDescription: (chainName, kind) =>
    `Tokenping prestaje slati upozorenja za health factor ${hrForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("hr", count, {
      one: `Ispravi ${count} polje za spremanje`,
      few: `Ispravi ${count} polja za spremanje`,
      other: `Ispravi ${count} polja za spremanje`,
    }),
  formErrors: {
    noService: "Odaberi barem jedan kanal upozorenja.",
    noEmail: "Unesi svoju adresu e-pošte.",
    invalidEmail: "Unesi adresu e-pošte poput ime@primjer.hr.",
    noSignal: "Unesi svoje korisničko ime na Signalu.",
    invalidSignal:
      "Unesi korisničko ime na Signalu poput alice.42. Svoje ćeš pronaći u Signalu pod Postavke, zatim Profil.",
    noTelegram: "Unesi svoje korisničko ime na Telegramu.",
    invalidTelegram:
      "Unesi korisničko ime na Telegramu poput alice_eth: od 4 do 32 slova, znamenke ili podvlake, počinje slovom i ne završava znakom _.",
  },
  summaryServices: "Kanali",
  summaryNoServices: "Ništa nije odabrano",
  summaryEmail: "E-pošta",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Jezik",
  summaryTelegramNotLinked: bot => `Još nije povezano: jednom pritisni Start u botu @${bot}.`,
  summaryThreshold: "Prag",
  sendTest: "Pošalji test",
  sendingTest: "Slanje",
  testAgainIn: minutes => `Ponovno za ${minutes} min`,
  testSent: channel => `Testna poruka poslana ${via(channel)}. Provjeri je li stigla.`,
  testFailed: "Testna poruka nije poslana",
  testLimitNote: minutes =>
    `Test šalje ovo upozorenje i tvoju poziciju kakvi su sada. Jedan test po kanalu ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Ispod praga tvog upozorenja",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Tvoj trenutačni health factor (${healthFactor}) ispod je tvog praga od ${threshold}.`,
  alertSaved: "Upozorenje je spremljeno",
  saveFailed: "Upozorenje nije spremljeno",
  alertDeleted: "Upozorenje je izbrisano",
  deleteFailed: "Upozorenje nije izbrisano",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (neobavezno)`,
  attributionDescription: "Pomaže nam saznati koji kanali djeluju. Sprema se uz adresu tvog novčanika.",
  attributionEmpty: "Unesi odgovor ili odaberi Preskoči.",
  attributionInvalid: () => "Odgovor je predug ili sadrži skrivene znakove. Upiši ga ponovno i pokušaj opet.",
  attributionSendFailed: "Odgovor nije poslan. Pokušaj ponovno ili preskoči.",
  sendAnswer: "Pošalji odgovor",
  sending: "Slanje",
  skip: "Preskoči",
  answerSent: "Odgovor je poslan",
};
