import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_FR = "« Comment avez-vous connu Tokenping ? »";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Confidentialité et données",
  metaDescription:
    "Ce que Tokenping stocke pour une alerte de facteur de santé Aave, ce qu'il ne stocke pas, quels services traitent vos données et comment les supprimer.",
  crumbHome: "Accueil",
  crumbPrivacy: "Confidentialité",
  title: "Confidentialité : ce que Tokenping stocke et qui le traite",
  lastUpdated: "Dernière mise à jour le",
  intro:
    "Cette page décrit ce que fait l'app aujourd'hui. Tokenping est en bêta, et nous mettons cette page à jour quand ce que nous collectons change.",
  withoutUs: {
    title: "Ce que vous pouvez faire sans rien nous donner",
    text: "Lire le site et le blog, et consulter vos positions dans le tableau de bord, n'ajoute rien à notre base de données. Pour afficher vos positions, votre navigateur demande aux fournisseurs RPC (listés ci-dessous) les données Aave de votre wallet : ils voient donc l'adresse de votre wallet.",
    morpho:
      "Dans le tableau de bord Morpho, votre navigateur envoie aussi l'adresse de votre wallet à l'API de Morpho, qui trouve les marchés Morpho dans lesquels vous empruntez, et lit vos positions Morpho auprès des mêmes fournisseurs RPC.",
  },
  stored: {
    title: "Ce que nous stockons quand vous enregistrez une alerte",
    items: [
      "L'adresse de votre wallet.",
      "Le réseau concerné par l'alerte, et votre seuil.",
      "Les canaux que vous avez choisis, et la langue de chacun.",
      "Votre adresse e-mail, si vous avez choisi l'e-mail.",
      "Votre nom d'utilisateur Signal, si vous avez choisi Signal.",
      "La date de création de l'alerte et celle de sa dernière modification.",
      "La dernière fois que vous avez envoyé un message de test sur chaque canal, pour autoriser un test par canal toutes les 15 minutes.",
    ],
    telegram:
      "Si vous choisissez Telegram, nous stockons le nom d'utilisateur Telegram que vous saisissez dans l'alerte. Quand ce compte appuie sur Start dans le bot Tokenping, nous stockons aussi l'identifiant de son chat et le moment où il a appuyé sur Start, pour que les alertes puissent lui parvenir. N'importe qui peut vérifier si un nom d'utilisateur Telegram a appuyé sur Start dans le bot.",
    attribution: `Si vous répondez à la question facultative ${ATTRIBUTION_QUESTION_FR} après avoir enregistré une alerte, nous stockons votre réponse et l'heure avec l'adresse de votre wallet.`,
  },
  notStored: {
    title: "Ce que nous ne stockons pas",
    items: [
      "Vos positions ou un historique de votre facteur de santé. Ils sont lus en direct et ne sont pas enregistrés.",
      "Un journal des alertes que nous avons envoyées.",
      `Des pixels de suivi ou des cookies publicitaires : le site n'en utilise aucun. Quand vous vous connectez avec votre wallet, Tokenping dépose un cookie qui indique seulement quel wallet s'est connecté ; il dure 7 jours ou jusqu'à ce que vous déconnectiez le wallet sur ce site. Pendant la connexion, un second cookie conserve la demande de connexion pendant cinq minutes. Votre navigateur conserve dans son propre stockage local (local storage) votre choix de thème, la connexion de votre wallet, les wallets qui s'y sont connectés et s'il vous a déjà montré la question ${ATTRIBUTION_QUESTION_FR}.`,
      "Des adresses IP dans notre base de données. Vercel traite tout de même chaque requête, comme indiqué ci-dessous. Quand une vérification d'alerte ou un message échoue, l'erreur, qui peut contenir l'adresse de votre wallet et le destinataire, est inscrite dans nos journaux serveur.",
    ],
  },
  whoCanSee: {
    title: "Qui peut voir vos paramètres d'alerte",
    tiedToWallet:
      "Les paramètres d'alerte sont liés à une adresse de wallet, pas à un compte avec un mot de passe. Pour les voir ou les modifier, vous signez un message avec ce wallet, ce qui prouve que l'adresse vous appartient. Ce n'est pas une transaction et cela ne coûte aucun gas, et une signature dure 7 jours dans ce navigateur.",
    anyone: hasTelegram =>
      `Seule une personne capable de signer avec votre wallet peut voir l'adresse e-mail${hasTelegram ? ", le nom d'utilisateur Signal et le nom d'utilisateur Telegram" : " et le nom d'utilisateur Signal"} enregistrés pour ce wallet, ou modifier ou supprimer ses alertes. Les enregistrements publics des paiements décrits ci-dessous montrent tout de même quels wallets ont payé.`,
    dontEnter:
      "Ne saisissez pas une adresse e-mail ou un nom d'utilisateur Signal que vous ne voudriez pas voir associé à l'adresse de votre wallet.",
  },
  processors: {
    title: "Qui traite vos données",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Héberge ce site et exécute la vérification des alertes toutes les ${minutes} minutes.`,
        receives: "Chaque requête vers le site, y compris votre adresse IP, et nos journaux serveur.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Compte les pages vues, sans cookies.",
        receives:
          "Pour chaque page vue : l'adresse de la page, le site d'où vous venez, votre localisation approximative, ainsi que votre navigateur, votre système d'exploitation et votre type d'appareil. Un visiteur est un hash de la requête qui change toutes les 24 heures, de sorte que les visites ne peuvent pas être reliées d'un jour à l'autre ni d'un site à l'autre.",
      },
      { name: "Supabase", role: "Notre base de données.", receives: "Les paramètres d'alerte listés ci-dessus." },
      {
        name: "Resend",
        role: "Envoie les e-mails d'alerte.",
        receives: "Votre adresse e-mail et le texte de l'alerte.",
      },
      {
        name: "Fly.io (notre relais Signal)",
        role: "Héberge le serveur signal-cli-rest-api que nous exploitons, qui transmet les alertes Signal à Signal.",
        receives: "Votre nom d'utilisateur Signal et le texte de l'alerte (Signal les reçoit aussi).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Distribue les alertes Telegram via son Bot API.",
              receives: "L'identifiant de votre chat Telegram et le texte de l'alerte.",
            },
          ]
        : []),
      {
        name: "Fournisseurs RPC (PublicNode, Alchemy et les endpoints publics des réseaux)",
        role: "Répondent aux lectures de la blockchain : depuis votre navigateur pour le tableau de bord, et depuis notre serveur pour les vérifications d'alertes et pour vérifier les signatures de connexion des smart wallets.",
        receives:
          "L'adresse du wallet lu (et, quand vous vous connectez, votre signature), et votre adresse IP pour les lectures faites depuis votre navigateur.",
      },
      {
        name: "L'API de Morpho",
        role: "Trouve les marchés Morpho listés dans lesquels votre wallet emprunte, pour le tableau de bord Morpho, et indique à notre serveur si un marché est listé quand vous enregistrez une alerte Morpho.",
        receives: "L'adresse de votre wallet, et votre adresse IP pour les recherches faites par votre navigateur.",
      },
      {
        name: "WalletConnect",
        role: "Relaie la connexion entre ce site et l'app de votre wallet, si vous vous connectez avec WalletConnect.",
        receives:
          "Ce que l'app de votre wallet et ce site échangent pour se connecter, comme l'adresse de votre wallet.",
      },
    ],
    receives: receives => `Reçoit : ${receives}`,
    ownPolicy: "Chacun de ces services traite ces données selon sa propre politique de confidentialité.",
  },
  onChain: {
    title: "Ce qui est public sur la blockchain",
    text: paymentChainName =>
      `Le paiement des alertes a lieu ${paymentChainName ? `sur ${paymentChainName}` : "sur le réseau de paiement"}. Chaque paiement enregistre l'adresse qui paie, le token, le montant, l'heure, la période achetée et la nouvelle date d'expiration dans un événement public que tout le monde peut lire et que personne ne peut supprimer. Vos paramètres d'alerte ne sont jamais écrits sur une blockchain.`,
  },
  retention: {
    title: "Combien de temps nous les conservons, et comment les supprimer",
    settings:
      "Les paramètres d'alerte sont conservés jusqu'à ce que vous supprimiez l'alerte dans le tableau de bord. La suppression efface les paramètres de ce réseau, y compris l'adresse e-mail et le nom d'utilisateur Signal, et nécessite un accès actif.",
    telegramStop: "Envoyer /stop au bot Tokenping dans Telegram dissocie votre chat et arrête les alertes Telegram.",
    contact: {
      before: `Si votre accès a expiré, ou si vous voulez que votre réponse à la question ${ATTRIBUTION_QUESTION_FR} soit supprimée, écrivez-nous sur`,
      x: "X",
      middle: "ou dans notre communauté sur",
      telegram: "Telegram",
      or: "ou",
      signal: "Signal",
      after: "et nous procéderons à la suppression.",
    },
    payments: "Personne ne peut supprimer les paiements sur la blockchain.",
  },
  homepage: {
    before: "Les questions sur le fonctionnement des alertes trouvent leur réponse sur la ",
    link: "page d'accueil",
    after: ".",
  },
};
