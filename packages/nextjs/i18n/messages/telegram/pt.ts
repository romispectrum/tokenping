import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "O Tokenping só funciona em chats privados. Mande mensagem direto para o bot.",
  noUsername:
    "Sua conta do Telegram ainda não tem nome de usuário. Crie um no Telegram (Configurações, depois Nome de " +
    "usuário), digite esse nome no seu alerta no Tokenping e envie /start aqui de novo.",
  linkSaveFailed: "Algo deu errado ao vincular este chat. Envie /start de novo.",
  linked: username =>
    `@${username} vinculado. Os alertas do Tokenping que citam @${username} vão chegar neste chat.\n\n` +
    "Envie /stop a qualquer momento para pará-los.",
  unsubscribed: "Pronto. Nenhum alerta do Tokenping vai chegar aqui. Envie /start para voltar a recebê-los.",
  unsubscribeFailed: "Algo deu errado ao parar os alertas. Envie /stop de novo.",
  help:
    "O Tokenping avisa você quando o seu fator de saúde no Aave ou no Morpho cai abaixo de um limite que você define no app.\n\n" +
    "Digite o seu nome de usuário do Telegram no seu alerta no Tokenping e envie /start aqui uma vez.\n\n" +
    "Comandos:\n" +
    "/start: vincular este chat ao seu nome de usuário\n" +
    "/stop: parar todos os alertas do Tokenping aqui\n" +
    "/help: mostrar esta mensagem",
  unknownCommand: "Só respondo a /start, /stop e /help. Gerencie seus alertas no app do Tokenping.",
};
