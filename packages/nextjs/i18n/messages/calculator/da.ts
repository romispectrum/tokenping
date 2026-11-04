import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers with a decimal point ("0.25", "$1.00"), so its examples and hints write them
// that way, with a space for thousands ("12 000 USDC"): a Danish thousands dot would read as that decimal point.
export const MESSAGES: CalculatorMessages = {
  title: "Beregner til likvidationspris på Aave",
  intro:
    "Indtast hver sikkerhed og din gæld for at se health factor og de priser, hvor positionen kan blive likvideret. Beregneren bruger formlen for Aave V3: Σ(sikkerhedens værdi × likvidationstærskel) ÷ gældens værdi.",
  examplesLabel: "Indlæs et regneeksempel:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC i gæld",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC i gæld",
    "volatile-debt": "10 000 USDC, 2.5 WETH lånt",
  },
  defaultCollateralName: index => `Sikkerhed ${index}`,
  defaultDebtName: "Lånt aktiv",
  collateralLegend: index => `Sikkerhed ${index}`,
  presetLabel: "Aktiv på Aave V3 (udfylder tærsklen)",
  eModeHint: (collateral, borrowable) =>
    `Denne tærskel gælder for ${joinList("da", collateral)}; anden sikkerhed beholder sin egen. I denne E-Mode kan du kun låne ${joinList("da", borrowable)}.`,
  otherAsset: "Andet aktiv: indtast selv tærsklen",
  presetGroup: (market, date) => `${market} (læst ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode »ETH correlated« (f.eks. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Aktivets navn",
  namePlaceholder: symbols => `f.eks. ${joinList("da", symbols, "disjunction")}`,
  amountSupplied: "Indskudt mængde",
  price: "Pris (USD)",
  priceHint: "Aaves orakelpris, som vises på aktivets side i Aave-appen.",
  threshold: "Likvidationstærskel (%)",
  thresholdHint: "I E-Mode kategoriens tærskel. På Aave V4 collateral factor.",
  removeCollateral: index => `Fjern sikkerhed ${index}`,
  addCollateral: "Tilføj en sikkerhed mere",
  debtLegend: "Gæld",
  debtKindLegend: "Hvad har du lånt?",
  debtKinds: { stable: "En stablecoin (regnes som $1.00)", volatile: "Et volatilt aktiv, f.eks. WETH" },
  debtAmount: { stable: "Lånt beløb (USD)", volatile: "Lånt mængde (tokens)" },
  debtAmountHint: "Medregn den rente, der er påløbet indtil nu.",
  debtPrice: "Pris på det lånte aktiv (USD)",
  errors: {
    number: "Indtast et tal som 10 eller 0.25, med punktum som decimaltegn.",
    price: "Indtast en pris over 0.",
    threshold: "Indtast en procentsats over 0 og højst 100.",
    samePrice: (name, price) =>
      `${name} er allerede indtastet ovenfor til ${price}. Brug samme pris: et aktiv har én pris.`,
  },
  eModeLead: "Intet resultat: Aave tillader ikke denne kombination.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("da", borrowable);
    const loanText = loan.kind === "stable" ? "et lån i stablecoin" : `lånt ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Med E-Mode »${category}« på ${market} kan du kun låne ${borrowableList}, så en konto med ${loanText} ` +
      `kan ikke bruge tærsklen på ${thresholdPercent} %. Vælg i stedet sikkerhedens egen tærskel${own}, eller lån ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultat",
    empty: "Indtast et tal i hvert felt for at se resultatet.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Ingen gæld, så der er intet at likvidere.",
    liquidatableNow: "Under 1.00: positionen kan blive likvideret nu.",
    liquidatableBelow: "Positionen kan blive likvideret under 1.00.",
    none: "Ingen",
    priceTitle: name => `Likvidationspris for ${name}`,
    priceTitleBorrowed: name => `Likvidationspris for ${name} (lånt)`,
    priceTitleShared: name => `Likvidationspris for ${name} (indskudt og lånt)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor kommer tilbage på 1.00, hvis ${name}${alike ? " (indskudt og lånt)" : ""} ${
        rises ? "stiger" : "falder"
      } ${change} fra ${now}, med de øvrige priser uændrede.`,
    collateralFall: ({ change, now }) => `${change} under ${now}, hvis alle andre priser forbliver uændrede.`,
    collateralNone: name =>
      `Selv ved $0 kan ${name} alene ikke bringe health factor under 1.00: den anden sikkerhed dækker gælden.`,
    debtRise: ({ change, now }) =>
      `${change} over ${now}: lånte aktiver trykker health factor ned, når deres pris stiger.`,
    sharedRise: ({ name, change, now }) =>
      `${change} over ${now}: du har lånt mere ${name}, end din sikkerhed i ${name} tæller for, så en stigning trykker health factor ned. Øvrige priser uændrede.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} under ${now}, med lånt ${name} til samme pris og alle andre priser uændrede.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} under ${now} for hver række med ${name}, hvis alle andre priser forbliver uændrede.`,
    bothSidesNeutral: name =>
      `${name} er både din sikkerhed og din gæld, så de to bevæger sig sammen, og prisen ændrer ikke health factor. Renter, en ændret tærskel eller dine egne transaktioner ændrer den stadig.`,
    bothSidesRecover: name =>
      `${name} er på begge sider, så de to bevæger sig sammen: ingen pris på ${name} alene bringer health factor tilbage på 1.00.`,
    bothSidesSafe: name =>
      `${name} er på begge sider, så de to bevæger sig sammen: prisen alene kan ikke bringe health factor under 1.00.`,
    uniformTitle: "Al sikkerhed falder samtidig",
    uniformDescription: prices =>
      `Hvis prisen på hver sikkerhed falder så meget, og gældens pris ikke bevæger sig, når health factor 1.00: ${joinList(
        "da",
        prices.map(({ name, price }) => `${name} på ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Prisforhold ${numerator} ÷ ${denominator} ved likvidation`,
    ratioDescription: (now, change, falls) =>
      `Nu ${now}. Hvis begge priser bevæger sig, bringer ${falls ? "et fald" : "en stigning"} på ${change} i dette forhold health factor til 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Sikkerhed ${collateral}, regnet med sine likvidationstærskler: ${weighted}. Health factor = ${weighted} ÷ ${debt} i gæld = ${healthFactor}.`,
  },
  noscript:
    "Beregneren skal bruge JavaScript for at regne igen. Resultatet ovenfor gælder 10 WETH til $2 400 (likvidationstærskel 83 %) mod 12 000 USDC i gæld; regneeksemplerne på denne side bruger samme formel.",
  disclaimer: {
    lead: "Et skøn til undervisningsbrug, ikke økonomisk rådgivning.",
    beforeDate:
      "Det bruger kun de tal, du indtaster. Aaves aktuelle parametre kan ændre sig: tærsklerne ovenfor blev læst on-chain den",
    afterDate:
      ", og governance eller Risk Stewards kan ændre dem når som helst. Orakelpriser bevæger sig, renten bliver ved med at øge din gæld, og hver likvidationspris forudsætter, at alle andre priser forbliver uændrede. Tjek din position i Aave-appen, før du handler.",
  },
};
