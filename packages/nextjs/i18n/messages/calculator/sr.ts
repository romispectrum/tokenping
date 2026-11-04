import type { CalculatorMessages } from "./shared";
import { joinList, srOnMarket } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun that takes the case ("cena tokena WETH") or a colon ("Likvidaciona cena: WETH"), so the name
// itself never needs an ending.

export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator likvidacione cene za Aave",
  intro:
    "Unesi svaku imovinu u kolateralu i svoj dug i dobićeš health factor i cene pri kojima pozicija može da bude likvidirana. Kalkulator koristi formulu protokola Aave V3: Σ(vrednost kolaterala × prag likvidacije) ÷ vrednost duga.",
  examplesLabel: "Učitaj razrađen primer:",
  examples: {
    "one-collateral": "10 WETH, dug 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dug 20 000 USDC",
    "volatile-debt": "10 000 USDC, pozajmljeno 2.5 WETH",
  },
  defaultCollateralName: index => `Kolateral ${index}`,
  defaultDebtName: "Pozajmljena imovina",
  collateralLegend: index => `Kolateral ${index}`,
  presetLabel: "Imovina na protokolu Aave V3 (popunjava prag)",
  eModeHint: (collateral, borrowable) =>
    `Ovaj prag važi za: ${joinList("sr", collateral)}. Ostali kolateral zadržava svoj prag. U ovoj E-Mode kategoriji možeš da pozajmiš samo: ${joinList("sr", borrowable)}.`,
  otherAsset: "Druga imovina: prag unesi ručno",
  presetGroup: (market, date) => `${market} (očitano ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (npr. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativni)",
  },
  nameLabel: "Naziv imovine",
  namePlaceholder: symbols => `npr. ${joinList("sr", symbols, "disjunction")}`,
  amountSupplied: "Deponovana količina",
  price: "Cena (USD)",
  priceHint: "Cena iz Aave orakla, prikazana na stranici te imovine u aplikaciji Aave.",
  threshold: "Prag likvidacije (%)",
  thresholdHint: "U režimu E-Mode prag kategorije. Na protokolu Aave V4 collateral factor.",
  removeCollateral: index => `Ukloni kolateral ${index}`,
  addCollateral: "Dodaj drugi kolateral",
  debtLegend: "Dug",
  debtKindLegend: "Šta pozajmljuješ?",
  debtKinds: { stable: "Stablecoin (računa se po $1.00)", volatile: "Imovinu promenljive cene, npr. WETH" },
  debtAmount: { stable: "Pozajmljeni iznos (USD)", volatile: "Pozajmljena količina (tokeni)" },
  debtAmountHint: "Uračunaj i do sada obračunatu kamatu.",
  debtPrice: "Cena pozajmljene imovine (USD)",
  errors: {
    number: "Unesi broj, npr. 10 ili 0.25, sa tačkom kao decimalnim znakom.",
    price: "Unesi cenu veću od 0.",
    threshold: "Unesi procenat veći od 0 i najviše 100.",
    samePrice: (name, price) =>
      `Token ${name} je već unet gore sa cenom ${price}. Koristi istu cenu: jedna imovina ima jednu cenu.`,
  },
  eModeLead: "Nema rezultata: Aave ne dozvoljava ovu kombinaciju.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("sr", borrowable);
    const loanText = loan.kind === "stable" ? "pozajmljenim stablecoinom" : `pozajmljenim tokenom ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode kategorija „${category}“ ${srOnMarket(market, "market")} dozvoljava pozajmljivanje samo ovoga: ${borrowableList}. ` +
      `Zato nalog sa ${loanText} ne može da koristi njen prag od ${thresholdPercent}%. Umesto toga izaberi sopstveni prag kolaterala${own} ili pozajmi nešto od ovoga: ${borrowableList}.`
    );
  },
  results: {
    heading: "Rezultat",
    empty: "Unesi broj u svako polje da vidiš rezultat.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Nema duga, pa nema ni šta da se likvidira.",
    liquidatableNow: "Ispod 1.00: pozicija može da bude likvidirana već sada.",
    liquidatableBelow: "Pozicija može da bude likvidirana ispod 1.00.",
    none: "Nema",
    priceTitle: name => `Likvidaciona cena: ${name}`,
    priceTitleBorrowed: name => `Likvidaciona cena: ${name} (pozajmljeno)`,
    priceTitleShared: name => `Likvidaciona cena: ${name} (deponovano i pozajmljeno)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor se vraća na 1.00 ako cena tokena ${name}${alike ? " (deponovanog i pozajmljenog podjednako)" : ""} ${
        rises ? "poraste" : "padne"
      } za ${change} od ${now}, uz nepromenjene ostale cene.`,
    collateralFall: ({ change, now }) => `${change} ispod ${now}, ako se sve ostale cene ne promene.`,
    collateralNone: name =>
      `Čak ni po ceni od $0 token ${name} sam ne može da spusti health factor ispod 1.00: ostali kolateral pokriva dug.`,
    debtRise: ({ change, now }) =>
      `${change} iznad ${now}: pozajmljena imovina spušta health factor kad joj cena raste.`,
    sharedRise: ({ name, change, now }) =>
      `${change} iznad ${now}: tvoj dug u tokenu ${name} veći je od dela tvog kolaterala u tokenu ${name} koji se računa, pa rast cene spušta health factor. Ostale cene bez promene.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} ispod ${now}, uz istu cenu pozajmljenog tokena ${name} i nepromenjene sve ostale cene.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} ispod ${now} za svaki red sa tokenom ${name}, ako se sve ostale cene ne promene.`,
    bothSidesNeutral: name =>
      `Token ${name} je istovremeno tvoj kolateral i tvoj dug, pa se obe strane kreću zajedno i njegova cena ne menja health factor. Kamata, promena praga ili tvoje sopstvene transakcije ga ipak menjaju.`,
    bothSidesRecover: name =>
      `Token ${name} se nalazi na obe strane, pa se one kreću zajedno: nijedna cena tokena ${name} sama ne vraća health factor na 1.00.`,
    bothSidesSafe: name =>
      `Token ${name} se nalazi na obe strane, pa se one kreću zajedno: sama njegova cena ne može da spusti health factor ispod 1.00.`,
    uniformTitle: "Sav kolateral pada zajedno",
    uniformDescription: prices =>
      `Ako cena svakog kolaterala padne ovoliko, a cena duga se ne pomeri, health factor stiže do 1.00: ${joinList(
        "sr",
        prices.map(({ name, price }) => `${name}: ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Odnos cena ${numerator} ÷ ${denominator} pri likvidaciji`,
    ratioDescription: (now, change, falls) =>
      `Sada ${now}. Ako se pomere obe cene, ${falls ? "pad" : "rast"} ovog odnosa za ${change} dovodi health factor na 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Kolateral ${collateral}, računat po pragovima likvidacije: ${weighted}. Health factor = ${weighted} ÷ ${debt} duga = ${healthFactor}.`,
  },
  noscript:
    "Kalkulatoru je za ponovni proračun potreban JavaScript. Rezultat gore se odnosi na 10 WETH po $2 400 (prag likvidacije 83%) uz dug od 12 000 USDC; razrađeni primeri na ovoj stranici koriste istu formulu.",
  disclaimer: {
    lead: "Edukativna procena, a ne finansijski savet.",
    beforeDate:
      "Koristi samo brojeve koje uneseš. Aktuelni Aave parametri mogu da se promene: pragovi gore su očitani na blockchainu",
    afterDate:
      ", a governance ili Risk Stewards mogu da ih promene u bilo kom trenutku. Cene iz orakla se menjaju, kamata ti stalno povećava dug, a svaka likvidaciona cena pretpostavlja da se sve ostale cene ne menjaju. Pre nego što bilo šta preduzmeš, proveri svoju poziciju u aplikaciji Aave.",
  },
};
