import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

// The calculator reads and shows numbers the app's way (a decimal point, "$2,400.00"), so the examples and hints
// keep the decimal point and group thousands with a space, which reads the same either way.
export const MESSAGES: CalculatorMessages = {
  title: "Calcolatore del prezzo di liquidazione Aave",
  intro:
    "Inserisci ogni asset del collaterale e il tuo debito per ottenere il fattore di salute e i prezzi a cui la posizione può essere liquidata. Usa la formula di Aave V3: Σ(valore del collaterale × soglia di liquidazione) ÷ valore del debito.",
  examplesLabel: "Carica un esempio svolto:",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC di debito",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC di debito",
    "volatile-debt": "10 000 USDC, 2.5 WETH presi in prestito",
  },
  defaultCollateralName: index => `Collaterale ${index}`,
  defaultDebtName: "Asset preso in prestito",
  collateralLegend: index => `Collaterale ${index}`,
  presetLabel: "Asset di Aave V3 (compila la soglia)",
  eModeHint: (collateral, borrowable) =>
    `Questa soglia vale per ${joinList("it", collateral)}; gli altri collaterali mantengono la propria. In questo E-Mode puoi prendere in prestito solo ${joinList("it", borrowable)}.`,
  otherAsset: "Altro asset: inserisci tu la soglia",
  presetGroup: (market, date) => `${market} (letto il ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode «ETH correlated» (ad es. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativo)",
  },
  nameLabel: "Nome dell'asset",
  namePlaceholder: symbols => `ad es. ${joinList("it", symbols, "disjunction")}`,
  amountSupplied: "Importo depositato",
  price: "Prezzo (USD)",
  priceHint: "Il prezzo dell'oracolo di Aave, indicato nella pagina dell'asset nell'app Aave.",
  threshold: "Soglia di liquidazione (%)",
  thresholdHint: "In E-Mode, la soglia della categoria. Su Aave V4, il collateral factor.",
  removeCollateral: index => `Rimuovi il collaterale ${index}`,
  addCollateral: "Aggiungi un secondo collaterale",
  debtLegend: "Debito",
  debtKindLegend: "Cosa hai preso in prestito?",
  debtKinds: { stable: "Una stablecoin (contata a $1.00)", volatile: "Un asset volatile, come WETH" },
  debtAmount: { stable: "Importo preso in prestito (USD)", volatile: "Quantità presa in prestito (token)" },
  debtAmountHint: "Includi gli interessi maturati finora.",
  debtPrice: "Prezzo dell'asset preso in prestito (USD)",
  errors: {
    number: "Inserisci un numero come 10 o 0.25, con il punto per i decimali.",
    price: "Inserisci un prezzo maggiore di 0.",
    threshold: "Inserisci una percentuale maggiore di 0 e non superiore a 100.",
    samePrice: (name, price) =>
      `${name} è già inserito più sopra a ${price}. Usa lo stesso prezzo: un asset ha un solo prezzo.`,
  },
  eModeLead: "Nessun risultato: Aave non consente questa combinazione.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("it", borrowable);
    const loanText = loan.kind === "stable" ? "un prestito in stablecoin" : `${loan.name} preso in prestito`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `L'E-Mode «${category}» di ${market} consente di prendere in prestito solo ${borrowableList}, quindi un account con ${loanText} ` +
      `non può usare la sua soglia del ${thresholdPercent}%. Scegli invece la soglia propria del collaterale${own}, oppure prendi in prestito ${borrowableList}.`
    );
  },
  results: {
    heading: "Risultato",
    empty: "Inserisci un numero in ogni campo per vedere il risultato.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Fattore di salute",
    noDebt: "Nessun debito, quindi non c'è nulla da liquidare.",
    liquidatableNow: "Sotto 1.00: la posizione può essere liquidata già adesso.",
    liquidatableBelow: "La posizione può essere liquidata sotto 1.00.",
    none: "Nessuno",
    priceTitle: name => `Prezzo di liquidazione di ${name}`,
    priceTitleBorrowed: name => `Prezzo di liquidazione di ${name} (preso in prestito)`,
    priceTitleShared: name => `Prezzo di liquidazione di ${name} (depositato e preso in prestito)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Il fattore di salute torna a 1.00 se ${name}${alike ? " (depositato e preso in prestito)" : ""} ${
        rises ? "sale" : "scende"
      } del ${change} da ${now}, con gli altri prezzi invariati.`,
    collateralFall: ({ change, now }) => `${change} sotto ${now}, se tutti gli altri prezzi restano invariati.`,
    collateralNone: name =>
      `Anche a $0, ${name} da solo non può portare il fattore di salute sotto 1.00: gli altri collaterali coprono il debito.`,
    debtRise: ({ change, now }) =>
      `${change} sopra ${now}: gli asset presi in prestito spingono giù il fattore di salute quando il loro prezzo sale.`,
    sharedRise: ({ name, change, now }) =>
      `${change} sopra ${now}: hai preso in prestito più ${name} di quanto valga il tuo collaterale in ${name}, quindi un rialzo spinge giù il fattore di salute. Altri prezzi invariati.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} sotto ${now}, con il ${name} preso in prestito allo stesso prezzo e tutti gli altri prezzi invariati.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} sotto ${now} per ogni riga in ${name}, se tutti gli altri prezzi restano invariati.`,
    bothSidesNeutral: name =>
      `${name} è sia il tuo collaterale sia il tuo debito, quindi i due si muovono insieme e il suo prezzo non cambia il fattore di salute. Gli interessi, una modifica della soglia o le tue transazioni lo cambiano comunque.`,
    bothSidesRecover: name =>
      `${name} è su entrambi i lati, quindi i due si muovono insieme: nessun prezzo di ${name} da solo riporta il fattore di salute a 1.00.`,
    bothSidesSafe: name =>
      `${name} è su entrambi i lati, quindi i due si muovono insieme: il suo prezzo da solo non può portare il fattore di salute sotto 1.00.`,
    uniformTitle: "Tutto il collaterale scende insieme",
    uniformDescription: prices =>
      `Se il prezzo di ogni collaterale scende di tanto e il prezzo del debito non si muove, il fattore di salute arriva a 1.00: ${joinList(
        "it",
        prices.map(({ name, price }) => `${name} a ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Rapporto di prezzo ${numerator} ÷ ${denominator} alla liquidazione`,
    ratioDescription: (now, change, falls) =>
      `Adesso ${now}. Se si muovono entrambi i prezzi, ${falls ? "un calo" : "un rialzo"} del ${change} di questo rapporto porta il fattore di salute a 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Collaterale ${collateral}, contato alle sue soglie di liquidazione: ${weighted}. Fattore di salute = ${weighted} ÷ ${debt} di debito = ${healthFactor}.`,
  },
  noscript:
    "Il calcolatore ha bisogno di JavaScript per ricalcolare. Il risultato qui sopra è per 10 WETH a $2 400 (soglia di liquidazione 83%) contro 12 000 USDC di debito; gli esempi svolti di questa pagina usano la stessa formula.",
  disclaimer: {
    lead: "Stima a scopo informativo, non è una consulenza finanziaria.",
    beforeDate:
      "Usa solo i numeri che inserisci. I parametri di Aave in vigore possono cambiare: le soglie qui sopra sono state lette onchain il",
    afterDate:
      ", e la governance o i Risk Stewards possono cambiarle in qualsiasi momento. I prezzi degli oracoli si muovono, gli interessi continuano ad aggiungersi al tuo debito e ogni prezzo di liquidazione presuppone che tutti gli altri prezzi restino invariati. Controlla la tua posizione nell'app Aave prima di agire.",
  },
};
