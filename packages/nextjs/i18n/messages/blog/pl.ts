import type { BlogMessages } from "./shared";
// The alert price ("3 USDC za 30 dni" or the fallback) stands where the nominative reads: "Cena alertów: ...".
import { formatDecimal, plural } from "~~/i18n/format";

/** "co 5 minut", "co 2 minuty", "co minutę". */
const everyMinutes = (minutes: number) =>
  plural("pl", minutes, {
    one: "co minutę",
    few: `co ${minutes} minuty`,
    many: `co ${minutes} minut`,
    other: `co ${formatDecimal("pl", minutes)} minuty`,
  });

/** "w 22 sieciach", "w 1 sieci". */
const onNetworks = (networks: number) =>
  plural("pl", networks, { one: `w ${networks} sieci`, other: `w ${networks} sieciach` });

/** "za dzień", "za 30 dni", "za 1,5 dnia". */
const forDays = (days: number) =>
  plural("pl", days, {
    one: "za dzień",
    few: `za ${days} dni`,
    many: `za ${days} dni`,
    other: `za ${formatDecimal("pl", days)} dnia`,
  });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Start", blog: "Blog" },
  index: {
    title: "Współczynnik zdrowia i likwidacje w Aave i Morpho: poradniki",
    description:
      "Poradniki o współczynniku zdrowia w Aave i Morpho, likwidacjach, cenach likwidacji i alertach, z przykładami obliczeń i datowanymi danymi ze źródłami.",
    kicker: "Poradniki o Aave i Morpho",
    lead: "Jak działa współczynnik zdrowia w Aave i w Morpho, co dzieje się przy likwidacji, jak obliczyć cenę likwidacji i jak dostać ostrzeżenie, zanim cena się do niej zbliży. Każda liczba w tych poradnikach podaje swoje źródło i datę, kiedy ją sprawdzono.",
    dashboardCta: "Otwórz panel Aave",
    morphoDashboardCta: "Otwórz panel Morpho",
    rss: "Subskrybuj przez RSS",
    startHere: "Zacznij tutaj",
    allGuides: "Wszystkie poradniki",
    empty: {
      title: "Nie ma jeszcze poradników",
      description: "Przygotowujemy polskie wersje poradników. Subskrybuj przez RSS, aby dostać je zaraz po publikacji.",
      otherLanguage: "Czytaj poradniki po angielsku",
    },
  },
  post: {
    kicker: "Poradnik o Aave V3",
    morphoKicker: "Poradnik o Morpho",
    byline: { author: "Zespół Tokenping", published: "Opublikowano", updated: "Zaktualizowano" },
    readingTime: minutes => `${minutes} min czytania`,
    readGuide: "Czytaj poradnik",
    related: "Powiązane poradniki",
  },
  endBox: {
    label: "O Tokenping",
    title: "Alerty o współczynniku zdrowia od Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping sprawdza twój współczynnik zdrowia w Aave V3 i V4 ${everyMinutes(minutes)} ${onNetworks(networks)} i wysyła ci wiadomość przez ${channels}, gdy jest poniżej twojego progu. Cena alertów: ${price}${paymentChain ? `, płatność w sieci ${paymentChain}` : ""}; przeglądanie pozycji nie wymaga płatności. Alerty dają ci czas na reakcję, ale nie zapobiegają likwidacji.`,
    cta: "Otwórz panel",
    morpho: {
      title: "Alerty o współczynniku zdrowia w Morpho od Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping sprawdza twój współczynnik zdrowia w Morpho Blue i Midnight ${everyMinutes(minutes)} ${onNetworks(networks)} i wysyła ci wiadomość przez ${channels}, gdy jest poniżej twojego progu, a przed terminem zapadalności pożyczki o stałym oprocentowaniu wysyła przypomnienie. Cena alertów: ${price}${paymentChain ? `, płatność w sieci ${paymentChain}` : ""}, ten sam plan co alerty dla Aave; przeglądanie pozycji nie wymaga płatności. Alerty dają ci czas na reakcję, ale nie zapobiegają likwidacji.`,
      cta: "Otwórz panel Morpho",
    },
  },
  alertPrice: {
    fallback: "niewielka kwota w USDC (aktualną cenę znajdziesz w panelu)",
    plan: ({ priceLabel, days }) => `${formatDecimal("pl", priceLabel)} ${forDays(days)}`,
  },
  callout: { info: "Uwaga", warning: "Ostrzeżenie" },
  shortAnswer: "Krótka odpowiedź",
  scopeNote: {
    text: "Dotyczy Aave V3.7, sprawdzone na rynkach Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche i Gnosis. Inne rynki i sieci V3 mogą działać na starszych wersjach. Różnice w Aave V4 opisujemy tam, gdzie zasady się różnią.",
    morphoText:
      "Dotyczy rynków Morpho Blue i Morpho Midnight wyświetlanych w aplikacji Morpho. Każdy rynek ma własne zabezpieczenie, wyrocznię i LLTV, więc sprawdź dane swojego rynku.",
    figuresAsOf: "Dane na dzień",
  },
  table: {
    fallbackLabel: "Tabela, przewijana w poziomie",
    label: (heading, index) => (index === undefined ? `Tabela: ${heading}` : `Tabela ${index}: ${heading}`),
    scrollHint: "Przewiń w bok, aby zobaczyć wszystkie kolumny.",
  },
};
