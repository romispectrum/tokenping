import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

// The alert price ("3 USDC za 30 dni" or the blog's fallback) always stands where the nominative reads correctly:
// "Cena alertów: ...", never after "kosztują".

/** "na 30 dni", "na 1 dzień". */
const plForDays = (days: number) => `na ${plural("pl", days, { one: `${days} dzień`, other: `${days} dni` })}`;

/** "co 5 minut", "co 2 minuty", "co minutę". */
const plEveryMinutes = (minutes: number) =>
  plural("pl", minutes, {
    one: "co minutę",
    few: `co ${minutes} minuty`,
    many: `co ${minutes} minut`,
    other: `co ${formatDecimal("pl", minutes)} minuty`,
  });

const plPrice = (plan: AlertPlan) =>
  `${formatDecimal("pl", plan.priceLabel)} za ${plural("pl", plan.days, { one: "1 dzień", other: `${plan.days} dni` })}`;

/** "w 21 sieciach", "w 1 sieci". */
const plOnNetworks = (networks: number) =>
  plural("pl", networks, { one: `w ${networks} sieci`, other: `w ${networks} sieciach` });

/** "1 sieć", "2 sieci", "22 sieci". */
const plNetworks = (networks: number) =>
  plural("pl", networks, { one: `${networks} sieć`, other: `${networks} sieci` });

/** "1 rynek", "2 rynki", "24 rynków". */
const plMarkets = (markets: number) =>
  plural("pl", markets, {
    one: `${markets} rynek`,
    few: `${markets} rynki`,
    many: `${markets} rynków`,
    other: `${markets} rynku`,
  });

/** "1 Spoke", "2 Spoke'i", "13 Spoke'ów". */
const plSpokes = (spokes: number) =>
  plural("pl", spokes, {
    one: `${spokes} Spoke`,
    few: `${spokes} Spoke'i`,
    many: `${spokes} Spoke'ów`,
    other: `${spokes} Spoke'a`,
  });

/** "w sieci Arbitrum One", or the payment network unnamed. */
const plOnChain = (chainName: string | undefined) => (chainName ? `w sieci ${chainName}` : "w sieci płatności");

export const MESSAGES: HomeMessages = {
  headline: channels => `Alerty o współczynniku zdrowia w Aave i Morpho przez ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alerty przez ${channels}, gdy współczynnik zdrowia w Aave lub Morpho jest poniżej progu, ${plOnNetworks(networks)}, ${plEveryMinutes(minutes)}.`
      : `Alerty przez ${channels}, gdy twój współczynnik zdrowia w Aave lub Morpho spadnie poniżej twojego progu, ${plOnNetworks(networks)}. Sprawdzanie ${plEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `Ustaw alerty: ${plPrice(plan)}` : "Ustaw alerty"),
  offerDescription: ({ days, currency }) =>
    `Alerty o współczynniku zdrowia ${plForDays(days)}, płatne w ${currency} z twojego portfela. Bez automatycznego odnowienia.`,

  kicker: "Aave V3 i V4, Morpho Blue i Midnight",
  heroLead: ({ minutes, channels }) =>
    `Sprawdzanie ${plEveryMinutes(minutes)}. Wiadomość przez ${channels}, dopóki jesteś poniżej swojej granicy. Tylko do odczytu, bez zatwierdzania tokenów.`,
  networksLabel: "Sieci",
  heroCoverage: networks => plNetworks(networks),
  channelsLabel: "Alerty przez:",
  exampleAlertLabel: "Tak wygląda alert",
  exampleAlertCaption: subject => `Przykład. E-maile przychodzą z tematem „${subject}”.`,

  dashboardCta: "Otwórz panel Aave",
  morphoDashboardCta: "Otwórz panel Morpho",
  dashboardCtaMicrocopy: alertPrice => `Połącz portfel i zobacz wszystkie pozycje. Cena alertów: ${alertPrice}.`,

  problemTitle: "Współczynnik zdrowia spada, gdy śpisz",
  problemLead:
    "Aave pokazuje twój współczynnik zdrowia, ale nie wysyła alertów (październik 2026). W nocy zmieniają go trzy rzeczy:",
  problemCauses: [
    { title: "Ceny spadają", body: "ETH tanieje, a twoje zabezpieczenie jest warte mniej." },
    { title: "Narastają odsetki", body: "Twój dług rośnie co sekundę." },
    { title: "Progi się zmieniają", body: "W Aave governance może obniżyć próg likwidacji." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Pożyczkobiorcy opisują ",
      morning("poranek ze zlikwidowaną pozycją"),
      ", ",
      failedRepays("godzinę nieudanych transakcji spłaty"),
      " i ",
      polygon("spłatę przy 1,01, która przyszła za późno"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "Likwidator zatrzymuje do tego bonus: 5% na WETH na rynku Core w sieci Ethereum (październik 2026).",
      guide && rich(" Zobacz, ", guide("jak działa likwidacja"), "."),
    ),
  chart: {
    threshold: "twój próg",
    liquidation: "likwidacja",
    alertSent: "Alert wysłany",
    youCheck: "Sprawdzasz telefon",
    caption:
      "Przykładowa noc. Alert wychodzi o 3:05, przy pierwszym sprawdzeniu poniżej 1,5, pięć godzin zanim spojrzysz na telefon.",
  },

  howItWorksTitle: "Jak to działa",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` w sieci ${paymentChain}` : "";
    return [
      {
        title: "Połącz portfel, z którego pożyczasz",
        body: "Tylko do odczytu. Aave i Morpho, każde na osobnej stronie.",
      },
      {
        title: plan
          ? `Odblokuj alerty za ${formatDecimal("pl", plan.priceLabel)}`
          : "Odblokuj alerty niewielką płatnością w USDC",
        body: `${plan ? `${capitalize(plForDays(plan.days))}, płatność` : "Płatność"} w USDC${paidOn}. Bez automatycznego odnowienia.`,
      },
      {
        title: "Wybierz granicę dla każdego rynku",
        body: `Od ${formatDecimal("pl", threshold.min)} (w Morpho od ${formatDecimal("pl", morphoMin)}) do ${formatDecimal("pl", threshold.max)}, domyślnie ${formatDecimal("pl", threshold.default)}.`,
      },
      {
        title: "Otrzymuj wiadomości, dopóki jesteś poniżej niej",
        body: `${capitalize(plEveryMinutes(minutes))}, przez ${channels}, dopóki nie wrócisz powyżej swojej granicy.`,
      },
    ];
  },
  scaleTitle: "Gdzie ustawić granicę",
  scale: {
    liquidation: "likwidacja",
    critical: "Krytyczny",
    risky: "Ryzykowny",
    safe: "Bezpieczny",
    defaultThreshold: value => `Domyślnie ${value}`,
    below: value => `Poniżej ${value}`,
    between: (from, to) => `Od ${from} do ${to}`,
    andAbove: value => `${value} i więcej`,
    range: (min, max) => `Dowolna wartość od ${min} do ${max}.`,
  },
  scaleGuide: "Jak wybrać próg",

  coverageTitle: "Każdy rynek Aave i każdy wymieniony rynek Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${plMarkets(v3Markets)} Aave V3 ${plOnNetworks(v3Networks)} i ${plSpokes(spokes)} Aave V4 ${plOnNetworks(v4Networks)}, według stanu na 16 października 2026, a do tego każdy wymieniony rynek Morpho ${plOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => `${plMarkets(count)} V3`,
    v4Spokes: count => `${plSpokes(count)} V4`,
    morpho: "Morpho",
  },
  coverageNote:
    "Rynki w sieciach Scroll, ZKsync, Metis, Soneium i Sonic są wygaszane przez governance Aave i nadal je monitorujemy. Nie obejmujemy Aave V3 w sieci Harmony, niewymienionych rynków Morpho ani innych protokołów.",

  pricingTitle: "Cennik",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alerty", detail: capitalize(alertPrice) },
    { term: "Odnowienie", detail: "Brak automatycznego: zapłać ponownie, gdy chcesz więcej czasu" },
    {
      term: "Płatność",
      detail: paymentChain
        ? `USDC w sieci ${paymentChain}, z twojego portfela (zgoda, potem płatność)`
        : "USDC, z twojego portfela",
    },
  ],
  priceSource: "Cena jest odczytywana z kontraktu płatności i odświeżana co godzinę.",
  pricingFootnote: "Przeglądanie pozycji nie wymaga płatności.",

  questionsTitle: "Pytania, które warto zadać przed połączeniem portfela",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = plOnChain(paymentChain);
    return [
      {
        question: "Czy Tokenping może ruszyć moje środki?",
        answer: rich(
          `Nie. Tokenping tylko odczytuje twoje pozycje i nigdy nie prosi o zgodę ani o podpis ani w Aave, ani w Morpho. Jedyne transakcje to płatność ${onChain}: zgoda na dokładnie tę kwotę, a potem płatność. `,
          links.sourcify
            ? rich(
                "Kontrakt jest ",
                links.sourcify("zweryfikowany w Sourcify"),
                ", a jego ",
                links.sourceCode("kod źródłowy jest publiczny"),
              )
            : links.sourceCode("Kod źródłowy kontraktu jest publiczny"),
          "; portfel zespołu może zmienić jego cenę, wstrzymać go i zaktualizować.",
        ),
      },
      {
        question: "Co zapisujecie?",
        answer: rich(
          "Adres twojego portfela, twoje alerty i podane dane kontaktowe (e-mail, nazwę użytkownika Signal",
          hasTelegram ? ", czat Telegram" : "",
          `). Bez historii i bez śledzących plików cookie; wyświetlenia stron liczymy anonimowo. Te dane kontaktowe może odczytać tylko osoba, która może podpisywać twoim portfelem, ale płatności ${onChain} są publiczne. Pełną listę znajdziesz na `,
          links.privacy("stronie o prywatności"),
          ".",
        ),
      },
      {
        question: "Ile to kosztuje?",
        answer: rich(
          `Cena alertów: ${alertPrice}, w USDC ${onChain}, plus trochę ETH na gas. Przeglądanie pozycji nie wymaga płatności. Bez automatycznego odnowienia, bez zwrotów.`,
        ),
      },
      {
        question: "Które pożyczki w Morpho są objęte?",
        answer: rich(
          `Pożyczki w Morpho Blue (zmienne oprocentowanie) i Morpho Midnight (stałe oprocentowanie) na rynkach wymienionych w aplikacji Morpho, z progami od ${formatDecimal("pl", morphoMin)}. Pożyczka o stałym oprocentowaniu dostaje też przypomnienia przed terminem zapadalności. Obejmuje je ten sam plan: otwórz `,
          links.morphoDashboard("panel Morpho"),
          ".",
        ),
      },
      {
        question: "Co, jeśli alert nie dotrze?",
        answer: rich(
          `Następne sprawdzenie, ${plural("pl", minutes, { one: "minutę", few: `${minutes} minuty`, many: `${minutes} minut`, other: `${minutes} minuty` })} później, spróbuje ponownie. Dostarczanie zależy od Resend, przekaźnika Signal, `,
          hasTelegram ? "Telegram Bot API, " : "",
          "publicznych węzłów RPC i harmonogramu Vercel, bez gwarancji dostępności. Wybierz dwa kanały i zostaw sobie czas na reakcję.",
        ),
      },
      {
        question: "Jak zatrzymać alerty?",
        answer: rich(
          "Ustają, gdy twój współczynnik zdrowia wróci powyżej twojej granicy albo gdy usuniesz alert (wymaga aktywnego dostępu). Dostęp wygasł? Napisz do nas na ",
          links.x("X"),
          " albo w naszej społeczności w aplikacji ",
          links.telegramCommunity("Telegram"),
          " lub ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " W aplikacji Telegram działa też /stop." : "",
          " Nie ma jeszcze wstrzymywania alertów ani linku do wypisania się.",
        ),
      },
      {
        question: "Czy mogę obserwować portfel, którego nie łączę?",
        answer: rich("Obecnie nie. Jeden portfel, ten połączony; dostęp jest przypisany do portfela."),
      },
      {
        question: "Inne narzędzia nic nie kosztują. Dlaczego płacić?",
        answer: rich(
          "Jeśli pasuje ci bot telegramowy albo aplikacja mobilna, korzystaj z nich",
          links.comparison ? rich(": opisuje je nasze ", links.comparison("porównanie")) : null,
          ". Tokenping jest dla alertów przez Signal lub e-mail, na każdym rynku Aave i każdym wymienionym rynku Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Ograniczenia, powiedziane wprost",
  limits: ({ minutes, paymentChain }) => [
    `Sprawdzanie ${plEveryMinutes(minutes)}, a nie na bieżąco.`,
    "Każde sprawdzenie poniżej twojej granicy wysyła kolejną wiadomość: bez wstrzymywania i bez podsumowań.",
    "Jedna granica na rynek, tylko dla połączonego portfela.",
    `Tylko USDC${paymentChain ? ` w sieci ${paymentChain}` : ""}: bez kart, bez zwrotów.`,
    "E-maile nie mają jeszcze linku do wypisania się; usunięcie alertu wymaga aktywnego dostępu.",
    "Beta: dostarczanie przez zewnętrzne usługi, bez gwarancji dostępności.",
  ],

  blogTitle: "Z bloga",
  allGuides: "Wszystkie poradniki o Aave i Morpho",

  closingTitle: "Ustaw alert o współczynniku zdrowia w Aave lub Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, płatność z twojego portfela. Bez automatycznego odnowienia.`,
};
