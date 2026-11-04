import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples, hints and
// results keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Kalkulator for likvidasjonspris på Aave",
  intro:
    "Legg inn hver sikkerhet og gjelden din for å se health factor og prisene der posisjonen kan likvideres. Kalkulatoren bruker formelen for Aave V3: Σ(sikkerhetens verdi × likvidasjonsterskel) ÷ gjeldens verdi.",
  examplesLabel: "Last inn et regneeksempel:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC i gjeld",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC i gjeld",
    "volatile-debt": "10 000 USDC, 2.5 WETH lånt",
  },
  defaultCollateralName: index => `Sikkerhet ${index}`,
  defaultDebtName: "Lånt eiendel",
  collateralLegend: index => `Sikkerhet ${index}`,
  presetLabel: "Eiendel på Aave V3 (fyller inn terskelen)",
  eModeHint: (collateral, borrowable) =>
    `Denne terskelen gjelder for ${joinList("nb", collateral)}; annen sikkerhet beholder sin egen. I denne E-Mode kan du bare låne ${joinList("nb", borrowable)}.`,
  otherAsset: "Annen eiendel: legg inn terskelen selv",
  presetGroup: (market, date) => `${market} (lest ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode «ETH correlated» (f.eks. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (native)",
  },
  nameLabel: "Navn på eiendelen",
  namePlaceholder: symbols => `f.eks. ${joinList("nb", symbols, "disjunction")}`,
  amountSupplied: "Innskutt mengde",
  price: "Pris (USD)",
  priceHint: "Aaves orakelpris, som vises på eiendelens side i Aave-appen.",
  threshold: "Likvidasjonsterskel (%)",
  thresholdHint: "I E-Mode kategoriens terskel. På Aave V4 collateral factor.",
  removeCollateral: index => `Fjern sikkerhet ${index}`,
  addCollateral: "Legg til en sikkerhet til",
  debtLegend: "Gjeld",
  debtKindLegend: "Hva har du lånt?",
  debtKinds: { stable: "En stablecoin (regnes som $1.00)", volatile: "En volatil eiendel, for eksempel WETH" },
  debtAmount: { stable: "Lånt beløp (USD)", volatile: "Lånt mengde (tokens)" },
  debtAmountHint: "Ta med renten som har påløpt så langt.",
  debtPrice: "Pris på den lånte eiendelen (USD)",
  errors: {
    number: "Skriv inn et tall som 10 eller 0.25, med punktum for desimaler.",
    price: "Skriv inn en pris over 0.",
    threshold: "Skriv inn en prosentsats over 0 og høyst 100.",
    samePrice: (name, price) =>
      `${name} er allerede lagt inn ovenfor til ${price}. Bruk samme pris: én eiendel har én pris.`,
  },
  eModeLead: "Ingen resultat: Aave tillater ikke denne kombinasjonen.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("nb", borrowable);
    const loanText = loan.kind === "stable" ? "et lån i stablecoin" : `lånt ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Med E-Mode «${category}» på ${market} kan du bare låne ${borrowableList}, så en konto med ${loanText} ` +
      `kan ikke bruke terskelen på ${thresholdPercent} %. Velg sikkerhetens egen terskel i stedet${own}, eller lån ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultat",
    empty: "Skriv inn et tall i hvert felt for å se resultatet.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Ingen gjeld, så det er ingenting å likvidere.",
    liquidatableNow: "Under 1.00: posisjonen kan likvideres nå.",
    liquidatableBelow: "Posisjonen kan likvideres under 1.00.",
    none: "Ingen",
    priceTitle: name => `Likvidasjonspris for ${name}`,
    priceTitleBorrowed: name => `Likvidasjonspris for ${name} (lånt)`,
    priceTitleShared: name => `Likvidasjonspris for ${name} (innskutt og lånt)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor kommer tilbake til 1.00 hvis ${name}${alike ? " (innskutt og lånt)" : ""} ${
        rises ? "stiger" : "faller"
      } ${change} fra ${now}, med andre priser uendret.`,
    collateralFall: ({ change, now }) => `${change} under ${now}, hvis alle andre priser er uendret.`,
    collateralNone: name =>
      `Selv ved $0 kan ikke ${name} alene ta health factor under 1.00: den andre sikkerheten dekker gjelden.`,
    debtRise: ({ change, now }) =>
      `${change} over ${now}: lånte eiendeler presser health factor ned når prisen deres stiger.`,
    sharedRise: ({ name, change, now }) =>
      `${change} over ${now}: du har lånt mer ${name} enn sikkerheten din i ${name} teller for, så en oppgang presser health factor ned. Andre priser uendret.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} under ${now}, med lånt ${name} til samme pris og alle andre priser uendret.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} under ${now} for hver rad med ${name}, hvis alle andre priser er uendret.`,
    bothSidesNeutral: name =>
      `${name} er både sikkerheten og gjelden din, så begge beveger seg sammen og prisen endrer ikke health factor. Renter, en endret terskel eller dine egne transaksjoner endrer den likevel.`,
    bothSidesRecover: name =>
      `${name} er på begge sider, så begge beveger seg sammen: ingen pris på ${name} alene bringer health factor tilbake til 1.00.`,
    bothSidesSafe: name =>
      `${name} er på begge sider, så begge beveger seg sammen: prisen alene kan ikke ta health factor under 1.00.`,
    uniformTitle: "All sikkerhet faller samtidig",
    uniformDescription: prices =>
      `Hvis prisen på hver sikkerhet faller så mye og gjeldens pris står stille, når health factor 1.00: ${joinList(
        "nb",
        prices.map(({ name, price }) => `${name} på ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Prisforhold ${numerator} ÷ ${denominator} ved likvidasjon`,
    ratioDescription: (now, change, falls) =>
      `Nå ${now}. Hvis begge prisene beveger seg, tar ${falls ? "et fall" : "en oppgang"} på ${change} i dette forholdet health factor til 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Sikkerhet ${collateral}, regnet med likvidasjonstersklene: ${weighted}. Health factor = ${weighted} ÷ ${debt} i gjeld = ${healthFactor}.`,
  },
  noscript:
    "Kalkulatoren trenger JavaScript for å regne på nytt. Resultatet ovenfor gjelder 10 WETH til $2 400 (likvidasjonsterskel 83 %) mot 12 000 USDC i gjeld; regneeksemplene på denne siden bruker samme formel.",
  disclaimer: {
    lead: "Et anslag til læring, ikke finansiell rådgivning.",
    beforeDate:
      "Den bruker bare tallene du legger inn. Aaves gjeldende parametere kan endres: tersklene ovenfor ble lest on-chain",
    afterDate:
      ", og governance eller Risk Stewards kan endre dem når som helst. Orakelpriser beveger seg, renten øker gjelden din hele tiden, og hver likvidasjonspris forutsetter at alle andre priser er uendret. Sjekk posisjonen din i Aave-appen før du handler.",
  },
};
