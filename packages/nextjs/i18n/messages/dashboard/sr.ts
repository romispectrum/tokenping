import type { DashboardMessages } from "./shared";
import { hrSrChannelsGenitive, plural, srForMarket, srOnMarket } from "~~/i18n/format";

/** "1 dan", "2 dana", "30 dana", "21 dan". */
const days = (count: number) =>
  plural("sr", count, { one: `${count} dan`, few: `${count} dana`, other: `${count} dana` });

/** "svakih 5 minuta", "svaka 2 minuta", "svakog minuta" (minut is masculine in Serbian). */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svakog minuta"
    : plural("sr", minutes, {
        one: `svaki ${minutes} minut`,
        few: `svaka ${minutes} minuta`,
        other: `svakih ${minutes} minuta`,
      });

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const onNetworks = (count: number) =>
  plural("sr", count, { one: `na ${count} mreži`, few: `na ${count} mreže`, other: `na ${count} mreža` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Aave V3 i V4 pozicije i health factor",
    metaDescription: (networkCount, channels) =>
      `Vidi kolateral, dug i health factor na protokolu Aave V3 i V4 ${onNetworks(networkCount)}. Upozorenja preko ${hrSrChannelsGenitive(channels)}, jedan prag po tržištu.`,
    title: "Aave V3 i V4 pozicije i upozorenja za health factor",
    networkMarkets: (name, markets) => `${name} (tržišta ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Poveži novčanik kojim se zadužuješ da vidiš njegov kolateral, dug i health factor na protokolu Aave V3 na ovim mrežama: ${v3Networks}, kao i u svakom Aave V4 Spoke-u na ovim mrežama: ${v4Networks}. Za pregled nije potrebna nikakva transakcija.`,
    disclosureSummary: "Koliko koštaju upozorenja i koliko često proveravamo",
    alertsCost: (channels, paymentChain) =>
      `Da dobiješ poruku preko ${hrSrChannelsGenitive(channels)} kad health factor nekog tržišta padne ispod praga koji izabereš, otključaj upozorenja plaćanjem u USDC${paymentChain ? ` ${srOnMarket(paymentChain, "network")}` : ""}. Trenutnu cenu vidiš pre plaćanja.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping proverava ${everyMinutes(minutes)}. Dok god je health factor ispod tvog praga, dobijaš poruku na svakih ${repeatMinutes} minuta na svaki izabrani kanal.`,
    guideThreshold: "Kako da izabereš prag",
    guideAlerts: "Kako rade upozorenja",
    morphoDashboard: "Zadužuješ se na protokolu Morpho? Otvori kontrolnu tablu za Morpho",
  },
  gate: {
    title: "Poveži novčanik da nastaviš",
    description:
      "Tokenpingu je potrebna adresa tvog novčanika da prikaže tvoje Aave pozicije. Povezivanje ne premešta sredstva i ne naplaćuje naknadu.",
    connect: "Poveži novčanik",
    connecting: "Povezivanje",
    approveInWallet: "Odobri povezivanje u svom novčaniku.",
  },
  positionsHeading: "Tvoje Aave pozicije",
  loadingDashboard: "Učitavanje kontrolne table",
  toolbar: {
    wallet: "Novčanik",
    refresh: "Osveži pozicije",
    refreshing: "Osvežavanje",
    loadingPositions: "Učitavanje pozicija",
  },
  errors: {
    positionsDidNotLoad: "Pozicije nisu učitane",
    refreshFailed: "Osvežavanje nije uspelo",
    showingLastPositions: "Prikazane su pozicije iz poslednjeg uspešnog učitavanja.",
    tryAgain: "Pokušaj ponovo",
    fetchPositionsFailed: "Preuzimanje Aave pozicija nije uspelo",
  },
  totals: {
    supplied: "Ukupno deponovano",
    borrowed: "Ukupno pozajmljeno",
    netWorth: "Neto vrednost",
    noData: "Nema podataka",
  },
  networks: {
    heading: "Tržišta",
    active: count =>
      plural("sr", count, { one: `${count} aktivno`, few: `${count} aktivna`, other: `${count} aktivnih` }),
    noPositions: "Na podržanim tržištima nisu pronađene aktivne Aave pozicije.",
    selectedRegion: "Izabrano tržište",
    noneSelectedTitle: "Nije izabrano nijedno tržište",
    noneSelectedDescription: "Izaberi tržište da vidiš svoju Aave poziciju.",
    otherMarkets: count => `Ostala tržišta (${count})`,
    otherMarketsHint: "Tržišta koja je Tokenping proverio, a na kojima ovaj novčanik nema ni poziciju ni upozorenje.",
    alertSet: "Upozorenje podešeno",
    supplied: usd => `deponovano ${usd},`,
    borrowed: usd => `pozajmljeno ${usd}`,
    noPosition: "Nema pozicije",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Nema duga",
    critical: "Kritično",
    risky: "Rizično",
    safe: "Bezbedno",
  },
  position: {
    market: version => (version === 4 ? "Aave V4 Spoke" : "Aave V3 tržište"),
    noPositionTitle: chainName => `Nema aktivne pozicije ${srOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave ne prikazuje ni kolateral ni dug za ovaj novčanik ${srOnMarket(chainName)}.`,
    collateral: "Kolateral",
    debt: "Dug",
    netWorth: "Neto vrednost",
    suppliedTitle: "Deponovano",
    borrowedTitle: "Pozajmljeno",
    noCollateral: "Nema deponovanog kolaterala",
    noDebt: "Nema neizmirenog duga",
    tokenIconsFrom: "Ikone tokena i mreža:",
    tokenDetailsFailedTitle: "Podaci o tokenima nisu učitani",
    tokenDetailsFailedBody: "Ukupni iznosi gore dolaze iz Aave pregleda naloga. Osveži pozicije da pokušaš ponovo.",
  },
  tokens: {
    asset: "Imovina",
    supplied: "Deponovano",
    supplyApy: "APY depozita",
    collateral: "Kolateral",
    borrowed: "Pozajmljeno",
    rateType: "Vrsta kamate",
    enabled: "Uključeno",
    disabled: "Isključeno",
    stable: amount => `Stabilna ${amount}`,
    variable: amount => `Promenljiva ${amount}`,
    count: count => plural("sr", count, { one: `${count} token`, few: `${count} tokena`, other: `${count} tokena` }),
  },
  address: {
    defaultLabel: "Adresa",
    copy: (_label, address) => `Kopiraj adresu ${address}`,
    copied: "Adresa je kopirana",
    copyFailed: "Kopiranje nije uspelo. Označi adresu i kopiraj je ručno.",
  },
  opensInNewTab: "(otvara se u novoj kartici)",
  paywall: {
    unlockedUntil: date => `Upozorenja otključana do ${date}`,
    titleNew: "Otključaj upozorenja za health factor",
    titleExtend: "Produži pristup da izmeniš upozorenja",
    descriptionNew:
      "Plati jednom da otključaš podešavanja upozorenja i podesiš prag za health factor za svaku mrežu. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš da produžiš.",
    descriptionExtend:
      "Tvoja prethodna podešavanja upozorenja su sačuvana. Plati ponovo da produžiš pristup i izmeniš ih.",
    networkDescriptionNew: chainName =>
      `Plati jednom da podesiš upozorenja za health factor ${srOnMarket(chainName)} i na drugim tržištima. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš da produžiš.`,
    networkDescriptionExtend: chainName =>
      `Tvoja sačuvana podešavanja upozorenja ${srForMarket(chainName)} su i dalje na tvom nalogu. Plati ponovo da produžiš pristup i izmeniš ih.`,
    connectWallet: "Poveži novčanik da platiš pristup.",
    unconfigured: "Ugovor za plaćanje nije podešen za ovu mrežu.",
    noPlan: "Trenutno nema dostupnog plaćenog plana.",
    paused: "Plaćanja su trenutno pauzirana. Pokušaj ponovo kasnije.",
    statusUnavailable: "Status plaćanja nije učitan. Ponovo učitaj stranicu da pokušaš opet.",
    wrongNetworkTitle: "Pogrešna mreža",
    wrongNetworkBody: (walletChain, target) =>
      `Tvoj novčanik je ${walletChain ? srOnMarket(walletChain, "network") : "na drugoj mreži"}. Za plaćanje se prebaci ${target ? `na mrežu ${target}` : "na mrežu za plaćanje"}.`,
    switchTo: target => `Prebaci se ${target ? `na mrežu ${target}` : "na mrežu za plaćanje"}`,
    switching: "Promena mreže",
    loadingDetails: "Učitavanje podataka o plaćanju",
    price: "Cena",
    access: "Pristup",
    network: "Mreža",
    networkFee: "Naknada mreže",
    networkFeeValue: symbol => `Plaća se u ${symbol} za svaki korak, prikazano u novčaniku`,
    period: (count, about) => (about ? `Oko ${days(count)}` : days(count)),
    pay: amount => `Plati ${amount}`,
    extend: (count, amount) => `Dodaj ${days(count)} za ${amount}`,
    extendHint: count =>
      `Svako plaćanje dodaje ${days(count)} posle tvog trenutnog datuma isteka. Plati koliko god puta želiš; ništa se ne obnavlja samo.`,
    accessExtended: date => `Pristup je produžen do ${date}.`,
    accessActive: "Pristup je aktivan. Sada možeš da podesiš upozorenja.",
    paymentPending: "Plaćanje je potvrđeno. Pristup će se uskoro pojaviti.",
    loading: {
      processing: "Obrada",
      waitingForWallet: "Čeka se tvoj novčanik",
      approving: "Odobravanje",
      paying: "Plaćanje",
    },
    unavailable: "Plaćeni pristup trenutno nije dostupan.",
    checkFailed: "Status plaćanja nije proveren. Pokušaj ponovo za trenutak.",
    approvalNotVisible: "Odobrenje je potvrđeno, ali se još ne vidi. Pokušaj ponovo za trenutak.",
  },
  payment: {
    stepsLabel: "Koraci plaćanja",
    approveTitle: amount => `Odobri ${amount}`,
    approveHint:
      "Dozvoljava ugovoru za plaćanje da uzme tačno ovaj iznos. Preskače se ako ga pokriva neko ranije odobrenje.",
    payTitle: amount => `Plati ${amount}`,
    payHint: "Šalje plaćanje i otključava upozorenja.",
    inProgress: "U toku",
    done: "Gotovo",
    notNeeded: "Nije potrebno",
    transaction: "Transakcija ",
    viewOn: explorer => `Prikaži na stranici ${explorer}`,
    preparingTitle: "Priprema plaćanja",
    preparingBody: "Proveravaju se trenutna cena i tvoje odobrenje.",
    confirmTitle: "Potvrdi u novčaniku",
    approveSignBody: amount => `Korak 1 od 2: odobri ${amount}. Ništa se ne šalje dok ne potvrdiš.`,
    processingOn: network => (network ? `Obrada ${srOnMarket(network, "network")}` : "Obrada na mreži"),
    approvePendingBody: "Korak 1 od 2: odobrenje je poslato. Novčanik će zatim tražiti da potvrdiš plaćanje.",
    paySignBody: amount => `Korak 2 od 2: plati ${amount}. Ništa se ne šalje dok ne potvrdiš.`,
    payPendingBody: "Korak 2 od 2: plaćanje je poslato. Upozorenja se otključavaju kad ga mreža potvrdi.",
  },
};
