import type { DashboardMessages } from "./shared";
import { capitalize, plural, slForMarket, slOnMarket } from "~~/i18n/format";

/** "1 dan", "2 dneva", "3 dni", "30 dni". */
const days = (count: number) =>
  plural("sl", count, { one: `${count} dan`, two: `${count} dneva`, few: `${count} dni`, other: `${count} dni` });

/** "vsako minuto", "vsaki 2 minuti", "vsake 3 minute", "vsakih 5 minut". */
const everyMinutes = (minutes: number) =>
  plural("sl", minutes, {
    one: minutes === 1 ? "vsako minuto" : `vsako ${minutes} minuto`,
    two: `vsaki ${minutes} minuti`,
    few: `vsake ${minutes} minute`,
    other: `vsakih ${minutes} minut`,
  });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Pozicije in health factor v Aave V3 in V4",
    metaDescription: (networkCount, channels) =>
      `Zavarovanje, dolg in health factor v Aave V3 in V4 ${plural("sl", networkCount, { one: `na ${networkCount} omrežju`, other: `na ${networkCount} omrežjih` })}. Opozorila: ${channels}, en prag na trg.`,
    title: "Pozicije v Aave V3 in V4 ter opozorila za health factor",
    networkMarkets: (name, markets) => `${name} (trgi ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Poveži denarnico, s katero si izposojaš, da vidiš njeno zavarovanje, dolg in health factor v Aave V3 na omrežjih ${v3Networks} ter na vseh trgih Spoke v Aave V4 na omrežjih ${v4Networks}. Ogled ne zahteva transakcije.`,
    disclosureSummary: "Koliko stanejo opozorila in kako pogosto preverjamo",
    alertsCost: (channels, paymentChain) =>
      `Če želiš prejeti sporočilo, ko health factor na trgu pade pod prag, ki ga izbereš, odkleni opozorila s plačilom v USDC${paymentChain ? ` na omrežju ${paymentChain}` : ""}. Kanali: ${channels}. Trenutno ceno vidiš, preden plačaš.`,
    checks: (minutes, repeatMinutes) =>
      `Tokenping preverja ${everyMinutes(minutes)}. Dokler je health factor pod tvojim pragom, dobiš sporočilo vsakih ${repeatMinutes} minut v vsak izbrani kanal.`,
    guideThreshold: "Kako izbrati prag",
    guideAlerts: "Kako delujejo opozorila",
    morphoDashboard: "Si izposojaš v Morpho? Odpri nadzorno ploščo Morpho",
  },
  gate: {
    title: "Za nadaljevanje poveži denarnico",
    description:
      "Tokenping potrebuje naslov tvoje denarnice, da pokaže tvoje pozicije v Aave. Povezava ne premika sredstev in ne stane ničesar.",
    connect: "Poveži denarnico",
    connecting: "Povezovanje",
    approveInWallet: "Odobri povezavo v denarnici.",
  },
  positionsHeading: "Tvoje pozicije v Aave",
  loadingDashboard: "Nalaganje nadzorne plošče",
  toolbar: {
    wallet: "Denarnica",
    refresh: "Osveži pozicije",
    refreshing: "Osveževanje",
    loadingPositions: "Nalaganje pozicij",
  },
  errors: {
    positionsDidNotLoad: "Pozicij ni bilo mogoče naložiti",
    refreshFailed: "Osvežitev ni uspela",
    showingLastPositions: "Prikazane so pozicije iz zadnjega uspešnega nalaganja.",
    tryAgain: "Poskusi znova",
    fetchPositionsFailed: "Pozicij v Aave ni bilo mogoče pridobiti",
  },
  totals: {
    supplied: "Skupaj položeno",
    borrowed: "Skupaj izposojeno",
    netWorth: "Neto vrednost",
    noData: "Ni podatkov",
  },
  networks: {
    heading: "Trgi",
    active: count =>
      plural("sl", count, {
        one: `${count} aktiven`,
        two: `${count} aktivna`,
        few: `${count} aktivni`,
        other: `${count} aktivnih`,
      }),
    noPositions: "Na podprtih trgih ni zaznanih aktivnih pozicij v Aave.",
    selectedRegion: "Izbrani trg",
    noneSelectedTitle: "Noben trg ni izbran",
    noneSelectedDescription: "Izberi trg, da vidiš svojo pozicijo v Aave.",
    otherMarkets: count => `Drugi trgi (${count})`,
    otherMarketsHint: "Trgi, ki jih je Tokenping preveril in na katerih ta denarnica nima pozicije ne opozorila.",
    alertSet: "Opozorilo nastavljeno",
    supplied: usd => `položeno ${usd},`,
    borrowed: usd => `izposojeno ${usd}`,
    noPosition: "Ni pozicije",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Ni dolga",
    critical: "Kritično",
    risky: "Tvegano",
    safe: "Varno",
  },
  position: {
    market: version => (version === 4 ? "Spoke Aave V4" : "Trg Aave V3"),
    noPositionTitle: chainName => `${capitalize(slOnMarket(chainName))} ni aktivne pozicije`,
    noPositionDetail: chainName => `Aave za to denarnico ${slOnMarket(chainName)} ne izkazuje ne zavarovanja ne dolga.`,
    collateral: "Zavarovanje",
    debt: "Dolg",
    netWorth: "Neto vrednost",
    suppliedTitle: "Položeno",
    borrowedTitle: "Izposojeno",
    noCollateral: "Ni položenega zavarovanja",
    noDebt: "Ni odprtega dolga",
    tokenIconsFrom: "Ikone žetonov in omrežij:",
    tokenDetailsFailedTitle: "Podrobnosti žetonov ni bilo mogoče naložiti",
    tokenDetailsFailedBody: "Zgornji seštevki so iz povzetka računa v Aave. Osveži pozicije in poskusi znova.",
  },
  tokens: {
    asset: "Sredstvo",
    supplied: "Položeno",
    supplyApy: "APY za polog",
    collateral: "Zavarovanje",
    borrowed: "Izposojeno",
    rateType: "Vrsta obrestne mere",
    enabled: "Vklopljeno",
    disabled: "Izklopljeno",
    stable: amount => `Stabilna ${amount}`,
    variable: amount => `Spremenljiva ${amount}`,
    count: count =>
      plural("sl", count, {
        one: `${count} sredstvo`,
        two: `${count} sredstvi`,
        few: `${count} sredstva`,
        other: `${count} sredstev`,
      }),
  },
  address: {
    defaultLabel: "Naslov",
    copy: (_label, address) => `Kopiraj naslov ${address}`,
    copied: "Naslov kopiran",
    copyFailed: "Kopiranje ni uspelo. Označi naslov in ga kopiraj ročno.",
  },
  opensInNewTab: "(odpre se v novem zavihku)",
  paywall: {
    unlockedUntil: date => `Opozorila odklenjena do ${date}`,
    titleNew: "Odkleni opozorila za health factor",
    titleExtend: "Podaljšaj dostop za urejanje opozoril",
    descriptionNew:
      "Plačaj enkrat, da odkleneš nastavitve opozoril in nastaviš prag za health factor za vsako omrežje. Nič se ne podaljša samodejno: ko želiš podaljšati, plačaš iz svoje denarnice.",
    descriptionExtend:
      "Tvoje prejšnje nastavitve opozoril so shranjene. Plačaj znova, da podaljšaš dostop in jih urejaš.",
    networkDescriptionNew: chainName =>
      `Plačaj enkrat, da nastaviš opozorila za health factor ${slOnMarket(chainName)} in na drugih trgih. Nič se ne podaljša samodejno: ko želiš podaljšati, plačaš iz svoje denarnice.`,
    networkDescriptionExtend: chainName =>
      `Tvoje shranjene nastavitve opozoril ${slForMarket(chainName)} so še vedno v tvojem računu. Plačaj znova, da podaljšaš dostop in jih urejaš.`,
    connectWallet: "Poveži denarnico, da plačaš dostop.",
    unconfigured: "Plačilna pogodba za to omrežje ni nastavljena.",
    noPlan: "Trenutno ni na voljo nobenega plačljivega paketa.",
    paused: "Plačila so trenutno ustavljena. Poskusi znova pozneje.",
    statusUnavailable: "Stanja plačila ni bilo mogoče naložiti. Znova naloži stran in poskusi znova.",
    wrongNetworkTitle: "Napačno omrežje",
    wrongNetworkBody: (walletChain, target) =>
      `${walletChain ? `Tvoja denarnica je na omrežju ${walletChain}.` : "Tvoja denarnica je na drugem omrežju."} Za plačilo preklopi na ${target ? `omrežje ${target}` : "plačilno omrežje"}.`,
    switchTo: target => `Preklopi na ${target ? `omrežje ${target}` : "plačilno omrežje"}`,
    switching: "Preklapljanje omrežja",
    loadingDetails: "Nalaganje podrobnosti plačila",
    price: "Cena",
    access: "Dostop",
    network: "Omrežje",
    networkFee: "Omrežnina",
    networkFeeValue: symbol => `Plačaš jo v ${symbol} za vsak korak, znesek vidiš v denarnici`,
    period: (count, about) => (about ? `Približno ${days(count)}` : days(count)),
    pay: amount => `Plačaj ${amount}`,
    extend: (count, amount) => `Dodaj ${days(count)} za ${amount}`,
    extendHint: count =>
      `Vsako plačilo doda ${days(count)} po trenutnem datumu konca dostopa. Plačaš lahko kolikokrat želiš; nič se ne podaljša samo.`,
    accessExtended: date => `Dostop podaljšan do ${date}.`,
    accessActive: "Dostop je aktiven. Zdaj lahko nastaviš opozorila.",
    paymentPending: "Plačilo potrjeno. Dostop se bo kmalu prikazal.",
    loading: {
      processing: "Obdelava",
      waitingForWallet: "Čakanje na tvojo denarnico",
      approving: "Odobritev",
      paying: "Plačevanje",
    },
    unavailable: "Plačljiv dostop trenutno ni na voljo.",
    checkFailed: "Stanja plačila ni bilo mogoče preveriti. Poskusi znova čez trenutek.",
    approvalNotVisible: "Odobritev je potrjena, a še ni vidna. Poskusi znova čez trenutek.",
  },
  payment: {
    stepsLabel: "Koraki plačila",
    approveTitle: amount => `Odobri ${amount}`,
    approveHint:
      "Plačilni pogodbi dovoli, da vzame točno ta znesek. Korak se preskoči, če ga pokriva že prejšnja odobritev.",
    payTitle: amount => `Plačaj ${amount}`,
    payHint: "Pošlje plačilo in odklene opozorila.",
    inProgress: "V teku",
    done: "Končano",
    notNeeded: "Ni potrebno",
    transaction: "Transakcija ",
    viewOn: explorer => `Odpri v raziskovalcu ${explorer}`,
    preparingTitle: "Priprava plačila",
    preparingBody: "Preverjanje trenutne cene in tvoje odobritve.",
    confirmTitle: "Potrdi v denarnici",
    approveSignBody: amount => `Korak 1 od 2: odobri ${amount}. Nič se ne pošlje, dokler ne potrdiš.`,
    processingOn: network => (network ? `Obdelava na omrežju ${network}` : "Obdelava na omrežju"),
    approvePendingBody: "Korak 1 od 2: odobritev oddana. Denarnica te bo nato prosila, da potrdiš plačilo.",
    paySignBody: amount => `Korak 2 od 2: plačaj ${amount}. Nič se ne pošlje, dokler ne potrdiš.`,
    payPendingBody: "Korak 2 od 2: plačilo oddano. Opozorila se odklenejo, ko ga omrežje potrdi.",
  },
};
