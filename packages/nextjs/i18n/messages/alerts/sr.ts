import type { AlertsMessages } from "./shared";
import { plural, srForMarket, srOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Kako si saznao za Tokenping?";

/** "svakih 15 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${minutes} minuta`,
      });

// The channel's name comes from serviceNames, where email is the badge "E-pošta"; in a sentence it is "putem e-pošte",
// and Signal or Telegram follow "kanala" so the name keeps its form.
const via = (channel: string) => (channel === "E-pošta" ? "putem e-pošte" : `putem kanala ${channel}`);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Podešavanja upozorenja",
  active: "Aktivno",
  payToEdit: "Plati pristup da bi menjao",
  editAlert: "Izmeni upozorenje",
  signInTitle: "Prijavi se da upravljaš upozorenjima",
  signInDescription:
    "Tvoj novčanik potpisuje poruku koja dokazuje da je adresa tvoja. To nije transakcija i ne troši gas.",
  signIn: "Prijavi se novčanikom",
  signingIn: "Čeka se tvoj novčanik",
  signInStatement: "Prijavi se na Tokenping da vidiš i menjaš svoja upozorenja za health factor.",
  signInRejected: "Odbio si zahtev za potpis. Prijavi se da vidiš i menjaš svoja upozorenja.",
  signInFailed: "Prijava nije uspela. Pokušaj ponovo.",
  signInExpired: "Tvoja prijava je istekla. Ponovo se prijavi novčanikom.",
  emptyTitle: (chainName, kind) => `Još nema upozorenja ${srOnMarket(chainName, kind)}`,
  emptyDescription: "Dobij poruku kad tvoj health factor padne ispod praga koji izabereš.",
  createAlert: "Napravi upozorenje",
  loadErrorTitle: "Podešavanja upozorenja nisu učitana",
  loadErrorDescription: "Proveri vezu i pokušaj ponovo.",
  tryAgain: "Pokušaj ponovo",
  retrying: "Ponovni pokušaj",
  servicesLegend: "Kanali upozorenja",
  servicesDescription: "Izaberi gde stižu upozorenja. Možeš izabrati više kanala.",
  serviceNames: { email: "E-pošta", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Adresa e-pošte",
  emailDescription: "Upozorenja se šalju na ovu adresu.",
  emailPlaceholder: "ti@primer.rs",
  signalLabel: "Korisničko ime na Signalu",
  signalDescription: "U Signalu otvori Podešavanja, zatim Profil. Izgleda ovako: alice.42.",
  telegramLabel: "Korisničko ime na Telegramu",
  telegramDescription:
    "Upozorenja stižu na ovaj Telegram nalog. Nađi ga u Telegramu pod Podešavanja, zatim Korisničko ime.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Provera",
  telegramLinked: username => `@${username} je povezan: upozorenja će stizati u tvoj razgovor na Telegramu.`,
  telegramPressStart: bot => `Još nije povezano: jednom pritisni Start u ${bot ? `botu @${bot}` : "Tokenping botu"}.`,
  openBot: bot => `Otvori @${bot}`,
  telegramStatusUnknown: "Nije bilo moguće proveriti da li je ovo korisničko ime povezano. I dalje možeš da sačuvaš.",
  opensInNewTab: "(otvara se u novoj kartici)",
  channelLanguageLabels: { email: "Jezik e-pošte", signal: "Jezik za Signal", telegram: "Jezik za Telegram" },
  thresholdLabel: "Prag za health factor",
  thresholdExactValue: "(tačna vrednost)",
  thresholdScale: { critical: "Kritično", safe: "Bezbedno", verySafe: "Veoma bezbedno" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Dobićeš obaveštenje kad tvoj health factor ${srOnMarket(chainName, kind)} padne ispod ${threshold}.`,
  saveAlert: "Sačuvaj upozorenje",
  saving: "Čuvanje",
  cancel: "Otkaži",
  deleteAlert: "Obriši upozorenje",
  deleting: "Brisanje",
  keepAlert: "Zadrži upozorenje",
  deleteTitle: "Obrisati ovo upozorenje?",
  deleteDescription: (chainName, kind) =>
    `Tokenping prestaje da šalje upozorenja za health factor ${srForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("sr", count, {
      one: `Ispravi ${count} polje da bi sačuvao`,
      few: `Ispravi ${count} polja da bi sačuvao`,
      other: `Ispravi ${count} polja da bi sačuvao`,
    }),
  formErrors: {
    noService: "Izaberi bar jedan kanal upozorenja.",
    noEmail: "Unesi svoju adresu e-pošte.",
    invalidEmail: "Unesi adresu e-pošte poput ime@primer.rs.",
    noSignal: "Unesi svoje korisničko ime na Signalu.",
    invalidSignal:
      "Unesi korisničko ime na Signalu poput alice.42. Svoje ćeš naći u Signalu pod Podešavanja, zatim Profil.",
    noTelegram: "Unesi svoje korisničko ime na Telegramu.",
    invalidTelegram:
      "Unesi korisničko ime na Telegramu poput alice_eth: od 4 do 32 slova, cifre ili donje crte, počinje slovom i ne završava se znakom _.",
  },
  summaryServices: "Kanali",
  summaryNoServices: "Ništa nije izabrano",
  summaryEmail: "E-pošta",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Jezik",
  summaryTelegramNotLinked: bot => `Još nije povezano: jednom pritisni Start u botu @${bot}.`,
  summaryThreshold: "Prag",
  sendTest: "Pošalji test",
  sendingTest: "Slanje",
  testAgainIn: minutes => `Ponovo za ${minutes} min`,
  testSent: channel => `Test poruka je poslata ${via(channel)}. Proveri da li je stigla.`,
  testFailed: "Test poruka nije poslata",
  testLimitNote: minutes =>
    `Test šalje ovo upozorenje i tvoju poziciju onakve kakve su sada. Jedan test po kanalu ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Ispod praga tvog upozorenja",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Tvoj trenutni health factor (${healthFactor}) je ispod tvog praga od ${threshold}.`,
  alertSaved: "Upozorenje je sačuvano",
  saveFailed: "Upozorenje nije sačuvano",
  alertDeleted: "Upozorenje je obrisano",
  deleteFailed: "Upozorenje nije obrisano",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (opciono)`,
  attributionDescription: "Pomaže nam da saznamo koji kanali funkcionišu. Čuva se uz adresu tvog novčanika.",
  attributionEmpty: "Unesi odgovor ili izaberi Preskoči.",
  attributionInvalid: () => "Odgovor je predugačak ili sadrži skrivene znakove. Upiši ga ponovo i pokušaj opet.",
  attributionSendFailed: "Odgovor nije poslat. Pokušaj ponovo ili preskoči.",
  sendAnswer: "Pošalji odgovor",
  sending: "Slanje",
  skip: "Preskoči",
  answerSent: "Odgovor je poslat",
};
