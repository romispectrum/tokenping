import type { AlertsMessages } from "./shared";
import { plForMarket, plOnMarket, plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION = "Skąd znasz Tokenping?";

const everyMinutes = (minutes: number) =>
  plural("pl", minutes, {
    one: `co ${minutes} minutę`,
    few: `co ${minutes} minuty`,
    many: `co ${minutes} minut`,
    other: `co ${minutes} minuty`,
  });

export const MESSAGES: AlertsMessages = {
  cardTitle: "Ustawienia alertów",
  active: "Aktywny",
  payToEdit: "Zapłać za dostęp, aby edytować",
  editAlert: "Edytuj alert",
  signInTitle: "Zaloguj się, aby zarządzać alertami",
  signInDescription:
    "Portfel podpisuje wiadomość, która potwierdza, że adres należy do ciebie. To nie jest transakcja, więc nie płacisz za gas.",
  signIn: "Zaloguj się portfelem",
  signingIn: "Czekamy na twój portfel",
  signInStatement: "Zaloguj się w Tokenping, aby zobaczyć i edytować swoje alerty o współczynniku zdrowia.",
  signInRejected: "Prośba o podpis została odrzucona. Zaloguj się, aby zobaczyć i edytować swoje alerty.",
  signInFailed: "Nie udało się zalogować. Spróbuj ponownie.",
  signInExpired: "Twoja sesja wygasła. Zaloguj się ponownie portfelem.",
  emptyTitle: (chainName, kind) => `Nie masz jeszcze alertów ${plOnMarket(chainName, kind)}`,
  emptyDescription: "Otrzymasz wiadomość, gdy twój współczynnik zdrowia spadnie poniżej wybranego progu.",
  createAlert: "Utwórz alert",
  loadErrorTitle: "Nie udało się wczytać ustawień alertów",
  loadErrorDescription: "Sprawdź połączenie i spróbuj ponownie.",
  tryAgain: "Spróbuj ponownie",
  retrying: "Ponawiamy",
  servicesLegend: "Kanały alertów",
  servicesDescription: "Wybierz, dokąd mają trafiać alerty. Możesz wybrać więcej niż jeden kanał.",
  serviceNames: { email: "E-mail", signal: "Signal", telegram: "Telegram" },
  emailLabel: "Adres e-mail",
  emailDescription: "Alerty trafią na ten adres.",
  emailPlaceholder: "ty@example.com",
  signalLabel: "Nazwa użytkownika Signal",
  signalDescription: "W aplikacji Signal otwórz Ustawienia, a potem Profil. Wygląda tak: alice.42.",
  telegramLabel: "Nazwa użytkownika Telegram",
  telegramDescription:
    "Alerty trafią na to konto Telegram. Nazwę znajdziesz w aplikacji Telegram: Ustawienia, a potem Nazwa użytkownika.",
  telegramPlaceholder: "alice_eth",
  telegramChecking: "Sprawdzamy",
  telegramLinked: username => `Połączono @${username}: alerty będą trafiać do twojego czatu w aplikacji Telegram.`,
  telegramPressStart: bot => `Jeszcze niepołączone: naciśnij raz Start w ${bot ? `@${bot}` : "bocie Tokenping"}.`,
  openBot: bot => `Otwórz @${bot}`,
  telegramStatusUnknown: "Nie udało się sprawdzić, czy ta nazwa użytkownika jest połączona. Nadal możesz zapisać.",
  opensInNewTab: "(otwiera się w nowej karcie)",
  channelLanguageLabels: {
    email: "Język e-maili",
    signal: "Język wiadomości Signal",
    telegram: "Język wiadomości Telegram",
  },
  thresholdLabel: "Próg współczynnika zdrowia",
  thresholdExactValue: "(dokładna wartość)",
  thresholdScale: { critical: "Krytyczny", safe: "Bezpieczny", verySafe: "Bardzo bezpieczny" },
  thresholdDescription: (threshold, chainName, kind) =>
    `Otrzymasz alert, gdy twój współczynnik zdrowia ${plOnMarket(chainName, kind)} spadnie poniżej ${threshold}.`,
  saveAlert: "Zapisz alert",
  saving: "Zapisujemy",
  cancel: "Anuluj",
  deleteAlert: "Usuń alert",
  deleting: "Usuwamy",
  keepAlert: "Zachowaj alert",
  deleteTitle: "Usunąć ten alert?",
  deleteDescription: (chainName, kind) =>
    `Tokenping przestanie wysyłać alerty o współczynniku zdrowia ${plForMarket(chainName, kind)}.`,
  errorSummaryTitle: count =>
    plural("pl", count, {
      one: `Popraw ${count} pole, aby zapisać`,
      few: `Popraw ${count} pola, aby zapisać`,
      many: `Popraw ${count} pól, aby zapisać`,
      other: `Popraw ${count} pola, aby zapisać`,
    }),
  formErrors: {
    noService: "Wybierz co najmniej jeden kanał alertów.",
    noEmail: "Wpisz swój adres e-mail.",
    invalidEmail: "Wpisz adres e-mail w formacie imie@example.com.",
    noSignal: "Wpisz swoją nazwę użytkownika Signal.",
    invalidSignal:
      "Wpisz nazwę użytkownika Signal w formacie alice.42. Znajdziesz ją w aplikacji Signal: Ustawienia, a potem Profil.",
    noTelegram: "Wpisz swoją nazwę użytkownika Telegram.",
    invalidTelegram:
      "Wpisz nazwę użytkownika Telegram w formacie alice_eth: od 4 do 32 liter, cyfr lub podkreśleń, na początku litera, na końcu nie _.",
  },
  summaryServices: "Kanały",
  summaryNoServices: "Nie wybrano",
  summaryEmail: "E-mail",
  summarySignal: "Signal",
  summaryTelegram: "Telegram",
  summaryLanguage: "Język",
  summaryTelegramNotLinked: bot => `Jeszcze niepołączone: naciśnij raz Start w @${bot}.`,
  summaryThreshold: "Próg",
  sendTest: "Wyślij test",
  sendingTest: "Wysyłamy",
  testAgainIn: minutes => `Ponownie za ${minutes} min`,
  testSent: channel => `Wysłano wiadomość testową przez ${channel}. Sprawdź, czy dotarła.`,
  testFailed: "Nie udało się wysłać wiadomości testowej",
  testLimitNote: minutes =>
    `Test wysyła ten alert i twoją pozycję w obecnym stanie. Jeden na kanał ${everyMinutes(minutes)}.`,
  belowThresholdTitle: "Poniżej progu twojego alertu",
  belowThresholdDescription: (healthFactor, threshold) =>
    `Twój obecny współczynnik zdrowia (${healthFactor}) jest poniżej twojego progu ${threshold}.`,
  alertSaved: "Alert zapisany",
  saveFailed: "Nie udało się zapisać alertu",
  alertDeleted: "Alert usunięty",
  deleteFailed: "Nie udało się usunąć alertu",
  attributionQuestion: ATTRIBUTION_QUESTION,
  attributionFormLabel: `${ATTRIBUTION_QUESTION} (opcjonalnie)`,
  attributionDescription:
    "Odpowiedź pomaga nam sprawdzić, które kanały działają. Zapisujemy ją razem z adresem twojego portfela.",
  attributionEmpty: "Wpisz odpowiedź albo wybierz Pomiń.",
  // The checks behind it (length, hidden control characters) only fail for pasted text.
  attributionInvalid: () => "Odpowiedź jest za długa albo zawiera ukryte znaki. Przepisz ją i spróbuj ponownie.",
  attributionSendFailed: "Nie udało się wysłać odpowiedzi. Spróbuj ponownie albo pomiń pytanie.",
  sendAnswer: "Wyślij odpowiedź",
  sending: "Wysyłamy",
  skip: "Pomiń",
  answerSent: "Odpowiedź wysłana",
};
