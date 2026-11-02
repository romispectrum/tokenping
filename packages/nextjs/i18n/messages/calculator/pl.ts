import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator ceny likwidacji w Aave",
  intro:
    "Wpisz każde aktywo zabezpieczenia i swój dług, aby zobaczyć współczynnik zdrowia i ceny, przy których pozycja może zostać zlikwidowana. Kalkulator używa wzoru Aave V3: Σ(wartość zabezpieczenia × próg likwidacji) ÷ wartość długu.",
  examplesLabel: "Wczytaj przykład z obliczeniami:",
  examples: {
    "one-collateral": "10 WETH, dług 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dług 20 000 USDC",
    "volatile-debt": "10 000 USDC, pożyczone 2.5 WETH",
  },
  defaultCollateralName: index => `Zabezpieczenie ${index}`,
  defaultDebtName: "Pożyczone aktywo",
  collateralLegend: index => `Zabezpieczenie ${index}`,
  presetLabel: "Aktywo Aave V3 (uzupełnia próg)",
  eModeHint: (collateral, borrowable) =>
    `Ten próg dotyczy ${joinList("pl", collateral)}; pozostałe zabezpieczenie zachowuje własny. W tym E-Mode możesz pożyczać tylko ${joinList("pl", borrowable)}.`,
  otherAsset: "Inne aktywo: wpisz próg samodzielnie",
  presetGroup: (market, date) => `${market} (odczytano ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated” (np. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (natywny)",
  },
  nameLabel: "Nazwa aktywa",
  namePlaceholder: symbols => `np. ${symbols.join(" lub ")}`,
  amountSupplied: "Wpłacona ilość",
  price: "Cena (USD)",
  priceHint: "Cena z wyroczni Aave, widoczna na stronie aktywa w aplikacji Aave.",
  threshold: "Próg likwidacji (%)",
  thresholdHint: "W E-Mode próg danej kategorii. W Aave V4 collateral factor.",
  removeCollateral: index => `Usuń zabezpieczenie ${index}`,
  addCollateral: "Dodaj drugie zabezpieczenie",
  debtLegend: "Dług",
  debtKindLegend: "Co pożyczasz?",
  debtKinds: { stable: "Stablecoin (liczony jako $1.00)", volatile: "Aktywo o zmiennej cenie, np. WETH" },
  debtAmount: { stable: "Pożyczona kwota (USD)", volatile: "Pożyczona ilość (tokeny)" },
  debtAmountHint: "Wlicz dotychczas naliczone odsetki.",
  debtPrice: "Cena pożyczonego aktywa (USD)",
  errors: {
    number: "Wpisz liczbę, np. 10 lub 0.25, z kropką jako separatorem dziesiętnym.",
    price: "Wpisz cenę większą od 0.",
    threshold: "Wpisz procent większy od 0 i nie większy niż 100.",
    samePrice: (name, price) =>
      `${name} jest już wpisane powyżej z ceną ${price}. Użyj tej samej ceny: jedno aktywo ma jedną cenę.`,
  },
  eModeLead: "Brak wyniku: Aave nie pozwala na takie połączenie.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("pl", borrowable);
    const loanText = loan.kind === "stable" ? "z pożyczonym stablecoinem" : `z pożyczonym ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode „${category}” na rynku ${market} pozwala pożyczać tylko ${borrowableList}, więc konto ${loanText} ` +
      `nie może użyć jego progu ${thresholdPercent}%. Zamiast tego wybierz własny próg zabezpieczenia${own} albo pożycz ${borrowableList}.`
    );
  },
  results: {
    heading: "Wynik",
    empty: "Wpisz liczbę w każdym polu, aby zobaczyć wynik.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Współczynnik zdrowia",
    noDebt: "Brak długu, więc nie ma czego likwidować.",
    liquidatableNow: "Poniżej 1.00: pozycję można zlikwidować już teraz.",
    liquidatableBelow: "Pozycję można zlikwidować poniżej 1.00.",
    none: "Brak",
    priceTitle: name => `Cena likwidacji ${name}`,
    priceTitleBorrowed: name => `Cena likwidacji ${name} (pożyczone)`,
    priceTitleShared: name => `Cena likwidacji ${name} (wpłacone i pożyczone)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Współczynnik zdrowia wróci do 1.00, jeśli cena ${name}${alike ? " (wpłaconego i pożyczonego)" : ""} ${
        rises ? "wzrośnie" : "spadnie"
      } o ${change} od ${now}, przy niezmienionych pozostałych cenach.`,
    collateralFall: ({ change, now }) => `O ${change} poniżej ${now}, jeśli wszystkie pozostałe ceny się nie zmienią.`,
    collateralNone: name =>
      `Nawet przy cenie $0 samo ${name} nie obniży współczynnika zdrowia poniżej 1.00: dług pokrywa pozostałe zabezpieczenie.`,
    debtRise: ({ change, now }) =>
      `O ${change} powyżej ${now}: pożyczone aktywa obniżają współczynnik zdrowia, gdy ich cena rośnie.`,
    sharedRise: ({ name, change, now }) =>
      `O ${change} powyżej ${now}: twój dług w ${name} jest większy niż część zabezpieczenia w ${name}, która się liczy, więc wzrost ceny obniża współczynnik zdrowia. Pozostałe ceny bez zmian.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `O ${change} poniżej ${now}, przy tej samej cenie pożyczonego ${name} i bez zmian wszystkich pozostałych cen.`,
    sharedFallRows: ({ name, change, now }) =>
      `O ${change} poniżej ${now} dla każdego wiersza ${name}, jeśli wszystkie pozostałe ceny się nie zmienią.`,
    bothSidesNeutral: name =>
      `${name} jest jednocześnie twoim zabezpieczeniem i długiem, więc obie strony zmieniają się razem i cena tego aktywa nie zmienia współczynnika zdrowia. Zmieniają go jednak odsetki, zmiana progu lub twoje własne transakcje.`,
    bothSidesRecover: name =>
      `${name} jest po obu stronach, więc obie zmieniają się razem: żadna cena ${name} sama nie przywróci współczynnika zdrowia do 1.00.`,
    bothSidesSafe: name =>
      `${name} jest po obu stronach, więc obie zmieniają się razem: sama cena tego aktywa nie obniży współczynnika zdrowia poniżej 1.00.`,
    uniformTitle: "Całe zabezpieczenie spada jednocześnie",
    uniformDescription: prices =>
      `Jeśli cena każdego zabezpieczenia spadnie o tyle, a cena długu się nie zmieni, współczynnik zdrowia osiągnie 1.00: ${prices
        .map(({ name, price }) => `${name} po ${price}`)
        .join(" i ")}.`,
    ratioTitle: (numerator, denominator) => `Stosunek cen ${numerator} ÷ ${denominator} przy likwidacji`,
    ratioDescription: (now, change, falls) =>
      `Teraz ${now}. Jeśli zmienią się obie ceny, ${falls ? "spadek" : "wzrost"} tego stosunku o ${change} sprowadzi współczynnik zdrowia do 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Zabezpieczenie ${collateral}, liczone według progów likwidacji: ${weighted}. Współczynnik zdrowia = ${weighted} ÷ ${debt} długu = ${healthFactor}.`,
  },
  noscript:
    "Kalkulator potrzebuje JavaScriptu do przeliczania. Wynik powyżej dotyczy 10 WETH po $2 400 (próg likwidacji 83%) przy długu 12 000 USDC; przykłady z obliczeniami na tej stronie używają tego samego wzoru.",
  disclaimer: {
    lead: "Szacunkowe wyliczenie w celach edukacyjnych, nie porada finansowa.",
    beforeDate:
      "Opiera się tylko na liczbach, które wpiszesz. Bieżące parametry Aave mogą się zmieniać: progi powyżej odczytano z blockchaina",
    afterDate:
      ", a governance lub Risk Stewards mogą je zmienić w każdej chwili. Ceny z wyroczni się zmieniają, odsetki wciąż powiększają twój dług, a każda cena likwidacji zakłada, że wszystkie pozostałe ceny się nie zmienią. Zanim cokolwiek zrobisz, sprawdź swoją pozycję w aplikacji Aave.",
  },
};
