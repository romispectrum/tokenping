import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_EN = '"How did you hear about Tokenping?"';

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacy and data",
  metaDescription:
    "What Tokenping stores when you set an Aave health factor alert, what it does not store, which services handle your data and how to delete it.",
  crumbHome: "Home",
  crumbPrivacy: "Privacy",
  title: "Privacy: what Tokenping stores and who handles it",
  lastUpdated: "Last updated",
  intro:
    "This page describes what the app does today. Tokenping is in beta, and we update this page when what we collect changes.",
  withoutUs: {
    title: "What you can do without giving us anything",
    text: "Reading the site and the blog, and looking at your positions on the dashboard, adds nothing to our database. To show your positions, your browser asks RPC providers (listed below) for your wallet's Aave data, so they see your wallet address.",
    morpho:
      "On the Morpho dashboard, your browser also sends your wallet address to Morpho's API, which finds the Morpho markets you borrow in, and reads your Morpho positions from the same RPC providers.",
  },
  stored: {
    title: "What we store when you save an alert",
    items: [
      "Your wallet address.",
      "The network the alert is for, and your threshold.",
      "The channels you picked, and the language of each.",
      "Your email address, if you chose email.",
      "Your Signal username, if you chose Signal.",
      "When the alert was created and last changed.",
      "When you last sent a test message on each channel, to allow one test per channel every 15 minutes.",
    ],
    telegram:
      "If you choose Telegram, we store the Telegram username you type into the alert. When that account presses Start in the Tokenping bot, we also store its chat ID and when it pressed Start, so alerts can reach it. Anyone can check whether a Telegram username has pressed Start in the bot.",
    attribution: `If you answer the optional ${ATTRIBUTION_QUESTION_EN} question after saving an alert, we store your answer and the time with your wallet address.`,
  },
  notStored: {
    title: "What we don't store",
    items: [
      "Your positions or a history of your health factor. They are read live and not saved.",
      "A log of the alerts we sent.",
      `Tracking pixels or advertising cookies: the site uses none. When you sign in with your wallet, Tokenping sets one cookie that only says which wallet signed in; it lasts 7 days or until you disconnect the wallet on this site. While you sign in, a second cookie holds the sign-in request for five minutes. Your browser keeps your theme choice, your wallet connection, which wallets have signed in on it and whether it has already shown you the ${ATTRIBUTION_QUESTION_EN} question in its own local storage.`,
      "IP addresses in our database. Vercel still handles every request, as listed below. When an alert check or a message fails, the error, which can include your wallet address and the recipient, goes to our server logs.",
    ],
  },
  whoCanSee: {
    title: "Who can see your alert settings",
    tiedToWallet:
      "Alert settings are tied to a wallet address, not to an account with a password. To see or change them, you sign a message with that wallet, which proves the address is yours. It is not a transaction and costs no gas, and one signature lasts 7 days on that browser.",
    anyone: hasTelegram =>
      `Only someone who can sign with your wallet can see the email address${hasTelegram ? ", Signal username and Telegram username" : " and Signal username"} saved for it, or change or delete its alerts. The public payment records described below still show which wallets have paid.`,
    dontEnter: "Don't enter an email address or Signal username you wouldn't want linked to your wallet address.",
  },
  processors: {
    title: "Who handles your data",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Hosts this site and runs the alert check every ${minutes} minutes.`,
        receives: "Every request to the site, including your IP address, and our server logs.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Counts page views, without cookies.",
        receives:
          "For each page view: the page address, the site you came from, your approximate location, and your browser, operating system and device type. A visitor is a hash of the request that changes every 24 hours, so visits cannot be linked across days or sites.",
      },
      { name: "Supabase", role: "Our database.", receives: "The alert settings listed above." },
      { name: "Resend", role: "Sends alert emails.", receives: "Your email address and the alert text." },
      {
        name: "Fly.io (our Signal relay)",
        role: "Hosts the signal-cli-rest-api server we run, which hands Signal alerts to Signal.",
        receives: "Your Signal username and the alert text (and so does Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Delivers Telegram alerts through its Bot API.",
              receives: "Your Telegram chat ID and the alert text.",
            },
          ]
        : []),
      {
        name: "RPC providers (PublicNode, Alchemy and the networks' public endpoints)",
        role: "Answer the blockchain reads: from your browser for the dashboard, and from our server for alert checks and to check sign-in signatures from smart wallets.",
        receives:
          "The wallet address being read (and, when you sign in, your signature), and your IP address for reads made from your browser.",
      },
      {
        name: "Morpho's API",
        role: "Finds the listed Morpho markets your wallet borrows in, for the Morpho dashboard, and tells our server whether a market is listed when you save a Morpho alert.",
        receives: "Your wallet address, and your IP address for the lookups your browser makes.",
      },
      {
        name: "WalletConnect",
        role: "Relays the connection between this site and your wallet app, if you connect with WalletConnect.",
        receives: "What your wallet app and this site exchange to connect, such as your wallet address.",
      },
    ],
    receives: receives => `Receives: ${receives}`,
    ownPolicy: "Each of these services handles that data under its own privacy policy.",
  },
  onChain: {
    title: "What is public on the blockchain",
    text: paymentChainName =>
      `Paying for alerts happens on ${paymentChainName ?? "the payment network"}. Each payment records the paying address, the token, the amount, the time, the period bought and the new expiry date in a public event that anyone can read and nobody can delete. Your alert settings are never written to a blockchain.`,
  },
  retention: {
    title: "How long we keep it, and how to delete it",
    settings:
      "Alert settings stay until you delete the alert in the dashboard. Deleting removes that network's settings, including the email address and Signal username, and needs active access.",
    telegramStop: "Sending /stop to the Tokenping bot in Telegram unlinks your chat and stops Telegram alerts.",
    contact: {
      before: `If your access has expired, or you want your ${ATTRIBUTION_QUESTION_EN} answer removed, message us on`,
      x: "X",
      middle: "or in our community on",
      telegram: "Telegram",
      or: "or",
      signal: "Signal",
      after: "and we'll delete it.",
    },
    payments: "Payments on the blockchain can't be deleted by anyone.",
  },
  homepage: { before: "Questions about how alerts work are answered on the ", link: "homepage", after: "." },
};
