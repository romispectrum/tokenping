import { type HomeMessages, rich } from "./shared";
import { capitalize, formatDecimal, plural } from "~~/i18n/format";

/** "30 dias", "1 dia". */
const ptDays = (days: number) => plural("pt", days, { one: `${days} dia`, other: `${days} dias` });

/** "a cada 5 minutos", "a cada minuto". */
const ptEveryMinutes = (minutes: number) =>
  plural("pt", minutes, { one: "a cada minuto", other: `a cada ${minutes} minutos` });

/** "29 redes", "1 rede". */
const ptNetworks = (networks: number) =>
  plural("pt", networks, { one: `${networks} rede`, other: `${networks} redes` });

/** "em 29 redes", "em 1 rede". */
const ptOnNetworks = (networks: number) => `em ${ptNetworks(networks)}`;

/** "24 mercados V3", "1 mercado V3". */
const ptV3Markets = (markets: number) =>
  plural("pt", markets, { one: `${markets} mercado V3`, other: `${markets} mercados V3` });

/** "13 Spokes V4", "1 Spoke V4". */
const ptV4Spokes = (spokes: number) =>
  plural("pt", spokes, { one: `${spokes} Spoke V4`, other: `${spokes} Spokes V4` });

/** "na rede Arbitrum One", or the payment network unnamed. */
const ptOnChain = (chainName: string | undefined) => (chainName ? `na rede ${chainName}` : "na rede de pagamento");

export const MESSAGES: HomeMessages = {
  headline: channels => `Alertas de fator de saúde do Aave e do Morpho por ${channels}`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `Alertas por ${channels} quando o seu fator de saúde no Aave ou no Morpho está abaixo do seu limite, ${ptOnNetworks(networks)}, ${ptEveryMinutes(minutes)}.`
      : `Alertas por ${channels} quando o seu fator de saúde no Aave ou no Morpho cai abaixo do seu limite, ${ptOnNetworks(networks)}. Verificado ${ptEveryMinutes(minutes)}.`,
  channelBadge: capitalize,
  pricingCta: plan =>
    plan
      ? `Configurar alertas: ${formatDecimal("pt", plan.priceLabel)} por ${ptDays(plan.days)}`
      : "Configurar alertas",
  offerDescription: ({ days, currency }) =>
    `Alertas de fator de saúde por ${ptDays(days)}, pagos em ${currency} com a sua carteira. Sem renovação automática.`,

  kicker: "Aave V3 e V4, Morpho Blue e Midnight",
  heroLead: ({ minutes, channels }) =>
    `Verificado ${ptEveryMinutes(minutes)}. Uma mensagem por ${channels} enquanto você estiver abaixo do seu limite. Somente leitura, sem aprovações.`,
  networksLabel: "Redes",
  heroCoverage: networks => ptNetworks(networks),
  channelsLabel: "Alertas por:",
  exampleAlertLabel: "O que um alerta diz",
  exampleAlertCaption: subject => `Exemplo. Os e-mails chegam com o assunto "${subject}".`,

  dashboardCta: "Abrir o painel do Aave",
  morphoDashboardCta: "Abrir o painel do Morpho",
  dashboardCtaMicrocopy: alertPrice =>
    `Conecte uma carteira e veja todas as posições. Os alertas custam ${alertPrice}.`,

  problemTitle: "O fator de saúde cai enquanto você dorme",
  problemLead:
    "O Aave mostra o seu fator de saúde, mas não envia alertas (outubro de 2026). Três coisas mexem nele durante a noite:",
  problemCauses: [
    { title: "Os preços caem", body: "O ETH cai e a sua garantia passa a valer menos." },
    { title: "Os juros se acumulam", body: "A sua dívida cresce a cada segundo." },
    { title: "Os limites mudam", body: "No Aave, a governança pode reduzir um limite de liquidação." },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "Tomadores contam que ",
      morning("acordaram com a posição liquidada"),
      ", que passaram ",
      failedRepays("uma hora com transações de pagamento falhando"),
      " e que fizeram ",
      polygon("um pagamento a 1,01 que chegou tarde demais"),
      ".",
    ),
  problemLiquidator: guide =>
    rich(
      "O liquidante ainda fica com um bônus: 5% sobre WETH no mercado Core do Ethereum (outubro de 2026).",
      guide && rich(" Veja ", guide("como funciona uma liquidação"), "."),
    ),
  chart: {
    threshold: "seu limite",
    liquidation: "liquidação",
    alertSent: "Alerta enviado",
    youCheck: "Você olha o celular",
    caption:
      "Uma noite de exemplo. O alerta sai às 03:05, na primeira verificação abaixo de 1,5, cinco horas antes de você olhar.",
  },

  howItWorksTitle: "Como funciona",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? ` na rede ${paymentChain}` : "";
    return [
      {
        title: "Conecte a carteira com que você pega empréstimo",
        body: "Somente leitura. Aave e Morpho, uma página para cada um.",
      },
      {
        title: plan
          ? `Desbloqueie os alertas por ${formatDecimal("pt", plan.priceLabel)}`
          : "Desbloqueie os alertas com um pequeno pagamento em USDC",
        body: `${plan ? `${capitalize(ptDays(plan.days))} de acesso, pagos` : "Pagamento"} em USDC${paidOn}. Sem renovação automática.`,
      },
      {
        title: "Escolha um limite para cada mercado",
        body: `De ${formatDecimal("pt", threshold.min)} (${formatDecimal("pt", morphoMin)} no Morpho) a ${formatDecimal("pt", threshold.max)}, padrão ${formatDecimal("pt", threshold.default)}.`,
      },
      {
        title: "Receba uma mensagem enquanto estiver abaixo dele",
        body: `${capitalize(ptEveryMinutes(minutes))}, por ${channels}, até você voltar para cima do seu limite.`,
      },
    ];
  },
  scaleTitle: "Onde colocar o seu limite",
  scale: {
    liquidation: "liquidação",
    critical: "Crítico",
    risky: "Arriscado",
    safe: "Seguro",
    defaultThreshold: value => `Padrão: ${value}`,
    below: value => `Abaixo de ${value}`,
    between: (from, to) => `De ${from} a ${to}`,
    andAbove: value => `${value} ou mais`,
    range: (min, max) => `Qualquer valor de ${min} a ${max}.`,
  },
  scaleGuide: "Como escolher um limite",

  coverageTitle: "Todos os mercados do Aave e todos os mercados listados do Morpho",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${ptV3Markets(v3Markets)} do Aave ${ptOnNetworks(v3Networks)} e ${ptV4Spokes(spokes)} do Aave ${ptOnNetworks(v4Networks)}, em 4 de novembro de 2026, além de todos os mercados listados do Morpho ${ptOnNetworks(morphoNetworks)}.`,
  coverage: {
    v3Markets: count => ptV3Markets(count),
    v4Spokes: count => ptV4Spokes(count),
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium e Sonic estão sendo encerrados pela governança do Aave e continuam monitorados. Fora da cobertura: Aave V3 na Harmony, mercados do Morpho não listados e outros protocolos.",

  pricingTitle: "Preços",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "Alertas", detail: capitalize(alertPrice) },
    { term: "Renovação", detail: "Nunca automática: pague de novo quando quiser mais tempo" },
    {
      term: "Pagamento",
      detail: paymentChain
        ? `USDC na rede ${paymentChain}, com a sua carteira (aprovar, depois pagar)`
        : "USDC, com a sua carteira",
    },
  ],
  priceSource: "O preço é lido do contrato de pagamento e atualizado a cada hora.",
  pricingFootnote: "Ver suas posições não exige pagamento.",

  questionsTitle: "Perguntas para fazer antes de conectar uma carteira",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = ptOnChain(paymentChain);
    return [
      {
        question: "O Tokenping pode mexer nos meus fundos?",
        answer: rich(
          `Não. O Tokenping só lê as suas posições e nunca pede aprovação nem assinatura no Aave ou no Morpho. As únicas transações são o pagamento ${onChain}: uma aprovação do valor exato do preço e depois o pagamento. `,
          links.sourcify
            ? rich(
                "O contrato é ",
                links.sourcify("verificado no Sourcify"),
                " e o ",
                links.sourceCode("código-fonte dele é público"),
              )
            : links.sourceCode("O código-fonte do contrato é público"),
          "; a carteira da equipe pode mudar o preço, pausar o contrato e atualizá-lo.",
        ),
      },
      {
        question: "O que vocês guardam?",
        answer: rich(
          "O endereço da sua carteira, os seus alertas e os contatos que você informa (e-mail, nome de usuário do Signal",
          hasTelegram ? ", chat do Telegram" : "",
          `). Nenhum histórico e nenhum cookie de rastreamento; as visualizações de página são contadas de forma anônima. Só quem consegue assinar com a sua carteira pode ler esses contatos, mas os pagamentos são públicos ${onChain}. A `,
          links.privacy("página de privacidade"),
          " tem a lista completa.",
        ),
      },
      {
        question: "Quanto custa?",
        answer: rich(
          `Os alertas custam ${alertPrice}, em USDC ${onChain}, mais um pouco de ETH para o gas. Ver suas posições não exige pagamento. Sem renovação automática e sem reembolso.`,
        ),
      },
      {
        question: "Quais empréstimos do Morpho são cobertos?",
        answer: rich(
          `Empréstimos no Morpho Blue (taxa variável) e no Morpho Midnight (taxa fixa) nos mercados listados no app do Morpho, com limites a partir de ${formatDecimal("pt", morphoMin)}. Um empréstimo com taxa fixa também recebe lembretes antes do vencimento. O mesmo plano cobre os dois: abra o `,
          links.morphoDashboard("painel do Morpho"),
          ".",
        ),
      },
      {
        question: "E se um alerta não chegar?",
        answer: rich(
          `A próxima verificação, ${plural("pt", minutes, { one: `${minutes} minuto`, other: `${minutes} minutos` })} depois, tenta de novo. A entrega depende do Resend, de um relay do Signal,`,
          hasTelegram ? " da Telegram Bot API," : "",
          " de nós RPC públicos e do agendador da Vercel, sem garantia de disponibilidade. Escolha dois canais e deixe margem para agir.",
        ),
      },
      {
        question: "Como paro os alertas?",
        answer: rich(
          "Eles param quando o seu fator de saúde volta para cima do seu limite, ou quando você exclui o alerta (exige acesso ativo). O acesso expirou? Fale com a gente no ",
          links.x("X"),
          " ou na nossa comunidade no ",
          links.telegramCommunity("Telegram"),
          " ou no ",
          links.signalCommunity("Signal"),
          ".",
          hasTelegram ? " No Telegram, /stop também funciona." : "",
          " Ainda não há soneca nem link de descadastro.",
        ),
      },
      {
        question: "Posso acompanhar uma carteira que não conecto?",
        answer: rich("Hoje não. Uma carteira, a que você conecta; o acesso é por carteira."),
      },
      {
        question: "Outras ferramentas não custam nada. Por que pagar?",
        answer: rich(
          "Se um bot do Telegram ou um app de celular atende você, use um deles",
          links.comparison ? rich(": ", links.comparison("a nossa comparação"), " fala deles") : null,
          ". O Tokenping é para alertas por Signal ou e-mail, em cada mercado do Aave e cada mercado listado do Morpho.",
        ),
      },
    ];
  },

  limitsTitle: "Os limites, sem rodeios",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `Verifica ${ptEveryMinutes(minutes)}, não de forma contínua.`,
    `Abaixo do seu limite, você recebe uma mensagem a cada ${repeatMinutes} minutos: sem soneca e sem resumo.`,
    "Um limite por mercado, só para a carteira conectada.",
    `Só USDC${paymentChain ? ` na rede ${paymentChain}` : ""}: sem cartão e sem reembolso.`,
    "Ainda não há link de descadastro nos e-mails; excluir um alerta exige acesso ativo.",
    "Beta: entrega por serviços de terceiros, sem garantia de disponibilidade.",
  ],

  blogTitle: "Do blog",
  allGuides: "Todos os guias do Aave e do Morpho",

  closingTitle: "Configure o seu alerta de fator de saúde do Aave ou do Morpho",
  closingLead: alertPrice => `${capitalize(alertPrice)}, pagos com a sua carteira. Sem renovação automática.`,
};
