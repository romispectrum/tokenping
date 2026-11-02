import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_PT = '"Como você conheceu o Tokenping?"';

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacidade e dados",
  metaDescription:
    "O que o Tokenping guarda quando você cria um alerta de fator de saúde do Aave, o que não guarda, quais serviços tratam os seus dados e como excluí-los.",
  crumbHome: "Início",
  crumbPrivacy: "Privacidade",
  title: "Privacidade: o que o Tokenping guarda e quem trata os dados",
  lastUpdated: "Atualizado em",
  intro:
    "Esta página descreve o que o app faz hoje. O Tokenping está em beta, e atualizamos esta página quando o que coletamos muda.",
  withoutUs: {
    title: "O que você pode fazer sem nos dar nada",
    text: "Ler o site e o blog, e ver as suas posições no painel, não acrescenta nada ao nosso banco de dados. Para mostrar as suas posições, o seu navegador pede aos provedores de RPC (listados abaixo) os dados do Aave da sua carteira, então eles veem o endereço da sua carteira.",
    morpho:
      "No painel do Morpho, o seu navegador também envia o endereço da sua carteira para a API do Morpho, que encontra os mercados do Morpho em que você pega empréstimo, e lê as suas posições no Morpho nos mesmos provedores de RPC.",
  },
  stored: {
    title: "O que guardamos quando você salva um alerta",
    items: [
      "O endereço da sua carteira.",
      "A rede do alerta e o seu limite.",
      "Os canais que você escolheu e o idioma de cada um.",
      "O seu endereço de e-mail, se você escolheu e-mail.",
      "O seu nome de usuário do Signal, se você escolheu Signal.",
      "Quando o alerta foi criado e quando foi alterado pela última vez.",
      "Quando você enviou pela última vez uma mensagem de teste em cada canal, para permitir um teste por canal a cada 15 minutos.",
    ],
    telegram:
      "Se você escolher Telegram, guardamos o nome de usuário do Telegram que você digita no alerta. Quando essa conta toca em Start no bot do Tokenping, também guardamos o ID do chat dela e quando ela tocou em Start, para que os alertas possam chegar a ela. Qualquer pessoa pode verificar se um nome de usuário do Telegram tocou em Start no bot.",
    attribution: `Se você responder à pergunta opcional ${ATTRIBUTION_QUESTION_PT} depois de salvar um alerta, guardamos a sua resposta e o horário junto com o endereço da sua carteira.`,
  },
  notStored: {
    title: "O que não guardamos",
    items: [
      "As suas posições ou um histórico do seu fator de saúde. Eles são lidos na hora e não são salvos.",
      "Um registro dos alertas que enviamos.",
      `Pixels de rastreamento ou cookies de publicidade: o site não usa nenhum. Quando você entra com a sua carteira, o Tokenping define um cookie que diz apenas qual carteira entrou; ele dura 7 dias ou até você desconectar a carteira neste site. Enquanto você entra, um segundo cookie guarda o pedido de entrada por cinco minutos. O seu navegador guarda no armazenamento local dele a sua escolha de tema, a conexão da sua carteira, quais carteiras entraram nele e se ele já mostrou a pergunta ${ATTRIBUTION_QUESTION_PT}.`,
      "Endereços IP no nosso banco de dados. A Vercel ainda trata cada requisição, como listado abaixo. Quando uma verificação de alerta ou uma mensagem falha, o erro, que pode incluir o endereço da sua carteira e o destinatário, vai para os logs do nosso servidor.",
    ],
  },
  whoCanSee: {
    title: "Quem pode ver as suas configurações de alerta",
    tiedToWallet:
      "As configurações de alerta ficam ligadas a um endereço de carteira, não a uma conta com senha. Para vê-las ou alterá-las, você assina uma mensagem com essa carteira, o que prova que o endereço é seu. Não é uma transação e não custa gas, e uma assinatura vale por 7 dias naquele navegador.",
    anyone: hasTelegram =>
      `Só quem consegue assinar com a sua carteira pode ver o endereço de e-mail${hasTelegram ? ", o nome de usuário do Signal e o nome de usuário do Telegram" : " e o nome de usuário do Signal"} salvos para ela, ou alterar ou excluir os alertas dela. Os registros públicos de pagamento descritos abaixo ainda mostram quais carteiras pagaram.`,
    dontEnter:
      "Não informe um endereço de e-mail ou um nome de usuário do Signal que você não queira ligado ao endereço da sua carteira.",
  },
  processors: {
    title: "Quem trata os seus dados",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hospeda este site e roda a verificação de alertas a cada ${minutes} minutos.`,
        receives: "Cada requisição ao site, incluindo o seu endereço IP, e os logs do nosso servidor.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Conta as visualizações de página, sem cookies.",
        receives:
          "Para cada visualização de página: o endereço da página, o site de onde você veio, a sua localização aproximada e o seu navegador, sistema operacional e tipo de dispositivo. Um visitante é um hash da requisição que muda a cada 24 horas, então as visitas não podem ser ligadas entre dias ou sites.",
      },
      { name: "Supabase", role: "Nosso banco de dados.", receives: "As configurações de alerta listadas acima." },
      {
        name: "Resend",
        role: "Envia os e-mails de alerta.",
        receives: "O seu endereço de e-mail e o texto do alerta.",
      },
      {
        name: "Fly.io (nosso relay do Signal)",
        role: "Hospeda o servidor signal-cli-rest-api que operamos, que entrega os alertas do Signal ao Signal.",
        receives: "O seu nome de usuário do Signal e o texto do alerta (e o Signal também).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Entrega os alertas do Telegram pela Bot API dele.",
              receives: "O ID do seu chat do Telegram e o texto do alerta.",
            },
          ]
        : []),
      {
        name: "Provedores de RPC (PublicNode, Alchemy e os endpoints públicos das redes)",
        role: "Respondem às leituras da blockchain: a partir do seu navegador para o painel, e a partir do nosso servidor para as verificações de alerta e para verificar assinaturas de entrada feitas por smart wallets.",
        receives:
          "O endereço da carteira lida (e, quando você entra, a sua assinatura), e o seu endereço IP nas leituras feitas pelo seu navegador.",
      },
      {
        name: "API do Morpho",
        role: "Encontra os mercados listados do Morpho em que a sua carteira pega empréstimo, para o painel do Morpho, e informa ao nosso servidor se um mercado está listado quando você salva um alerta do Morpho.",
        receives: "O endereço da sua carteira, e o seu endereço IP nas consultas que o seu navegador faz.",
      },
      {
        name: "WalletConnect",
        role: "Faz a ponte da conexão entre este site e o app da sua carteira, se você conectar com o WalletConnect.",
        receives: "O que o app da sua carteira e este site trocam para se conectar, como o endereço da sua carteira.",
      },
    ],
    receives: receives => `Recebe: ${receives}`,
    ownPolicy: "Cada um desses serviços trata esses dados conforme a própria política de privacidade.",
  },
  onChain: {
    title: "O que é público na blockchain",
    text: paymentChainName =>
      `O pagamento dos alertas acontece ${paymentChainName ? `na rede ${paymentChainName}` : "na rede de pagamento"}. Cada pagamento registra o endereço pagador, o token, o valor, o horário, o período comprado e a nova data de expiração em um evento público que qualquer pessoa pode ler e ninguém pode apagar. As suas configurações de alerta nunca são gravadas em uma blockchain.`,
  },
  retention: {
    title: "Por quanto tempo guardamos e como excluir",
    settings:
      "As configurações de alerta ficam guardadas até você excluir o alerta no painel. A exclusão remove as configurações daquela rede, incluindo o endereço de e-mail e o nome de usuário do Signal, e exige acesso ativo.",
    telegramStop: "Enviar /stop ao bot do Tokenping no Telegram desvincula o seu chat e para os alertas do Telegram.",
    contact: {
      before: `Se o seu acesso expirou, ou se você quer que a sua resposta à pergunta ${ATTRIBUTION_QUESTION_PT} seja removida, fale com a gente no`,
      x: "X",
      middle: "ou na nossa comunidade no",
      telegram: "Telegram",
      or: "ou no",
      signal: "Signal",
      after: "e nós excluímos.",
    },
    payments: "Ninguém pode apagar os pagamentos na blockchain.",
  },
  homepage: {
    before: "As perguntas sobre como os alertas funcionam são respondidas na ",
    link: "página inicial",
    after: ".",
  },
};
