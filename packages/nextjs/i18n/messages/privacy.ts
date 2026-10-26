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
};
