import type { PrivacyMessages } from "./shared";
import { plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_PL = "„Skąd znasz Tokenping?”";

/** "co 5 minut", "co 2 minuty", "co minutę". */
const everyMinutes = (minutes: number) =>
  plural("pl", minutes, {
    one: "co minutę",
    few: `co ${minutes} minuty`,
    many: `co ${minutes} minut`,
    other: `co ${minutes} minuty`,
  });

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Prywatność i dane",
  metaDescription:
    "Co Tokenping zapisuje, gdy ustawiasz alert o współczynniku zdrowia w Aave, czego nie zapisuje, które usługi przetwarzają twoje dane i jak je usunąć.",
  crumbHome: "Start",
  crumbPrivacy: "Prywatność",
  title: "Prywatność: co Tokenping zapisuje i kto przetwarza dane",
  lastUpdated: "Ostatnia aktualizacja:",
  intro:
    "Ta strona opisuje, co aplikacja robi obecnie. Tokenping jest w wersji beta, a gdy zmieni się zakres zbieranych danych, aktualizujemy tę stronę.",
  withoutUs: {
    title: "Co możesz zrobić, nie przekazując nam niczego",
    text: "Czytanie strony i bloga oraz przeglądanie twoich pozycji w panelu nie dodaje niczego do naszej bazy danych. Aby pokazać twoje pozycje, twoja przeglądarka pyta dostawców RPC (wymienionych poniżej) o dane twojego portfela w Aave, więc ci dostawcy widzą adres twojego portfela.",
    morpho:
      "W panelu Morpho twoja przeglądarka wysyła też adres twojego portfela do API Morpho, które znajduje rynki Morpho, na których pożyczasz, i odczytuje twoje pozycje w Morpho od tych samych dostawców RPC.",
  },
  stored: {
    title: "Co zapisujemy, gdy zapisujesz alert",
    items: [
      "Adres twojego portfela.",
      "Sieć, której dotyczy alert, i twój próg.",
      "Wybrane przez ciebie kanały i język każdego z nich.",
      "Twój adres e-mail, jeśli wybierzesz e-mail.",
      "Twoją nazwę użytkownika Signal, jeśli wybierzesz Signal.",
      "Kiedy alert został utworzony i kiedy ostatnio zmieniony.",
      "Kiedy ostatnio wysłano wiadomość testową w każdym kanale, aby pozwolić na jeden test na kanał co 15 minut.",
    ],
    telegram:
      "Jeśli wybierzesz Telegram, zapisujemy nazwę użytkownika Telegram, którą wpiszesz w alercie. Gdy to konto naciśnie Start w bocie Tokenping, zapisujemy też identyfikator jego czatu i czas naciśnięcia Start, aby alerty mogły do niego trafiać. Każdy może sprawdzić, czy dana nazwa użytkownika Telegram nacisnęła Start w bocie.",
    attribution: `Jeśli po zapisaniu alertu odpowiesz na opcjonalne pytanie ${ATTRIBUTION_QUESTION_PL}, zapisujemy twoją odpowiedź i jej czas razem z adresem twojego portfela.`,
  },
  notStored: {
    title: "Czego nie zapisujemy",
    items: [
      "Twoich pozycji ani historii twojego współczynnika zdrowia. Są odczytywane na bieżąco i nie są zapisywane.",
      "Rejestru wysłanych alertów.",
      `Pikseli śledzących ani reklamowych plików cookie: strona nie używa żadnych. Gdy logujesz się portfelem, Tokenping ustawia jeden plik cookie, który mówi tylko, który portfel się zalogował; jest ważny 7 dni albo do chwili, gdy rozłączysz portfel na tej stronie. W trakcie logowania drugi plik cookie przechowuje przez pięć minut prośbę o zalogowanie. Twoja przeglądarka przechowuje w swojej pamięci lokalnej (local storage) wybrany motyw, połączenie z portfelem, informację, które portfele się w niej zalogowały, oraz to, czy pokazała ci już pytanie ${ATTRIBUTION_QUESTION_PL}.`,
      "Adresów IP w naszej bazie danych. Vercel nadal obsługuje każde żądanie, jak opisano poniżej. Gdy sprawdzenie alertu lub wysłanie wiadomości się nie powiedzie, błąd, który może zawierać adres twojego portfela i odbiorcę, trafia do naszych logów serwera.",
    ],
  },
  whoCanSee: {
    title: "Kto widzi ustawienia twoich alertów",
    tiedToWallet:
      "Ustawienia alertów są powiązane z adresem portfela, a nie z kontem z hasłem. Aby je zobaczyć lub zmienić, podpisujesz tym portfelem wiadomość, która potwierdza, że adres należy do ciebie. To nie jest transakcja, więc nie płacisz za gas, a jeden podpis jest ważny 7 dni w tej przeglądarce.",
    anyone: hasTelegram =>
      `Tylko osoba, która może podpisywać twoim portfelem, może zobaczyć zapisany dla niego adres e-mail${hasTelegram ? ", nazwę użytkownika Signal i nazwę użytkownika Telegram" : " i nazwę użytkownika Signal"} albo zmienić lub usunąć jego alerty. Publiczne zapisy płatności opisane poniżej nadal pokazują, które portfele zapłaciły.`,
    dontEnter:
      "Nie wpisuj adresu e-mail ani nazwy użytkownika Signal, których nie chcesz wiązać z adresem swojego portfela.",
  },
  processors: {
    title: "Kto przetwarza twoje dane",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hostuje tę stronę i uruchamia sprawdzanie alertów ${everyMinutes(minutes)}.`,
        receives: "Każde żądanie do strony, w tym twój adres IP, oraz nasze logi serwera.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Liczy wyświetlenia stron, bez plików cookie.",
        receives:
          "Przy każdym wyświetleniu strony: adres strony, stronę, z której przychodzisz, twoją przybliżoną lokalizację oraz twoją przeglądarkę, system operacyjny i typ urządzenia. Odwiedzający to skrót (hash) żądania, który zmienia się co 24 godziny, więc wizyt nie da się powiązać między dniami ani stronami.",
      },
      { name: "Supabase", role: "Nasza baza danych.", receives: "Ustawienia alertów wymienione powyżej." },
      { name: "Resend", role: "Wysyła alerty e-mailem.", receives: "Twój adres e-mail i treść alertu." },
      {
        name: "Fly.io (nasz przekaźnik Signal)",
        role: "Hostuje uruchamiany przez nas serwer signal-cli-rest-api, który przekazuje alerty do Signal.",
        receives: "Twoją nazwę użytkownika Signal i treść alertu (tak samo jak Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Dostarcza alerty Telegram przez swoje Bot API.",
              receives: "Identyfikator twojego czatu Telegram i treść alertu.",
            },
          ]
        : []),
      {
        name: "Dostawcy RPC (PublicNode, Alchemy i publiczne punkty końcowe sieci)",
        role: "Odpowiadają na odczyty z blockchaina: z twojej przeglądarki dla panelu, a z naszego serwera przy sprawdzaniu alertów i weryfikacji podpisów logowania z portfeli smart contract.",
        receives:
          "Odczytywany adres portfela (a przy logowaniu twój podpis) oraz twój adres IP przy odczytach z twojej przeglądarki.",
      },
      {
        name: "API Morpho",
        role: "Znajduje wymienione rynki Morpho, na których pożycza twój portfel, dla panelu Morpho, i informuje nasz serwer, czy rynek jest wymieniony, gdy zapisujesz alert dla Morpho.",
        receives: "Adres twojego portfela oraz twój adres IP przy zapytaniach z twojej przeglądarki.",
      },
      {
        name: "WalletConnect",
        role: "Przekazuje połączenie między tą stroną a aplikacją twojego portfela, jeśli łączysz się przez WalletConnect.",
        receives: "To, co aplikacja twojego portfela i ta strona wymieniają przy łączeniu, np. adres twojego portfela.",
      },
    ],
    receives: receives => `Otrzymuje: ${receives}`,
    ownPolicy: "Każda z tych usług przetwarza te dane zgodnie z własną polityką prywatności.",
  },
  onChain: {
    title: "Co jest publiczne na blockchainie",
    text: paymentChainName =>
      `Płatności za alerty odbywają się ${paymentChainName ? `w sieci ${paymentChainName}` : "w sieci płatności"}. Każda płatność zapisuje adres płacący, token, kwotę, czas, kupiony okres i nową datę wygaśnięcia w publicznym zdarzeniu, które każdy może odczytać i którego nikt nie może usunąć. Ustawienia twoich alertów nigdy nie są zapisywane na blockchainie.`,
  },
  retention: {
    title: "Jak długo je przechowujemy i jak je usunąć",
    settings:
      "Ustawienia alertów są przechowywane, dopóki nie usuniesz alertu w panelu. Usunięcie kasuje ustawienia dla tej sieci, w tym adres e-mail i nazwę użytkownika Signal, i wymaga aktywnego dostępu.",
    telegramStop:
      "Wysłanie /stop do bota Tokenping w aplikacji Telegram odłącza twój czat i zatrzymuje alerty Telegram.",
    contact: {
      before: `Jeśli twój dostęp wygasł albo chcesz usunąć swoją odpowiedź na pytanie ${ATTRIBUTION_QUESTION_PL}, napisz do nas na`,
      x: "X",
      middle: "albo w naszej społeczności w aplikacji",
      telegram: "Telegram",
      or: "lub",
      signal: "Signal",
      after: "i poproś o usunięcie, a usuniemy te dane.",
    },
    payments: "Płatności na blockchainie nie może usunąć nikt.",
  },
  homepage: {
    before: "Odpowiedzi na pytania o to, jak działają alerty, znajdziesz na ",
    link: "stronie głównej",
    after: ".",
  },
};
