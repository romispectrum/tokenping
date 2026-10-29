import type { Localized } from "~~/i18n/locales";

// The privacy page (components/pages/PrivacyPage.tsx). Every fact, processor and caveat appears in every language;
// the Czech and the Spanish are translations, never summaries. Rich text is split into the words around each link.

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
  withoutUs: { title: string; text: string; morpho: string };
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
const ATTRIBUTION_QUESTION_ES = '"¿Cómo te enteraste de Tokenping?"';
const ATTRIBUTION_QUESTION_HI = '"आपने Tokenping के बारे में कैसे सुना?"';
const ATTRIBUTION_QUESTION_DE = "„Wie hast du von Tokenping erfahren?“";
const ATTRIBUTION_QUESTION_VI = '"Bạn biết đến Tokenping qua đâu?"';

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
      morpho:
        "Na přehledu Morpho váš prohlížeč navíc posílá adresu vaší peněženky do API Morpho, které najde trhy Morpho, ve kterých si půjčujete, a vaše pozice na Morpho čte od stejných poskytovatelů RPC.",
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
          name: "API Morpho",
          role: "Pro přehled Morpho zjišťuje, ve kterých trzích uvedených v aplikaci Morpho si vaše peněženka půjčuje, a našemu serveru při uložení upozornění na Morpho říká, zda je trh uvedený.",
          receives: "Adresa vaší peněženky a u dotazů z vašeho prohlížeče také vaše IP adresa.",
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
  es: {
    metaTitle: "Privacidad y datos",
    metaDescription:
      "Qué almacena Tokenping cuando configuras una alerta del factor de salud de Aave, qué no almacena, qué servicios tratan tus datos y cómo eliminarlos.",
    crumbHome: "Inicio",
    crumbPrivacy: "Privacidad",
    title: "Privacidad: qué almacena Tokenping y quién trata los datos",
    lastUpdated: "Actualizado el",
    intro:
      "Esta página describe lo que hace la aplicación hoy. Tokenping está en beta, y actualizamos esta página cuando cambia lo que recopilamos.",
    withoutUs: {
      title: "Lo que puedes hacer sin darnos nada",
      text: "Leer el sitio y el blog, y ver tus posiciones en el panel, no agrega nada a nuestra base de datos. Para mostrar tus posiciones, tu navegador pide a proveedores de RPC (indicados más abajo) los datos de Aave de tu billetera, así que ellos ven la dirección de tu billetera.",
      morpho:
        "En el panel de Morpho, tu navegador también envía la dirección de tu billetera a la API de Morpho, que encuentra los mercados de Morpho en los que pides prestado, y lee tus posiciones de Morpho de los mismos proveedores de RPC.",
    },
    stored: {
      title: "Lo que almacenamos cuando guardas una alerta",
      items: [
        "La dirección de tu billetera.",
        "La red a la que corresponde la alerta y tu umbral.",
        "Los canales que elegiste y el idioma de cada uno.",
        "Tu dirección de correo electrónico, si elegiste correo electrónico.",
        "Tu nombre de usuario de Signal, si elegiste Signal.",
        "Cuándo se creó la alerta y cuándo se modificó por última vez.",
        "Cuándo enviaste por última vez un mensaje de prueba en cada canal, para permitir una prueba por canal cada 15 minutos.",
      ],
      telegram:
        "Si eliges Telegram, almacenamos el nombre de usuario de Telegram que escribes en la alerta. Cuando esa cuenta pulsa Iniciar en el bot de Tokenping, también almacenamos el ID de su chat y cuándo pulsó Iniciar, para que las alertas puedan llegarle. Cualquiera puede comprobar si un nombre de usuario de Telegram ha pulsado Iniciar en el bot.",
      attribution: `Si respondes la pregunta opcional ${ATTRIBUTION_QUESTION_ES} después de guardar una alerta, almacenamos tu respuesta y la hora junto con la dirección de tu billetera.`,
    },
    notStored: {
      title: "Lo que no almacenamos",
      items: [
        "Tus posiciones ni un historial de tu factor de salud. Se leen en el momento y no se guardan.",
        "Un registro de las alertas que enviamos.",
        `Píxeles de seguimiento ni cookies publicitarias: el sitio no usa ninguno. Cuando inicias sesión con tu billetera, Tokenping establece una cookie que únicamente indica qué billetera inició sesión; dura 7 días o hasta que desconectes la billetera en este sitio. Mientras inicias sesión, una segunda cookie guarda la solicitud de inicio de sesión durante cinco minutos. Tu navegador guarda en su propio almacenamiento local (local storage) el tema que elegiste, la conexión de tu billetera, qué billeteras iniciaron sesión en él y si ya te mostró la pregunta ${ATTRIBUTION_QUESTION_ES}.`,
        "Direcciones IP en nuestra base de datos. Aun así, Vercel procesa cada solicitud, como se indica más abajo. Cuando falla una revisión de alertas o un mensaje, el error, que puede incluir la dirección de tu billetera y el destinatario, va a los registros de nuestro servidor.",
      ],
    },
    whoCanSee: {
      title: "Quién puede ver tu configuración de alertas",
      tiedToWallet:
        "La configuración de alertas está vinculada a una dirección de billetera, no a una cuenta con contraseña. Para verla o cambiarla, firmas un mensaje con esa billetera, lo que demuestra que la dirección es tuya. No es una transacción y no cuesta gas, y una firma dura 7 días en ese navegador.",
      anyone: hasTelegram =>
        `Solo alguien que pueda firmar con tu billetera puede ver la dirección de correo electrónico${hasTelegram ? ", el nombre de usuario de Signal y el nombre de usuario de Telegram" : " y el nombre de usuario de Signal"} guardados para ella, o cambiar o eliminar sus alertas. Aun así, los registros públicos de pagos descritos más abajo muestran qué billeteras han pagado.`,
      dontEnter:
        "No escribas una dirección de correo electrónico ni un nombre de usuario de Signal que no quieras que quede vinculado a la dirección de tu billetera.",
    },
    processors: {
      title: "Quién trata tus datos",
      list: ({ minutes, hasTelegram }) => [
        {
          name: "Vercel",
          role: `Aloja este sitio y ejecuta la revisión de alertas cada ${minutes} minutos.`,
          receives: "Cada solicitud al sitio, incluida tu dirección IP, y los registros de nuestro servidor.",
        },
        {
          name: "Vercel Web Analytics",
          role: "Cuenta las páginas vistas, sin cookies.",
          receives:
            "Por cada página vista: la dirección de la página, el sitio del que vienes, tu ubicación aproximada, y tu navegador, sistema operativo y tipo de dispositivo. Un visitante es un hash de la solicitud que cambia cada 24 horas, así que las visitas no se pueden vincular entre días ni entre sitios.",
        },
        { name: "Supabase", role: "Nuestra base de datos.", receives: "La configuración de alertas indicada arriba." },
        {
          name: "Resend",
          role: "Envía las alertas por correo electrónico.",
          receives: "Tu dirección de correo electrónico y el texto de la alerta.",
        },
        {
          name: "Fly.io (nuestro servidor de retransmisión de Signal)",
          role: "Aloja el servidor signal-cli-rest-api que operamos, que entrega las alertas de Signal a Signal.",
          receives: "Tu nombre de usuario de Signal y el texto de la alerta (que también recibe Signal).",
        },
        ...(hasTelegram
          ? [
              {
                name: "Telegram",
                role: "Entrega las alertas de Telegram a través de su Bot API.",
                receives: "El ID de tu chat de Telegram y el texto de la alerta.",
              },
            ]
          : []),
        {
          name: "Proveedores de RPC (PublicNode, Alchemy y los endpoints públicos de las redes)",
          role: "Responden las lecturas de la blockchain: desde tu navegador para el panel, y desde nuestro servidor para las revisiones de alertas y para verificar las firmas de inicio de sesión de billeteras inteligentes.",
          receives:
            "La dirección de billetera que se lee (y, cuando inicias sesión, tu firma), y tu dirección IP en las lecturas hechas desde tu navegador.",
        },
        {
          name: "API de Morpho",
          role: "Encuentra los mercados de Morpho listados en los que pide prestado tu billetera, para el panel de Morpho, y le indica a nuestro servidor si un mercado está listado cuando guardas una alerta de Morpho.",
          receives: "La dirección de tu billetera, y tu dirección IP en las consultas que hace tu navegador.",
        },
        {
          name: "WalletConnect",
          role: "Retransmite la conexión entre este sitio y la aplicación de tu billetera, si te conectas con WalletConnect.",
          receives:
            "Lo que la aplicación de tu billetera y este sitio intercambian para conectarse, como la dirección de tu billetera.",
        },
      ],
      receives: receives => `Recibe: ${receives}`,
      ownPolicy: "Cada uno de estos servicios trata esos datos según su propia política de privacidad.",
    },
    onChain: {
      title: "Lo que es público en la blockchain",
      text: paymentChainName =>
        `El pago de las alertas se hace en ${paymentChainName ? `la red ${paymentChainName}` : "la red de pago"}. Cada pago registra la dirección que paga, el token, el monto, la hora, el período comprado y la nueva fecha de expiración en un evento público que cualquiera puede leer y nadie puede borrar. Tu configuración de alertas nunca se escribe en una blockchain.`,
    },
    retention: {
      title: "Cuánto tiempo lo conservamos y cómo eliminarlo",
      settings:
        "La configuración de alertas se conserva hasta que eliminas la alerta en el panel. Eliminarla borra la configuración de esa red, incluidos la dirección de correo electrónico y el nombre de usuario de Signal, y requiere acceso activo.",
      telegramStop:
        "Enviar /stop al bot de Tokenping en Telegram desvincula tu chat y detiene las alertas de Telegram.",
      contact: {
        before: `Si tu acceso expiró, o quieres que eliminemos tu respuesta a la pregunta ${ATTRIBUTION_QUESTION_ES}, escríbenos en`,
        x: "X",
        middle: "o en nuestra comunidad en",
        telegram: "Telegram",
        or: "o",
        signal: "Signal",
        after: "y lo eliminaremos.",
      },
      payments: "Nadie puede eliminar los pagos en la blockchain.",
    },
    homepage: {
      before: "Las preguntas sobre cómo funcionan las alertas se responden en la ",
      link: "página de inicio",
      after: ".",
    },
  },
  hi: {
    metaTitle: "गोपनीयता और डेटा",
    metaDescription:
      "जब आप Aave हेल्थ फ़ैक्टर अलर्ट सेट करते हैं तो Tokenping क्या स्टोर करता है, क्या नहीं, कौन सी सेवाएं आपका डेटा संभालती हैं और उसे कैसे हटाएं।",
    crumbHome: "होम",
    crumbPrivacy: "गोपनीयता",
    title: "गोपनीयता: Tokenping क्या स्टोर करता है और कौन उसे संभालता है",
    lastUpdated: "आख़िरी अपडेट:",
    intro:
      "यह पेज बताता है कि ऐप आज क्या करता है। Tokenping बीटा में है, और जब हम जो इकट्ठा करते हैं वह बदलता है, तो हम यह पेज अपडेट करते हैं।",
    withoutUs: {
      title: "आप हमें कुछ दिए बिना क्या कर सकते हैं",
      text: "साइट और ब्लॉग पढ़ने से, और डैशबोर्ड पर अपनी पोज़िशन देखने से, हमारे डेटाबेस में कुछ नहीं जुड़ता। आपकी पोज़िशन दिखाने के लिए आपका ब्राउज़र RPC प्रोवाइडरों (नीचे सूचीबद्ध) से आपके वॉलेट का Aave डेटा मांगता है, इसलिए वे आपका वॉलेट एड्रेस देखते हैं।",
      morpho:
        "Morpho डैशबोर्ड पर आपका ब्राउज़र आपका वॉलेट एड्रेस Morpho के API को भी भेजता है, जो वे Morpho मार्केट ढूंढता है जिनमें आप उधार लेते हैं, और आपकी Morpho पोज़िशन उन्हीं RPC प्रोवाइडरों से पढ़ता है।",
    },
    stored: {
      title: "अलर्ट सहेजने पर हम क्या स्टोर करते हैं",
      items: [
        "आपका वॉलेट एड्रेस।",
        "वह नेटवर्क जिसके लिए अलर्ट है, और आपकी सीमा।",
        "आपके चुने हुए चैनल, और हर एक की भाषा।",
        "आपका ईमेल पता, अगर आपने ईमेल चुना।",
        "आपका Signal यूज़रनेम, अगर आपने Signal चुना।",
        "अलर्ट कब बनाया गया और आख़िरी बार कब बदला गया।",
        "आपने हर चैनल पर आख़िरी बार टेस्ट संदेश कब भेजा, ताकि हर चैनल पर हर 15 मिनट में एक टेस्ट की अनुमति दी जा सके।",
      ],
      telegram:
        "अगर आप Telegram चुनते हैं, तो हम वह Telegram यूज़रनेम स्टोर करते हैं जो आप अलर्ट में लिखते हैं। जब वह अकाउंट Tokenping बॉट में Start दबाता है, तो हम उसकी चैट ID और Start दबाने का समय भी स्टोर करते हैं, ताकि अलर्ट उस तक पहुंच सकें। कोई भी यह जांच सकता है कि किसी Telegram यूज़रनेम ने बॉट में Start दबाया है या नहीं।",
      attribution: `अगर आप अलर्ट सहेजने के बाद वैकल्पिक ${ATTRIBUTION_QUESTION_HI} सवाल का जवाब देते हैं, तो हम आपका जवाब और समय आपके वॉलेट एड्रेस के साथ स्टोर करते हैं।`,
    },
    notStored: {
      title: "हम क्या स्टोर नहीं करते",
      items: [
        "आपकी पोज़िशन या आपके हेल्थ फ़ैक्टर का इतिहास। वे लाइव पढ़े जाते हैं और सहेजे नहीं जाते।",
        "हमारे भेजे गए अलर्ट का लॉग।",
        `ट्रैकिंग पिक्सेल या विज्ञापन कुकीज़: साइट इनमें से कुछ भी इस्तेमाल नहीं करती। जब आप अपने वॉलेट से साइन इन करते हैं, तो Tokenping एक कुकी सेट करता है जो सिर्फ़ यह बताती है कि किस वॉलेट ने साइन इन किया; यह 7 दिन तक या इस साइट पर वॉलेट डिस्कनेक्ट करने तक रहती है। साइन इन के दौरान एक दूसरी कुकी पांच मिनट के लिए साइन-इन अनुरोध रखती है। आपका ब्राउज़र अपने लोकल स्टोरेज (local storage) में आपकी थीम की पसंद, आपका वॉलेट कनेक्शन, उस पर किन वॉलेट ने साइन इन किया है और क्या उसने आपको ${ATTRIBUTION_QUESTION_HI} सवाल पहले ही दिखाया है, रखता है।`,
        "हमारे डेटाबेस में IP पते। फिर भी Vercel हर अनुरोध संभालता है, जैसा नीचे बताया गया है। जब कोई अलर्ट जांच या संदेश विफल होता है, तो त्रुटि, जिसमें आपका वॉलेट एड्रेस और प्राप्तकर्ता शामिल हो सकते हैं, हमारे सर्वर लॉग में जाती है।",
      ],
    },
    whoCanSee: {
      title: "आपकी अलर्ट सेटिंग कौन देख सकता है",
      tiedToWallet:
        "अलर्ट सेटिंग एक वॉलेट एड्रेस से जुड़ी होती है, पासवर्ड वाले किसी अकाउंट से नहीं। उसे देखने या बदलने के लिए आप उस वॉलेट से एक संदेश पर हस्ताक्षर करते हैं, जिससे साबित होता है कि वह एड्रेस आपका है। यह कोई ट्रांज़ैक्शन नहीं है और इसमें कोई गैस नहीं लगती, और एक हस्ताक्षर उस ब्राउज़र पर 7 दिन तक चलता है।",
      anyone: hasTelegram =>
        `सिर्फ़ वही, जो आपके वॉलेट से हस्ताक्षर कर सकता है, उसके लिए सहेजा गया ईमेल पता${hasTelegram ? ", Signal यूज़रनेम और Telegram यूज़रनेम" : " और Signal यूज़रनेम"} देख सकता है, या उसके अलर्ट बदल या हटा सकता है। नीचे बताए गए सार्वजनिक भुगतान रिकॉर्ड फिर भी दिखाते हैं कि किन वॉलेट ने भुगतान किया है।`,
      dontEnter: "ऐसा ईमेल पता या Signal यूज़रनेम न लिखें जिसे आप अपने वॉलेट एड्रेस से जुड़ा नहीं देखना चाहेंगे।",
    },
    processors: {
      title: "आपका डेटा कौन संभालता है",
      list: ({ minutes, hasTelegram }) => [
        {
          name: "Vercel",
          role: `इस साइट को होस्ट करता है और हर ${minutes} मिनट में अलर्ट जांच चलाता है।`,
          receives: "साइट पर हर अनुरोध, आपके IP पते सहित, और हमारे सर्वर लॉग।",
        },
        {
          name: "Vercel Web Analytics",
          role: "पेज व्यू गिनता है, बिना कुकीज़ के।",
          receives:
            "हर पेज व्यू के लिए: पेज का पता, वह साइट जहां से आप आए, आपका अनुमानित स्थान, और आपका ब्राउज़र, ऑपरेटिंग सिस्टम और डिवाइस का प्रकार। विज़िटर अनुरोध का एक हैश है जो हर 24 घंटे में बदलता है, इसलिए विज़िट को अलग-अलग दिनों या साइटों के बीच जोड़ा नहीं जा सकता।",
        },
        { name: "Supabase", role: "हमारा डेटाबेस।", receives: "ऊपर सूचीबद्ध अलर्ट सेटिंग।" },
        { name: "Resend", role: "अलर्ट ईमेल भेजता है।", receives: "आपका ईमेल पता और अलर्ट का टेक्स्ट।" },
        {
          name: "Fly.io (हमारा Signal रिले)",
          role: "वह signal-cli-rest-api सर्वर होस्ट करता है जो हम चलाते हैं और जो Signal अलर्ट Signal को सौंपता है।",
          receives: "आपका Signal यूज़रनेम और अलर्ट का टेक्स्ट (और यही Signal को भी मिलता है)।",
        },
        ...(hasTelegram
          ? [
              {
                name: "Telegram",
                role: "अपने Bot API के ज़रिए Telegram अलर्ट पहुंचाता है।",
                receives: "आपकी Telegram चैट ID और अलर्ट का टेक्स्ट।",
              },
            ]
          : []),
        {
          name: "RPC प्रोवाइडर (PublicNode, Alchemy और नेटवर्क के सार्वजनिक एंडपॉइंट)",
          role: "ब्लॉकचेन रीड का जवाब देते हैं: डैशबोर्ड के लिए आपके ब्राउज़र से, और अलर्ट जांच के लिए और स्मार्ट वॉलेट के साइन-इन हस्ताक्षर जांचने के लिए हमारे सर्वर से।",
          receives:
            "जो वॉलेट एड्रेस पढ़ा जा रहा है (और, जब आप साइन इन करते हैं, आपका हस्ताक्षर), और आपके ब्राउज़र से किए गए रीड के लिए आपका IP पता।",
        },
        {
          name: "Morpho का API",
          role: "Morpho डैशबोर्ड के लिए वे सूचीबद्ध Morpho मार्केट ढूंढता है जिनमें आपका वॉलेट उधार लेता है, और जब आप Morpho अलर्ट सहेजते हैं तो हमारे सर्वर को बताता है कि कोई मार्केट सूचीबद्ध है या नहीं।",
          receives: "आपका वॉलेट एड्रेस, और आपके ब्राउज़र की खोजों के लिए आपका IP पता।",
        },
        {
          name: "WalletConnect",
          role: "अगर आप WalletConnect से कनेक्ट करते हैं, तो इस साइट और आपके वॉलेट ऐप के बीच कनेक्शन रिले करता है।",
          receives: "कनेक्ट होने के लिए आपका वॉलेट ऐप और यह साइट जो आपस में भेजते हैं, जैसे आपका वॉलेट एड्रेस।",
        },
      ],
      receives: receives => `प्राप्त करता है: ${receives}`,
      ownPolicy: "इनमें से हर सेवा उस डेटा को अपनी गोपनीयता नीति के तहत संभालती है।",
    },
    onChain: {
      title: "ब्लॉकचेन पर क्या सार्वजनिक है",
      text: paymentChainName =>
        `अलर्ट का भुगतान ${paymentChainName ? `${paymentChainName} नेटवर्क` : "भुगतान नेटवर्क"} पर होता है। हर भुगतान भुगतान करने वाला एड्रेस, टोकन, राशि, समय, खरीदी गई अवधि और नई समाप्ति तारीख़ एक सार्वजनिक इवेंट में दर्ज करता है, जिसे कोई भी पढ़ सकता है और कोई नहीं हटा सकता। आपकी अलर्ट सेटिंग कभी किसी ब्लॉकचेन पर नहीं लिखी जाती।`,
    },
    retention: {
      title: "हम इसे कितने समय तक रखते हैं, और इसे कैसे हटाएं",
      settings:
        "अलर्ट सेटिंग तब तक रहती है जब तक आप डैशबोर्ड में अलर्ट नहीं हटाते। हटाने से उस नेटवर्क की सेटिंग हट जाती है, ईमेल पते और Signal यूज़रनेम सहित, और इसके लिए सक्रिय एक्सेस चाहिए।",
      telegramStop:
        "Telegram में Tokenping बॉट को /stop भेजने से आपकी चैट अनलिंक हो जाती है और Telegram अलर्ट बंद हो जाते हैं।",
      contact: {
        before: `अगर आपका एक्सेस समाप्त हो गया है, या आप अपना ${ATTRIBUTION_QUESTION_HI} जवाब हटवाना चाहते हैं, तो हमें संदेश भेजें`,
        x: "X",
        middle: "पर या हमारे समुदाय में",
        telegram: "Telegram",
        or: "या",
        signal: "Signal",
        after: "पर, और हम उसे हटा देंगे।",
      },
      payments: "ब्लॉकचेन पर हुए भुगतान को कोई भी नहीं हटा सकता।",
    },
    homepage: {
      before: "अलर्ट कैसे काम करते हैं, इसके जवाब ",
      link: "होमपेज",
      after: " पर हैं।",
    },
  },
  de: {
    metaTitle: "Datenschutz und Daten",
    metaDescription:
      "Was Tokenping speichert, wenn du einen Health-Factor-Alert für Aave einrichtest, was nicht, welche Dienste deine Daten verarbeiten und wie du sie löschst.",
    crumbHome: "Startseite",
    crumbPrivacy: "Datenschutz",
    title: "Datenschutz: was Tokenping speichert und wer es verarbeitet",
    lastUpdated: "Zuletzt aktualisiert am",
    intro:
      "Diese Seite beschreibt, was die App heute tut. Tokenping ist in der Beta, und wir aktualisieren diese Seite, wenn sich ändert, was wir erfassen.",
    withoutUs: {
      title: "Was du tun kannst, ohne uns etwas zu geben",
      text: "Die Website und den Blog zu lesen und deine Positionen im Dashboard anzusehen, fügt unserer Datenbank nichts hinzu. Um deine Positionen anzuzeigen, fragt dein Browser RPC-Anbieter (unten aufgeführt) nach den Aave-Daten deiner Wallet, daher sehen sie deine Wallet-Adresse.",
      morpho:
        "Im Morpho-Dashboard sendet dein Browser deine Wallet-Adresse außerdem an die API von Morpho, die die Morpho-Märkte findet, in denen du leihst, und liest deine Morpho-Positionen über dieselben RPC-Anbieter.",
    },
    stored: {
      title: "Was wir speichern, wenn du einen Alert speicherst",
      items: [
        "Deine Wallet-Adresse.",
        "Das Netzwerk, für das der Alert gilt, und dein Schwellenwert.",
        "Die Kanäle, die du gewählt hast, und die Sprache jedes Kanals.",
        "Deine E-Mail-Adresse, wenn du E-Mail gewählt hast.",
        "Dein Signal-Benutzername, wenn du Signal gewählt hast.",
        "Wann der Alert erstellt und wann er zuletzt geändert wurde.",
        "Wann du zuletzt über jeden Kanal eine Testnachricht gesendet hast, um einen Test pro Kanal alle 15 Minuten zu erlauben.",
      ],
      telegram:
        "Wenn du Telegram wählst, speichern wir den Telegram-Benutzernamen, den du im Alert eingibst. Wenn dieses Konto im Tokenping-Bot auf Start drückt, speichern wir außerdem seine Chat-ID und den Zeitpunkt, zu dem es auf Start gedrückt hat, damit Alerts es erreichen können. Jeder kann prüfen, ob ein Telegram-Benutzername im Bot auf Start gedrückt hat.",
      attribution: `Wenn du nach dem Speichern eines Alerts die freiwillige Frage ${ATTRIBUTION_QUESTION_DE} beantwortest, speichern wir deine Antwort und den Zeitpunkt zusammen mit deiner Wallet-Adresse.`,
    },
    notStored: {
      title: "Was wir nicht speichern",
      items: [
        "Deine Positionen oder ein Verlauf deines Health Factors. Sie werden live gelesen und nicht gespeichert.",
        "Ein Protokoll der Alerts, die wir gesendet haben.",
        `Tracking-Pixel oder Werbe-Cookies: Die Website verwendet keine. Wenn du dich mit deiner Wallet anmeldest, setzt Tokenping ein Cookie, das nur angibt, welche Wallet sich angemeldet hat; es gilt 7 Tage oder bis du die Wallet auf dieser Website trennst. Während du dich anmeldest, hält ein zweites Cookie die Anmeldeanfrage fünf Minuten lang. Dein Browser speichert in seinem eigenen lokalen Speicher (local storage) dein gewähltes Farbschema, deine Wallet-Verbindung, welche Wallets sich in ihm angemeldet haben und ob er dir die Frage ${ATTRIBUTION_QUESTION_DE} schon gezeigt hat.`,
        "IP-Adressen in unserer Datenbank. Vercel verarbeitet trotzdem jede Anfrage, wie unten aufgeführt. Wenn eine Alert-Prüfung oder eine Nachricht fehlschlägt, landet der Fehler, der deine Wallet-Adresse und den Empfänger enthalten kann, in unseren Server-Logs.",
      ],
    },
    whoCanSee: {
      title: "Wer deine Alert-Einstellungen sehen kann",
      tiedToWallet:
        "Alert-Einstellungen sind an eine Wallet-Adresse gebunden, nicht an ein Konto mit Passwort. Um sie zu sehen oder zu ändern, signierst du mit dieser Wallet eine Nachricht, die beweist, dass die Adresse dir gehört. Das ist keine Transaktion und kostet kein Gas, und eine Signatur gilt 7 Tage in diesem Browser.",
      anyone: hasTelegram =>
        `Nur wer mit deiner Wallet signieren kann, kann die für sie gespeicherte E-Mail-Adresse${hasTelegram ? ", den Signal-Benutzernamen und den Telegram-Benutzernamen" : " und den Signal-Benutzernamen"} sehen oder ihre Alerts ändern oder löschen. Die unten beschriebenen öffentlichen Zahlungsdaten zeigen trotzdem, welche Wallets bezahlt haben.`,
      dontEnter:
        "Gib keine E-Mail-Adresse und keinen Signal-Benutzernamen ein, die du nicht mit deiner Wallet-Adresse verknüpft sehen willst.",
    },
    processors: {
      title: "Wer deine Daten verarbeitet",
      list: ({ minutes, hasTelegram }) => [
        {
          name: "Vercel",
          role: `Hostet diese Website und führt alle ${minutes} Minuten die Alert-Prüfung aus.`,
          receives: "Jede Anfrage an die Website, einschließlich deiner IP-Adresse, und unsere Server-Logs.",
        },
        {
          name: "Vercel Web Analytics",
          role: "Zählt Seitenaufrufe, ohne Cookies.",
          receives:
            "Für jeden Seitenaufruf: die Adresse der Seite, die Website, von der du kommst, deinen ungefähren Standort sowie deinen Browser, dein Betriebssystem und deinen Gerätetyp. Ein Besucher ist ein Hash der Anfrage, der sich alle 24 Stunden ändert, sodass Besuche nicht über Tage oder Websites hinweg verknüpft werden können.",
        },
        { name: "Supabase", role: "Unsere Datenbank.", receives: "Die oben aufgeführten Alert-Einstellungen." },
        { name: "Resend", role: "Versendet Alert-E-Mails.", receives: "Deine E-Mail-Adresse und den Text des Alerts." },
        {
          name: "Fly.io (unser Signal-Relay)",
          role: "Hostet den von uns betriebenen signal-cli-rest-api-Server, der Signal-Alerts an Signal übergibt.",
          receives: "Deinen Signal-Benutzernamen und den Text des Alerts (ebenso wie Signal).",
        },
        ...(hasTelegram
          ? [
              {
                name: "Telegram",
                role: "Stellt Telegram-Alerts über seine Bot API zu.",
                receives: "Deine Telegram-Chat-ID und den Text des Alerts.",
              },
            ]
          : []),
        {
          name: "RPC-Anbieter (PublicNode, Alchemy und die öffentlichen Endpunkte der Netzwerke)",
          role: "Beantworten die Abfragen an die Blockchain: aus deinem Browser für das Dashboard und von unserem Server für Alert-Prüfungen und zur Prüfung von Anmeldesignaturen von Smart Wallets.",
          receives:
            "Die abgefragte Wallet-Adresse (und bei der Anmeldung deine Signatur) sowie deine IP-Adresse bei Abfragen aus deinem Browser.",
        },
        {
          name: "API von Morpho",
          role: "Findet für das Morpho-Dashboard die gelisteten Morpho-Märkte, in denen deine Wallet leiht, und teilt unserem Server mit, ob ein Markt gelistet ist, wenn du einen Morpho-Alert speicherst.",
          receives: "Deine Wallet-Adresse sowie deine IP-Adresse bei den Abfragen, die dein Browser macht.",
        },
        {
          name: "WalletConnect",
          role: "Leitet die Verbindung zwischen dieser Website und deiner Wallet-App weiter, wenn du dich mit WalletConnect verbindest.",
          receives:
            "Was deine Wallet-App und diese Website austauschen, um sich zu verbinden, etwa deine Wallet-Adresse.",
        },
      ],
      receives: receives => `Erhält: ${receives}`,
      ownPolicy: "Jeder dieser Dienste verarbeitet diese Daten nach seiner eigenen Datenschutzerklärung.",
    },
    onChain: {
      title: "Was auf der Blockchain öffentlich ist",
      text: paymentChainName =>
        `Die Zahlung für Alerts erfolgt ${paymentChainName ? `im Netzwerk ${paymentChainName}` : "im Zahlungsnetzwerk"}. Jede Zahlung hält die zahlende Adresse, den Token, den Betrag, den Zeitpunkt, den gekauften Zeitraum und das neue Ablaufdatum in einem öffentlichen Event fest, das jeder lesen und niemand löschen kann. Deine Alert-Einstellungen werden nie auf eine Blockchain geschrieben.`,
    },
    retention: {
      title: "Wie lange wir sie aufbewahren und wie du sie löschst",
      settings:
        "Alert-Einstellungen bleiben gespeichert, bis du den Alert im Dashboard löschst. Das Löschen entfernt die Einstellungen für dieses Netzwerk, einschließlich E-Mail-Adresse und Signal-Benutzername, und setzt aktiven Zugang voraus.",
      telegramStop:
        "Wenn du /stop an den Tokenping-Bot in Telegram sendest, wird die Verknüpfung mit deinem Chat aufgehoben und Telegram-Alerts werden beendet.",
      contact: {
        before: `Wenn dein Zugang abgelaufen ist oder du deine Antwort auf die Frage ${ATTRIBUTION_QUESTION_DE} entfernen lassen willst, schreib uns auf`,
        x: "X",
        middle: "oder in unserer Community auf",
        telegram: "Telegram",
        or: "oder",
        signal: "Signal",
        after: "und wir löschen sie.",
      },
      payments: "Zahlungen auf der Blockchain kann niemand löschen.",
    },
    homepage: {
      before: "Fragen dazu, wie Alerts funktionieren, beantwortet die ",
      link: "Startseite",
      after: ".",
    },
  },
  vi: {
    metaTitle: "Quyền riêng tư và dữ liệu",
    metaDescription:
      "Tokenping lưu gì khi bạn cài đặt cảnh báo hệ số sức khỏe Aave, không lưu gì, dịch vụ nào xử lý dữ liệu của bạn và cách xóa dữ liệu.",
    crumbHome: "Trang chủ",
    crumbPrivacy: "Quyền riêng tư",
    title: "Quyền riêng tư: Tokenping lưu gì và ai xử lý dữ liệu",
    lastUpdated: "Cập nhật lần cuối ngày",
    intro:
      "Trang này mô tả những gì ứng dụng làm hiện nay. Tokenping đang ở giai đoạn beta, và chúng tôi cập nhật trang này khi những gì chúng tôi thu thập thay đổi.",
    withoutUs: {
      title: "Những gì bạn có thể làm mà không cần cung cấp gì cho chúng tôi",
      text: "Đọc trang web và blog, và xem vị thế của bạn trên bảng điều khiển, không thêm gì vào cơ sở dữ liệu của chúng tôi. Để hiển thị vị thế của bạn, trình duyệt của bạn hỏi các nhà cung cấp RPC (liệt kê bên dưới) về dữ liệu Aave của ví bạn, nên họ thấy địa chỉ ví của bạn.",
      morpho:
        "Trên bảng điều khiển Morpho, trình duyệt của bạn còn gửi địa chỉ ví của bạn đến API của Morpho (API này tìm các thị trường Morpho mà bạn đang vay), và đọc các vị thế Morpho của bạn từ cùng các nhà cung cấp RPC đó.",
    },
    stored: {
      title: "Những gì chúng tôi lưu khi bạn lưu một cảnh báo",
      items: [
        "Địa chỉ ví của bạn.",
        "Mạng mà cảnh báo áp dụng, và ngưỡng của bạn.",
        "Các kênh bạn đã chọn, và ngôn ngữ của từng kênh.",
        "Địa chỉ email của bạn, nếu bạn chọn email.",
        "Tên người dùng Signal của bạn, nếu bạn chọn Signal.",
        "Thời điểm cảnh báo được tạo và được thay đổi lần cuối.",
        "Thời điểm bạn gửi tin nhắn thử lần cuối trên mỗi kênh, để cho phép một lần gửi thử trên mỗi kênh trong mỗi 15 phút.",
      ],
      telegram:
        "Nếu bạn chọn Telegram, chúng tôi lưu tên người dùng Telegram mà bạn nhập vào cảnh báo. Khi tài khoản đó nhấn Start trong bot Tokenping, chúng tôi còn lưu ID cuộc trò chuyện (chat ID) của tài khoản đó và thời điểm nó nhấn Start, để cảnh báo có thể đến được tài khoản đó. Bất kỳ ai cũng có thể kiểm tra xem một tên người dùng Telegram đã nhấn Start trong bot hay chưa.",
      attribution: `Nếu bạn trả lời câu hỏi không bắt buộc ${ATTRIBUTION_QUESTION_VI} sau khi lưu một cảnh báo, chúng tôi lưu câu trả lời của bạn và thời điểm trả lời cùng với địa chỉ ví của bạn.`,
    },
    notStored: {
      title: "Những gì chúng tôi không lưu",
      items: [
        "Vị thế của bạn hay lịch sử hệ số sức khỏe của bạn. Chúng được đọc trực tiếp mỗi lần và không được lưu lại.",
        "Nhật ký các cảnh báo chúng tôi đã gửi.",
        `Pixel theo dõi hay cookie quảng cáo: trang web không dùng loại nào. Khi bạn đăng nhập bằng ví, Tokenping đặt một cookie chỉ cho biết ví nào đã đăng nhập; cookie này tồn tại 7 ngày hoặc cho đến khi bạn ngắt kết nối ví trên trang web này. Trong lúc bạn đăng nhập, một cookie thứ hai giữ yêu cầu đăng nhập trong năm phút. Trình duyệt của bạn giữ trong bộ nhớ cục bộ (local storage) của chính nó: giao diện (theme) bạn chọn, kết nối ví của bạn, những ví nào đã đăng nhập trên trình duyệt đó và việc trình duyệt đã hiển thị câu hỏi ${ATTRIBUTION_QUESTION_VI} cho bạn hay chưa.`,
        "Địa chỉ IP trong cơ sở dữ liệu của chúng tôi. Dù vậy, Vercel vẫn xử lý mọi yêu cầu, như liệt kê bên dưới. Khi một lần kiểm tra cảnh báo hoặc một tin nhắn bị lỗi, thông báo lỗi, có thể bao gồm địa chỉ ví của bạn và người nhận, được ghi vào nhật ký máy chủ (server log) của chúng tôi.",
      ],
    },
    whoCanSee: {
      title: "Ai có thể xem cài đặt cảnh báo của bạn",
      tiedToWallet:
        "Cài đặt cảnh báo gắn với một địa chỉ ví, không gắn với một tài khoản có mật khẩu. Để xem hoặc thay đổi chúng, bạn ký một tin nhắn bằng ví đó, việc này chứng minh địa chỉ đó là của bạn. Đây không phải là giao dịch và không tốn phí gas, và một chữ ký có hiệu lực 7 ngày trên trình duyệt đó.",
      anyone: hasTelegram =>
        `Chỉ người có thể ký bằng ví của bạn mới xem được địa chỉ email${hasTelegram ? ", tên người dùng Signal và tên người dùng Telegram" : " và tên người dùng Signal"} đã lưu cho ví đó, hoặc thay đổi hay xóa các cảnh báo của ví đó. Dù vậy, các bản ghi thanh toán công khai được mô tả bên dưới vẫn cho thấy những ví nào đã thanh toán.`,
      dontEnter:
        "Đừng nhập địa chỉ email hoặc tên người dùng Signal mà bạn không muốn bị liên kết với địa chỉ ví của mình.",
    },
    processors: {
      title: "Ai xử lý dữ liệu của bạn",
      list: ({ minutes, hasTelegram }) => [
        {
          name: "Vercel",
          role: `Lưu trữ (host) trang web này và chạy việc kiểm tra cảnh báo mỗi ${minutes} phút.`,
          receives: "Mọi yêu cầu đến trang web, bao gồm địa chỉ IP của bạn, và nhật ký máy chủ của chúng tôi.",
        },
        {
          name: "Vercel Web Analytics",
          role: "Đếm lượt xem trang, không dùng cookie.",
          receives:
            "Với mỗi lượt xem trang: địa chỉ trang, trang web bạn đến từ đó, vị trí gần đúng của bạn, và trình duyệt, hệ điều hành và loại thiết bị của bạn. Một khách truy cập là một giá trị băm (hash) của yêu cầu, thay đổi sau mỗi 24 giờ, nên các lượt truy cập không thể được liên kết giữa các ngày hay giữa các trang web.",
        },
        {
          name: "Supabase",
          role: "Cơ sở dữ liệu của chúng tôi.",
          receives: "Các cài đặt cảnh báo được liệt kê ở trên.",
        },
        { name: "Resend", role: "Gửi email cảnh báo.", receives: "Địa chỉ email của bạn và nội dung cảnh báo." },
        {
          name: "Fly.io (máy chủ chuyển tiếp Signal của chúng tôi)",
          role: "Lưu trữ máy chủ signal-cli-rest-api do chúng tôi vận hành, máy chủ này chuyển cảnh báo Signal cho Signal.",
          receives: "Tên người dùng Signal của bạn và nội dung cảnh báo (Signal cũng nhận được những thông tin này).",
        },
        ...(hasTelegram
          ? [
              {
                name: "Telegram",
                role: "Gửi cảnh báo Telegram qua Bot API của Telegram.",
                receives: "ID cuộc trò chuyện Telegram của bạn và nội dung cảnh báo.",
              },
            ]
          : []),
        {
          name: "Nhà cung cấp RPC (PublicNode, Alchemy và các endpoint công khai của các mạng)",
          role: "Trả lời các yêu cầu đọc blockchain: từ trình duyệt của bạn cho bảng điều khiển, và từ máy chủ của chúng tôi cho việc kiểm tra cảnh báo và để kiểm tra chữ ký đăng nhập từ ví thông minh (smart wallet).",
          receives:
            "Địa chỉ ví đang được đọc (và, khi bạn đăng nhập, chữ ký của bạn), và địa chỉ IP của bạn với các yêu cầu đọc từ trình duyệt của bạn.",
        },
        {
          name: "API của Morpho",
          role: "Tìm các thị trường Morpho được liệt kê mà ví của bạn đang vay, cho bảng điều khiển Morpho, và cho máy chủ của chúng tôi biết một thị trường có được liệt kê hay không khi bạn lưu một cảnh báo Morpho.",
          receives: "Địa chỉ ví của bạn, và địa chỉ IP của bạn với các lần tra cứu do trình duyệt của bạn thực hiện.",
        },
        {
          name: "WalletConnect",
          role: "Chuyển tiếp kết nối giữa trang web này và ứng dụng ví của bạn, nếu bạn kết nối bằng WalletConnect.",
          receives:
            "Những gì ứng dụng ví của bạn và trang web này trao đổi để kết nối, chẳng hạn như địa chỉ ví của bạn.",
        },
      ],
      receives: receives => `Nhận: ${receives}`,
      ownPolicy: "Mỗi dịch vụ này xử lý dữ liệu đó theo chính sách quyền riêng tư của riêng mình.",
    },
    onChain: {
      title: "Những gì công khai trên blockchain",
      text: paymentChainName =>
        `Việc thanh toán cho cảnh báo diễn ra trên ${paymentChainName ? `mạng ${paymentChainName}` : "mạng thanh toán"}. Mỗi khoản thanh toán ghi lại địa chỉ thanh toán, token, số tiền, thời điểm, khoảng thời gian đã mua và ngày hết hạn mới trong một sự kiện (event) công khai mà ai cũng có thể đọc và không ai có thể xóa. Cài đặt cảnh báo của bạn không bao giờ được ghi lên blockchain.`,
    },
    retention: {
      title: "Chúng tôi giữ dữ liệu bao lâu, và cách xóa",
      settings:
        "Cài đặt cảnh báo được giữ cho đến khi bạn xóa cảnh báo trong bảng điều khiển. Việc xóa sẽ gỡ bỏ cài đặt của mạng đó, bao gồm địa chỉ email và tên người dùng Signal, và cần quyền truy cập còn hiệu lực.",
      telegramStop:
        "Gửi /stop cho bot Tokenping trong Telegram sẽ hủy liên kết cuộc trò chuyện của bạn và dừng cảnh báo qua Telegram.",
      contact: {
        before: `Nếu quyền truy cập của bạn đã hết hạn, hoặc bạn muốn xóa câu trả lời của mình cho câu hỏi ${ATTRIBUTION_QUESTION_VI}, hãy nhắn cho chúng tôi trên`,
        x: "X",
        middle: "hoặc trong cộng đồng của chúng tôi trên",
        telegram: "Telegram",
        or: "hoặc",
        signal: "Signal",
        after: "và chúng tôi sẽ xóa.",
      },
      payments: "Không ai có thể xóa các khoản thanh toán trên blockchain.",
    },
    homepage: {
      before: "Các câu hỏi về cách cảnh báo hoạt động được trả lời trên ",
      link: "trang chủ",
      after: ".",
    },
  },
};
