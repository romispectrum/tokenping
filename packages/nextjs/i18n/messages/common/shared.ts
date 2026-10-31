export type CommonMessages = {
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
