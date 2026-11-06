import type { DashboardMessages } from "./shared";
import { plForMarket, plOnMarket, plural } from "~~/i18n/format";

/** "1 dzień", "30 dni". */
const days = (count: number) => plural("pl", count, { one: `${count} dzień`, other: `${count} dni` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Pozycje i współczynnik zdrowia w Aave V3 i V4",
    metaDescription: (networkCount, channels) =>
      `Zobacz zabezpieczenie, dług i współczynnik zdrowia w Aave V3 i V4 ${plural("pl", networkCount, { one: `w ${networkCount} sieci`, other: `w ${networkCount} sieciach` })}, potem ustaw alerty przez ${channels}, jeden próg na rynek.`,
    title: "Pozycje w Aave V3 i V4 oraz alerty o współczynniku zdrowia",
    networkMarkets: (name, markets) => `${name} (rynki ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Połącz portfel, z którego pożyczasz, aby zobaczyć jego zabezpieczenie, dług i współczynnik zdrowia w Aave V3 w sieciach ${v3Networks} oraz we wszystkich Spoke'ach Aave V4 w sieciach ${v4Networks}. Przeglądanie nie wymaga żadnej transakcji.`,
    disclosureSummary: "Ile kosztują alerty i jak często sprawdzamy",
    alertsCost: (channels, paymentChain) =>
      `Aby dostać wiadomość przez ${channels}, gdy współczynnik zdrowia na którymś rynku spadnie poniżej wybranego progu, odblokuj alerty płatnością w USDC${paymentChain ? ` w sieci ${paymentChain}` : ""}. Aktualną cenę zobaczysz przed zapłatą.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping sprawdza ${plural("pl", minutes, { one: "co minutę", few: `co ${minutes} minuty`, many: `co ${minutes} minut`, other: `co ${minutes} minuty` })}. Dopóki współczynnik zdrowia pozostaje poniżej twojego progu, dostajesz wiadomość co ${repeatMinutes} minut w każdym wybranym kanale.`,
    guideThreshold: "Jak wybrać próg",
    guideAlerts: "Jak działają alerty",
    morphoDashboard: "Pożyczasz w Morpho? Otwórz panel Morpho",
  },
  gate: {
    title: "Połącz portfel, aby kontynuować",
    description:
      "Tokenping potrzebuje adresu twojego portfela, aby pokazać twoje pozycje w Aave. Połączenie nie przenosi środków i nic nie kosztuje.",
    connect: "Połącz portfel",
    connecting: "Łączymy",
    approveInWallet: "Zatwierdź połączenie w portfelu.",
  },
  positionsHeading: "Twoje pozycje w Aave",
  loadingDashboard: "Wczytujemy panel",
  toolbar: {
    wallet: "Portfel",
    refresh: "Odśwież pozycje",
    refreshing: "Odświeżamy",
    loadingPositions: "Wczytujemy pozycje",
  },
  errors: {
    positionsDidNotLoad: "Nie udało się wczytać pozycji",
    refreshFailed: "Nie udało się odświeżyć",
    showingLastPositions: "Pokazujemy pozycje z ostatniego udanego wczytania.",
    tryAgain: "Spróbuj ponownie",
    fetchPositionsFailed: "Nie udało się pobrać pozycji w Aave",
  },
  totals: {
    supplied: "Łącznie wpłacone",
    borrowed: "Łącznie pożyczone",
    netWorth: "Wartość netto",
    noData: "Brak danych",
  },
  networks: {
    heading: "Rynki",
    active: count =>
      plural("pl", count, {
        one: `${count} aktywny`,
        few: `${count} aktywne`,
        many: `${count} aktywnych`,
        other: `${count} aktywne`,
      }),
    noPositions: "Nie wykryto aktywnych pozycji w Aave na obsługiwanych rynkach.",
    selectedRegion: "Wybrany rynek",
    noneSelectedTitle: "Nie wybrano rynku",
    noneSelectedDescription: "Wybierz rynek, aby zobaczyć swoją pozycję w Aave.",
    otherMarkets: count => `Inne rynki (${count})`,
    otherMarketsHint: "Rynki sprawdzone przez Tokenping, na których ten portfel nie ma pozycji ani alertu.",
    alertSet: "Alert ustawiony",
    supplied: usd => `wpłacone ${usd},`,
    borrowed: usd => `pożyczone ${usd}`,
    noPosition: "Brak pozycji",
  },
  healthFactor: {
    srPrefix: "Współczynnik zdrowia ",
    noDebt: "Brak długu",
    critical: "Krytyczny",
    risky: "Ryzykowny",
    safe: "Bezpieczny",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Rynek Aave V3"),
    noPositionTitle: chainName => `Brak aktywnej pozycji ${plOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave nie wykazuje zabezpieczenia ani długu tego portfela ${plOnMarket(chainName)}.`,
    collateral: "Zabezpieczenie",
    debt: "Dług",
    netWorth: "Wartość netto",
    suppliedTitle: "Wpłacone",
    borrowedTitle: "Pożyczone",
    noCollateral: "Brak wpłaconego zabezpieczenia",
    noDebt: "Brak niespłaconego długu",
    tokenIconsFrom: "Ikony tokenów i sieci z",
    tokenDetailsFailedTitle: "Nie udało się wczytać szczegółów tokenów",
    tokenDetailsFailedBody:
      "Sumy powyżej pochodzą z podsumowania konta w Aave. Odśwież pozycje, aby spróbować ponownie.",
  },
  tokens: {
    asset: "Aktywo",
    supplied: "Wpłacone",
    supplyApy: "APY wpłat",
    collateral: "Zabezpieczenie",
    borrowed: "Pożyczone",
    rateType: "Typ oprocentowania",
    enabled: "Włączone",
    disabled: "Wyłączone",
    stable: amount => `Stałe ${amount}`,
    variable: amount => `Zmienne ${amount}`,
    count: count =>
      plural("pl", count, {
        one: `${count} aktywo`,
        few: `${count} aktywa`,
        many: `${count} aktywów`,
        other: `${count} aktywa`,
      }),
  },
  address: {
    defaultLabel: "Adres",
    copy: (_label, address) => `Kopiuj adres ${address}`,
    copied: "Adres skopiowany",
    copyFailed: "Nie udało się skopiować. Zaznacz adres i skopiuj go ręcznie.",
  },
  opensInNewTab: "(otwiera się w nowej karcie)",
  paywall: {
    unlockedUntil: date => `Alerty odblokowane do ${date}`,
    titleNew: "Odblokuj alerty o współczynniku zdrowia",
    titleExtend: "Przedłuż dostęp, aby edytować alerty",
    descriptionNew:
      "Zapłać raz, aby odblokować ustawienia alertów i ustawić próg współczynnika zdrowia dla każdej sieci. Nic nie odnawia się automatycznie: płacisz ze swojego portfela, gdy chcesz przedłużyć dostęp.",
    descriptionExtend:
      "Twoje poprzednie ustawienia alertów są zapisane. Zapłać ponownie, aby przedłużyć dostęp i je edytować.",
    networkDescriptionNew: chainName =>
      `Zapłać raz, aby ustawić alerty o współczynniku zdrowia ${plOnMarket(chainName)} i na innych rynkach. Nic nie odnawia się automatycznie: płacisz ze swojego portfela, gdy chcesz przedłużyć dostęp.`,
    networkDescriptionExtend: chainName =>
      `Twoje zapisane ustawienia alertów ${plForMarket(chainName)} wciąż są na twoim koncie. Zapłać ponownie, aby przedłużyć dostęp i je edytować.`,
    connectWallet: "Połącz portfel, aby zapłacić za dostęp.",
    unconfigured: "Kontrakt płatności nie jest skonfigurowany dla tej sieci.",
    noPlan: "Obecnie nie ma dostępnego płatnego planu.",
    paused: "Płatności są teraz wstrzymane. Spróbuj później.",
    statusUnavailable: "Nie udało się wczytać stanu płatności. Odśwież stronę, aby spróbować ponownie.",
    wrongNetworkTitle: "Niewłaściwa sieć",
    wrongNetworkBody: (walletChain, target) =>
      `${walletChain ? `Twój portfel jest w sieci ${walletChain}.` : "Twój portfel jest w innej sieci."} Aby zapłacić, przełącz na ${target ? `sieć ${target}` : "sieć płatności"}.`,
    switchTo: target => `Przełącz na ${target ? `sieć ${target}` : "sieć płatności"}`,
    switching: "Przełączamy sieć",
    loadingDetails: "Wczytujemy szczegóły płatności",
    price: "Cena",
    access: "Dostęp",
    network: "Sieć",
    networkFee: "Opłata sieciowa",
    networkFeeValue: symbol => `Płatna w ${symbol} za każdy krok, widoczna w portfelu`,
    period: (count, about) => (about ? `Około ${days(count)}` : days(count)),
    pay: amount => `Zapłać ${amount}`,
    extend: (count, amount) => `Dodaj ${days(count)} za ${amount}`,
    extendHint: count =>
      `Każda płatność dodaje ${days(count)} po obecnej dacie końca dostępu. Płać tyle razy, ile chcesz; nic nie odnawia się samo.`,
    accessExtended: date => `Dostęp przedłużony do ${date}.`,
    accessActive: "Dostęp aktywny. Możesz teraz ustawić alerty.",
    paymentPending: "Płatność potwierdzona. Dostęp pojawi się za chwilę.",
    loading: {
      processing: "Przetwarzamy",
      waitingForWallet: "Czekamy na twój portfel",
      approving: "Zatwierdzamy",
      paying: "Płacimy",
    },
    unavailable: "Płatny dostęp nie jest teraz dostępny.",
    checkFailed: "Nie udało się sprawdzić stanu płatności. Spróbuj ponownie za chwilę.",
    approvalNotVisible: "Zgoda jest potwierdzona, ale jeszcze niewidoczna. Spróbuj ponownie za chwilę.",
  },
  payment: {
    stepsLabel: "Kroki płatności",
    approveTitle: amount => `Zatwierdź ${amount}`,
    approveHint:
      "Pozwala kontraktowi płatności pobrać dokładnie tę kwotę. Ten krok jest pomijany, gdy pokrywa ją wcześniejsza zgoda.",
    payTitle: amount => `Zapłać ${amount}`,
    payHint: "Wysyła płatność i odblokowuje alerty.",
    inProgress: "W toku",
    done: "Gotowe",
    notNeeded: "Niepotrzebne",
    transaction: "Transakcja ",
    viewOn: explorer => `Pokaż w ${explorer}`,
    preparingTitle: "Przygotowujemy płatność",
    preparingBody: "Sprawdzamy aktualną cenę i twoją zgodę.",
    confirmTitle: "Potwierdź w portfelu",
    approveSignBody: amount => `Krok 1 z 2: zatwierdź ${amount}. Nic nie zostanie wysłane, dopóki nie potwierdzisz.`,
    processingOn: network => (network ? `Przetwarzanie w sieci ${network}` : "Przetwarzanie w sieci"),
    approvePendingBody: "Krok 1 z 2: zgoda wysłana. Następnie portfel poprosi cię o potwierdzenie płatności.",
    paySignBody: amount => `Krok 2 z 2: zapłać ${amount}. Nic nie zostanie wysłane, dopóki nie potwierdzisz.`,
    payPendingBody: "Krok 2 z 2: płatność wysłana. Alerty odblokują się, gdy sieć ją potwierdzi.",
  },
};
