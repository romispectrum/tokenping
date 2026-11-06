import type { MorphoMessages } from "./shared";
import { plForMarket, plOnMarket, plural } from "~~/i18n/format";

/** "co 5 minut", "co 2 minuty", "co minutę". */
const everyMinutes = (minutes: number) =>
  plural("pl", minutes, {
    one: "co minutę",
    few: `co ${minutes} minuty`,
    many: `co ${minutes} minut`,
    other: `co ${minutes} minuty`,
  });

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Alerty o współczynniku zdrowia dla Morpho Blue i Midnight",
    metaDescription: (networkCount, channels) =>
      `Alerty o współczynniku zdrowia dla Morpho Blue i Midnight przez ${channels}, ${plural("pl", networkCount, { one: `w ${networkCount} sieci`, other: `w ${networkCount} sieciach` })}, z przypomnieniem przed terminem zapadalności.`,
    title: "Pozycje i alerty o współczynniku zdrowia w Morpho Blue i Midnight",
    intro: networks =>
      `Twoje pozycje pożyczkowe na rynkach, które wyświetla aplikacja Morpho, w sieciach ${networks}: pożyczki o zmiennym oprocentowaniu (Morpho Blue) i o stałym oprocentowaniu (Morpho Midnight). Współczynniki zdrowia są odczytywane z blockchaina.`,
    checks: (minutes, repeatMinutes) =>
      `Alerty są sprawdzane ${everyMinutes(minutes)}. Pożyczka o stałym oprocentowaniu dostaje też przypomnienie 7 dni i 1 dzień przed terminem zapadalności, a po tym terminie alert co ${repeatMinutes} minut, dopóki pozostaje dług.`,
    access: "Jedna płatność za dostęp obejmuje alerty dla Aave i Morpho.",
    notAffiliated: "Tokenping nie jest powiązany z Morpho.",
    guideHealthFactor: "Jak działa współczynnik zdrowia w Morpho",
    guideLiquidation: "Jak działa likwidacja w Morpho",
    guideMidnight: "Pożyczki o stałym oprocentowaniu w Morpho Midnight",
    aaveDashboard: "Pożyczasz w Aave? Otwórz panel Aave",
  },
  positionsHeading: "Twoje pozycje w Morpho",
  gate: {
    title: "Połącz portfel, aby kontynuować",
    description:
      "Tokenping potrzebuje adresu twojego portfela, aby znaleźć twoje pozycje w Morpho. Połączenie nie przenosi środków i nic nie kosztuje.",
    connect: "Połącz portfel",
    connecting: "Łączymy",
    approveInWallet: "Zatwierdź połączenie w portfelu.",
  },
  list: {
    heading: "Rynki",
    count: count => `${count} z długiem`,
    none: "Nie znaleziono pożyczek na rynkach, które wyświetla aplikacja Morpho.",
    discoveryFailed: "API Morpho nie odpowiedziało, więc widać tylko rynki z zapisanym alertem.",
    variableRate: "Zmienne oprocentowanie",
    fixedRate: "Stałe oprocentowanie",
    matures: date => `Termin zapadalności: ${date}`,
    matured: "Po terminie zapadalności",
    unreadable: "Nie udało się odczytać",
    retry: market => `Spróbuj ponownie odczytać ${market}`,
    noneSelectedDescription: "Wybierz rynek, aby zobaczyć swoją pozycję w Morpho.",
  },
  details: {
    collateralValue: "Wartość zabezpieczenia",
    debt: "Dług",
    ltv: "LTV",
    lltv: "LTV likwidacji",
    maturity: "Termin zapadalności",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("pl", days, { one: "za 1 dzień", other: `za ${days} dni` })
        : plural("pl", hours, {
            one: "za 1 godzinę",
            few: `za ${hours} godziny`,
            many: `za ${hours} godzin`,
            other: `za ${hours} godziny`,
          }),
    pastMaturity:
      "Ta pożyczka jest po terminie zapadalności: pozostały dług może zostać zlikwidowany w dowolnej chwili, niezależnie od współczynnika zdrowia. Spłać go, aby uniknąć likwidacji.",
    preLiquidation: "Prelikwidacja",
    preLiquidationNote:
      "Na tym rynku masz włączoną prelikwidację (pre-liquidation), więc współczynnik zdrowia jest liczony względem jej wcześniejszej granicy: poniżej 1 część twojej pozycji może zostać sprzedana.",
    amountsIn: token => `Kwoty są podane w ${token} i wycenione przez wyrocznię rynku.`,
    noDebtTitle: "Brak długu na tym rynku",
    noDebtDetail: "Zapisany alert pozostaje zapisany i nic nie wysyła, dopóki nie ma długu.",
    unreadableTitle: "Nie udało się odczytać tej pozycji",
    unreadableDetail: "Sieć nie odpowiedziała. Twój alert jest nadal sprawdzany.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Zapłać raz, aby ustawić alerty o współczynniku zdrowia ${plOnMarket(marketName, "market")} i na innych rynkach. Nic nie odnawia się automatycznie: płacisz ze swojego portfela, gdy chcesz przedłużyć dostęp.`,
    descriptionExtend: marketName =>
      `Twoje zapisane ustawienia alertów ${plForMarket(marketName, "market")} wciąż są na twoim koncie. Zapłać ponownie, aby przedłużyć dostęp i je edytować.`,
  },
};
