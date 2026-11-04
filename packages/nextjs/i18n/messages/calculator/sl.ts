import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun ("cena sredstva WETH") or a colon ("Likvidacijska cena: WETH"), so it never takes a case ending.
export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator likvidacijske cene za Aave",
  intro:
    "Vnesi vsako sredstvo zavarovanja in svoj dolg, da dobiš health factor in cene, pri katerih je pozicijo mogoče likvidirati. Kalkulator uporablja formulo Aave V3: Σ(vrednost zavarovanja × prag likvidacije) ÷ vrednost dolga.",
  examplesLabel: "Naloži izračunan primer:",
  examples: {
    "one-collateral": "10 WETH, dolg 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dolg 20 000 USDC",
    "volatile-debt": "10 000 USDC, izposojeno 2.5 WETH",
  },
  defaultCollateralName: index => `Zavarovanje ${index}`,
  defaultDebtName: "Izposojeno sredstvo",
  collateralLegend: index => `Zavarovanje ${index}`,
  presetLabel: "Sredstvo Aave V3 (izpolni prag)",
  eModeHint: (collateral, borrowable) =>
    `Ta prag velja za: ${joinList("sl", collateral)}. Drugo zavarovanje ohrani svojega. V tem E-Mode si lahko izposodiš samo: ${joinList("sl", borrowable)}.`,
  otherAsset: "Drugo sredstvo: prag vnesi ročno",
  presetGroup: (market, date) => `${market} (prebrano ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (npr. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativni)",
  },
  nameLabel: "Ime sredstva",
  namePlaceholder: symbols => `npr. ${joinList("sl", symbols, "disjunction")}`,
  amountSupplied: "Položena količina",
  price: "Cena (USD)",
  priceHint: "Cena oraklja Aave, prikazana na strani sredstva v aplikaciji Aave.",
  threshold: "Prag likvidacije (%)",
  thresholdHint: "V E-Mode prag kategorije. V Aave V4 collateral factor.",
  removeCollateral: index => `Odstrani zavarovanje ${index}`,
  addCollateral: "Dodaj drugo zavarovanje",
  debtLegend: "Dolg",
  debtKindLegend: "Kaj si izposojaš?",
  debtKinds: { stable: "Stablecoin (šteje se po $1.00)", volatile: "Sredstvo s spremenljivo ceno, na primer WETH" },
  debtAmount: { stable: "Izposojeni znesek (USD)", volatile: "Izposojena količina (žetoni)" },
  debtAmountHint: "Vključi do zdaj nabrane obresti.",
  debtPrice: "Cena izposojenega sredstva (USD)",
  errors: {
    number: "Vnesi število, kot je 10 ali 0.25, s piko za decimalke.",
    price: "Vnesi ceno, večjo od 0.",
    threshold: "Vnesi odstotek, večji od 0 in največ 100.",
    samePrice: (name, price) =>
      `Sredstvo ${name} je zgoraj že vneseno s ceno ${price}. Uporabi isto ceno: eno sredstvo ima eno ceno.`,
  },
  eModeLead: "Ni rezultata: Aave te kombinacije ne dovoli.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("sl", borrowable);
    const loanText = loan.kind === "stable" ? "s posojilom v stablecoinu" : `z izposojenim sredstvom ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode „${category}“ na trgu ${market} dovoljuje izposojo samo teh sredstev: ${borrowableList}. Zato račun ${loanText} ` +
      `ne more uporabiti njegovega praga ${thresholdPercent} %. Namesto tega izberi lasten prag zavarovanja${own} ali si izposodi: ${borrowableList}.`
    );
  },
  results: {
    heading: "Rezultat",
    empty: "Vnesi število v vsako polje, da vidiš rezultat.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Ni dolga, zato ni česa likvidirati.",
    liquidatableNow: "Pod 1.00: pozicijo je mogoče likvidirati že zdaj.",
    liquidatableBelow: "Pozicijo je mogoče likvidirati pod 1.00.",
    none: "Ni",
    priceTitle: name => `Likvidacijska cena: ${name}`,
    priceTitleBorrowed: name => `Likvidacijska cena: ${name} (izposojeno)`,
    priceTitleShared: name => `Likvidacijska cena: ${name} (položeno in izposojeno)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor se vrne na 1.00, če cena sredstva ${name}${alike ? " (položenega in izposojenega)" : ""} ${
        rises ? "zraste" : "pade"
      } za ${change} od ${now}, ostale cene pa ostanejo enake.`,
    collateralFall: ({ change, now }) => `Za ${change} pod ${now}, če vse druge cene ostanejo enake.`,
    collateralNone: name =>
      `Tudi pri ceni $0 sredstvo ${name} samo ne more spustiti health factorja pod 1.00: dolg pokriva drugo zavarovanje.`,
    debtRise: ({ change, now }) =>
      `Za ${change} nad ${now}: izposojena sredstva znižujejo health factor, ko njihova cena raste.`,
    sharedRise: ({ name, change, now }) =>
      `Za ${change} nad ${now}: izposojenega sredstva ${name} je več, kot ga šteje tvoje zavarovanje v tem sredstvu, zato rast cene zniža health factor. Ostale cene ostanejo enake.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `Za ${change} pod ${now}, pri čemer ima izposojeno sredstvo ${name} isto ceno, vse druge cene pa ostanejo enake.`,
    sharedFallRows: ({ name, change, now }) =>
      `Za ${change} pod ${now} za vsako vrstico sredstva ${name}, če vse druge cene ostanejo enake.`,
    bothSidesNeutral: name =>
      `Sredstvo ${name} je hkrati tvoje zavarovanje in tvoj dolg, zato se obe strani gibljeta skupaj in njegova cena ne spremeni health factorja. Spremenijo ga pa obresti, sprememba praga ali tvoje lastne transakcije.`,
    bothSidesRecover: name =>
      `Sredstvo ${name} je na obeh straneh, zato se obe strani gibljeta skupaj: nobena cena tega sredstva sama ne vrne health factorja na 1.00.`,
    bothSidesSafe: name =>
      `Sredstvo ${name} je na obeh straneh, zato se obe strani gibljeta skupaj: njegova cena sama ne more spustiti health factorja pod 1.00.`,
    uniformTitle: "Vse zavarovanje pade hkrati",
    uniformDescription: prices =>
      `Če cena vsakega zavarovanja pade za toliko, cena dolga pa se ne spremeni, health factor doseže 1.00: ${prices
        .map(({ name, price }) => `${name} po ${price}`)
        .join(" in ")}.`,
    ratioTitle: (numerator, denominator) => `Razmerje cen ${numerator} ÷ ${denominator} ob likvidaciji`,
    ratioDescription: (now, change, falls) =>
      `Zdaj ${now}. Če se spremenita obe ceni, ${falls ? "padec" : "rast"} tega razmerja za ${change} spusti health factor na 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Zavarovanje ${collateral}, šteto po pragovih likvidacije: ${weighted}. Health factor = ${weighted} ÷ ${debt} dolga = ${healthFactor}.`,
  },
  noscript:
    "Kalkulator za ponovni izračun potrebuje JavaScript. Zgornji rezultat velja za 10 WETH po $2 400 (prag likvidacije 83 %) ob dolgu 12 000 USDC; izračunani primeri na tej strani uporabljajo isto formulo.",
  disclaimer: {
    lead: "Izobraževalna ocena, ne finančni nasvet.",
    beforeDate:
      "Uporablja samo števila, ki jih vneseš. Trenutni parametri Aave se lahko spremenijo: zgornji pragovi so bili prebrani z verige dne",
    afterDate:
      ", governance ali Risk Stewards pa jih lahko kadar koli spremenijo. Cene orakljev se gibljejo, obresti tvoj dolg ves čas povečujejo, vsaka likvidacijska cena pa predpostavlja, da vse druge cene ostanejo enake. Preden ukrepaš, preveri svojo pozicijo v aplikaciji Aave.",
  },
};
