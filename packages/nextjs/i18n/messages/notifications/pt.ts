import type { NotificationMessages } from "./shared";
import { plural, ptOnMarket } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `O seu fator de saúde no Aave ${ptOnMarket(chainName)} está em ${healthFactor}, ` +
    `abaixo do seu limite de ${threshold}. ` +
    `Considere adicionar garantia ou pagar parte da dívida para evitar a liquidação.\n\nEnviado em: ${timestamp}`,
  alertSubject: chainName => `Alerta de fator de saúde do Aave - ${chainName}`,
  // The html footer says "Criado em" where the text says "Enviado em", as the English does.
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>O seu fator de saúde no Aave ${ptOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} está em ` +
    `<strong>${healthFactor}</strong>, abaixo do seu limite de ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Considere adicionar garantia ou pagar parte da dívida para evitar a liquidação.</p>` +
    `<p><small>Criado em: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "crítico", risky: "arriscado", safe: "seguro" };
    const now =
      position.kind === "debt"
        ? `Agora: fator de saúde ${position.healthFactor} (${statusWord[position.status]}), garantia ${position.collateral}, dívida ${position.debt}.`
        : position.kind === "noDebt"
          ? `Agora: sem dívida, então nada pode ser liquidado${position.collateral ? ` (garantia ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Agora: nenhuma posição aberta neste mercado."
            : "Agora: não foi possível ler a sua posição. Os alertas de verdade tentam de novo a cada verificação.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Isso está abaixo do seu limite, então a próxima verificação envia um alerta de verdade."
          : "Isso está acima do seu limite, então nenhum alerta seria enviado agora."
        : null;
    const every = plural("pt", minutes, { one: "a cada minuto", other: `a cada ${minutes} minutos` });
    return [
      "Mensagem de teste do Tokenping: os alertas neste canal funcionam.",
      `Seu alerta: ${chainName}, quando o fator de saúde cair abaixo de ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Verificado ${every}. Enviado em: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Mensagem de teste do Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (LLTV ${market.lltv})`
      : `${market.loan} com taxa fixa, vence em ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `O seu fator de saúde no Morpho ${ptOnMarket(chainName, "network")} está em ${healthFactor}, abaixo do seu limite de ${threshold}.`,
    `Mercado: ${market}.`,
    ...(preLiquidation
      ? [
          "Você ativou a pré-liquidação (pre-liquidation) neste mercado, então o fator de saúde é medido em relação a uma linha anterior: abaixo de 1, parte da sua posição pode ser vendida.",
        ]
      : []),
    "Considere adicionar garantia ou pagar parte da dívida para evitar a liquidação.",
    `Enviado em: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Alerta de fator de saúde do Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `O seu empréstimo com taxa fixa no Morpho ${ptOnMarket(chainName, "network")} venceu em ${when} e ainda tem ${debt} de dívida.`,
          `Mercado: ${market}.`,
          "Agora ele pode ser liquidado a qualquer momento, seja qual for o fator de saúde. Pague a dívida para evitar a liquidação.",
          `Enviado em: ${timestamp}`,
        ]
      : [
          `O seu empréstimo com taxa fixa no Morpho ${ptOnMarket(chainName, "network")} vence em até ${stage === "7d" ? "7 dias" : "24 horas"}, em ${when}.`,
          `Mercado: ${market}.`,
          `Dívida: ${debt}.`,
          "Depois do vencimento, qualquer dívida não paga pode ser liquidada, então pague antes disso.",
          `Enviado em: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Empréstimo no Morpho vencido - ${chainName}`
      : `Empréstimo no Morpho vence em até ${stage === "7d" ? "7 dias" : "24 horas"} - ${chainName}`,
};
