import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Liquidationspreis-Rechner für Aave",
  intro:
    "Gib jede Sicherheit und deine Schulden ein, um den Health Factor und die Preise zu sehen, bei denen die Position liquidiert werden kann. Der Rechner nutzt die Formel von Aave V3: Σ(Wert der Sicherheiten × Liquidationsschwelle) ÷ Wert der Schulden.",
  examplesLabel: "Durchgerechnetes Beispiel laden:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC Schulden",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC Schulden",
    "volatile-debt": "10 000 USDC, 2.5 WETH geliehen",
  },
  defaultCollateralName: index => `Sicherheit ${index}`,
  defaultDebtName: "Geliehenes Asset",
  collateralLegend: index => `Sicherheit ${index}`,
  presetLabel: "Asset auf Aave V3 (füllt die Schwelle aus)",
  eModeHint: (collateral, borrowable) =>
    `Diese Schwelle gilt für ${joinList("de", collateral)}; andere Sicherheiten behalten ihre eigene. In diesem E-Mode kannst du nur ${joinList("de", borrowable)} leihen.`,
  otherAsset: "Anderes Asset: Schwelle selbst eingeben",
  presetGroup: (market, date) => `${market} (Stand ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated“ (z. B. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativ)",
  },
  nameLabel: "Name des Assets",
  namePlaceholder: symbols => `z. B. ${joinList("de", symbols, "disjunction")}`,
  amountSupplied: "Eingezahlte Menge",
  price: "Preis (USD)",
  priceHint: "Der Orakelpreis von Aave, angezeigt auf der Seite des Assets in der Aave-App.",
  threshold: "Liquidationsschwelle (%)",
  thresholdHint: "Im E-Mode die Schwelle der Kategorie. Auf Aave V4 der Collateral Factor.",
  removeCollateral: index => `Sicherheit ${index} entfernen`,
  addCollateral: "Zweite Sicherheit hinzufügen",
  debtLegend: "Schulden",
  debtKindLegend: "Was hast du geliehen?",
  debtKinds: { stable: "Einen Stablecoin (zählt als $1.00)", volatile: "Ein volatiles Asset wie WETH" },
  debtAmount: { stable: "Geliehener Betrag (USD)", volatile: "Geliehene Menge (Token)" },
  debtAmountHint: "Rechne die bisher aufgelaufenen Zinsen mit ein.",
  debtPrice: "Preis des geliehenen Assets (USD)",
  errors: {
    number: "Gib eine Zahl wie 10 oder 0.25 ein, mit Punkt als Dezimaltrennzeichen.",
    price: "Gib einen Preis über 0 ein.",
    threshold: "Gib einen Prozentsatz über 0 und höchstens 100 ein.",
    samePrice: (name, price) =>
      `${name} ist oben schon mit ${price} eingetragen. Verwende denselben Preis: Ein Asset hat nur einen Preis.`,
  },
  eModeLead: "Kein Ergebnis: Aave erlaubt diese Kombination nicht.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("de", borrowable);
    const loanText = loan.kind === "stable" ? "einem Stablecoin-Kredit" : `geliehenem ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `Der E-Mode „${category}“ von ${market} erlaubt nur, ${borrowableList} zu leihen, daher kann ein Konto mit ${loanText} ` +
      `die Schwelle von ${thresholdPercent}% dieses E-Mode nicht nutzen. Wähle stattdessen die eigene Schwelle der Sicherheit${own} oder leihe ${borrowableList}.`
    );
  },
  results: {
    heading: "Ergebnis",
    empty: "Gib in jedes Feld eine Zahl ein, um das Ergebnis zu sehen.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health Factor",
    noDebt: "Keine Schulden, also gibt es nichts zu liquidieren.",
    liquidatableNow: "Unter 1.00: Die Position kann jetzt liquidiert werden.",
    liquidatableBelow: "Die Position kann unter 1.00 liquidiert werden.",
    none: "Keiner",
    priceTitle: name => `Liquidationspreis von ${name}`,
    priceTitleBorrowed: name => `Liquidationspreis von ${name} (geliehen)`,
    priceTitleShared: name => `Liquidationspreis von ${name} (eingezahlt und geliehen)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Der Health Factor kommt auf 1.00 zurück, wenn ${name}${alike ? " (eingezahlt und geliehen)" : ""} von ${now} um ${change} ${
        rises ? "steigt" : "fällt"
      } und die anderen Preise gleich bleiben.`,
    collateralFall: ({ change, now }) => `${change} unter ${now}, wenn alle anderen Preise gleich bleiben.`,
    collateralNone: name =>
      `Selbst bei $0 kann ${name} allein den Health Factor nicht unter 1.00 drücken: Die anderen Sicherheiten decken die Schulden.`,
    debtRise: ({ change, now }) =>
      `${change} über ${now}: Geliehene Assets drücken den Health Factor, wenn ihr Preis steigt.`,
    sharedRise: ({ name, change, now }) =>
      `${change} über ${now}: Du hast mehr ${name} geliehen, als deine Sicherheit in ${name} anrechnet, daher drückt ein Anstieg den Health Factor. Andere Preise unverändert.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} unter ${now}, mit dem geliehenen ${name} zum gleichen Preis und allen anderen Preisen unverändert.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} unter ${now} für jede Zeile mit ${name}, wenn alle anderen Preise gleich bleiben.`,
    bothSidesNeutral: name =>
      `${name} ist zugleich deine Sicherheit und deine Schuld, daher bewegen sich beide gemeinsam und der Preis ändert den Health Factor nicht. Zinsen, eine geänderte Schwelle oder deine eigenen Transaktionen ändern ihn trotzdem.`,
    bothSidesRecover: name =>
      `${name} steht auf beiden Seiten, daher bewegen sich beide gemeinsam: Kein Preis von ${name} allein bringt den Health Factor auf 1.00 zurück.`,
    bothSidesSafe: name =>
      `${name} steht auf beiden Seiten, daher bewegen sich beide gemeinsam: Der Preis allein kann den Health Factor nicht unter 1.00 drücken.`,
    uniformTitle: "Alle Sicherheiten fallen gemeinsam",
    uniformDescription: prices =>
      `Wenn der Preis jeder Sicherheit um so viel fällt und sich der Preis der Schulden nicht bewegt, erreicht der Health Factor 1.00: ${joinList(
        "de",
        prices.map(({ name, price }) => `${name} bei ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Preisverhältnis ${numerator} ÷ ${denominator} bei Liquidation`,
    ratioDescription: (now, change, falls) =>
      `Jetzt ${now}. Wenn sich beide Preise bewegen, bringt ${falls ? "ein Rückgang" : "ein Anstieg"} dieses Verhältnisses um ${change} den Health Factor auf 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Sicherheiten ${collateral}, angerechnet mit ihren Liquidationsschwellen: ${weighted}. Health Factor = ${weighted} ÷ ${debt} Schulden = ${healthFactor}.`,
  },
  noscript:
    "Der Rechner braucht JavaScript, um neu zu rechnen. Das Ergebnis oben gilt für 10 WETH zu $2 400 (Liquidationsschwelle 83%) gegenüber 12 000 USDC Schulden; die durchgerechneten Beispiele auf dieser Seite nutzen dieselbe Formel.",
  disclaimer: {
    lead: "Eine Schätzung zu Lernzwecken, keine Finanzberatung.",
    beforeDate:
      "Sie nutzt nur die Zahlen, die du eingibst. Live-Parameter von Aave können sich ändern: Die Schwellen oben wurden am",
    afterDate:
      " onchain gelesen, und die Governance oder die Risk Stewards können sie jederzeit ändern. Orakelpreise bewegen sich, Zinsen erhöhen deine Schulden laufend, und jeder Liquidationspreis setzt voraus, dass alle anderen Preise gleich bleiben. Prüfe deine Position in der Aave-App, bevor du handelst.",
  },
};
