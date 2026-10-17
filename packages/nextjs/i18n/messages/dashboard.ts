import { capitalize, csForMarket, csOnMarket, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";

// The dashboard (/aave): the server-rendered page around the wallet island, the positions, the paywall and its payment
// flow. Amounts and health factors arrive already formatted: the dashboard keeps the app's number format in both
// languages, so only the words change.

type DashboardMessages = {
  page: {
    metaTitle: string;
    /** The meta description; `channels` is the alert channels joined with "or" ("Signal or email"). */
    metaDescription: (networkCount: number, channels: string) => string;
    title: string;
    /** "Ethereum (Core, Prime, EtherFi and Horizon markets)": a network with several V3 markets, `markets` joined. */
    networkMarkets: (networkName: string, markets: string) => string;
    /**
     * `v3Networks` is every network read on Aave V3, joined ("Ethereum (Core, Prime, EtherFi and Horizon markets),
     * Polygon ... and Monad"); `v4Networks` every network with Aave V4 Spokes ("Ethereum, Avalanche, Arc and Base").
     */
    intro: (v3Networks: string, v4Networks: string) => string;
    disclosureSummary: string;
    /** `paymentChain` is the network alerts are paid on; undefined when no target network has a paywall. */
    alertsCost: (channels: string, paymentChain: string | undefined) => string;
    checks: (minutes: number) => string;
    guideThreshold: string;
    guideAlerts: string;
  };
  gate: {
    title: string;
    description: string;
    connect: string;
    connecting: string;
    approveInWallet: string;
  };
  /** The sr-only h2 above the positions. */
  positionsHeading: string;
  loadingDashboard: string;
  toolbar: {
    wallet: string;
    refresh: string;
    refreshing: string;
    loadingPositions: string;
  };
  errors: {
    positionsDidNotLoad: string;
    refreshFailed: string;
    showingLastPositions: string;
    tryAgain: string;
    /** When the positions request failed without a message of its own. */
    fetchPositionsFailed: string;
  };
  totals: {
    supplied: string;
    borrowed: string;
    netWorth: string;
    noData: string;
  };
  networks: {
    heading: string;
    active: (count: number) => string;
    noPositions: string;
    selectedRegion: string;
    noneSelectedTitle: string;
    noneSelectedDescription: string;
    /** The folded group of markets where the wallet has neither a position nor an alert. */
    otherMarkets: (count: number) => string;
    otherMarketsHint: string;
    alertSet: string;
    /** "$1,200.00 supplied," (the comma ends the first half of the row's two totals). */
    supplied: (usd: string) => string;
    borrowed: (usd: string) => string;
    noPosition: string;
  };
  healthFactor: {
    /** Read before the value by screen readers; ends with a space. */
    srPrefix: string;
    noDebt: string;
    critical: string;
    risky: string;
    safe: string;
  };
  position: {
    /** The kind of market, under its name in the details card. */
    market: (version: 3 | 4) => string;
    noPositionTitle: (chainName: string) => string;
    noPositionDetail: (chainName: string) => string;
    collateral: string;
    debt: string;
    netWorth: string;
    suppliedTitle: string;
    borrowedTitle: string;
    noCollateral: string;
    noDebt: string;
    tokenIconsFrom: string;
    tokenDetailsFailedTitle: string;
    tokenDetailsFailedBody: string;
  };
  tokens: {
    asset: string;
    supplied: string;
    supplyApy: string;
    collateral: string;
    borrowed: string;
    rateType: string;
    enabled: string;
    disabled: string;
    stable: (amount: string) => string;
    variable: (amount: string) => string;
    count: (count: number) => string;
  };
  address: {
    defaultLabel: string;
    copy: (label: string, address: string) => string;
    copied: string;
    copyFailed: string;
  };
  /** After a link that opens a new tab, for screen readers. */
  opensInNewTab: string;
  paywall: {
    unlockedUntil: (date: string) => string;
    titleNew: string;
    titleExtend: string;
    descriptionNew: string;
    descriptionExtend: string;
    /** PositionAccess's copy for the selected network. */
    networkDescriptionNew: (chainName: string) => string;
    networkDescriptionExtend: (chainName: string) => string;
    connectWallet: string;
    unconfigured: string;
    noPlan: string;
    paused: string;
    statusUnavailable: string;
    wrongNetworkTitle: string;
    /** Both names are undefined when the network is not one of the app's target networks. */
    wrongNetworkBody: (walletChain: string | undefined, target: string | undefined) => string;
    switchTo: (target: string | undefined) => string;
    switching: string;
    loadingDetails: string;
    price: string;
    access: string;
    network: string;
    networkFee: string;
    networkFeeValue: (symbol: string) => string;
    /** The access period; `about` when the plan's duration had to be rounded to whole days. */
    period: (days: number, about: boolean) => string;
    pay: (amount: string) => string;
    accessActive: string;
    paymentPending: string;
    loading: {
      processing: string;
      waitingForWallet: string;
      approving: string;
      paying: string;
    };
    unavailable: string;
    checkFailed: string;
    approvalNotVisible: string;
  };
  payment: {
    stepsLabel: string;
    approveTitle: (amount: string) => string;
    approveHint: string;
    payTitle: (amount: string) => string;
    payHint: string;
    inProgress: string;
    done: string;
    notNeeded: string;
    /** sr-only, before the hash; ends with a space. */
    transaction: string;
    viewOn: (explorer: string) => string;
    preparingTitle: string;
    preparingBody: string;
    confirmTitle: string;
    approveSignBody: (amount: string) => string;
    /** `network` is undefined when the payment network is unknown. */
    processingOn: (network: string | undefined) => string;
    approvePendingBody: string;
    paySignBody: (amount: string) => string;
    payPendingBody: string;
  };
};

export const DASHBOARD_MESSAGES: Localized<DashboardMessages> = {
  en: {
    page: {
      metaTitle: "Aave V3 and V4 positions and health factor",
      metaDescription: (networkCount, channels) =>
        `See your Aave V3 and V4 collateral, debt and health factor on ${networkCount} networks, then set ${channels} alerts, one threshold per market.`,
      title: "Aave V3 and V4 positions and health factor alerts",
      networkMarkets: (name, markets) => `${name} (${markets} markets)`,
      intro: (v3Networks, v4Networks) =>
        `Connect the wallet you borrow with to see its collateral, debt and health factor on Aave V3 on ${v3Networks}, and in every Aave V4 Spoke on ${v4Networks}. Viewing needs no transaction.`,
      disclosureSummary: "What alerts cost and how often we check",
      alertsCost: (channels, paymentChain) =>
        `To get a message on ${channels} when a market's health factor drops below a threshold you choose, unlock alerts with a USDC payment${paymentChain ? ` on ${paymentChain}` : ""}. The current price is shown before you pay.`,
      checks: minutes =>
        `Tokenping checks every ${minutes} minutes. While the health factor stays below your threshold, every check sends another message on each channel you chose.`,
      guideThreshold: "How to choose a threshold",
      guideAlerts: "How alerts work",
    },
    gate: {
      title: "Connect a wallet to continue",
      description:
        "Tokenping needs your wallet address to show your Aave positions. Connecting does not move funds or cost a fee.",
      connect: "Connect wallet",
      connecting: "Connecting",
      approveInWallet: "Approve the connection in your wallet.",
    },
    positionsHeading: "Your Aave positions",
    loadingDashboard: "Loading your dashboard",
    toolbar: {
      wallet: "Wallet",
      refresh: "Refresh positions",
      refreshing: "Refreshing",
      loadingPositions: "Loading positions",
    },
    errors: {
      positionsDidNotLoad: "Positions did not load",
      refreshFailed: "Refresh failed",
      showingLastPositions: "Showing the positions from the last successful load.",
      tryAgain: "Try again",
      fetchPositionsFailed: "Failed to fetch Aave positions",
    },
    totals: {
      supplied: "Total supplied",
      borrowed: "Total borrowed",
      netWorth: "Net worth",
      noData: "No data",
    },
    networks: {
      heading: "Markets",
      active: count => `${count} active`,
      noPositions: "No active Aave positions detected in supported markets.",
      selectedRegion: "Selected market",
      noneSelectedTitle: "No market selected",
      noneSelectedDescription: "Select a market to view its Aave position.",
      otherMarkets: count => `Other markets (${count})`,
      otherMarketsHint: "Markets Tokenping checked where this wallet has no position and no alert.",
      alertSet: "Alert set",
      supplied: usd => `${usd} supplied,`,
      borrowed: usd => `${usd} borrowed`,
      noPosition: "No position",
    },
    healthFactor: {
      srPrefix: "Health factor ",
      noDebt: "No debt",
      critical: "Critical",
      risky: "Risky",
      safe: "Safe",
    },
    position: {
      market: version => (version === 4 ? "Aave V4 Spoke" : "Aave V3 market"),
      noPositionTitle: chainName => `No active position on ${chainName}`,
      noPositionDetail: chainName => `Aave reports no collateral and no debt for this wallet on ${chainName}.`,
      collateral: "Collateral",
      debt: "Debt",
      netWorth: "Net worth",
      suppliedTitle: "Supplied",
      borrowedTitle: "Borrowed",
      noCollateral: "No collateral supplied",
      noDebt: "No outstanding debt",
      tokenIconsFrom: "Token and network icons from",
      tokenDetailsFailedTitle: "Token details did not load",
      tokenDetailsFailedBody: "The totals above come from Aave's account summary. Refresh positions to try again.",
    },
    tokens: {
      asset: "Asset",
      supplied: "Supplied",
      supplyApy: "Supply APY",
      collateral: "Collateral",
      borrowed: "Borrowed",
      rateType: "Rate type",
      enabled: "Enabled",
      disabled: "Disabled",
      stable: amount => `Stable ${amount}`,
      variable: amount => `Variable ${amount}`,
      count: count => plural("en", count, { one: `${count} asset`, other: `${count} assets` }),
    },
    address: {
      defaultLabel: "Address",
      copy: (label, address) => `Copy ${label.toLowerCase()} ${address}`,
      copied: "Address copied",
      copyFailed: "Could not copy. Select the address and copy it manually.",
    },
    opensInNewTab: "(opens in a new tab)",
    paywall: {
      unlockedUntil: date => `Alerts unlocked until ${date}`,
      titleNew: "Unlock health factor alerts",
      titleExtend: "Extend access to edit your alerts",
      descriptionNew:
        "Pay once to unlock alert settings and set a health factor threshold for each network. Nothing renews automatically: you pay from your wallet when you want to extend.",
      descriptionExtend: "Your previous alert settings are saved. Pay again to extend access and edit them.",
      networkDescriptionNew: chainName =>
        `Pay once to set health factor alerts on ${chainName} and other markets. Nothing renews automatically: you pay from your wallet when you want to extend.`,
      networkDescriptionExtend: chainName =>
        `Your saved ${chainName} alert settings are still in your account. Pay again to extend access and edit them.`,
      connectWallet: "Connect your wallet to pay for access.",
      unconfigured: "Payment contract not configured for this network.",
      noPlan: "No paid plan is available at the moment.",
      paused: "Payments are paused right now. Try again later.",
      statusUnavailable: "Could not load the payment status. Reload the page to try again.",
      wrongNetworkTitle: "Wrong network",
      wrongNetworkBody: (walletChain, target) =>
        `Your wallet is on ${walletChain ?? "another network"}. Switch to ${target ?? "the payment network"} to pay.`,
      switchTo: target => `Switch to ${target ?? "the payment network"}`,
      switching: "Switching network",
      loadingDetails: "Loading payment details",
      price: "Price",
      access: "Access",
      network: "Network",
      networkFee: "Network fee",
      networkFeeValue: symbol => `Paid in ${symbol} for each step, shown in your wallet`,
      period: (days, about) => {
        const period = plural("en", days, { one: `${days} day`, other: `${days} days` });
        return about ? `About ${period}` : period;
      },
      pay: amount => `Pay ${amount}`,
      accessActive: "Access active. You can now configure notifications.",
      paymentPending: "Payment confirmed. Access will appear shortly.",
      loading: {
        processing: "Processing",
        waitingForWallet: "Waiting for your wallet",
        approving: "Approving",
        paying: "Paying",
      },
      unavailable: "Paid access is not available right now.",
      checkFailed: "Could not check the payment status. Try again in a moment.",
      approvalNotVisible: "The approval is confirmed but not visible yet. Try again in a moment.",
    },
    payment: {
      stepsLabel: "Payment steps",
      approveTitle: amount => `Approve ${amount}`,
      approveHint: "Lets the paywall take exactly this amount. Skipped when an earlier approval covers it.",
      payTitle: amount => `Pay ${amount}`,
      payHint: "Sends the payment and unlocks alerts.",
      inProgress: "In progress",
      done: "Done",
      notNeeded: "Not needed",
      transaction: "Transaction ",
      viewOn: explorer => `View on ${explorer}`,
      preparingTitle: "Preparing the payment",
      preparingBody: "Checking the current price and your approval.",
      confirmTitle: "Confirm in your wallet",
      approveSignBody: amount => `Step 1 of 2: approve ${amount}. Nothing is sent until you confirm.`,
      processingOn: network => `Processing on ${network ?? "the network"}`,
      approvePendingBody: "Step 1 of 2: approval submitted. Your wallet asks you to confirm the payment next.",
      paySignBody: amount => `Step 2 of 2: pay ${amount}. Nothing is sent until you confirm.`,
      payPendingBody: "Step 2 of 2: payment submitted. Alerts unlock once the network confirms it.",
    },
  },
  cs: {
    page: {
      metaTitle: "Pozice na Aave V3 a V4 a health factor",
      metaDescription: (networkCount, channels) =>
        `Uvidíte kolaterál, dluh a health factor na Aave V3 a V4 na ${networkCount} sítích. Pak si nastavte upozornění přes ${channels}, jeden práh na trh.`,
      title: "Pozice na Aave V3 a V4 a upozornění na health factor",
      networkMarkets: (name, markets) => `${name} (trhy ${markets})`,
      intro: (v3Networks, v4Networks) =>
        `Připojte peněženku, se kterou si půjčujete, a uvidíte její kolaterál, dluh a health factor na Aave V3 na sítích ${v3Networks} a ve všech trzích (Spoke) Aave V4 na sítích ${v4Networks}. Prohlížení nevyžaduje žádnou transakci.`,
      disclosureSummary: "Kolik upozornění stojí a jak často kontrolujeme",
      alertsCost: (channels, paymentChain) =>
        `Pokud chcete dostat zprávu přes ${channels}, když health factor na některém trhu klesne pod zvolený práh, odemkněte upozornění platbou v USDC${paymentChain ? ` na síti ${paymentChain}` : ""}. Aktuální cenu uvidíte před zaplacením.`,
      checks: minutes =>
        `Tokenping kontroluje ${plural("cs", minutes, { one: "každou minutu", few: `každé ${minutes} minuty`, other: `každých ${minutes} minut` })}. Dokud health factor zůstává pod vaším prahem, každá kontrola pošle další zprávu do každého kanálu, který jste zvolili.`,
      guideThreshold: "Jak zvolit práh",
      guideAlerts: "Jak fungují upozornění",
    },
    gate: {
      title: "Pro pokračování připojte peněženku",
      description:
        "Tokenping potřebuje adresu vaší peněženky, aby mohl zobrazit vaše pozice na Aave. Připojení nepřesouvá žádné prostředky a nic nestojí.",
      connect: "Připojit peněženku",
      connecting: "Připojování",
      approveInWallet: "Potvrďte připojení v peněžence.",
    },
    positionsHeading: "Vaše pozice na Aave",
    loadingDashboard: "Načítání přehledu",
    toolbar: {
      wallet: "Peněženka",
      refresh: "Obnovit pozice",
      refreshing: "Obnovování",
      loadingPositions: "Načítání pozic",
    },
    errors: {
      positionsDidNotLoad: "Pozice se nenačetly",
      refreshFailed: "Obnovení se nezdařilo",
      showingLastPositions: "Zobrazujeme pozice z posledního úspěšného načtení.",
      tryAgain: "Zkusit znovu",
      fetchPositionsFailed: "Pozice na Aave se nepodařilo načíst",
    },
    totals: {
      supplied: "Celkem vloženo",
      borrowed: "Celkem vypůjčeno",
      netWorth: "Čisté jmění",
      noData: "Žádná data",
    },
    networks: {
      heading: "Trhy",
      active: count =>
        plural("cs", count, { one: `${count} aktivní`, few: `${count} aktivní`, other: `${count} aktivních` }),
      noPositions: "Na podporovaných trzích jsme nenašli žádné aktivní pozice na Aave.",
      selectedRegion: "Vybraný trh",
      noneSelectedTitle: "Není vybraný žádný trh",
      noneSelectedDescription: "Vyberte trh a zobrazí se jeho pozice na Aave.",
      otherMarkets: count => `Další trhy (${count})`,
      otherMarketsHint: "Trhy, které Tokenping zkontroloval a kde tato peněženka nemá pozici ani upozornění.",
      alertSet: "Upozornění nastaveno",
      supplied: usd => `vloženo ${usd},`,
      borrowed: usd => `vypůjčeno ${usd}`,
      noPosition: "Bez pozice",
    },
    healthFactor: {
      srPrefix: "Health factor ",
      noDebt: "Bez dluhu",
      critical: "Kritický",
      risky: "Rizikový",
      safe: "Bezpečný",
    },
    position: {
      market: version => (version === 4 ? "Spoke Aave V4" : "Trh Aave V3"),
      noPositionTitle: chainName => `${capitalize(csOnMarket(chainName))} nemáte žádnou aktivní pozici`,
      noPositionDetail: chainName =>
        `Aave pro tuto peněženku ${csOnMarket(chainName)} neuvádí žádný kolaterál ani dluh.`,
      collateral: "Kolaterál",
      debt: "Dluh",
      netWorth: "Čisté jmění",
      suppliedTitle: "Vloženo",
      borrowedTitle: "Vypůjčeno",
      noCollateral: "Žádný vložený kolaterál",
      noDebt: "Žádný nesplacený dluh",
      tokenIconsFrom: "Ikony tokenů a sítí z",
      tokenDetailsFailedTitle: "Podrobnosti o tokenech se nenačetly",
      tokenDetailsFailedBody: "Součty výše pocházejí ze souhrnu účtu na Aave. Pro nový pokus obnovte pozice.",
    },
    tokens: {
      asset: "Aktivum",
      supplied: "Vloženo",
      supplyApy: "APY vkladu",
      collateral: "Kolaterál",
      borrowed: "Vypůjčeno",
      rateType: "Typ sazby",
      enabled: "Zapnuto",
      disabled: "Vypnuto",
      stable: amount => `Stabilní ${amount}`,
      variable: amount => `Variabilní ${amount}`,
      count: count => plural("cs", count, { one: `${count} aktivum`, few: `${count} aktiva`, other: `${count} aktiv` }),
    },
    address: {
      defaultLabel: "Adresa",
      copy: (_label, address) => `Zkopírovat adresu ${address}`,
      copied: "Adresa zkopírována",
      copyFailed: "Nepodařilo se zkopírovat. Označte adresu a zkopírujte ji ručně.",
    },
    opensInNewTab: "(otevře se v nové záložce)",
    paywall: {
      unlockedUntil: date => `Upozornění odemčena do ${date}`,
      titleNew: "Odemkněte upozornění na health factor",
      titleExtend: "Prodlužte přístup a upravte svá upozornění",
      descriptionNew:
        "Zaplaťte jednou a odemkne se nastavení upozornění, kde si pro každou síť určíte práh health factoru. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.",
      descriptionExtend:
        "Vaše dřívější nastavení upozornění zůstalo uložené. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.",
      networkDescriptionNew: chainName =>
        `Zaplaťte jednou a nastavte si upozornění na health factor ${csOnMarket(chainName)} i na dalších trzích. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.`,
      networkDescriptionExtend: chainName =>
        `Vaše uložené nastavení upozornění ${csForMarket(chainName)} ve vašem účtu zůstává. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.`,
      connectWallet: "Připojte peněženku, abyste mohli za přístup zaplatit.",
      unconfigured: "Platební kontrakt pro tuto síť není nastavený.",
      noPlan: "Momentálně není k dispozici žádný placený tarif.",
      paused: "Platby jsou momentálně pozastavené. Zkuste to později.",
      statusUnavailable: "Stav platby se nepodařilo načíst. Pro nový pokus obnovte stránku.",
      wrongNetworkTitle: "Nesprávná síť",
      wrongNetworkBody: (walletChain, target) =>
        `${walletChain ? `Vaše peněženka je na síti ${walletChain}.` : "Vaše peněženka je na jiné síti."} Pro zaplacení přepněte na ${target ? `síť ${target}` : "platební síť"}.`,
      switchTo: target => `Přepnout na ${target ? `síť ${target}` : "platební síť"}`,
      switching: "Přepínání sítě",
      loadingDetails: "Načítání platebních údajů",
      price: "Cena",
      access: "Přístup",
      network: "Síť",
      networkFee: "Poplatek sítě",
      networkFeeValue: symbol => `Platí se v ${symbol} za každý krok, výši uvidíte v peněžence`,
      period: (days, about) => {
        const period = plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` });
        return about ? `Přibližně ${period}` : period;
      },
      pay: amount => `Zaplatit ${amount}`,
      accessActive: "Přístup je aktivní. Teď si můžete nastavit upozornění.",
      paymentPending: "Platba je potvrzená. Přístup se brzy zobrazí.",
      loading: {
        processing: "Zpracování",
        waitingForWallet: "Čekáme na vaši peněženku",
        approving: "Schvalování",
        paying: "Placení",
      },
      unavailable: "Placený přístup teď není k dispozici.",
      checkFailed: "Stav platby se nepodařilo ověřit. Zkuste to za chvíli znovu.",
      approvalNotVisible: "Schválení je potvrzené, ale zatím se nezobrazuje. Zkuste to za chvíli znovu.",
    },
    payment: {
      stepsLabel: "Kroky platby",
      approveTitle: amount => `Schválit ${amount}`,
      approveHint:
        "Platební kontrakt si smí vzít přesně tuto částku. Krok se přeskočí, pokud ji pokrývá dřívější schválení.",
      payTitle: amount => `Zaplatit ${amount}`,
      payHint: "Odešle platbu a odemkne upozornění.",
      inProgress: "Probíhá",
      done: "Hotovo",
      notNeeded: "Není potřeba",
      transaction: "Transakce ",
      viewOn: explorer => `Zobrazit na ${explorer}`,
      preparingTitle: "Připravujeme platbu",
      preparingBody: "Ověřujeme aktuální cenu a vaše schválení.",
      confirmTitle: "Potvrďte v peněžence",
      approveSignBody: amount => `Krok 1 ze 2: schválení ${amount}. Dokud nepotvrdíte, nic se neodešle.`,
      processingOn: network => (network ? `Zpracování na síti ${network}` : "Zpracování v síti"),
      approvePendingBody: "Krok 1 ze 2: schválení odesláno. Peněženka vás pak požádá o potvrzení platby.",
      paySignBody: amount => `Krok 2 ze 2: platba ${amount}. Dokud nepotvrdíte, nic se neodešle.`,
      payPendingBody: "Krok 2 ze 2: platba odeslána. Upozornění se odemknou, jakmile ji síť potvrdí.",
    },
  },
};
