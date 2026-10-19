import type { Localized } from "~~/i18n/locales";

// The privacy page (components/pages/PrivacyPage.tsx). Every fact, processor and caveat appears in both languages;
// the Czech is a translation, never a summary. Rich text is split into the words around each link.

export type PrivacyProcessor = {
  name: string;
  role: string;
  receives: string;
};

type ProcessorFacts = {
  minutes: number;
  hasTelegram: boolean;
};

/** "<before> <link> <middle> <link> <or> <link> <after>", the spaces around the links written by the page. */
type ContactText = {
  before: string;
  x: string;
  middle: string;
  telegram: string;
  or: string;
  signal: string;
  after: string;
};

type PrivacyMessages = {
  metaTitle: string;
  metaDescription: string;
  crumbHome: string;
  crumbPrivacy: string;
  title: string;
  /** Followed by a space and the date. */
  lastUpdated: string;
  intro: string;
  withoutUs: { title: string; text: string };
  stored: { title: string; items: readonly string[]; telegram: string; attribution: string };
  notStored: { title: string; items: readonly string[] };
  whoCanSee: { title: string; tiedToWallet: string; anyone: (hasTelegram: boolean) => string; dontEnter: string };
  processors: {
    title: string;
    list: (facts: ProcessorFacts) => PrivacyProcessor[];
    receives: (receives: string) => string;
    ownPolicy: string;
  };
  /** The chain name is undefined when no target network has a paywall. */
  onChain: { title: string; text: (paymentChainName: string | undefined) => string };
  retention: { title: string; settings: string; telegramStop: string; contact: ContactText; payments: string };
  /** "<before><link><after>": the page links the home page. */
  homepage: { before: string; link: string; after: string };
};

const ATTRIBUTION_QUESTION_EN = '"How did you hear about Tokenping?"';
const ATTRIBUTION_QUESTION_CS = "„Jak jste se o Tokenpingu dozvěděli?“";

export const PRIVACY_MESSAGES: Localized<PrivacyMessages> = {
  en: {
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
  },
  cs: {
    metaTitle: "Ochrana soukromí a data",
    metaDescription:
      "Co Tokenping ukládá, když si nastavíte upozornění na Aave health factor, co neukládá, které služby s vašimi daty pracují a jak je smazat.",
    crumbHome: "Úvod",
    crumbPrivacy: "Ochrana soukromí",
    title: "Ochrana soukromí: co Tokenping ukládá a kdo s daty pracuje",
    lastUpdated: "Naposledy aktualizováno",
    intro:
      "Tato stránka popisuje, co aplikace dělá dnes. Tokenping je v betaverzi a když se změní, co shromažďujeme, tuto stránku aktualizujeme.",
    withoutUs: {
      title: "Co můžete dělat, aniž byste nám cokoli poskytli",
      text: "Čtení webu a blogu ani prohlížení vašich pozic v přehledu do naší databáze nic nepřidá. Aby se vaše pozice mohly zobrazit, váš prohlížeč se ptá poskytovatelů RPC (jsou uvedeni níže) na data vaší peněženky na Aave, takže tito poskytovatelé vidí adresu vaší peněženky.",
    },
    stored: {
      title: "Co ukládáme, když uložíte upozornění",
      items: [
        "Adresu vaší peněženky.",
        "Síť, pro kterou upozornění platí, a váš práh.",
        "Kanály, které jste zvolili, a jazyk každého z nich.",
        "Vaši e-mailovou adresu, pokud jste zvolili e-mail.",
        "Vaše uživatelské jméno na Signalu, pokud jste zvolili Signal.",
        "Kdy bylo upozornění vytvořeno a kdy naposledy změněno.",
        "Kdy jste naposledy poslali testovací zprávu na jednotlivý kanál, aby šel poslat jeden test na kanál za 15 minut.",
      ],
      telegram:
        "Pokud zvolíte Telegram, ukládáme uživatelské jméno na Telegramu, které zadáte do upozornění. Když tento účet stiskne Start v botovi Tokenpingu, uložíme také ID jeho chatu a čas, kdy Start stiskl, aby k němu upozornění mohla chodit. Kdokoli si může ověřit, jestli dané uživatelské jméno na Telegramu stisklo Start v botovi.",
      attribution: `Pokud po uložení upozornění odpovíte na nepovinnou otázku ${ATTRIBUTION_QUESTION_CS}, uložíme vaši odpověď a čas spolu s adresou vaší peněženky.`,
    },
    notStored: {
      title: "Co neukládáme",
      items: [
        "Vaše pozice ani historii vašeho health factoru. Čtou se živě a neukládají se.",
        "Záznam odeslaných upozornění.",
        `Sledovací pixely ani reklamní cookies: web nic z toho nepoužívá. Když se přihlásíte peněženkou, Tokenping nastaví jednu cookie, která říká jen to, která peněženka se přihlásila; platí 7 dní nebo do chvíle, kdy peněženku na tomto webu odpojíte. Během přihlašování drží druhá cookie na pět minut žádost o přihlášení. Váš prohlížeč si ve svém vlastním místním úložišti (local storage) uchovává zvolený motiv, připojení peněženky, které peněženky se v něm přihlásily, a to, zda vám už zobrazil otázku ${ATTRIBUTION_QUESTION_CS}.`,
        "IP adresy v naší databázi. Každý požadavek přesto zpracovává Vercel, jak je uvedeno níže. Když kontrola upozornění nebo odeslání zprávy selže, chyba, která může obsahovat adresu vaší peněženky a příjemce, se zapíše do našich serverových logů.",
      ],
    },
    whoCanSee: {
      title: "Kdo vidí nastavení vašich upozornění",
      tiedToWallet:
        "Nastavení upozornění je svázané s adresou peněženky, ne s účtem s heslem. Abyste je mohli zobrazit nebo změnit, podepíšete touto peněženkou zprávu, která prokáže, že adresa patří vám. Nejde o transakci, takže neplatíte žádný gas, a jeden podpis v daném prohlížeči platí 7 dní.",
      anyone: hasTelegram =>
        `E-mailovou adresu${hasTelegram ? ", uživatelské jméno na Signalu a uživatelské jméno na Telegramu" : " a uživatelské jméno na Signalu"}, které jsou k vaší peněžence uložené, si může zobrazit a její upozornění změnit nebo smazat jen ten, kdo umí podepisovat vaší peněženkou. Veřejné záznamy o platbách popsané níže přesto ukazují, které peněženky zaplatily.`,
      dontEnter:
        "Nezadávejte e-mailovou adresu ani uživatelské jméno na Signalu, které nechcete mít spojené s adresou své peněženky.",
    },
    processors: {
      title: "Kdo s vašimi daty pracuje",
      list: ({ minutes, hasTelegram }) => [
        {
          name: "Vercel",
          role: `Hostuje tento web a každých ${minutes} minut spouští kontrolu upozornění.`,
          receives: "Každý požadavek na web včetně vaší IP adresy a naše serverové logy.",
        },
        {
          name: "Vercel Web Analytics",
          role: "Počítá zobrazení stránek, bez cookies.",
          receives:
            "U každého zobrazení stránky: adresu stránky, web, ze kterého jste přišli, vaši přibližnou polohu a váš prohlížeč, operační systém a typ zařízení. Návštěvník je otisk (hash) požadavku, který se každých 24 hodin mění, takže návštěvy nelze propojit mezi dny ani weby.",
        },
        { name: "Supabase", role: "Naše databáze.", receives: "Nastavení upozornění uvedená výše." },
        { name: "Resend", role: "Odesílá upozornění e-mailem.", receives: "Vaše e-mailová adresa a text upozornění." },
        {
          name: "Fly.io (náš přenosový server pro Signal)",
          role: "Hostuje server signal-cli-rest-api, který provozujeme a který předává upozornění na Signal službě Signal.",
          receives: "Vaše uživatelské jméno na Signalu a text upozornění (ty dostává i Signal).",
        },
        ...(hasTelegram
          ? [
              {
                name: "Telegram",
                role: "Doručuje upozornění na Telegram přes své Bot API.",
                receives: "ID vašeho chatu na Telegramu a text upozornění.",
              },
            ]
          : []),
        {
          name: "Poskytovatelé RPC (PublicNode, Alchemy a veřejné endpointy jednotlivých sítí)",
          role: "Odpovídají na čtení z blockchainu: z vašeho prohlížeče pro přehled a z našeho serveru pro kontroly upozornění a pro ověření podpisu při přihlášení chytrou peněženkou.",
          receives:
            "Adresa čtené peněženky (a při přihlášení váš podpis) a u čtení z vašeho prohlížeče také vaše IP adresa.",
        },
        {
          name: "WalletConnect",
          role: "Zprostředkovává spojení mezi tímto webem a aplikací vaší peněženky, pokud se připojujete přes WalletConnect.",
          receives:
            "To, co si aplikace vaší peněženky a tento web při připojení vyměňují, například adresa vaší peněženky.",
        },
      ],
      receives: receives => `Předávaná data: ${receives}`,
      ownPolicy: "Každá z těchto služeb s těmito daty zachází podle svých vlastních zásad ochrany osobních údajů.",
    },
    onChain: {
      title: "Co je na blockchainu veřejné",
      text: paymentChainName =>
        `Platba za upozornění probíhá ${paymentChainName ? `na síti ${paymentChainName}` : "na platební síti"}. Každá platba zaznamená adresu plátce, token, částku, čas, zakoupené období a nové datum vypršení do veřejné události, kterou si může přečíst kdokoli a nikdo ji nemůže smazat. Nastavení vašich upozornění se na blockchain nikdy nezapisuje.`,
    },
    retention: {
      title: "Jak dlouho data uchováváme a jak je smazat",
      settings:
        "Nastavení upozornění zůstává uložené, dokud upozornění v přehledu nesmažete. Smazání odstraní nastavení pro danou síť včetně e-mailové adresy a uživatelského jména na Signalu a vyžaduje aktivní přístup.",
      telegramStop:
        "Když botovi Tokenping na Telegramu pošlete /stop, váš chat se odpojí a upozornění na Telegram přestanou chodit.",
      contact: {
        before: `Pokud vám vypršel přístup nebo chcete odstranit svou odpověď na otázku ${ATTRIBUTION_QUESTION_CS}, napište nám na`,
        x: "X",
        middle: "nebo do naší komunity na",
        telegram: "Telegramu",
        or: "či",
        signal: "Signalu",
        after: "a smažeme to.",
      },
      payments: "Platby na blockchainu nemůže smazat nikdo.",
    },
    homepage: {
      before: "Odpovědi na otázky, jak upozornění fungují, najdete na ",
      link: "úvodní stránce",
      after: ".",
    },
  },
};
