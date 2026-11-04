import type { AlertsMessages } from "./shared";
import { capitalize, plural, slForMarket, slOnMarket } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Od kod poznaš Tokenping?";

// The channel's name comes from serviceNames, where email is the badge "E-pošta"; after "prek" it is "e-pošte",
// the other channels follow "kanala" so their names never take a case ending.
const viaChannel = (channel: string) => (channel === "E-pošta" ? "prek e-pošte" : `prek kanala ${channel}`);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Nastavitve opozorila",
  active: "Aktivno",
  payToEdit: "Plačaj dostop za urejanje",
  editAlert: "Uredi opozorilo",
  signInTitle: "Prijavi se za upravljanje opozoril",
  signInDescription:
    "Tvoja denarnica podpiše sporočilo, ki dokazuje, da je naslov tvoj. To ni transakcija, zato ne plačaš gasa.",
  signIn: "Prijavi se z denarnico",
  signingIn: "Čakanje na tvojo denarnico",
  signInStatement: "Prijavi se v Tokenping, da vidiš in urejaš svoja opozorila za health factor.",
  signInRejected: "Zahteva za podpis je bila zavrnjena. Prijavi se, da vidiš in urejaš svoja opozorila.",
  signInFailed: "Prijava ni uspela. Poskusi znova.",
  signInExpired: "Tvoja prijava je potekla. Znova se prijavi z denarnico.",
  emptyTitle: (chainName, kind) => `${capitalize(slOnMarket(chainName, kind))} še nimaš opozoril`,
  emptyDescription: "Prejmi sporočilo, ko tvoj health factor pade pod prag, ki ga izbereš.",
  createAlert: "Ustvari opozorilo",
  loadErrorTitle: "Nastavitev opozorila ni bilo mogoče naložiti",
  loadErrorDescription: "Preveri povezavo in poskusi znova.",
  tryAgain: "Poskusi znova",
  retrying: "Ponovni poskus",
  servicesLegend: "Kanali za opozorila",
  servicesDescription: "Izberi, kam naj gredo opozorila. Izbereš lahko več kanalov.",
  serviceNames: { email: "E-pošta", signal: "Signal", telegram: "Telegram" },
  emailLabel: "E-poštni naslov",
  emailDescription: "Opozorila bodo poslana na ta naslov.",
  emailPlaceholder: "ti@example.com",
  signalLabel: "Uporabniško ime Signal",
  signalDescription: "V aplikaciji Signal odpri Nastavitve, nato Profil. Videti je takole: alice.42.",
  telegramLabel: "Uporabniško ime Telegram",
  telegramDescription:
    "Opozorila gredo na ta račun Telegram. Najdeš ga v aplikaciji Telegram pod Nastavitve, nato Uporabniško ime.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Preverjanje",
  telegramLinked: username =>
    `Uporabniško ime @${username} je povezano: opozorila bodo prihajala v tvoj klepet v aplikaciji Telegram.`,
  telegramPressStart: bot =>
    `Še ni povezano: enkrat pritisni Start ${bot ? `v klepetu z @${bot}` : "pri botu Tokenping"}.`,
  openBot: bot => `Odpri @${bot}`,
  telegramStatusUnknown: "Ni bilo mogoče preveriti, ali je to uporabniško ime povezano. Vseeno lahko shraniš.",
  opensInNewTab: "(odpre se v novem zavihku)",
  channelLanguageLabels: {
    email: "Jezik e-pošte",
    signal: "Jezik sporočil Signal",
    telegram: "Jezik sporočil Telegram",
  },
  thresholdLabel: "Prag za health factor",
  thresholdExactValue: "(natančna vrednost)",
  thresholdScale: { critical: "Kritično", safe: "Varno", verySafe: "Zelo varno" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Obvestimo te, ko tvoj health factor ${slOnMarket(chainName, kind)} pade pod ${threshold}.`,
  saveAlert: "Shrani opozorilo",
  saving: "Shranjevanje",
  cancel: "Prekliči",
  deleteAlert: "Izbriši opozorilo",
  deleting: "Brisanje",
  keepAlert: "Obdrži opozorilo",
  deleteTitle: "Želiš izbrisati to opozorilo?",
  deleteDescription: (chainName, kind) =>
    `Tokenping ne bo več pošiljal opozoril za health factor ${slForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("sl", count, {
      one: `Za shranjevanje popravi ${count} polje`,
      two: `Za shranjevanje popravi ${count} polji`,
      few: `Za shranjevanje popravi ${count} polja`,
      other: `Za shranjevanje popravi ${count} polj`,
    }),
  formErrors: {
    noService: "Izberi vsaj en kanal za opozorila.",
    noEmail: "Vnesi svoj e-poštni naslov.",
    invalidEmail: "Vnesi e-poštni naslov, kot je ime@example.com.",
    noSignal: "Vnesi svoje uporabniško ime Signal.",
    invalidSignal:
      "Vnesi uporabniško ime Signal, kot je alice.42. Najdeš ga v aplikaciji Signal pod Nastavitve, nato Profil.",
    noTelegram: "Vnesi svoje uporabniško ime Telegram.",
    invalidTelegram:
      "Vnesi uporabniško ime Telegram, kot je alice_eth: od 4 do 32 črk, števk ali podčrtajev, na začetku črka, na koncu ne _.",
  },
  summaryServices: "Kanali",
  summaryNoServices: "Nič izbranega",
  summaryEmail: "E-pošta",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Jezik",
  summaryTelegramNotLinked: bot => `Še ni povezano: enkrat pritisni Start v klepetu z @${bot}.`,
  summaryThreshold: "Prag",
  sendTest: "Pošlji test",
  sendingTest: "Pošiljanje",
  testAgainIn: minutes => `Znova čez ${minutes} min`,
  testSent: channel => `Testno sporočilo poslano ${viaChannel(channel)}. Preveri, ali je prispelo.`,
  testFailed: "Testno sporočilo ni bilo poslano",
  testLimitNote: minutes =>
    `Test pošlje to opozorilo in tvojo pozicijo, kot sta zdaj. Vsak kanal lahko preizkusiš enkrat ${plural(
      "sl",
      minutes,
      {
        one: `v ${minutes} minuti`,
        two: `v ${minutes} minutah`,
        few: `v ${minutes} minutah`,
        other: `v ${minutes} minutah`,
      },
    )}.`,
  belowThresholdTitle: "Pod pragom tvojega opozorila",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Tvoj trenutni health factor (${healthFactor}) je pod tvojim pragom ${threshold}.`,
  alertSaved: "Opozorilo shranjeno",
  saveFailed: "Opozorila ni bilo mogoče shraniti",
  alertDeleted: "Opozorilo izbrisano",
  deleteFailed: "Opozorila ni bilo mogoče izbrisati",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (neobvezno)`,
  attributionDescription:
    "Pomaga nam ugotoviti, kateri kanali delujejo. Odgovor shranimo skupaj z naslovom tvoje denarnice.",
  attributionEmpty: "Vnesi odgovor ali izberi Preskoči.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Odgovor je predolg ali vsebuje skrite znake. Napiši ga znova in poskusi še enkrat.",
  attributionSendFailed: "Odgovora ni bilo mogoče poslati. Poskusi znova ali preskoči.",
  sendAnswer: "Pošlji odgovor",
  sending: "Pošiljanje",
  skip: "Preskoči",
  answerSent: "Odgovor poslan",
};
