import type { DashboardMessages } from "./shared";
import { hrForMarket, hrOnMarket, hrSrChannelsGenitive, plural } from "~~/i18n/format";

/** "1 dan", "2 dana", "30 dana", "21 dan". */
const days = (count: number) =>
  plural("hr", count, { one: `${count} dan`, few: `${count} dana`, other: `${count} dana` });

/** "svakih 5 minuta", "svake 2 minute", "svake minute". */
const everyMinutes = (minutes: number) =>
  minutes === 1
    ? "svake minute"
    : plural("hr", minutes, {
        one: `svakih ${minutes} minuta`,
        few: `svake ${minutes} minute`,
        other: `svakih ${minutes} minuta`,
      });

/** "na 29 mreža", "na 22 mreže", "na 21 mreži". */
const onNetworks = (count: number) =>
  plural("hr", count, { one: `na ${count} mreži`, few: `na ${count} mreže`, other: `na ${count} mreža` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Pozicije i health factor na Aaveu V3 i V4",
    metaDescription: (networkCount, channels) =>
      `Vidi kolateral, dug i health factor na Aaveu V3 i V4 ${onNetworks(networkCount)} i postavi upozorenja putem ${hrSrChannelsGenitive(channels)}, jedan prag po tržištu.`,
    title: "Pozicije na Aaveu V3 i V4 i upozorenja za health factor",
    networkMarkets: (name, markets) => `${name} (tržišta ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Poveži novčanik kojim se zadužuješ da vidiš njegov kolateral, dug i health factor na Aaveu V3 na ovim mrežama: ${v3Networks}, te u svakom Spokeu Aavea V4 na ovim mrežama: ${v4Networks}. Za pregled ne treba nikakva transakcija.`,
    disclosureSummary: "Koliko koštaju upozorenja i koliko često provjeravamo",
    alertsCost: (channels, paymentChain) =>
      `Da dobiješ poruku putem ${hrSrChannelsGenitive(channels)} kad health factor nekog tržišta padne ispod praga koji odabereš, otključaj upozorenja plaćanjem u USDC-u${paymentChain ? ` ${hrOnMarket(paymentChain, "network")}` : ""}. Trenutačnu cijenu vidiš prije plaćanja.`,
    checks: minutes =>
      `Tokenping provjerava ${everyMinutes(minutes)}. Dok god je health factor ispod tvog praga, svaka provjera šalje novu poruku na svaki odabrani kanal.`,
    guideThreshold: "Kako odabrati prag",
    guideAlerts: "Kako rade upozorenja",
    morphoDashboard: "Zadužuješ se na Morphu? Otvori nadzornu ploču za Morpho",
  },
  gate: {
    title: "Poveži novčanik za nastavak",
    description:
      "Tokenpingu treba adresa tvog novčanika da prikaže tvoje pozicije na Aaveu. Povezivanje ne premješta sredstva i ne naplaćuje naknadu.",
    connect: "Poveži novčanik",
    connecting: "Povezivanje",
    approveInWallet: "Odobri povezivanje u svom novčaniku.",
  },
  positionsHeading: "Tvoje pozicije na Aaveu",
  loadingDashboard: "Učitavanje nadzorne ploče",
  toolbar: {
    wallet: "Novčanik",
    refresh: "Osvježi pozicije",
    refreshing: "Osvježavanje",
    loadingPositions: "Učitavanje pozicija",
  },
  errors: {
    positionsDidNotLoad: "Pozicije nisu učitane",
    refreshFailed: "Osvježavanje nije uspjelo",
    showingLastPositions: "Prikazane su pozicije iz posljednjeg uspješnog učitavanja.",
    tryAgain: "Pokušaj ponovno",
    fetchPositionsFailed: "Dohvaćanje pozicija na Aaveu nije uspjelo",
  },
  totals: {
    supplied: "Ukupno deponirano",
    borrowed: "Ukupno posuđeno",
    netWorth: "Neto vrijednost",
    noData: "Nema podataka",
  },
  networks: {
    heading: "Tržišta",
    active: count =>
      plural("hr", count, { one: `${count} aktivno`, few: `${count} aktivna`, other: `${count} aktivnih` }),
    noPositions: "Na podržanim tržištima nisu pronađene aktivne pozicije na Aaveu.",
    selectedRegion: "Odabrano tržište",
    noneSelectedTitle: "Nije odabrano nijedno tržište",
    noneSelectedDescription: "Odaberi tržište da vidiš svoju poziciju na Aaveu.",
    otherMarkets: count => `Ostala tržišta (${count})`,
    otherMarketsHint: "Tržišta koja je Tokenping provjerio, a na kojima ovaj novčanik nema ni poziciju ni upozorenje.",
    alertSet: "Upozorenje postavljeno",
    supplied: usd => `deponirano ${usd},`,
    borrowed: usd => `posuđeno ${usd}`,
    noPosition: "Nema pozicije",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Nema duga",
    critical: "Kritično",
    risky: "Rizično",
    safe: "Sigurno",
  },
  position: {
    market: version => (version === 4 ? "Spoke na Aaveu V4" : "Tržište na Aaveu V3"),
    noPositionTitle: chainName => `Nema aktivne pozicije ${hrOnMarket(chainName)}`,
    noPositionDetail: chainName => `Aave ne prikazuje ni kolateral ni dug za ovaj novčanik ${hrOnMarket(chainName)}.`,
    collateral: "Kolateral",
    debt: "Dug",
    netWorth: "Neto vrijednost",
    suppliedTitle: "Deponirano",
    borrowedTitle: "Posuđeno",
    noCollateral: "Nema deponiranog kolaterala",
    noDebt: "Nema nepodmirenog duga",
    tokenIconsFrom: "Ikone tokena i mreža:",
    tokenDetailsFailedTitle: "Podaci o tokenima nisu učitani",
    tokenDetailsFailedBody: "Ukupni iznosi gore dolaze iz Aaveova sažetka računa. Osvježi pozicije za novi pokušaj.",
  },
  tokens: {
    asset: "Imovina",
    supplied: "Deponirano",
    supplyApy: "APY depozita",
    collateral: "Kolateral",
    borrowed: "Posuđeno",
    rateType: "Vrsta kamate",
    enabled: "Uključeno",
    disabled: "Isključeno",
    stable: amount => `Stabilna ${amount}`,
    variable: amount => `Promjenjiva ${amount}`,
    count: count => plural("hr", count, { one: `${count} token`, few: `${count} tokena`, other: `${count} tokena` }),
  },
  address: {
    defaultLabel: "Adresa",
    copy: (_label, address) => `Kopiraj adresu ${address}`,
    copied: "Adresa je kopirana",
    copyFailed: "Kopiranje nije uspjelo. Označi adresu i kopiraj je ručno.",
  },
  opensInNewTab: "(otvara se u novoj kartici)",
  paywall: {
    unlockedUntil: date => `Upozorenja otključana do ${date}`,
    titleNew: "Otključaj upozorenja za health factor",
    titleExtend: "Produlji pristup da urediš upozorenja",
    descriptionNew:
      "Plati jednom da otključaš postavke upozorenja i postaviš prag za health factor za svaku mrežu. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš produljiti.",
    descriptionExtend:
      "Tvoje prijašnje postavke upozorenja su spremljene. Plati ponovno da produljiš pristup i urediš ih.",
    networkDescriptionNew: chainName =>
      `Plati jednom da postaviš upozorenja za health factor ${hrOnMarket(chainName)} i na drugim tržištima. Ništa se ne obnavlja automatski: plaćaš iz svog novčanika kad želiš produljiti.`,
    networkDescriptionExtend: chainName =>
      `Tvoje spremljene postavke upozorenja ${hrForMarket(chainName)} i dalje su na tvom računu. Plati ponovno da produljiš pristup i urediš ih.`,
    connectWallet: "Poveži novčanik da platiš pristup.",
    unconfigured: "Ugovor za plaćanje nije postavljen za ovu mrežu.",
    noPlan: "Trenutačno nema dostupnog plaćenog plana.",
    paused: "Plaćanja su trenutačno pauzirana. Pokušaj ponovno kasnije.",
    statusUnavailable: "Status plaćanja nije učitan. Ponovno učitaj stranicu za novi pokušaj.",
    wrongNetworkTitle: "Pogrešna mreža",
    wrongNetworkBody: (walletChain, target) =>
      `Tvoj novčanik je ${walletChain ? hrOnMarket(walletChain, "network") : "na drugoj mreži"}. Za plaćanje se prebaci ${target ? `na mrežu ${target}` : "na mrežu za plaćanje"}.`,
    switchTo: target => `Prebaci se ${target ? `na mrežu ${target}` : "na mrežu za plaćanje"}`,
    switching: "Promjena mreže",
    loadingDetails: "Učitavanje podataka o plaćanju",
    price: "Cijena",
    access: "Pristup",
    network: "Mreža",
    networkFee: "Naknada mreže",
    networkFeeValue: symbol => `Plaća se u ${symbol} za svaki korak, prikazano u novčaniku`,
    period: (count, about) => (about ? `Oko ${days(count)}` : days(count)),
    pay: amount => `Plati ${amount}`,
    extend: (count, amount) => `Dodaj ${days(count)} za ${amount}`,
    extendHint: count =>
      `Svako plaćanje dodaje ${days(count)} nakon tvog trenutačnog datuma isteka. Plati koliko god puta želiš; ništa se ne obnavlja samo.`,
    accessExtended: date => `Pristup je produljen do ${date}.`,
    accessActive: "Pristup je aktivan. Sada možeš postaviti upozorenja.",
    paymentPending: "Plaćanje je potvrđeno. Pristup će se uskoro pojaviti.",
    loading: {
      processing: "Obrada",
      waitingForWallet: "Čeka se tvoj novčanik",
      approving: "Odobravanje",
      paying: "Plaćanje",
    },
    unavailable: "Plaćeni pristup trenutačno nije dostupan.",
    checkFailed: "Status plaćanja nije provjeren. Pokušaj ponovno za trenutak.",
    approvalNotVisible: "Odobrenje je potvrđeno, ali se još ne vidi. Pokušaj ponovno za trenutak.",
  },
  payment: {
    stepsLabel: "Koraci plaćanja",
    approveTitle: amount => `Odobri ${amount}`,
    approveHint:
      "Dopušta ugovoru za plaćanje da uzme točno ovaj iznos. Preskače se ako ga pokriva neko ranije odobrenje.",
    payTitle: amount => `Plati ${amount}`,
    payHint: "Šalje plaćanje i otključava upozorenja.",
    inProgress: "U tijeku",
    done: "Gotovo",
    notNeeded: "Nije potrebno",
    transaction: "Transakcija ",
    viewOn: explorer => `Prikaži na stranici ${explorer}`,
    preparingTitle: "Priprema plaćanja",
    preparingBody: "Provjeravaju se trenutačna cijena i tvoje odobrenje.",
    confirmTitle: "Potvrdi u novčaniku",
    approveSignBody: amount => `Korak 1 od 2: odobri ${amount}. Ništa se ne šalje dok ne potvrdiš.`,
    processingOn: network => (network ? `Obrada ${hrOnMarket(network, "network")}` : "Obrada na mreži"),
    approvePendingBody: "Korak 1 od 2: odobrenje je poslano. Novčanik će te zatim tražiti da potvrdiš plaćanje.",
    paySignBody: amount => `Korak 2 od 2: plati ${amount}. Ništa se ne šalje dok ne potvrdiš.`,
    payPendingBody: "Korak 2 od 2: plaćanje je poslano. Upozorenja se otključavaju kad ga mreža potvrdi.",
  },
};
