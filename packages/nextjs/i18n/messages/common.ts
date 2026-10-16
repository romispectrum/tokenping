import type { Localized } from "~~/i18n/locales";

// The site chrome in both languages: the beta strip and skip link, the header, the footer, the shared UI primitives,
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
    nav: { home: string; dashboard: string; blog: string };
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
    privacy: string;
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
      nav: { home: "Home", dashboard: "Dashboard", blog: "Blog" },
      navLabel: "Main",
      openMenu: "Open menu",
      theme: "Theme",
      language: "Language",
    },
    footer: {
      tagline: channels => `Aave V3 and V4 health factor alerts on ${channels}.`,
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
      privacy: "Privacy",
      independence: "Independent tool, not affiliated with Aave Labs or the Aave DAO.",
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
      nav: { home: "Úvod", dashboard: "Přehled", blog: "Blog" },
      navLabel: "Hlavní",
      openMenu: "Otevřít menu",
      theme: "Motiv",
      language: "Jazyk",
    },
    footer: {
      tagline: channels => `Upozornění na Aave V3 a V4 health factor přes ${channels}.`,
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
      privacy: "Ochrana soukromí",
      independence: "Nezávislý nástroj, který není spojen s Aave Labs ani s Aave DAO.",
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
};
