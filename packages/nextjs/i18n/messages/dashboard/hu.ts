import type { DashboardMessages } from "./shared";
import { capitalize, huForMarket, huOnMarket, plural } from "~~/i18n/format";

/** "1 nap", "30 nap": Hungarian keeps the noun singular after a number. */
const days = (count: number) => plural("hu", count, { one: `${count} nap`, other: `${count} nap` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Aave V3 és V4 pozíciók és health factor",
    metaDescription: (networkCount, channels) =>
      `Lásd az Aave V3 és V4 fedezeted, adósságod és health factorod ${networkCount} hálózaton. Riasztás (${channels}), piaconként egy küszöbértékkel.`,
    title: "Aave V3 és V4 pozíciók és health factor-riasztások",
    networkMarkets: (name, markets) => `${name} (${markets} piac)`,
    intro: (v3Networks, v4Networks) =>
      `Csatlakoztasd a tárcát, amellyel hitelt veszel fel, és lásd a fedezetét, az adósságát és a health factorát az Aave V3-on a következő hálózatokon: ${v3Networks}, valamint minden Aave V4 Spoke-ban ezeken: ${v4Networks}. A megtekintéshez nem kell tranzakció.`,
    disclosureSummary: "Mennyibe kerülnek a riasztások, és milyen gyakran ellenőrzünk",
    alertsCost: (channels, paymentChain) =>
      `Ha üzenetet szeretnél kapni (${channels}), amikor egy piac health factora az általad választott küszöbérték alá esik, oldd fel a riasztásokat egy USDC-fizetéssel${paymentChain ? ` ${huOnMarket(paymentChain, "network")}` : ""}. Az aktuális árat fizetés előtt látod.`,
    checks: (minutes, repeatMinutes) =>
      `A Tokenping ${minutes} percenként ellenőriz. Amíg a health factor a küszöbértéked alatt marad, ${repeatMinutes} percenként kapsz üzenetet minden kiválasztott csatornán.`,
    guideThreshold: "Hogyan válassz küszöbértéket",
    guideAlerts: "Hogyan működnek a riasztások",
    morphoDashboard: "Morphón veszel fel hitelt? Nyisd meg a Morpho irányítópultot",
  },
  gate: {
    title: "A folytatáshoz csatlakoztass egy tárcát",
    description:
      "Az Aave-pozícióid megjelenítéséhez a Tokenpingnek szüksége van a tárcacímedre. A csatlakoztatás nem mozgat pénzt, és nem kerül díjba.",
    connect: "Tárca csatlakoztatása",
    connecting: "Csatlakozás",
    approveInWallet: "Hagyd jóvá a csatlakozást a tárcádban.",
  },
  positionsHeading: "Az Aave-pozícióid",
  loadingDashboard: "Az irányítópult betöltése",
  toolbar: {
    wallet: "Tárca",
    refresh: "Pozíciók frissítése",
    refreshing: "Frissítés",
    loadingPositions: "Pozíciók betöltése",
  },
  errors: {
    positionsDidNotLoad: "Nem sikerült betölteni a pozíciókat",
    refreshFailed: "A frissítés nem sikerült",
    showingLastPositions: "Az utolsó sikeres betöltés pozícióit látod.",
    tryAgain: "Újrapróbálás",
    fetchPositionsFailed: "Nem sikerült lekérni az Aave-pozíciókat",
  },
  totals: {
    supplied: "Összesen elhelyezve",
    borrowed: "Összesen felvéve",
    netWorth: "Nettó érték",
    noData: "Nincs adat",
  },
  networks: {
    heading: "Piacok",
    active: count => `${count} aktív`,
    noPositions: "A támogatott piacokon nem találtunk aktív Aave-pozíciót.",
    selectedRegion: "Kiválasztott piac",
    noneSelectedTitle: "Nincs kiválasztott piac",
    noneSelectedDescription: "Válassz egy piacot az Aave-pozíciója megtekintéséhez.",
    otherMarkets: count => `Többi piac (${count})`,
    otherMarketsHint:
      "Piacok, amelyeket a Tokenping ellenőrzött, de ennek a tárcának nincs rajtuk pozíciója és riasztása.",
    alertSet: "Riasztás beállítva",
    supplied: usd => `${usd} elhelyezve,`,
    borrowed: usd => `${usd} felvéve`,
    noPosition: "Nincs pozíció",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Nincs adósság",
    critical: "Kritikus",
    risky: "Kockázatos",
    safe: "Biztonságos",
  },
  position: {
    market: version => (version === 4 ? "Aave V4 Spoke" : "Aave V3-piac"),
    noPositionTitle: chainName => `${capitalize(huOnMarket(chainName))} nincs aktív pozíció`,
    noPositionDetail: chainName =>
      `Az Aave ${huOnMarket(chainName)} nem jelez fedezetet és adósságot ennél a tárcánál.`,
    collateral: "Fedezet",
    debt: "Adósság",
    netWorth: "Nettó érték",
    suppliedTitle: "Elhelyezve",
    borrowedTitle: "Felvéve",
    noCollateral: "Nincs elhelyezett fedezet",
    noDebt: "Nincs fennálló adósság",
    tokenIconsFrom: "A token- és hálózatikonok forrása:",
    tokenDetailsFailedTitle: "Nem sikerült betölteni a tokenadatokat",
    tokenDetailsFailedBody:
      "A fenti összesítések az Aave számlaösszesítőjéből származnak. Az újrapróbáláshoz frissítsd a pozíciókat.",
  },
  tokens: {
    asset: "Eszköz",
    supplied: "Elhelyezve",
    supplyApy: "Betéti APY",
    collateral: "Fedezet",
    borrowed: "Felvéve",
    rateType: "Kamattípus",
    enabled: "Bekapcsolva",
    disabled: "Kikapcsolva",
    stable: amount => `Stabil ${amount}`,
    variable: amount => `Változó ${amount}`,
    count: count => plural("hu", count, { one: `${count} eszköz`, other: `${count} eszköz` }),
  },
  address: {
    defaultLabel: "Cím",
    copy: (_label, address) => `Cím másolása: ${address}`,
    copied: "Cím másolva",
    copyFailed: "Nem sikerült másolni. Jelöld ki a címet, és másold ki kézzel.",
  },
  opensInNewTab: "(új lapon nyílik meg)",
  paywall: {
    unlockedUntil: date => `Riasztások feloldva eddig: ${date}`,
    titleNew: "Health factor-riasztások feloldása",
    titleExtend: "Hozzáférés meghosszabbítása a riasztások szerkesztéséhez",
    descriptionNew:
      "Fizess egyszer, és feloldod a riasztási beállításokat, majd minden hálózatra beállíthatsz egy health factor-küszöbértéket. Semmi sem újul meg automatikusan: a tárcádból fizetsz, amikor hosszabbítani szeretnél.",
    descriptionExtend:
      "A korábbi riasztási beállításaid el vannak mentve. Fizess újra, hogy meghosszabbítsd a hozzáférést és szerkeszthesd őket.",
    networkDescriptionNew: chainName =>
      `Fizess egyszer, és beállíthatsz health factor-riasztásokat ${huOnMarket(chainName)} és más piacokon. Semmi sem újul meg automatikusan: a tárcádból fizetsz, amikor hosszabbítani szeretnél.`,
    networkDescriptionExtend: chainName =>
      `A riasztási beállításaid ${huOnMarket(chainName)} továbbra is el vannak mentve a fiókodban. Fizess újra, hogy meghosszabbítsd a hozzáférést és szerkeszthesd őket.`,
    connectWallet: "A hozzáférés kifizetéséhez csatlakoztasd a tárcádat.",
    unconfigured: "Ezen a hálózaton nincs beállítva a fizetési szerződés.",
    noPlan: "Jelenleg nincs elérhető fizetős csomag.",
    paused: "A fizetések most szünetelnek. Próbáld újra később.",
    statusUnavailable: "Nem sikerült betölteni a fizetés állapotát. Az újrapróbáláshoz töltsd újra az oldalt.",
    wrongNetworkTitle: "Rossz hálózat",
    wrongNetworkBody: (walletChain, target) =>
      `A tárcád ${walletChain ? huOnMarket(walletChain, "network") : "egy másik hálózaton"} van. A fizetéshez válts ${target ? huForMarket(target, "network") : "a fizetési hálózatra"}.`,
    switchTo: target => `Váltás ${target ? huForMarket(target, "network") : "a fizetési hálózatra"}`,
    switching: "Hálózatváltás",
    loadingDetails: "Fizetési adatok betöltése",
    price: "Ár",
    access: "Hozzáférés",
    network: "Hálózat",
    networkFee: "Hálózati díj",
    networkFeeValue: symbol => `Lépésenként fizetendő (${symbol}), a tárcád mutatja`,
    period: (count, about) => (about ? `Kb. ${days(count)}` : days(count)),
    pay: amount => `Fizetés: ${amount}`,
    extend: (count, amount) => `${days(count)} hozzáadása ${amount} áron`,
    extendHint: count =>
      `Minden fizetés ${days(count)} hozzáférést ad a jelenlegi lejárati dátumod után. Annyiszor fizetsz, ahányszor szeretnél, semmi sem újul meg magától.`,
    accessExtended: date => `Hozzáférés meghosszabbítva eddig: ${date}`,
    accessActive: "A hozzáférés aktív. Most már beállíthatod az értesítéseket.",
    paymentPending: "Fizetés megerősítve. A hozzáférés hamarosan megjelenik.",
    loading: {
      processing: "Feldolgozás",
      waitingForWallet: "Várakozás a tárcádra",
      approving: "Jóváhagyás",
      paying: "Fizetés",
    },
    unavailable: "A fizetős hozzáférés most nem érhető el.",
    checkFailed: "Nem sikerült ellenőrizni a fizetés állapotát. Próbáld újra egy kicsit később.",
    approvalNotVisible: "A jóváhagyás megerősítve, de még nem látszik. Próbáld újra egy kicsit később.",
  },
  payment: {
    stepsLabel: "A fizetés lépései",
    approveTitle: amount => `Jóváhagyás: ${amount}`,
    approveHint:
      "Engedélyezi, hogy a fizetési szerződés pontosan ezt az összeget vegye le. Kimarad, ha egy korábbi jóváhagyás már fedezi.",
    payTitle: amount => `Fizetés: ${amount}`,
    payHint: "Elküldi a fizetést, és feloldja a riasztásokat.",
    inProgress: "Folyamatban",
    done: "Kész",
    notNeeded: "Nem szükséges",
    transaction: "Tranzakció ",
    viewOn: explorer => `Megtekintés itt: ${explorer}`,
    preparingTitle: "A fizetés előkészítése",
    preparingBody: "Az aktuális ár és a jóváhagyásod ellenőrzése.",
    confirmTitle: "Erősítsd meg a tárcádban",
    approveSignBody: amount => `1. lépés a 2-ből: jóváhagyás (${amount}). Amíg nem erősíted meg, semmi sem indul el.`,
    processingOn: network => (network ? `Feldolgozás ${huOnMarket(network, "network")}` : "Feldolgozás a hálózaton"),
    approvePendingBody: "1. lépés a 2-ből: jóváhagyás elküldve. Ezután a tárcád a fizetés megerősítését kéri.",
    paySignBody: amount => `2. lépés a 2-ből: fizetés (${amount}). Amíg nem erősíted meg, semmi sem indul el.`,
    payPendingBody: "2. lépés a 2-ből: fizetés elküldve. A riasztások akkor oldódnak fel, amikor a hálózat megerősíti.",
  },
};
