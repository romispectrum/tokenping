import type { TelegramReplies } from "./shared";

export const MESSAGES: TelegramReplies = {
  privateChatsOnly: "Tokenping fonctionne uniquement en chat privé. Écrivez directement au bot.",
  noUsername:
    "Votre compte Telegram n'a pas encore de nom d'utilisateur. Créez-en un dans Telegram (Paramètres, puis Nom " +
    "d'utilisateur), saisissez-le dans votre alerte sur Tokenping, puis renvoyez /start ici.",
  linkSaveFailed: "Une erreur s'est produite lors de la liaison de ce chat. Renvoyez /start.",
  linked: username =>
    `@${username} est lié. Les alertes Tokenping qui nomment @${username} arriveront dans ce chat.\n\n` +
    "Envoyez /stop à tout moment pour les arrêter.",
  unsubscribed: "Arrêté. Plus aucune alerte Tokenping n'arrivera ici. Envoyez /start pour les recevoir à nouveau.",
  unsubscribeFailed: "Une erreur s'est produite lors de l'arrêt des alertes. Renvoyez /stop.",
  help:
    "Tokenping vous écrit quand votre facteur de santé Aave ou Morpho passe sous un seuil que vous fixez dans l'app.\n\n" +
    "Saisissez votre nom d'utilisateur Telegram dans votre alerte sur Tokenping, puis envoyez /start ici une fois.\n\n" +
    "Commandes :\n" +
    "/start : lier ce chat à votre nom d'utilisateur\n" +
    "/stop : arrêter toutes les alertes Tokenping ici\n" +
    "/help : afficher ce message",
  unknownCommand: "Je réponds uniquement à /start, /stop et /help. Gérez vos alertes dans l'app Tokenping.",
};
