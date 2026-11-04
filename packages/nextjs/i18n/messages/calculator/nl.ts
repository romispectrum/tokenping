import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers with a decimal point ("0.25", "$1.00"), so its examples and hints write them
// that way, with a space for thousands ("12 000 USDC").
export const MESSAGES: CalculatorMessages = {
  title: "Liquidatieprijscalculator voor Aave",
  intro:
    "Vul elk onderpand en je schuld in om de health factor te zien en de prijzen waarbij de positie geliquideerd kan worden. De calculator gebruikt de formule van Aave V3: Σ(waarde van het onderpand × liquidatiedrempel) ÷ waarde van de schuld.",
  examplesLabel: "Een uitgewerkt voorbeeld laden:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC schuld",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC schuld",
    "volatile-debt": "10 000 USDC, 2.5 WETH geleend",
  },
  defaultCollateralName: index => `Onderpand ${index}`,
  defaultDebtName: "Geleend asset",
  collateralLegend: index => `Onderpand ${index}`,
  presetLabel: "Asset op Aave V3 (vult de drempel in)",
  eModeHint: (collateral, borrowable) =>
    `Deze drempel geldt voor ${joinList("nl", collateral)}; ander onderpand houdt zijn eigen drempel. In deze E-Mode kun je alleen ${joinList("nl", borrowable)} lenen.`,
  otherAsset: "Ander asset: vul de drempel zelf in",
  presetGroup: (market, date) => `${market} (gelezen op ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (bijv. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Naam van het asset",
  namePlaceholder: symbols => `bijv. ${joinList("nl", symbols, "disjunction")}`,
  amountSupplied: "Gestort bedrag",
  price: "Prijs (USD)",
  priceHint: "De oracleprijs van Aave, te zien op de pagina van het asset in de Aave-app.",
  threshold: "Liquidatiedrempel (%)",
  thresholdHint: "In E-Mode de drempel van de categorie. Op Aave V4 de collateral factor.",
  removeCollateral: index => `Onderpand ${index} verwijderen`,
  addCollateral: "Tweede onderpand toevoegen",
  debtLegend: "Schuld",
  debtKindLegend: "Wat heb je geleend?",
  debtKinds: { stable: "Een stablecoin (telt als $1.00)", volatile: "Een volatiel asset, zoals WETH" },
  debtAmount: { stable: "Geleend bedrag (USD)", volatile: "Geleende hoeveelheid (tokens)" },
  debtAmountHint: "Tel de rente mee die tot nu toe is opgebouwd.",
  debtPrice: "Prijs van het geleende asset (USD)",
  errors: {
    number: "Vul een getal in zoals 10 of 0.25, met een punt voor decimalen.",
    price: "Vul een prijs boven 0 in.",
    threshold: "Vul een percentage boven 0 en hoogstens 100 in.",
    samePrice: (name, price) =>
      `${name} staat hierboven al met ${price}. Gebruik dezelfde prijs: één asset heeft één prijs.`,
  },
  eModeLead: "Geen resultaat: Aave staat deze combinatie niet toe.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("nl", borrowable);
    const loanText = loan.kind === "stable" ? "een stablecoinlening" : `geleende ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Met de E-Mode “${category}” van ${market} kun je alleen ${borrowableList} lenen, dus een account met ${loanText} ` +
      `kan de drempel van ${thresholdPercent}% niet gebruiken. Kies in plaats daarvan de eigen drempel van het onderpand${own}, of leen ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultaat",
    empty: "Vul in elk veld een getal in om het resultaat te zien.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Geen schuld, dus er valt niets te liquideren.",
    liquidatableNow: "Onder 1.00: de positie kan nu geliquideerd worden.",
    liquidatableBelow: "De positie kan onder 1.00 geliquideerd worden.",
    none: "Geen",
    priceTitle: name => `Liquidatieprijs van ${name}`,
    priceTitleBorrowed: name => `Liquidatieprijs van ${name} (geleend)`,
    priceTitleShared: name => `Liquidatieprijs van ${name} (gestort en geleend)`,
    recover: ({ name, change, now, rises, alike }) =>
      `De health factor komt terug op 1.00 als ${name}${alike ? " (gestort en geleend)" : ""} ${change} ${
        rises ? "stijgt" : "daalt"
      } vanaf ${now}, met de andere prijzen ongewijzigd.`,
    collateralFall: ({ change, now }) => `${change} onder ${now}, als alle andere prijzen gelijk blijven.`,
    collateralNone: name =>
      `Zelfs bij $0 kan ${name} alleen de health factor niet onder 1.00 brengen: het andere onderpand dekt de schuld.`,
    debtRise: ({ change, now }) =>
      `${change} boven ${now}: geleende assets duwen de health factor omlaag als hun prijs stijgt.`,
    sharedRise: ({ name, change, now }) =>
      `${change} boven ${now}: je hebt meer ${name} geleend dan je onderpand in ${name} meetelt, dus een stijging duwt de health factor omlaag. Andere prijzen ongewijzigd.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} onder ${now}, met de geleende ${name} tegen dezelfde prijs en alle andere prijzen ongewijzigd.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} onder ${now} voor elke rij met ${name}, als alle andere prijzen gelijk blijven.`,
    bothSidesNeutral: name =>
      `${name} is zowel je onderpand als je schuld, dus beide bewegen samen en de prijs verandert de health factor niet. Rente, een gewijzigde drempel of je eigen transacties veranderen hem wel.`,
    bothSidesRecover: name =>
      `${name} staat aan beide kanten, dus beide bewegen samen: geen enkele prijs van ${name} brengt de health factor alleen terug op 1.00.`,
    bothSidesSafe: name =>
      `${name} staat aan beide kanten, dus beide bewegen samen: de prijs alleen kan de health factor niet onder 1.00 brengen.`,
    uniformTitle: "Al het onderpand daalt samen",
    uniformDescription: prices =>
      `Als de prijs van elk onderpand zoveel daalt en de prijs van de schuld niet beweegt, bereikt de health factor 1.00: ${joinList(
        "nl",
        prices.map(({ name, price }) => `${name} op ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Prijsverhouding ${numerator} ÷ ${denominator} bij liquidatie`,
    ratioDescription: (now, change, falls) =>
      `Nu ${now}. Als beide prijzen bewegen, brengt ${falls ? "een daling" : "een stijging"} van deze verhouding met ${change} de health factor op 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Onderpand ${collateral}, meegeteld tegen de liquidatiedrempels: ${weighted}. Health factor = ${weighted} ÷ ${debt} schuld = ${healthFactor}.`,
  },
  noscript:
    "De calculator heeft JavaScript nodig om opnieuw te rekenen. Het resultaat hierboven geldt voor 10 WETH tegen $2 400 (liquidatiedrempel 83%) tegenover 12 000 USDC schuld; de uitgewerkte voorbeelden op deze pagina gebruiken dezelfde formule.",
  disclaimer: {
    lead: "Een schatting ter informatie, geen financieel advies.",
    beforeDate:
      "Ze gebruikt alleen de getallen die je invult. Live parameters van Aave kunnen veranderen: de drempels hierboven zijn onchain gelezen op",
    afterDate:
      ", en governance of de Risk Stewards kunnen ze op elk moment wijzigen. Oracleprijzen bewegen, rente blijft je schuld verhogen en elke liquidatieprijs gaat ervan uit dat alle andere prijzen gelijk blijven. Controleer je positie in de Aave-app voordat je iets doet.",
  },
};
