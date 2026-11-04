import type { AlertsMessages } from "./shared";
import { capitalize, huForMarket, huOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Honnan hallottál a Tokenpingről?";

// The channel's name comes from serviceNames, where email is the badge "E-mail"; inside a sentence it is "e-mail".
const channelInSentence = (channel: string) => (channel === "E-mail" ? "e-mail" : channel);

export const MESSAGES: AlertsMessages = {
  cardTitle: "Riasztási beállítások",
  active: "Aktív",
  payToEdit: "Hozzáférés kifizetése a szerkesztéshez",
  editAlert: "Riasztás szerkesztése",
  signInTitle: "Jelentkezz be a riasztásaid kezeléséhez",
  signInDescription:
    "A tárcád aláír egy üzenetet, amely igazolja, hogy a cím a tiéd. Ez nem tranzakció, így gas díjat sem fizetsz érte.",
  signIn: "Bejelentkezés tárcával",
  signingIn: "Várakozás a tárcádra",
  signInStatement: "Jelentkezz be, hogy lásd és szerkeszd a Tokenping health factor-riasztásaidat.",
  signInRejected: "Elutasítottad az aláírási kérést. Jelentkezz be, hogy lásd és szerkeszd a riasztásaidat.",
  signInFailed: "Nem sikerült bejelentkezni. Próbáld újra.",
  signInExpired: "A bejelentkezésed lejárt. Jelentkezz be újra a tárcáddal.",
  emptyTitle: (chainName, kind) => `${capitalize(huOnMarket(chainName, kind))} még nincs riasztás`,
  emptyDescription: "Kapj üzenetet, ha a health factorod egy általad választott küszöbérték alá esik.",
  createAlert: "Riasztás létrehozása",
  loadErrorTitle: "Nem sikerült betölteni a riasztási beállításokat",
  loadErrorDescription: "Ellenőrizd a kapcsolatot, és próbáld újra.",
  tryAgain: "Újrapróbálás",
  retrying: "Újrapróbálás folyamatban",
  servicesLegend: "Riasztási csatornák",
  servicesDescription: "Válaszd ki, hová menjenek a riasztások. Több csatornát is választhatsz.",
  serviceNames: { email: "E-mail", signal: "Signal", telegram: "Telegram" },
  emailLabel: "E-mail-cím",
  emailDescription: "A riasztásokat erre a címre küldjük.",
  emailPlaceholder: "te@example.com",
  signalLabel: "Signal-felhasználónév",
  signalDescription: "A Signalban nyisd meg a Beállításokat, majd a Profilt. Így néz ki: alice.42.",
  telegramLabel: "Telegram-felhasználónév",
  telegramDescription:
    "A riasztások erre a Telegram-fiókra érkeznek. A Telegramban a Beállítások, majd a Felhasználónév alatt találod.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Ellenőrzés",
  telegramLinked: username => `@${username} összekapcsolva: a riasztások a Telegram-csevegésedbe érkeznek.`,
  telegramPressStart: bot =>
    bot
      ? `Még nincs összekapcsolva: nyomd meg egyszer a Start gombot itt: @${bot}.`
      : "Még nincs összekapcsolva: nyomd meg egyszer a Start gombot a Tokenping botban.",
  openBot: bot => `Megnyitás: @${bot}`,
  telegramStatusUnknown:
    "Nem sikerült ellenőrizni, hogy ez a felhasználónév össze van-e kapcsolva. Menteni így is tudsz.",
  opensInNewTab: "(új lapon nyílik meg)",
  channelLanguageLabels: {
    email: "Az e-mailek nyelve",
    signal: "A Signal-üzenetek nyelve",
    telegram: "A Telegram-üzenetek nyelve",
  },
  thresholdLabel: "Health factor-küszöbérték",
  thresholdExactValue: "(pontos érték)",
  thresholdScale: { critical: "Kritikus", safe: "Biztonságos", verySafe: "Nagyon biztonságos" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Értesítést kapsz, ha a health factorod ${huOnMarket(chainName, kind)} ${threshold} alá esik.`,
  saveAlert: "Riasztás mentése",
  saving: "Mentés",
  cancel: "Mégse",
  deleteAlert: "Riasztás törlése",
  deleting: "Törlés",
  keepAlert: "Riasztás megtartása",
  deleteTitle: "Törlöd ezt a riasztást?",
  deleteDescription: (chainName, kind) =>
    `A Tokenping nem küld több health factor-riasztást ${huForMarket(chainName, kind)} vonatkozóan.`,
  // Hungarian keeps the noun singular after a number, so both forms read the same.
  errorSummaryTitle: count =>
    plural("hu", count, {
      one: `A mentéshez javíts ${count} mezőt`,
      other: `A mentéshez javíts ${count} mezőt`,
    }),
  formErrors: {
    noService: "Válassz legalább egy riasztási csatornát.",
    noEmail: "Add meg az e-mail-címedet.",
    invalidEmail: "Adj meg egy e-mail-címet, például nev@example.com.",
    noSignal: "Add meg a Signal-felhasználónevedet.",
    invalidSignal:
      "Adj meg egy Signal-felhasználónevet, például alice.42. A sajátodat a Signalban a Beállítások, majd a Profil alatt találod.",
    noTelegram: "Add meg a Telegram-felhasználónevedet.",
    invalidTelegram:
      "Adj meg egy Telegram-felhasználónevet, például alice_eth: 4-32 betű, számjegy vagy aláhúzásjel, betűvel kezdődik, és nem végződik _ jellel.",
  },
  summaryServices: "Csatornák",
  summaryNoServices: "Nincs kiválasztva",
  summaryEmail: "E-mail",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Nyelv",
  summaryTelegramNotLinked: bot => `Még nincs összekapcsolva: nyomd meg egyszer a Start gombot itt: @${bot}.`,
  summaryThreshold: "Küszöbérték",
  sendTest: "Teszt küldése",
  sendingTest: "Küldés",
  testAgainIn: minutes => `Újra ${minutes} perc múlva`,
  testSent: channel => `Tesztüzenet elküldve: ${channelInSentence(channel)}. Ellenőrizd, hogy megérkezett-e.`,
  testFailed: "A tesztüzenetet nem sikerült elküldeni",
  testLimitNote: minutes =>
    `A teszt ezt a riasztást és a pozíciódat a mostani állapotában küldi el. Csatornánként ${minutes} percenként egy teszt.`,
  belowThresholdTitle: "A riasztási küszöbérték alatt",
  belowThresholdDescription: (healthFactor, threshold) =>
    `A jelenlegi health factorod (${healthFactor}) a küszöbértéked (${threshold}) alatt van.`,
  alertSaved: "Riasztás mentve",
  saveFailed: "Nem sikerült menteni a riasztást",
  alertDeleted: "Riasztás törölve",
  deleteFailed: "Nem sikerült törölni a riasztást",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (nem kötelező)`,
  attributionDescription: "Segít megtudni, mely csatornák működnek. A tárcacímeddel együtt mentjük.",
  attributionEmpty: "Írj be egy választ, vagy válaszd a Kihagyás lehetőséget.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () =>
    "A válasz túl hosszú, vagy rejtett karaktereket tartalmaz. Írd be újra, és próbáld meg ismét.",
  attributionSendFailed: "Nem sikerült elküldeni a válaszodat. Próbáld újra, vagy hagyd ki.",
  sendAnswer: "Válasz küldése",
  sending: "Küldés",
  skip: "Kihagyás",
  answerSent: "Válasz elküldve",
};
