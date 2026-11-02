import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Calculadora de preço de liquidação do Aave",
  intro:
    "Informe cada ativo dado em garantia e a sua dívida para ver o fator de saúde e os preços em que a posição pode ser liquidada. A calculadora usa a fórmula do Aave V3: Σ(valor da garantia × limite de liquidação) ÷ valor da dívida.",
  examplesLabel: "Carregar um exemplo calculado:",
  examples: {
    "one-collateral": "10 WETH, dívida de 12 000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, dívida de 20 000 USDC",
    "volatile-debt": "10 000 USDC, 2.5 WETH emprestados",
  },
  defaultCollateralName: index => `Garantia ${index}`,
  defaultDebtName: "Ativo emprestado",
  collateralLegend: index => `Garantia ${index}`,
  presetLabel: "Ativo do Aave V3 (preenche o limite)",
  eModeHint: (collateral, borrowable) =>
    `Este limite vale para ${joinList("pt", collateral)}; as outras garantias mantêm o próprio limite. Neste E-Mode, você só pode pegar emprestado ${joinList("pt", borrowable)}.`,
  otherAsset: "Outro ativo: informe o limite você mesmo",
  presetGroup: (market, date) => `${market} (lido em ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (por exemplo WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativo)",
  },
  nameLabel: "Nome do ativo",
  namePlaceholder: symbols => `por exemplo ${joinList("pt", symbols, "disjunction")}`,
  amountSupplied: "Quantidade depositada",
  price: "Preço (USD)",
  priceHint: "O preço do oráculo do Aave, mostrado na página do ativo no app do Aave.",
  threshold: "Limite de liquidação (%)",
  thresholdHint: "No E-Mode, o limite da categoria. No Aave V4, o collateral factor.",
  removeCollateral: index => `Remover a garantia ${index}`,
  addCollateral: "Adicionar uma segunda garantia",
  debtLegend: "Dívida",
  debtKindLegend: "O que você pegou emprestado?",
  debtKinds: { stable: "Uma stablecoin (contada a $1.00)", volatile: "Um ativo volátil, como WETH" },
  debtAmount: { stable: "Valor emprestado (USD)", volatile: "Quantidade emprestada (tokens)" },
  debtAmountHint: "Inclua os juros acumulados até agora.",
  debtPrice: "Preço do ativo emprestado (USD)",
  errors: {
    number: "Digite um número como 10 ou 0.25, com ponto para as casas decimais.",
    price: "Digite um preço acima de 0.",
    threshold: "Digite uma porcentagem acima de 0 e de no máximo 100.",
    samePrice: (name, price) =>
      `${name} já foi informado acima a ${price}. Use o mesmo preço: um ativo tem um só preço.`,
  },
  eModeLead: "Sem resultado: o Aave não permite essa combinação.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("pt", borrowable);
    const loanText = loan.kind === "stable" ? "um empréstimo em stablecoin" : `${loan.name} emprestado`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `O E-Mode “${category}” de ${market} só permite pegar emprestado ${borrowableList}, então uma conta com ${loanText} ` +
      `não pode usar o limite de ${thresholdPercent}% dele. Escolha o limite próprio da garantia${own} ou pegue emprestado ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultado",
    empty: "Digite um número em cada campo para ver o resultado.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Fator de saúde",
    noDebt: "Sem dívida, então não há nada a liquidar.",
    liquidatableNow: "Abaixo de 1.00: a posição já pode ser liquidada.",
    liquidatableBelow: "A posição pode ser liquidada abaixo de 1.00.",
    none: "Nenhum",
    priceTitle: name => `Preço de liquidação de ${name}`,
    priceTitleBorrowed: name => `Preço de liquidação de ${name} (emprestado)`,
    priceTitleShared: name => `Preço de liquidação de ${name} (depositado e emprestado)`,
    recover: ({ name, change, now, rises, alike }) =>
      `O fator de saúde volta a 1.00 se ${name}${alike ? " (depositado e emprestado)" : ""} ${
        rises ? "subir" : "cair"
      } ${change} a partir de ${now}, com os outros preços inalterados.`,
    collateralFall: ({ change, now }) => `${change} abaixo de ${now}, se todos os outros preços ficarem iguais.`,
    collateralNone: name =>
      `Mesmo a $0, ${name} sozinho não consegue levar o fator de saúde abaixo de 1.00: as outras garantias cobrem a dívida.`,
    debtRise: ({ change, now }) =>
      `${change} acima de ${now}: os ativos emprestados derrubam o fator de saúde quando sobem.`,
    sharedRise: ({ name, change, now }) =>
      `${change} acima de ${now}: você pegou emprestado mais ${name} do que a sua garantia em ${name} conta, então uma alta derruba o fator de saúde. Outros preços inalterados.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} abaixo de ${now}, com o ${name} emprestado no mesmo preço e todos os outros preços inalterados.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} abaixo de ${now} para cada linha de ${name}, se todos os outros preços ficarem iguais.`,
    bothSidesNeutral: name =>
      `${name} é ao mesmo tempo a sua garantia e a sua dívida, então os dois se movem juntos e o preço dele não muda o fator de saúde. Juros, uma mudança de limite ou as suas próprias transações ainda mudam.`,
    bothSidesRecover: name =>
      `${name} está dos dois lados, então os dois se movem juntos: nenhum preço de ${name} sozinho traz o fator de saúde de volta a 1.00.`,
    bothSidesSafe: name =>
      `${name} está dos dois lados, então os dois se movem juntos: o preço dele sozinho não consegue levar o fator de saúde abaixo de 1.00.`,
    uniformTitle: "Todas as garantias caem juntas",
    uniformDescription: prices =>
      `Se o preço de cada garantia cair isso e o preço da dívida não mudar, o fator de saúde chega a 1.00: ${joinList(
        "pt",
        prices.map(({ name, price }) => `${name} a ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Preço ${numerator} ÷ ${denominator} na liquidação`,
    ratioDescription: (now, change, falls) =>
      `Agora ${now}. Se os dois preços se moverem, ${falls ? "uma queda" : "uma alta"} de ${change} nessa relação leva o fator de saúde a 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Garantia ${collateral}, contada pelos limites de liquidação: ${weighted}. Fator de saúde = ${weighted} ÷ ${debt} de dívida = ${healthFactor}.`,
  },
  noscript:
    "A calculadora precisa de JavaScript para recalcular. O resultado acima é para 10 WETH a $2 400 (limite de liquidação 83%) contra uma dívida de 12 000 USDC; os exemplos calculados desta página usam a mesma fórmula.",
  disclaimer: {
    lead: "Estimativa educativa, não é recomendação financeira.",
    beforeDate:
      "Ela usa só os números que você informa. Os parâmetros do Aave podem mudar: os limites acima foram lidos na blockchain em",
    afterDate:
      ", e a governança ou os Risk Stewards podem mudá-los a qualquer momento. Os preços dos oráculos se movem, os juros continuam aumentando a sua dívida, e cada preço de liquidação supõe que todos os outros preços ficam iguais. Confira a sua posição no app do Aave antes de agir.",
  },
};
