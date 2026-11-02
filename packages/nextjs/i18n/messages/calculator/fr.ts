import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Calculateur de prix de liquidation Aave",
  intro:
    "Saisissez chaque actif en collatéral et votre dette pour obtenir le facteur de santé et les prix auxquels la position peut être liquidée. Le calculateur utilise la formule d'Aave V3 : Σ(valeur du collatéral × seuil de liquidation) ÷ valeur de la dette.",
  examplesLabel: "Charger un exemple chiffré :",
  examples: {
    "one-collateral": "10 WETH, 12 000 USDC de dette",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20 000 USDC de dette",
    "volatile-debt": "10 000 USDC, 2.5 WETH empruntés",
  },
  defaultCollateralName: index => `Collatéral ${index}`,
  defaultDebtName: "Actif emprunté",
  collateralLegend: index => `Collatéral ${index}`,
  presetLabel: "Actif Aave V3 (remplit le seuil)",
  eModeHint: (collateral, borrowable) =>
    `Ce seuil s'applique à ${joinList("fr", collateral)} ; les autres collatéraux gardent le leur. Dans cet E-Mode, vous pouvez emprunter uniquement ${joinList("fr", borrowable)}.`,
  otherAsset: "Autre actif : saisissez le seuil vous-même",
  presetGroup: (market, date) => `${market} (relevé le ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode « ETH correlated » (par ex. WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (natif)",
  },
  nameLabel: "Nom de l'actif",
  namePlaceholder: symbols => `par ex. ${joinList("fr", symbols, "disjunction")}`,
  amountSupplied: "Montant déposé",
  price: "Prix (USD)",
  priceHint: "Le prix de l'oracle d'Aave, affiché sur la page de l'actif dans l'app Aave.",
  threshold: "Seuil de liquidation (%)",
  thresholdHint: "En E-Mode, le seuil de la catégorie. Sur Aave V4, le collateral factor.",
  removeCollateral: index => `Retirer le collatéral ${index}`,
  addCollateral: "Ajouter un second collatéral",
  debtLegend: "Dette",
  debtKindLegend: "Qu'avez-vous emprunté ?",
  debtKinds: { stable: "Un stablecoin (compté à $1.00)", volatile: "Un actif volatil, comme WETH" },
  debtAmount: { stable: "Montant emprunté (USD)", volatile: "Quantité empruntée (tokens)" },
  debtAmountHint: "Incluez les intérêts accumulés jusqu'ici.",
  debtPrice: "Prix de l'actif emprunté (USD)",
  errors: {
    number: "Saisissez un nombre comme 10 ou 0.25, avec un point pour les décimales.",
    price: "Saisissez un prix supérieur à 0.",
    threshold: "Saisissez un pourcentage supérieur à 0 et au plus égal à 100.",
    samePrice: (name, price) =>
      `${name} est déjà saisi plus haut à ${price}. Utilisez le même prix : un actif n'a qu'un seul prix.`,
  },
  eModeLead: "Aucun résultat : Aave n'autorise pas cette combinaison.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("fr", borrowable);
    const loanText = loan.kind === "stable" ? "un prêt en stablecoin" : `du ${loan.name} emprunté`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `L'E-Mode « ${category} » de ${market} permet uniquement d'emprunter ${borrowableList} : un compte avec ${loanText} ` +
      `ne peut donc pas utiliser son seuil de ${thresholdPercent}%. Choisissez plutôt le seuil propre du collatéral${own}, ou empruntez ${borrowableList}.`
    );
  },
  results: {
    heading: "Résultat",
    empty: "Saisissez un nombre dans chaque champ pour voir le résultat.",
    summaryLine: (title, value) => `${title} : ${value}.`,
    healthFactor: "Facteur de santé",
    noDebt: "Aucune dette, donc rien à liquider.",
    liquidatableNow: "Sous 1.00 : la position peut être liquidée dès maintenant.",
    liquidatableBelow: "La position peut être liquidée sous 1.00.",
    none: "Aucun",
    priceTitle: name => `Prix de liquidation de ${name}`,
    priceTitleBorrowed: name => `Prix de liquidation de ${name} (emprunté)`,
    priceTitleShared: name => `Prix de liquidation de ${name} (déposé et emprunté)`,
    recover: ({ name, change, now, rises, alike }) =>
      `Le facteur de santé revient à 1.00 si ${name}${alike ? " (déposé et emprunté)" : ""} ${
        rises ? "monte" : "baisse"
      } de ${change} depuis ${now}, les autres prix restant inchangés.`,
    collateralFall: ({ change, now }) => `${change} sous ${now}, si tous les autres prix restent inchangés.`,
    collateralNone: name =>
      `Même à $0, ${name} seul ne peut pas faire passer le facteur de santé sous 1.00 : les autres collatéraux couvrent la dette.`,
    debtRise: ({ change, now }) =>
      `${change} au-dessus de ${now} : les actifs empruntés font baisser le facteur de santé quand leur prix monte.`,
    sharedRise: ({ name, change, now }) =>
      `${change} au-dessus de ${now} : vous avez emprunté plus de ${name} que ce que compte votre collatéral en ${name}, donc une hausse fait baisser le facteur de santé. Autres prix inchangés.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} sous ${now}, avec le ${name} emprunté au même prix et tous les autres prix inchangés.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} sous ${now} pour chaque ligne en ${name}, si tous les autres prix restent inchangés.`,
    bothSidesNeutral: name =>
      `${name} est à la fois votre collatéral et votre dette : les deux évoluent ensemble et son prix ne change pas le facteur de santé. Les intérêts, un changement de seuil ou vos propres transactions le changent quand même.`,
    bothSidesRecover: name =>
      `${name} est des deux côtés, donc les deux évoluent ensemble : aucun prix de ${name} à lui seul ne ramène le facteur de santé à 1.00.`,
    bothSidesSafe: name =>
      `${name} est des deux côtés, donc les deux évoluent ensemble : son prix à lui seul ne peut pas faire passer le facteur de santé sous 1.00.`,
    uniformTitle: "Tout le collatéral baisse ensemble",
    uniformDescription: prices =>
      `Si le prix de chaque collatéral baisse d'autant et que le prix de la dette ne bouge pas, le facteur de santé atteint 1.00 : ${joinList(
        "fr",
        prices.map(({ name, price }) => `${name} à ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Ratio de prix ${numerator} ÷ ${denominator} à la liquidation`,
    ratioDescription: (now, change, falls) =>
      `Actuellement ${now}. Si les deux prix bougent, ${falls ? "une baisse" : "une hausse"} de ${change} de ce ratio amène le facteur de santé à 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Collatéral ${collateral}, compté à ses seuils de liquidation : ${weighted}. Facteur de santé = ${weighted} ÷ ${debt} de dette = ${healthFactor}.`,
  },
  noscript:
    "Le calculateur a besoin de JavaScript pour recalculer. Le résultat ci-dessus correspond à 10 WETH à $2 400 (seuil de liquidation 83%) face à 12 000 USDC de dette ; les exemples chiffrés de cette page utilisent la même formule.",
  disclaimer: {
    lead: "Estimation à but éducatif, pas un conseil financier.",
    beforeDate:
      "Elle utilise uniquement les chiffres que vous saisissez. Les paramètres d'Aave en vigueur peuvent changer : les seuils ci-dessus ont été lus onchain le",
    afterDate:
      ", et la gouvernance ou les Risk Stewards peuvent les modifier à tout moment. Les prix des oracles bougent, les intérêts s'ajoutent sans cesse à votre dette, et chaque prix de liquidation suppose que tous les autres prix restent inchangés. Vérifiez votre position dans l'app Aave avant d'agir.",
  },
};
