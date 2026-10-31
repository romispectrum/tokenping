import type { NotificationMessages } from "./shared";
import { esMarketNoun, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Tu factor de salud de Aave en ${esMarketNoun(chainName)} ${chainName} es ${healthFactor}, ` +
    `por debajo de tu umbral de ${threshold}. ` +
    `Considera agregar colateral o pagar deuda para evitar la liquidación.\n\nEnviado: ${timestamp}`,
  alertSubject: chainName => `Alerta del factor de salud de Aave - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Tu factor de salud de Aave en ${esMarketNoun(chainName)} <strong>${chainName}</strong> es ` +
    `<strong>${healthFactor}</strong>, por debajo de tu umbral de ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Considera agregar colateral o pagar deuda para evitar la liquidación.</p>` +
    `<p><small>Creado: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "crítico", risky: "en riesgo", safe: "seguro" };
    const now =
      position.kind === "debt"
        ? `Ahora mismo: factor de salud ${position.healthFactor} (${statusWord[position.status]}), colateral ${position.collateral}, deuda ${position.debt}.`
        : position.kind === "noDebt"
          ? `Ahora mismo: sin deuda, así que no se puede liquidar nada${position.collateral ? ` (colateral ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Ahora mismo: no tienes ninguna posición abierta en este mercado."
            : "Ahora mismo: no se pudo leer tu posición. Las alertas reales lo vuelven a intentar en cada revisión.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Eso está por debajo de tu umbral, así que la próxima revisión enviará una alerta real."
          : "Eso está por encima de tu umbral, así que ahora no se enviaría ninguna alerta."
        : null;
    const every = plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });
    return [
      "Mensaje de prueba de Tokenping: las alertas por este canal funcionan.",
      `Tu alerta: ${chainName}, cuando el factor de salud caiga por debajo de ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Revisión ${every}. Enviado: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Mensaje de prueba de Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} a tasa fija, vence el ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Tu factor de salud de Morpho en la red ${chainName} es ${healthFactor}, por debajo de tu umbral de ${threshold}.`,
    `Mercado: ${market}.`,
    ...(preLiquidation
      ? [
          "Activaste la preliquidación en este mercado, así que el factor de salud se mide respecto a su línea, que se alcanza antes: por debajo de 1, se puede vender parte de tu posición.",
        ]
      : []),
    "Considera agregar colateral o pagar deuda para evitar la liquidación.",
    `Enviado: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Alerta del factor de salud de Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Tu préstamo a tasa fija de Morpho en la red ${chainName} venció el ${when} y aún tiene ${debt} de deuda.`,
          `Mercado: ${market}.`,
          "Ahora se puede liquidar en cualquier momento, sea cual sea su factor de salud. Devuelve el préstamo para evitar la liquidación.",
          `Enviado: ${timestamp}`,
        ]
      : [
          `Tu préstamo a tasa fija de Morpho en la red ${chainName} vence en menos de ${stage === "7d" ? "7 días" : "24 horas"}, el ${when}.`,
          `Mercado: ${market}.`,
          `Deuda: ${debt}.`,
          "Después del vencimiento, cualquier deuda que quede sin pagar se puede liquidar, así que págala antes.",
          `Enviado: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Tu préstamo de Morpho ya venció - ${chainName}`
      : `Tu préstamo de Morpho vence en menos de ${stage === "7d" ? "7 días" : "24 horas"} - ${chainName}`,
};
