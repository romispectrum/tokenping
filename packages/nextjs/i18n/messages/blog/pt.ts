import type { BlogMessages } from "./shared";
import { formatDecimal, plural } from "~~/i18n/format";

/** "a cada 5 minutos", "a cada minuto". */
const ptEveryMinutes = (minutes: number) =>
  plural("pt", minutes, { one: "a cada minuto", other: `a cada ${minutes} minutos` });

/** "em 22 redes", "em 1 rede". */
const ptOnNetworks = (networks: number) =>
  plural("pt", networks, { one: `em ${networks} rede`, other: `em ${networks} redes` });

export const MESSAGES: BlogMessages = {
  crumbs: { home: "Início", blog: "Blog" },
  index: {
    title: "Guias do Aave e do Morpho: fator de saúde e liquidação",
    description:
      "Guias sobre o fator de saúde no Aave e no Morpho, liquidação, preço de liquidação e alertas, com exemplos calculados e números datados e com fonte.",
    kicker: "Guias do Aave e do Morpho",
    lead: "Como o fator de saúde funciona no Aave e no Morpho, o que acontece em uma liquidação, como calcular o seu preço de liquidação e como ser avisado antes que ele chegue perto. Cada número destes guias cita a fonte e a data em que foi verificado.",
    dashboardCta: "Abrir o painel do Aave",
    morphoDashboardCta: "Abrir o painel do Morpho",
    rss: "Assinar por RSS",
    startHere: "Comece por aqui",
    allGuides: "Todos os guias",
    empty: {
      title: "Ainda não há guias",
      description:
        "Estamos preparando os guias em português. Assine por RSS para recebê-los assim que forem publicados.",
      otherLanguage: "Ler os guias em inglês",
    },
  },
  post: {
    kicker: "Guia do Aave V3",
    morphoKicker: "Guia do Morpho",
    byline: { author: "Pela equipe do Tokenping", published: "Publicado em", updated: "Atualizado em" },
    readingTime: minutes => `${minutes} min de leitura`,
    readGuide: "Ler o guia",
    related: "Guias relacionados",
  },
  endBox: {
    label: "Sobre o Tokenping",
    title: "Alertas de fator de saúde do Tokenping",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `O Tokenping verifica o fator de saúde das suas posições no Aave V3 e V4 ${ptEveryMinutes(minutes)} ${ptOnNetworks(networks)} e avisa você por ${channels} quando ele fica abaixo do seu limite. Os alertas custam ${price}${paymentChain ? `, pagos na rede ${paymentChain}` : ""}; ver suas posições não exige pagamento. Os alertas dão tempo para você agir; eles não impedem a liquidação.`,
    cta: "Abrir o painel",
    morpho: {
      title: "Alertas de fator de saúde do Morpho pelo Tokenping",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `O Tokenping verifica o fator de saúde dos seus empréstimos no Morpho Blue e no Midnight ${ptEveryMinutes(minutes)} ${ptOnNetworks(networks)} e avisa você por ${channels} quando ele fica abaixo do seu limite, com lembretes antes do vencimento de um empréstimo com taxa fixa. Os alertas custam ${price}${paymentChain ? `, pagos na rede ${paymentChain}` : ""}, o mesmo plano dos alertas do Aave; ver suas posições não exige pagamento. Os alertas dão tempo para você agir; eles não impedem a liquidação.`,
      cta: "Abrir o painel do Morpho",
    },
  },
  alertPrice: {
    fallback: "uma pequena taxa em USDC (o preço atual aparece no painel)",
    plan: ({ priceLabel, days }) =>
      `${formatDecimal("pt", priceLabel)} ${plural("pt", days, { one: "por dia", other: `por ${days} dias` })}`,
  },
  callout: { info: "Observação", warning: "Atenção" },
  shortAnswer: "Resposta curta",
  scopeNote: {
    text: "Vale para o Aave V3.7, verificado nos mercados Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche e Gnosis. Outros mercados e redes do V3 podem usar versões mais antigas. As diferenças do Aave V4 são indicadas onde as regras mudam.",
    morphoText:
      "Vale para os mercados do Morpho Blue e do Morpho Midnight listados no app do Morpho. Cada mercado define a própria garantia, o oráculo e o LLTV, então confira os números do seu.",
    figuresAsOf: "Números de",
  },
  table: {
    fallbackLabel: "Tabela, rola na horizontal",
    label: (heading, index) => (index === undefined ? `Tabela: ${heading}` : `Tabela ${index}: ${heading}`),
    scrollHint: "Role para o lado para ver todas as colunas.",
  },
};
