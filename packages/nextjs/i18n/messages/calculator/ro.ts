import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples and hints
// keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Calculator de preț de lichidare Aave",
  intro:
    "Introdu fiecare activ pus ca garanție și datoria ta ca să afli health factor-ul și prețurile la care poziția poate fi lichidată. Folosește formula Aave V3: Σ(valoarea garanției × pragul de lichidare) ÷ valoarea datoriei.",
  examplesLabel: "Încarcă un exemplu rezolvat:",
  examples: {
    "one-collateral": "10 WETH, datorie de 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, datorie de 20 000 USDC",
    "volatile-debt": "10 000 USDC, 2.5 WETH împrumutat",
  },
  defaultCollateralName: index => `Garanția ${index}`,
  defaultDebtName: "Activ împrumutat",
  collateralLegend: index => `Garanția ${index}`,
  presetLabel: "Activ Aave V3 (completează pragul)",
  eModeHint: (collateral, borrowable) =>
    `Acest prag se aplică pentru ${joinList("ro", collateral)}; restul garanției își păstrează pragul propriu. În acest E-Mode te poți împrumuta doar în ${joinList("ro", borrowable)}.`,
  otherAsset: "Alt activ: introdu tu pragul",
  presetGroup: (market, date) => `${market} (citit pe ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode „ETH correlated” (de ex. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativ)",
  },
  nameLabel: "Numele activului",
  namePlaceholder: symbols => `de ex. ${joinList("ro", symbols, "disjunction")}`,
  amountSupplied: "Cantitate depusă",
  price: "Preț (USD)",
  priceHint: "Prețul oracolului Aave, afișat pe pagina activului în aplicația Aave.",
  threshold: "Prag de lichidare (%)",
  thresholdHint: "În E-Mode, pragul categoriei. Pe Aave V4, collateral factor.",
  removeCollateral: index => `Elimină garanția ${index}`,
  addCollateral: "Adaugă a doua garanție",
  debtLegend: "Datorie",
  debtKindLegend: "Ce ai împrumutat?",
  debtKinds: { stable: "Un stablecoin (socotit la $1.00)", volatile: "Un activ volatil, precum WETH" },
  debtAmount: { stable: "Suma împrumutată (USD)", volatile: "Cantitatea împrumutată (tokenuri)" },
  debtAmountHint: "Include dobânda acumulată până acum.",
  debtPrice: "Prețul activului împrumutat (USD)",
  errors: {
    number: "Introdu un număr precum 10 sau 0.25, cu punct pentru zecimale.",
    price: "Introdu un preț mai mare decât 0.",
    threshold: "Introdu un procent mai mare decât 0 și cel mult 100.",
    samePrice: (name, price) =>
      `${name} este deja introdus mai sus la ${price}. Folosește același preț: un activ are un singur preț.`,
  },
  eModeLead: "Niciun rezultat: Aave nu permite această combinație.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("ro", borrowable);
    const loanText = loan.kind === "stable" ? "un împrumut în stablecoin" : `${loan.name} împrumutat`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `E-Mode-ul „${category}” de pe ${market} te lasă să te împrumuți doar în ${borrowableList}, așa că un cont cu ${loanText} ` +
      `nu poate folosi pragul său de ${thresholdPercent}%. Alege în schimb pragul propriu al garanției${own} sau împrumută-te în ${borrowableList}.`
    );
  },
  results: {
    heading: "Rezultat",
    empty: "Introdu un număr în fiecare câmp ca să vezi rezultatul.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Health factor",
    noDebt: "Nu există datorie, deci nu este nimic de lichidat.",
    liquidatableNow: "Sub 1.00: poziția poate fi lichidată acum.",
    liquidatableBelow: "Poziția poate fi lichidată sub 1.00.",
    none: "Niciunul",
    priceTitle: name => `Prețul de lichidare pentru ${name}`,
    priceTitleBorrowed: name => `Prețul de lichidare pentru ${name} (împrumutat)`,
    priceTitleShared: name => `Prețul de lichidare pentru ${name} (depus și împrumutat)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Health factor-ul revine la 1.00 dacă ${name}${alike ? " (depus și împrumutat deopotrivă)" : ""} ${
        rises ? "crește" : "scade"
      } cu ${change} față de ${now}, cu celelalte prețuri neschimbate.`,
    collateralFall: ({ change, now }) => `Cu ${change} sub ${now}, dacă toate celelalte prețuri rămân la fel.`,
    collateralNone: name =>
      `Chiar și la $0, ${name} singur nu poate duce health factor-ul sub 1.00: restul garanției acoperă datoria.`,
    debtRise: ({ change, now }) =>
      `Cu ${change} peste ${now}: activele împrumutate trag health factor-ul în jos când prețul lor crește.`,
    sharedRise: ({ name, change, now }) =>
      `Cu ${change} peste ${now}: ai împrumutat mai mult ${name} decât valorează garanția ta în ${name}, așa că o creștere trage health factor-ul în jos. Celelalte prețuri neschimbate.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `Cu ${change} sub ${now}, cu ${name} împrumutat la același preț și toate celelalte prețuri neschimbate.`,
    sharedFallRows: ({ name, change, now }) =>
      `Cu ${change} sub ${now} pentru fiecare rând cu ${name}, dacă toate celelalte prețuri rămân la fel.`,
    bothSidesNeutral: name =>
      `${name} este și garanția, și datoria ta, așa că cele două se mișcă împreună și prețul său nu schimbă health factor-ul. Dobânda, o schimbare de prag sau propriile tale tranzacții îl schimbă totuși.`,
    bothSidesRecover: name =>
      `${name} este de ambele părți, așa că cele două se mișcă împreună: niciun preț al ${name} nu readuce singur health factor-ul la 1.00.`,
    bothSidesSafe: name =>
      `${name} este de ambele părți, așa că cele două se mișcă împreună: doar prețul său nu poate duce health factor-ul sub 1.00.`,
    uniformTitle: "Toată garanția scade deodată",
    uniformDescription: prices =>
      `Dacă prețul fiecărei garanții scade atât de mult și prețul datoriei nu se mișcă, health factor-ul ajunge la 1.00: ${joinList(
        "ro",
        prices.map(({ name, price }) => `${name} la ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Raportul de preț ${numerator} ÷ ${denominator} la lichidare`,
    ratioDescription: (now, change, falls) =>
      `Acum ${now}. Dacă ambele prețuri se mișcă, ${falls ? "o scădere" : "o creștere"} cu ${change} a acestui raport duce health factor-ul la 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Garanție ${collateral}, socotită la pragurile de lichidare: ${weighted}. Health factor = ${weighted} ÷ ${debt} datorie = ${healthFactor}.`,
  },
  noscript:
    "Calculatorul are nevoie de JavaScript ca să recalculeze. Rezultatul de mai sus este pentru 10 WETH la $2 400 (prag de lichidare 83%) față de o datorie de 12 000 USDC; exemplele rezolvate de pe această pagină folosesc aceeași formulă.",
  disclaimer: {
    lead: "Estimare educațională, nu sfat financiar.",
    beforeDate:
      "Folosește doar numerele pe care le introduci. Parametrii live ai Aave se pot schimba: pragurile de mai sus au fost citite on-chain pe",
    afterDate:
      ", iar guvernanța sau Risk Stewards le pot schimba oricând. Prețurile oracolului se mișcă, dobânda continuă să-ți crească datoria și fiecare preț de lichidare presupune că toate celelalte prețuri rămân la fel. Verifică-ți poziția în aplicația Aave înainte să acționezi.",
  },
};
