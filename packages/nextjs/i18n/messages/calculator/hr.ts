import type { CalculatorMessages } from "./shared";
import { hrOnMarket, joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way. An asset's name
// follows a noun that takes the case ("cijena tokena WETH") or a colon ("Likvidacijska cijena: WETH"), so the name
// itself never needs an ending.

export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator likvidacijske cijene na Aaveu",
  intro:
    "Unesi svaku imovinu u kolateralu i svoj dug pa ćeš dobiti health factor i cijene pri kojima se pozicija može likvidirati. Kalkulator koristi formulu Aavea V3: Σ(vrijednost kolaterala × prag likvidacije) ÷ vrijednost duga.",
  examplesLabel: "Učitaj razrađeni primjer:",
  examples: {
    "one-collateral": "10 WETH, dug 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dug 20 000 USDC",
    "volatile-debt": "10 000 USDC, posuđeno 2.5 WETH",
  },
  defaultCollateralName: index => `Kolateral ${index}`,
  defaultDebtName: "Posuđena imovina",
  collateralLegend: index => `Kolateral ${index}`,
  presetLabel: "Imovina na Aaveu V3 (popunjava prag)",
  eModeHint: (collateral, borrowable) =>
    `Ovaj prag vrijedi za: ${joinList("hr", collateral)}. Ostali kolateral zadržava svoj prag. U ovoj kategoriji E-Mode možeš posuditi samo: ${joinList("hr", borrowable)}.`,
  otherAsset: "Druga imovina: prag unesi ručno",
  presetGroup: (market, date) => `${market} (očitano ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (npr. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativni)",
  },
  nameLabel: "Naziv imovine",
  namePlaceholder: symbols => `npr. ${joinList("hr", symbols, "disjunction")}`,
  amountSupplied: "Deponirana količina",
  price: "Cijena (USD)",
  priceHint: "Cijena iz Aaveova orakla, prikazana na stranici te imovine u aplikaciji Aave.",
  threshold: "Prag likvidacije (%)",
  thresholdHint: "U načinu E-Mode prag kategorije. Na Aaveu V4 collateral factor.",
  removeCollateral: index => `Ukloni kolateral ${index}`,
  addCollateral: "Dodaj drugi kolateral",
  debtLegend: "Dug",
  debtKindLegend: "Što posuđuješ?",
  debtKinds: { stable: "Stablecoin (računa se po $1.00)", volatile: "Imovinu promjenjive cijene, npr. WETH" },
  debtAmount: { stable: "Posuđeni iznos (USD)", volatile: "Posuđena količina (tokeni)" },
  debtAmountHint: "Uračunaj i dosad obračunatu kamatu.",
  debtPrice: "Cijena posuđene imovine (USD)",
  errors: {
    number: "Unesi broj, npr. 10 ili 0.25, s točkom kao decimalnim znakom.",
    price: "Unesi cijenu veću od 0.",
    threshold: "Unesi postotak veći od 0 i najviše 100.",
    samePrice: (name, price) =>
      `Token ${name} već je unesen gore s cijenom ${price}. Koristi istu cijenu: jedna imovina ima jednu cijenu.`,
  },
  eModeLead: "Nema rezultata: Aave ne dopušta ovu kombinaciju.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("hr", borrowable);
    const loanText = loan.kind === "stable" ? "posuđenim stablecoinom" : `posuđenim tokenom ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Kategorija E-Mode „${category}“ ${hrOnMarket(market, "market")} dopušta posudbu samo ovoga: ${borrowableList}. ` +
      `Zato račun s ${loanText} ne može koristiti njezin prag od ${thresholdPercent} %. Umjesto toga odaberi vlastiti prag kolaterala${own} ili posudi nešto od ovoga: ${borrowableList}.`
    );
  },
  results: {
    heading: "Rezultat",
    empty: "Unesi broj u svako polje da vidiš rezultat.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Nema duga, pa nema ni čega likvidirati.",
    liquidatableNow: "Ispod 1.00: pozicija se može likvidirati već sada.",
    liquidatableBelow: "Pozicija se može likvidirati ispod 1.00.",
    none: "Nema",
    priceTitle: name => `Likvidacijska cijena: ${name}`,
    priceTitleBorrowed: name => `Likvidacijska cijena: ${name} (posuđeno)`,
    priceTitleShared: name => `Likvidacijska cijena: ${name} (deponirano i posuđeno)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor se vraća na 1.00 ako cijena tokena ${name}${alike ? " (deponiranog i posuđenog jednako)" : ""} ${
        rises ? "poraste" : "padne"
      } za ${change} od ${now}, uz nepromijenjene ostale cijene.`,
    collateralFall: ({ change, now }) => `${change} ispod ${now}, ako se sve ostale cijene ne promijene.`,
    collateralNone: name =>
      `Čak ni po cijeni od $0 token ${name} sam ne može spustiti health factor ispod 1.00: ostali kolateral pokriva dug.`,
    debtRise: ({ change, now }) =>
      `${change} iznad ${now}: posuđena imovina spušta health factor kad joj cijena raste.`,
    sharedRise: ({ name, change, now }) =>
      `${change} iznad ${now}: tvoj dug u tokenu ${name} veći je od dijela tvog kolaterala u tokenu ${name} koji se računa, pa rast cijene spušta health factor. Ostale cijene bez promjene.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} ispod ${now}, uz istu cijenu posuđenog tokena ${name} i nepromijenjene sve ostale cijene.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} ispod ${now} za svaki redak s tokenom ${name}, ako se sve ostale cijene ne promijene.`,
    bothSidesNeutral: name =>
      `Token ${name} istodobno je tvoj kolateral i tvoj dug, pa se obje strane kreću zajedno i njegova cijena ne mijenja health factor. Kamata, promjena praga ili tvoje vlastite transakcije ipak ga mijenjaju.`,
    bothSidesRecover: name =>
      `Token ${name} nalazi se na obje strane, pa se one kreću zajedno: nijedna cijena tokena ${name} sama ne vraća health factor na 1.00.`,
    bothSidesSafe: name =>
      `Token ${name} nalazi se na obje strane, pa se one kreću zajedno: sama njegova cijena ne može spustiti health factor ispod 1.00.`,
    uniformTitle: "Sav kolateral pada zajedno",
    uniformDescription: prices =>
      `Ako cijena svakog kolaterala padne ovoliko, a cijena duga se ne pomakne, health factor dolazi do 1.00: ${joinList(
        "hr",
        prices.map(({ name, price }) => `${name}: ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Omjer cijena ${numerator} ÷ ${denominator} pri likvidaciji`,
    ratioDescription: (now, change, falls) =>
      `Sada ${now}. Ako se pomaknu obje cijene, ${falls ? "pad" : "rast"} ovog omjera za ${change} dovodi health factor na 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Kolateral ${collateral}, računat po pragovima likvidacije: ${weighted}. Health factor = ${weighted} ÷ ${debt} duga = ${healthFactor}.`,
  },
  noscript:
    "Kalkulatoru za ponovni izračun treba JavaScript. Rezultat gore odnosi se na 10 WETH po $2 400 (prag likvidacije 83 %) uz dug od 12 000 USDC; razrađeni primjeri na ovoj stranici koriste istu formulu.",
  disclaimer: {
    lead: "Edukativna procjena, a ne financijski savjet.",
    beforeDate:
      "Koristi samo brojeve koje uneseš. Aktualni parametri Aavea mogu se promijeniti: pragovi gore očitani su na blockchainu",
    afterDate:
      ", a governance ili Risk Stewards mogu ih promijeniti u bilo kojem trenutku. Cijene iz orakla se mijenjaju, kamata ti stalno povećava dug, a svaka likvidacijska cijena pretpostavlja da se sve ostale cijene ne mijenjaju. Prije nego što nešto poduzmeš, provjeri svoju poziciju u aplikaciji Aave.",
  },
};
