import type { Localized } from "~~/i18n/locales";

// The site chrome in every language: the beta strip and skip link, the header, the footer, the shared UI primitives,
// the wallet button, the developer faucet and the 404. Rich text is split into the words around the markup, so each
// language keeps its own word order.

type CommonMessages = {
  skipToContent: string;
  beta: {
    /** The strip's region name. */
    region: string;
    status: string;
    /** The visible words before the X mark. */
    followUs: string;
    /** The link's accessible name: the visible words plus the mark's name. */
    followUsLabel: string;
  };
  /** The logo link's accessible name, in the header and the footer. */
  homeLabel: string;
  header: {
    nav: { home: string; dashboard: string; morpho: string; blog: string };
    /** The main navigation landmark's name. */
    navLabel: string;
    openMenu: string;
    theme: string;
    language: string;
  };
  footer: {
    /** The line under the logo, with the alert channels joined ("Signal and email"). */
    tagline: (channels: string) => string;
    /** The footer navigation landmark's name. */
    navLabel: string;
    resources: string;
    community: string;
    legal: string;
    blog: string;
    rss: string;
    rssLabel: string;
    githubLabel: string;
    xLabel: string;
    telegramLabel: string;
    signalLabel: string;
    privacy: string;
    /** The donation block under the tagline: its title, and the address's name for screen readers. */
    donate: string;
    donationAddress: string;
    independence: string;
    /** The price arrives formatted ("1234.57"). */
    ethPrice: (price: string) => string;
    blockExplorer: string;
    blockExplorerShort: string;
  };
  theme: {
    toggle: string;
    /** ThemeChoice's group name. */
    legend: string;
    light: string;
    dark: string;
    system: string;
  };
  field: { optional: string };
  breadcrumbLabel: string;
  wallet: {
    connect: string;
    connectShort: string;
    wrongNetwork: string;
    disconnect: string;
    copied: string;
    copyAddress: string;
    viewQrCode: string;
    viewOnExplorer: string;
    switchNetwork: string;
    switchTo: (networkName: string) => string;
    revealPrivateKey: string;
    burner: {
      title: string;
      warning: string;
      /** "Your Private Key provides <strong>full access</strong> ... stored <strong>temporarily</strong> in ...". */
      accessBefore: string;
      accessStrong: string;
      accessMiddle: string;
      temporaryStrong: string;
      accessAfter: string;
      copy: string;
      copied: string;
      notFound: string;
    };
  };
  faucet: {
    button: string;
    title: string;
    from: string;
    available: string;
    destination: string;
    amount: string;
    send: string;
    grabFunds: string;
    noProvider: string;
    /** "- Did you forget to run <code>yarn chain</code> ?" */
    noChainBefore: string;
    noChainAfter: string;
    /** "- Or you can change <code>targetNetwork</code> in <code>scaffold.config.ts</code>" */
    changeNetworkBefore: string;
    changeNetworkMiddle: string;
  };
  notFound: {
    kicker: string;
    title: string;
    text: string;
    /** The link list's navigation name. */
    navLabel: string;
    home: string;
    dashboard: string;
    blog: string;
  };
};

export const COMMON_MESSAGES: Localized<CommonMessages> = {
  en: {
    skipToContent: "Skip to content",
    beta: {
      region: "App status and social",
      status: "Tokenping is in beta",
      followUs: "Follow us on",
      followUsLabel: "Follow us on X",
    },
    homeLabel: "Tokenping home",
    header: {
      nav: { home: "Home", dashboard: "Aave", morpho: "Morpho", blog: "Blog" },
      navLabel: "Main",
      openMenu: "Open menu",
      theme: "Theme",
      language: "Language",
    },
    footer: {
      tagline: channels => `Aave and Morpho health factor alerts on ${channels}.`,
      navLabel: "Footer",
      resources: "Resources",
      community: "Community",
      legal: "Legal",
      blog: "Blog",
      rss: "RSS",
      rssLabel: "Tokenping blog RSS feed",
      githubLabel: "Tokenping source code on GitHub",
      xLabel: "Tokenping on X",
      telegramLabel: "Tokenping Telegram community",
      signalLabel: "Tokenping Signal community",
      privacy: "Privacy",
      donate: "Support Tokenping",
      donationAddress: "Donation address",
      independence: "Independent tool, not affiliated with Aave Labs, the Aave DAO or Morpho.",
      ethPrice: price => `ETH price: $${price}`,
      blockExplorer: "Block explorer",
      blockExplorerShort: "Explorer",
    },
    theme: {
      toggle: "Toggle light or dark theme",
      legend: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    field: { optional: "(optional)" },
    breadcrumbLabel: "Breadcrumb",
    wallet: {
      connect: "Connect wallet",
      connectShort: "Connect",
      wrongNetwork: "Wrong network",
      disconnect: "Disconnect",
      copied: "Copied!",
      copyAddress: "Copy address",
      viewQrCode: "View QR Code",
      viewOnExplorer: "View on Block Explorer",
      switchNetwork: "Switch Network",
      switchTo: networkName => `Switch to ${networkName}`,
      revealPrivateKey: "Reveal Private Key",
      burner: {
        title: "Copy Burner Wallet Private Key",
        warning: "Burner wallets are intended for local development only and are not safe for storing real funds.",
        accessBefore: "Your Private Key provides ",
        accessStrong: "full access",
        accessMiddle: " to your entire wallet and funds. This is currently stored ",
        temporaryStrong: "temporarily",
        accessAfter: " in your browser.",
        copy: "Copy Private Key To Clipboard",
        copied: "Burner wallet private key copied to clipboard",
        notFound: "Burner wallet private key not found",
      },
    },
    faucet: {
      button: "Faucet",
      title: "Local Faucet",
      from: "From:",
      available: "Available:",
      destination: "Destination Address",
      amount: "Amount to send",
      send: "Send",
      grabFunds: "Grab funds from faucet",
      noProvider: "Cannot connect to local provider",
      noChainBefore: "- Did you forget to run ",
      noChainAfter: " ?",
      changeNetworkBefore: "- Or you can change ",
      changeNetworkMiddle: " in ",
    },
    notFound: {
      kicker: "Error 404",
      title: "Page not found",
      text: "The page you're looking for doesn't exist.",
      navLabel: "Pages",
      home: "Go to the home page",
      dashboard: "Open the dashboard",
      blog: "Read the blog",
    },
  },
  cs: {
    skipToContent: "Přeskočit na obsah",
    beta: {
      region: "Stav aplikace a sociální sítě",
      status: "Tokenping je v betaverzi",
      followUs: "Sledujte nás na",
      followUsLabel: "Sledujte nás na X",
    },
    homeLabel: "Úvodní stránka Tokenpingu",
    header: {
      nav: { home: "Úvod", dashboard: "Aave", morpho: "Morpho", blog: "Blog" },
      navLabel: "Hlavní",
      openMenu: "Otevřít menu",
      theme: "Motiv",
      language: "Jazyk",
    },
    footer: {
      tagline: channels => `Upozornění na health factor na Aave a Morpho přes ${channels}.`,
      navLabel: "Patička",
      resources: "Zdroje",
      community: "Komunita",
      legal: "Právní informace",
      blog: "Blog",
      rss: "RSS",
      rssLabel: "RSS kanál blogu Tokenping",
      githubLabel: "Zdrojový kód Tokenpingu na GitHubu",
      xLabel: "Tokenping na X",
      telegramLabel: "Komunita Tokenpingu na Telegramu",
      signalLabel: "Komunita Tokenpingu na Signalu",
      privacy: "Ochrana soukromí",
      donate: "Podpořte Tokenping",
      donationAddress: "Adresa pro dary",
      independence: "Nezávislý nástroj, který není spojen s Aave Labs, Aave DAO ani s Morpho.",
      ethPrice: price => `Cena ETH: $${price}`,
      blockExplorer: "Průzkumník bloků",
      blockExplorerShort: "Průzkumník",
    },
    theme: {
      toggle: "Přepnout světlý nebo tmavý motiv",
      legend: "Motiv",
      light: "Světlý",
      dark: "Tmavý",
      system: "Systém",
    },
    field: { optional: "(nepovinné)" },
    breadcrumbLabel: "Drobečková navigace",
    wallet: {
      connect: "Připojit peněženku",
      connectShort: "Připojit",
      wrongNetwork: "Špatná síť",
      disconnect: "Odpojit",
      copied: "Zkopírováno",
      copyAddress: "Kopírovat adresu",
      viewQrCode: "Zobrazit QR kód",
      viewOnExplorer: "Zobrazit v průzkumníku bloků",
      switchNetwork: "Přepnout síť",
      switchTo: networkName => `Přepnout na síť ${networkName}`,
      revealPrivateKey: "Zobrazit privátní klíč",
      burner: {
        title: "Zkopírovat privátní klíč burner peněženky",
        warning:
          "Burner peněženky jsou určené jen pro lokální vývoj a nejsou bezpečné pro uložení skutečných prostředků.",
        accessBefore: "Váš privátní klíč dává ",
        accessStrong: "plný přístup",
        accessMiddle: " k celé vaší peněžence a prostředkům. Teď je ",
        temporaryStrong: "dočasně",
        accessAfter: " uložený ve vašem prohlížeči.",
        copy: "Zkopírovat privátní klíč do schránky",
        copied: "Privátní klíč burner peněženky je zkopírovaný do schránky",
        notFound: "Privátní klíč burner peněženky nebyl nalezen",
      },
    },
    faucet: {
      button: "Faucet",
      title: "Lokální faucet",
      from: "Od:",
      available: "K dispozici:",
      destination: "Cílová adresa",
      amount: "Částka k odeslání",
      send: "Odeslat",
      grabFunds: "Získat prostředky z faucetu",
      noProvider: "Nelze se připojit k lokálnímu poskytovateli",
      noChainBefore: "- Nezapomněli jste spustit ",
      noChainAfter: "?",
      changeNetworkBefore: "- Nebo změňte ",
      changeNetworkMiddle: " v souboru ",
    },
    notFound: {
      kicker: "Chyba 404",
      title: "Stránka nenalezena",
      text: "Stránka, kterou hledáte, neexistuje.",
      navLabel: "Stránky",
      home: "Přejít na úvodní stránku",
      dashboard: "Otevřít přehled",
      blog: "Číst blog",
    },
  },
  es: {
    skipToContent: "Saltar al contenido",
    beta: {
      region: "Estado de la aplicación y redes sociales",
      status: "Tokenping está en beta",
      followUs: "Síguenos en",
      followUsLabel: "Síguenos en X",
    },
    homeLabel: "Inicio de Tokenping",
    header: {
      nav: { home: "Inicio", dashboard: "Aave", morpho: "Morpho", blog: "Blog" },
      navLabel: "Principal",
      openMenu: "Abrir menú",
      theme: "Tema",
      language: "Idioma",
    },
    footer: {
      tagline: channels => `Alertas del factor de salud en Aave y Morpho por ${channels}.`,
      navLabel: "Pie de página",
      resources: "Recursos",
      community: "Comunidad",
      legal: "Legal",
      blog: "Blog",
      rss: "RSS",
      rssLabel: "Canal RSS del blog de Tokenping",
      githubLabel: "Código fuente de Tokenping en GitHub",
      xLabel: "Tokenping en X",
      telegramLabel: "Comunidad de Tokenping en Telegram",
      signalLabel: "Comunidad de Tokenping en Signal",
      privacy: "Privacidad",
      donate: "Apoya a Tokenping",
      donationAddress: "Dirección para donaciones",
      independence: "Herramienta independiente, sin afiliación con Aave Labs, la Aave DAO ni Morpho.",
      ethPrice: price => `Precio de ETH: $${price}`,
      blockExplorer: "Explorador de bloques",
      blockExplorerShort: "Explorador",
    },
    theme: {
      toggle: "Cambiar entre tema claro y oscuro",
      legend: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    field: { optional: "(opcional)" },
    breadcrumbLabel: "Ruta de navegación",
    wallet: {
      connect: "Conectar billetera",
      connectShort: "Conectar",
      wrongNetwork: "Red incorrecta",
      disconnect: "Desconectar",
      copied: "¡Copiado!",
      copyAddress: "Copiar dirección",
      viewQrCode: "Ver código QR",
      viewOnExplorer: "Ver en el explorador de bloques",
      switchNetwork: "Cambiar de red",
      switchTo: networkName => `Cambiar a la red ${networkName}`,
      revealPrivateKey: "Mostrar clave privada",
      burner: {
        title: "Copiar la clave privada de la billetera burner",
        warning: "Las billeteras burner son solo para desarrollo local y no son seguras para guardar fondos reales.",
        accessBefore: "Tu clave privada da ",
        accessStrong: "acceso total",
        accessMiddle: " a toda tu billetera y tus fondos. Ahora está guardada ",
        temporaryStrong: "temporalmente",
        accessAfter: " en tu navegador.",
        copy: "Copiar la clave privada al portapapeles",
        copied: "Clave privada de la billetera burner copiada al portapapeles",
        notFound: "No se encontró la clave privada de la billetera burner",
      },
    },
    faucet: {
      button: "Faucet",
      title: "Faucet local",
      from: "De:",
      available: "Disponible:",
      destination: "Dirección de destino",
      amount: "Cantidad a enviar",
      send: "Enviar",
      grabFunds: "Obtener fondos del faucet",
      noProvider: "No se puede conectar con el proveedor local",
      noChainBefore: "- ¿Olvidaste ejecutar ",
      noChainAfter: "?",
      changeNetworkBefore: "- O cambia ",
      changeNetworkMiddle: " en ",
    },
    notFound: {
      kicker: "Error 404",
      title: "Página no encontrada",
      text: "La página que buscas no existe.",
      navLabel: "Páginas",
      home: "Ir a la página de inicio",
      dashboard: "Abrir el panel",
      blog: "Leer el blog",
    },
  },
  hi: {
    skipToContent: "सीधे सामग्री पर जाएँ",
    beta: {
      region: "ऐप की स्थिति और सोशल मीडिया",
      status: "Tokenping बीटा में है",
      followUs: "हमें फ़ॉलो करें",
      followUsLabel: "हमें X पर फ़ॉलो करें",
    },
    homeLabel: "Tokenping होम",
    header: {
      nav: { home: "होम", dashboard: "Aave", morpho: "Morpho", blog: "ब्लॉग" },
      navLabel: "मुख्य",
      openMenu: "मेनू खोलें",
      theme: "थीम",
      language: "भाषा",
    },
    footer: {
      tagline: channels => `${channels} पर Aave और Morpho हेल्थ फ़ैक्टर अलर्ट।`,
      navLabel: "फ़ुटर",
      resources: "संसाधन",
      community: "कम्युनिटी",
      legal: "कानूनी",
      blog: "ब्लॉग",
      rss: "RSS",
      rssLabel: "Tokenping ब्लॉग का RSS फ़ीड",
      githubLabel: "GitHub पर Tokenping का सोर्स कोड",
      xLabel: "X पर Tokenping",
      telegramLabel: "Tokenping की Telegram कम्युनिटी",
      signalLabel: "Tokenping की Signal कम्युनिटी",
      privacy: "गोपनीयता",
      donate: "Tokenping को सहयोग दें",
      donationAddress: "दान का पता",
      independence: "स्वतंत्र टूल, Aave Labs, Aave DAO या Morpho से कोई संबंध नहीं।",
      ethPrice: price => `ETH की कीमत: $${price}`,
      blockExplorer: "ब्लॉक एक्सप्लोरर",
      blockExplorerShort: "एक्सप्लोरर",
    },
    theme: {
      toggle: "हल्की या गहरी थीम चुनें",
      legend: "थीम",
      light: "हल्की",
      dark: "गहरी",
      system: "सिस्टम",
    },
    field: { optional: "(वैकल्पिक)" },
    breadcrumbLabel: "ब्रेडक्रम्ब",
    wallet: {
      connect: "वॉलेट कनेक्ट करें",
      connectShort: "कनेक्ट करें",
      wrongNetwork: "गलत नेटवर्क",
      disconnect: "डिसकनेक्ट करें",
      copied: "कॉपी हो गया!",
      copyAddress: "पता कॉपी करें",
      viewQrCode: "QR कोड देखें",
      viewOnExplorer: "ब्लॉक एक्सप्लोरर में देखें",
      switchNetwork: "नेटवर्क बदलें",
      switchTo: networkName => `${networkName} नेटवर्क पर जाएँ`,
      revealPrivateKey: "प्राइवेट की दिखाएँ",
      burner: {
        title: "बर्नर वॉलेट की प्राइवेट की कॉपी करें",
        warning: "बर्नर वॉलेट सिर्फ़ लोकल डेवलपमेंट के लिए हैं और असली फ़ंड रखने के लिए सुरक्षित नहीं हैं।",
        accessBefore: "आपकी प्राइवेट की आपके पूरे वॉलेट और फ़ंड तक ",
        accessStrong: "पूरी पहुँच",
        accessMiddle: " देती है। यह अभी आपके ब्राउज़र में ",
        temporaryStrong: "अस्थायी रूप से",
        accessAfter: " रखी गई है।",
        copy: "प्राइवेट की क्लिपबोर्ड पर कॉपी करें",
        copied: "बर्नर वॉलेट की प्राइवेट की क्लिपबोर्ड पर कॉपी हो गई",
        notFound: "बर्नर वॉलेट की प्राइवेट की नहीं मिली",
      },
    },
    faucet: {
      button: "Faucet",
      title: "लोकल faucet",
      from: "प्रेषक:",
      available: "उपलब्ध:",
      destination: "गंतव्य पता",
      amount: "भेजने की राशि",
      send: "भेजें",
      grabFunds: "Faucet से फ़ंड लें",
      noProvider: "लोकल प्रोवाइडर से कनेक्ट नहीं हो पा रहा",
      noChainBefore: "- क्या आप ",
      noChainAfter: " चलाना भूल गए?",
      changeNetworkBefore: "- या ",
      changeNetworkMiddle: " बदलें, इस फ़ाइल में: ",
    },
    notFound: {
      kicker: "त्रुटि 404",
      title: "पेज नहीं मिला",
      text: "आप जो पेज ढूँढ रहे हैं, वह मौजूद नहीं है।",
      navLabel: "पेज",
      home: "होम पेज पर जाएँ",
      dashboard: "डैशबोर्ड खोलें",
      blog: "ब्लॉग पढ़ें",
    },
  },
};
