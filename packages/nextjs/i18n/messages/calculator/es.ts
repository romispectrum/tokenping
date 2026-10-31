import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Calculadora del precio de liquidación en Aave",
  intro:
    "Indica cada activo de tu colateral y tu deuda para obtener el factor de salud y los precios a los que la posición puede ser liquidada. La calculadora usa la fórmula de Aave V3: Σ(valor del colateral × umbral de liquidación) ÷ valor de la deuda.",
  examplesLabel: "Cargar un ejemplo resuelto:",
  examples: {
    "one-collateral": "10 WETH, deuda de 12,000 USDC",
    "two-collaterals": "10 WETH + 0.2 WBTC, deuda de 20,000 USDC",
    "volatile-debt": "10,000 USDC, deuda de 2.5 WETH",
  },
  defaultCollateralName: index => `Colateral ${index}`,
  defaultDebtName: "Activo de la deuda",
  collateralLegend: index => `Colateral ${index}`,
  presetLabel: "Activo de Aave V3 (el umbral se completa solo)",
  eModeHint: (collateral, borrowable) =>
    `Este umbral cuenta para ${joinList("es", collateral)}; el resto del colateral conserva el suyo. En este E-Mode solo puedes pedir prestado ${joinList("es", borrowable)}.`,
  otherAsset: "Otro activo: indica tú el umbral",
  presetGroup: (market, date) => `${market} (datos del ${date})`,
  presetLabels: {
    "ethereum-core-emode-eth": "E-Mode “ETH correlated” (p. ej., WETH, wstETH, weETH)",
    "arbitrum-usdc": "USDC (nativo)",
  },
  nameLabel: "Nombre del activo",
  namePlaceholder: symbols => `p. ej., ${joinList("es", symbols, "disjunction")}`,
  amountSupplied: "Cantidad depositada",
  price: "Precio (USD)",
  priceHint: "El precio del oráculo de Aave, que aparece en la página del activo en la aplicación de Aave.",
  threshold: "Umbral de liquidación (%)",
  thresholdHint: "En E-Mode, el umbral de la categoría. En Aave V4, el factor de colateral (collateral factor).",
  removeCollateral: index => `Quitar el colateral ${index}`,
  addCollateral: "Agregar un segundo colateral",
  debtLegend: "Deuda",
  debtKindLegend: "¿Qué pediste prestado?",
  debtKinds: { stable: "Una stablecoin (se cuenta a $1.00)", volatile: "Un activo volátil, como WETH" },
  debtAmount: { stable: "Monto de la deuda (USD)", volatile: "Cantidad de la deuda (tokens)" },
  debtAmountHint: "Incluye los intereses acumulados hasta ahora.",
  debtPrice: "Precio del activo de la deuda (USD)",
  errors: {
    number: "Escribe un número como 10 o 0.25, con punto para los decimales.",
    price: "Escribe un precio mayor que 0.",
    threshold: "Escribe un porcentaje mayor que 0 y de 100 como máximo.",
    samePrice: (name, price) =>
      `Ya indicaste ${name} arriba a ${price}. Usa el mismo precio: un activo tiene un solo precio.`,
  },
  eModeLead: "Sin resultado: Aave no permite esta combinación.",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("es", borrowable);
    const loanText = loan.kind === "stable" ? "un préstamo en stablecoin" : `deuda en ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `El E-Mode “${category}” de ${market} solo permite pedir prestado ${borrowableList}, así que una cuenta con ${loanText} ` +
      `no puede usar el umbral del ${thresholdPercent}% de ese E-Mode. Elige en su lugar el umbral propio del colateral${own}, o pide prestado ${borrowableList}.`
    );
  },
  results: {
    heading: "Resultado",
    empty: "Escribe un número en cada campo para ver el resultado.",
    summaryLine: (title, value) => `${title}: ${value}.`,
    healthFactor: "Factor de salud",
    noDebt: "Sin deuda, así que no hay nada que liquidar.",
    liquidatableNow: "Por debajo de 1.00: la posición se puede liquidar ahora.",
    liquidatableBelow: "La posición se puede liquidar por debajo de 1.00.",
    none: "Ninguno",
    priceTitle: name => `Precio de liquidación de ${name}`,
    priceTitleBorrowed: name => `Precio de liquidación de ${name} (deuda)`,
    priceTitleShared: name => `Precio de liquidación de ${name} (depositado y en deuda)`,
    recover: ({ name, change, now, rises, alike }) =>
      `El factor de salud vuelve a 1.00 si ${name}${alike ? " (el depositado y el de la deuda)" : ""} ${
        rises ? "sube" : "baja"
      } ${change} desde ${now}, con los demás precios sin cambios.`,
    collateralFall: ({ change, now }) =>
      `${change} por debajo de ${now}, si todos los demás precios se mantienen iguales.`,
    collateralNone: name =>
      `Incluso a $0, ${name} por sí solo no puede llevar el factor de salud por debajo de 1.00: el resto del colateral cubre la deuda.`,
    debtRise: ({ change, now }) =>
      `${change} por encima de ${now}: los activos de la deuda bajan el factor de salud cuando su precio sube.`,
    sharedRise: ({ name, change, now }) =>
      `${change} por encima de ${now}: pediste prestado más ${name} de lo que cuenta tu colateral en ${name}, así que una subida baja el factor de salud. Los demás precios, sin cambios.`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${change} por debajo de ${now}, con el ${name} de la deuda al mismo precio y todos los demás precios sin cambios.`,
    sharedFallRows: ({ name, change, now }) =>
      `${change} por debajo de ${now} en cada fila de ${name}, si todos los demás precios se mantienen iguales.`,
    bothSidesNeutral: name =>
      `${name} es a la vez tu colateral y tu deuda, así que ambos se mueven juntos y su precio no cambia el factor de salud. Los intereses, un cambio de umbral o tus propias transacciones sí lo cambian.`,
    bothSidesRecover: name =>
      `${name} está en ambos lados, así que ambos se mueven juntos: ningún precio de ${name} por sí solo devuelve el factor de salud a 1.00.`,
    bothSidesSafe: name =>
      `${name} está en ambos lados, así que ambos se mueven juntos: su precio por sí solo no puede llevar el factor de salud por debajo de 1.00.`,
    uniformTitle: "Todo el colateral baja a la vez",
    uniformDescription: prices =>
      `Si el precio de cada colateral baja este porcentaje y el precio de la deuda no se mueve, el factor de salud llega a 1.00: ${joinList(
        "es",
        prices.map(({ name, price }) => `${name} a ${price}`),
      )}.`,
    ratioTitle: (numerator, denominator) => `Relación de precios ${numerator} ÷ ${denominator} en la liquidación`,
    ratioDescription: (now, change, falls) =>
      `Ahora ${now}. Si ambos precios se mueven, ${falls ? "una baja" : "una subida"} de ${change} en esta relación lleva el factor de salud a 1.00.`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `Colateral ${collateral}, contado según sus umbrales de liquidación: ${weighted}. Factor de salud = ${weighted} ÷ ${debt} de deuda = ${healthFactor}.`,
  },
  noscript:
    "La calculadora necesita JavaScript para recalcular. El resultado de arriba corresponde a 10 WETH a $2,400 (umbral de liquidación del 83%) frente a una deuda de 12,000 USDC; los ejemplos resueltos de esta página usan la misma fórmula.",
  disclaimer: {
    lead: "Estimación educativa, no asesoramiento financiero.",
    beforeDate:
      "Se basa solo en los números que indicas. Los parámetros vigentes de Aave pueden cambiar: los umbrales de arriba se leyeron de la blockchain el",
    afterDate:
      ", y la gobernanza o los Risk Stewards pueden cambiarlos en cualquier momento. Los precios del oráculo se mueven, los intereses siguen sumándose a tu deuda y cada precio de liquidación supone que todos los demás precios se mantienen iguales. Revisa tu posición en la aplicación de Aave antes de actuar.",
  },
};
