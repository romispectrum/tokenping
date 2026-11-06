import type { MorphoMessages } from "./shared";
import { plural, ptForMarket, ptOnMarket } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Alertas de fator de saúde para Morpho Blue e Midnight",
    metaDescription: (networkCount, channels) =>
      `Alertas de fator de saúde para empréstimos no Morpho Blue e Midnight por ${channels}, em ${networkCount} redes, com lembrete antes do vencimento.`,
    title: "Posições no Morpho Blue e Midnight e alertas de fator de saúde",
    intro: networks =>
      `Suas posições de empréstimo nos mercados listados no app do Morpho, em ${networks}: empréstimos com taxa variável (Morpho Blue) e com taxa fixa (Morpho Midnight). Os fatores de saúde são lidos direto da blockchain.`,
    checks: (minutes, repeatMinutes) =>
      `Os alertas são verificados ${plural("pt", minutes, { one: "a cada minuto", other: `a cada ${minutes} minutos` })}. Um empréstimo com taxa fixa também recebe um lembrete 7 dias e 1 dia antes do vencimento, e um alerta a cada ${repeatMinutes} minutos depois do vencimento enquanto houver dívida.`,
    access: "Um único pagamento de acesso cobre seus alertas do Aave e do Morpho.",
    notAffiliated: "O Tokenping não tem vínculo com o Morpho.",
    guideHealthFactor: "Como funciona o fator de saúde no Morpho",
    guideLiquidation: "Como funciona a liquidação no Morpho",
    guideMidnight: "Empréstimos com taxa fixa no Morpho Midnight",
    aaveDashboard: "Pega empréstimo no Aave? Abra o painel do Aave",
  },
  positionsHeading: "Suas posições no Morpho",
  gate: {
    title: "Conecte uma carteira para continuar",
    description:
      "O Tokenping precisa do endereço da sua carteira para encontrar suas posições no Morpho. Conectar não movimenta fundos nem cobra taxa.",
    connect: "Conectar carteira",
    connecting: "Conectando",
    approveInWallet: "Aprove a conexão na sua carteira.",
  },
  list: {
    heading: "Mercados",
    count: count => `${count} com dívida`,
    none: "Nenhum empréstimo encontrado nos mercados listados no app do Morpho.",
    discoveryFailed: "A API do Morpho não respondeu, então só aparecem os mercados com um alerta salvo.",
    variableRate: "Taxa variável",
    fixedRate: "Taxa fixa",
    matures: date => `Vence em ${date}`,
    matured: "Vencido",
    unreadable: "Não foi possível ler",
    retry: market => `Tentar ler ${market} de novo`,
    noneSelectedDescription: "Selecione um mercado para ver sua posição no Morpho.",
  },
  details: {
    collateralValue: "Valor da garantia",
    debt: "Dívida",
    ltv: "LTV",
    lltv: "LTV de liquidação",
    maturity: "Vencimento",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("pt", days, { one: `em ${days} dia`, other: `em ${days} dias` })
        : plural("pt", hours, { one: `em ${hours} hora`, other: `em ${hours} horas` }),
    pastMaturity:
      "Este empréstimo passou do vencimento: qualquer dívida restante pode ser liquidada a qualquer momento, seja qual for o fator de saúde. Pague a dívida para evitar a liquidação.",
    preLiquidation: "Pré-liquidação",
    preLiquidationNote:
      "Você ativou a pré-liquidação (pre-liquidation) neste mercado, então o fator de saúde é medido em relação a uma linha anterior: abaixo de 1, parte da sua posição pode ser vendida.",
    amountsIn: token => `Os valores estão em ${token}, avaliados pelo oráculo do mercado.`,
    noDebtTitle: "Nenhuma dívida neste mercado",
    noDebtDetail: "Um alerta salvo continua salvo e não envia nada enquanto não houver dívida.",
    unreadableTitle: "Não foi possível ler esta posição",
    unreadableDetail: "A rede não respondeu. Seu alerta continua sendo verificado.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Pague uma vez para configurar alertas de fator de saúde ${ptOnMarket(marketName, "market")} e em outros mercados. Nada é renovado automaticamente: você paga com a sua carteira quando quiser estender.`,
    descriptionExtend: marketName =>
      `Suas configurações de alerta salvas ${ptForMarket(marketName, "market")} continuam na sua conta. Pague de novo para estender o acesso e editá-las.`,
  },
};
