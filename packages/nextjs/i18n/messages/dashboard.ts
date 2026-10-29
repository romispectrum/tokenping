import {
  capitalize,
  csForMarket,
  csOnMarket,
  deForMarket,
  deOnMarket,
  esMarket,
  hiMarket,
  plural,
  viMarket,
} from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";

// The dashboard (/aave): the server-rendered page around the wallet island, the positions, the paywall and its payment
// flow. Amounts and health factors arrive already formatted: the dashboard keeps the app's number format in every
// language, so only the words change.

/** What a dashboard's wallet gate says before a wallet is connected. */
export type GateMessages = {
  title: string;
  description: string;
  connect: string;
  connecting: string;
  approveInWallet: string;
};

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
    /** The link to the Morpho dashboard, for a borrower who is on the wrong page. */
    morphoDashboard: string;
  };
  gate: GateMessages;
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
    /** While access is active: one more plan period, paid on top of the current end date. */
    extend: (days: number, amount: string) => string;
    extendHint: (days: number) => string;
    accessExtended: (date: string) => string;
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
      morphoDashboard: "Borrowing on Morpho? Open the Morpho dashboard",
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
      extend: (days, amount) =>
        `Add ${plural("en", days, { one: `${days} day`, other: `${days} days` })} for ${amount}`,
      extendHint: days =>
        `Each payment adds ${plural("en", days, { one: `${days} day`, other: `${days} days` })} after your current end date. Pay as many times as you like; nothing renews on its own.`,
      accessExtended: date => `Access extended until ${date}.`,
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
      morphoDashboard: "Půjčujete si na Morpho? Otevřete přehled Morpho",
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
      extend: (days, amount) =>
        `Přidat ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` })} za ${amount}`,
      extendHint: days =>
        `Každá platba přidá ${plural("cs", days, { one: `${days} den`, few: `${days} dny`, other: `${days} dní` })} k datu, kdy vám přístup končí. Platit můžete, kolikrát chcete; nic se neobnovuje samo.`,
      accessExtended: date => `Přístup je prodloužený do ${date}.`,
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
  es: {
    page: {
      metaTitle: "Posiciones y factor de salud en Aave V3 y V4",
      metaDescription: (networkCount, channels) =>
        `Tu colateral, tu deuda y tu factor de salud en Aave V3 y V4, en ${networkCount} redes, con alertas por ${channels} y un umbral por mercado.`,
      title: "Posiciones en Aave V3 y V4 y alertas del factor de salud",
      networkMarkets: (name, markets) => `${name} (mercados ${markets})`,
      intro: (v3Networks, v4Networks) =>
        `Conecta la billetera con la que pides prestado para ver su colateral, su deuda y su factor de salud en Aave V3 en las redes ${v3Networks}, y en todos los Spokes de Aave V4 en las redes ${v4Networks}. Consultarlos no requiere ninguna transacción.`,
      disclosureSummary: "Cuánto cuestan las alertas y cada cuánto revisamos",
      alertsCost: (channels, paymentChain) =>
        `Para recibir un mensaje por ${channels} cuando el factor de salud de un mercado caiga por debajo de un umbral que tú elijas, desbloquea las alertas con un pago en USDC${paymentChain ? ` en la red ${paymentChain}` : ""}. El precio actual se muestra antes de pagar.`,
      checks: minutes =>
        `Tokenping revisa ${plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` })}. Mientras el factor de salud siga por debajo de tu umbral, cada revisión envía otro mensaje por cada canal que elegiste.`,
      guideThreshold: "Cómo elegir un umbral",
      guideAlerts: "Cómo funcionan las alertas",
      morphoDashboard: "¿Pides prestado en Morpho? Abre el panel de Morpho",
    },
    gate: {
      title: "Conecta una billetera para continuar",
      description:
        "Tokenping necesita la dirección de tu billetera para mostrar tus posiciones en Aave. Conectarla no mueve fondos ni cobra ninguna comisión.",
      connect: "Conectar billetera",
      connecting: "Conectando",
      approveInWallet: "Aprueba la conexión en tu billetera.",
    },
    positionsHeading: "Tus posiciones en Aave",
    loadingDashboard: "Cargando tu panel",
    toolbar: {
      wallet: "Billetera",
      refresh: "Actualizar posiciones",
      refreshing: "Actualizando",
      loadingPositions: "Cargando posiciones",
    },
    errors: {
      positionsDidNotLoad: "Las posiciones no se cargaron",
      refreshFailed: "No se pudo actualizar",
      showingLastPositions: "Se muestran las posiciones de la última carga correcta.",
      tryAgain: "Intentar de nuevo",
      fetchPositionsFailed: "No se pudieron obtener las posiciones de Aave",
    },
    totals: {
      supplied: "Total depositado",
      borrowed: "Deuda total",
      netWorth: "Patrimonio neto",
      noData: "Sin datos",
    },
    networks: {
      heading: "Mercados",
      active: count => plural("es", count, { one: `${count} activo`, other: `${count} activos` }),
      noPositions: "No se detectaron posiciones activas en Aave en los mercados compatibles.",
      selectedRegion: "Mercado seleccionado",
      noneSelectedTitle: "Ningún mercado seleccionado",
      noneSelectedDescription: "Selecciona un mercado para ver su posición en Aave.",
      otherMarkets: count => `Otros mercados (${count})`,
      otherMarketsHint: "Mercados que Tokenping revisó donde esta billetera no tiene ninguna posición ni alerta.",
      alertSet: "Alerta configurada",
      supplied: usd => `${usd} depositados,`,
      borrowed: usd => `${usd} de deuda`,
      noPosition: "Sin posición",
    },
    healthFactor: {
      srPrefix: "Factor de salud ",
      noDebt: "Sin deuda",
      critical: "Crítico",
      risky: "En riesgo",
      safe: "Seguro",
    },
    position: {
      market: version => (version === 4 ? "Spoke de Aave V4" : "Mercado de Aave V3"),
      noPositionTitle: chainName => `No tienes ninguna posición activa en ${esMarket(chainName)}`,
      noPositionDetail: chainName =>
        `Según Aave, esta billetera no tiene colateral ni deuda en ${esMarket(chainName)}.`,
      collateral: "Colateral",
      debt: "Deuda",
      netWorth: "Patrimonio neto",
      suppliedTitle: "Depositado",
      borrowedTitle: "Deuda",
      noCollateral: "No hay colateral depositado",
      noDebt: "No hay deuda pendiente",
      tokenIconsFrom: "Iconos de tokens y redes de",
      tokenDetailsFailedTitle: "Los detalles de los tokens no se cargaron",
      tokenDetailsFailedBody:
        "Los totales de arriba vienen del resumen de cuenta de Aave. Actualiza las posiciones para intentarlo de nuevo.",
    },
    tokens: {
      asset: "Activo",
      supplied: "Depositado",
      supplyApy: "APY de depósito",
      collateral: "Colateral",
      borrowed: "Deuda",
      rateType: "Tipo de tasa",
      enabled: "Activado",
      disabled: "Desactivado",
      stable: amount => `Estable ${amount}`,
      variable: amount => `Variable ${amount}`,
      count: count => plural("es", count, { one: `${count} activo`, other: `${count} activos` }),
    },
    address: {
      defaultLabel: "Dirección",
      copy: (_label, address) => `Copiar la dirección ${address}`,
      copied: "Dirección copiada",
      copyFailed: "No se pudo copiar. Selecciona la dirección y cópiala a mano.",
    },
    opensInNewTab: "(se abre en una pestaña nueva)",
    paywall: {
      unlockedUntil: date => `Alertas desbloqueadas hasta el ${date}`,
      titleNew: "Desbloquea las alertas del factor de salud",
      titleExtend: "Extiende el acceso para editar tus alertas",
      descriptionNew:
        "Paga una vez para desbloquear la configuración de alertas y fijar un umbral del factor de salud para cada red. Nada se renueva automáticamente: pagas desde tu billetera cuando quieras extender el acceso.",
      descriptionExtend:
        "Tu configuración de alertas anterior está guardada. Paga de nuevo para extender el acceso y editarla.",
      networkDescriptionNew: chainName =>
        `Paga una vez para configurar alertas del factor de salud en ${esMarket(chainName)} y en otros mercados. Nada se renueva automáticamente: pagas desde tu billetera cuando quieras extender el acceso.`,
      networkDescriptionExtend: chainName =>
        `Tu configuración de alertas guardada para ${esMarket(chainName)} sigue en tu cuenta. Paga de nuevo para extender el acceso y editarla.`,
      connectWallet: "Conecta tu billetera para pagar el acceso.",
      unconfigured: "El contrato de pago no está configurado para esta red.",
      noPlan: "No hay ningún plan de pago disponible en este momento.",
      paused: "Los pagos están pausados ahora mismo. Inténtalo más tarde.",
      statusUnavailable: "No se pudo cargar el estado del pago. Recarga la página para intentarlo de nuevo.",
      wrongNetworkTitle: "Red incorrecta",
      wrongNetworkBody: (walletChain, target) =>
        `Tu billetera está en ${walletChain ? `la red ${walletChain}` : "otra red"}. Cambia a ${target ? `la red ${target}` : "la red de pago"} para pagar.`,
      switchTo: target => `Cambiar a ${target ? `la red ${target}` : "la red de pago"}`,
      switching: "Cambiando de red",
      loadingDetails: "Cargando los detalles del pago",
      price: "Precio",
      access: "Acceso",
      network: "Red",
      networkFee: "Comisión de red",
      networkFeeValue: symbol => `Se paga en ${symbol} en cada paso y se muestra en tu billetera`,
      period: (days, about) => {
        const period = plural("es", days, { one: `${days} día`, other: `${days} días` });
        return about ? `Aproximadamente ${period}` : period;
      },
      pay: amount => `Pagar ${amount}`,
      extend: (days, amount) =>
        `Agregar ${plural("es", days, { one: `${days} día`, other: `${days} días` })} por ${amount}`,
      extendHint: days =>
        `Cada pago agrega ${plural("es", days, { one: `${days} día`, other: `${days} días` })} a partir de la fecha en que termina tu acceso actual. Paga tantas veces como quieras; nada se renueva solo.`,
      accessExtended: date => `Acceso extendido hasta el ${date}.`,
      accessActive: "Acceso activo. Ya puedes configurar las alertas.",
      paymentPending: "Pago confirmado. El acceso aparecerá en breve.",
      loading: {
        processing: "Procesando",
        waitingForWallet: "Esperando tu billetera",
        approving: "Aprobando",
        paying: "Pagando",
      },
      unavailable: "El acceso de pago no está disponible ahora mismo.",
      checkFailed: "No se pudo verificar el estado del pago. Inténtalo de nuevo en un momento.",
      approvalNotVisible: "La aprobación está confirmada, pero aún no se ve. Inténtalo de nuevo en un momento.",
    },
    payment: {
      stepsLabel: "Pasos del pago",
      approveTitle: amount => `Aprobar ${amount}`,
      approveHint:
        "Permite que el contrato de pago tome exactamente este monto. Se omite si una aprobación anterior ya lo cubre.",
      payTitle: amount => `Pagar ${amount}`,
      payHint: "Envía el pago y desbloquea las alertas.",
      inProgress: "En curso",
      done: "Listo",
      notNeeded: "No hace falta",
      transaction: "Transacción ",
      viewOn: explorer => `Ver en ${explorer}`,
      preparingTitle: "Preparando el pago",
      preparingBody: "Verificando el precio actual y tu aprobación.",
      confirmTitle: "Confirma en tu billetera",
      approveSignBody: amount => `Paso 1 de 2: aprobar ${amount}. No se envía nada hasta que confirmes.`,
      processingOn: network => (network ? `Procesando en la red ${network}` : "Procesando en la red"),
      approvePendingBody:
        "Paso 1 de 2: aprobación enviada. A continuación, tu billetera te pedirá que confirmes el pago.",
      paySignBody: amount => `Paso 2 de 2: pagar ${amount}. No se envía nada hasta que confirmes.`,
      payPendingBody: "Paso 2 de 2: pago enviado. Las alertas se desbloquean cuando la red lo confirme.",
    },
  },
  hi: {
    page: {
      metaTitle: "Aave V3 और V4 पोज़िशन और हेल्थ फ़ैक्टर",
      metaDescription: (networkCount, channels) =>
        `${networkCount} नेटवर्क पर अपना Aave V3 और V4 कोलैटरल, कर्ज़ और हेल्थ फ़ैक्टर देखें, फिर ${channels} से अलर्ट सेट करें, हर मार्केट के लिए एक सीमा।`,
      title: "Aave V3 और V4 पोज़िशन और हेल्थ फ़ैक्टर अलर्ट",
      networkMarkets: (name, markets) => `${name} (${markets} मार्केट)`,
      intro: (v3Networks, v4Networks) =>
        `वह वॉलेट कनेक्ट करें जिससे आप उधार लेते हैं, और ${v3Networks} पर Aave V3 में और ${v4Networks} पर Aave V4 के हर Spoke में उसका कोलैटरल, कर्ज़ और हेल्थ फ़ैक्टर देखें। देखने के लिए किसी ट्रांज़ैक्शन की ज़रूरत नहीं।`,
      disclosureSummary: "अलर्ट की कीमत क्या है और हम कितनी बार जाँच करते हैं",
      alertsCost: (channels, paymentChain) =>
        `जब किसी मार्केट का हेल्थ फ़ैक्टर आपकी चुनी हुई सीमा से नीचे गिरे, तब ${channels} पर संदेश पाने के लिए ${paymentChain ? `${paymentChain} नेटवर्क पर ` : ""}USDC में भुगतान करके अलर्ट अनलॉक करें। भुगतान से पहले मौजूदा कीमत दिखाई जाती है।`,
      checks: minutes =>
        `Tokenping हर ${plural("hi", minutes, { one: "मिनट", other: `${minutes} मिनट` })} जाँच करता है। जब तक हेल्थ फ़ैक्टर आपकी सीमा से नीचे रहता है, हर जाँच पर आपके चुने हुए हर चैनल पर एक और संदेश भेजा जाता है।`,
      guideThreshold: "सीमा कैसे चुनें",
      guideAlerts: "अलर्ट कैसे काम करते हैं",
      morphoDashboard: "Morpho पर उधार लेते हैं? Morpho डैशबोर्ड खोलें",
    },
    gate: {
      title: "जारी रखने के लिए वॉलेट कनेक्ट करें",
      description:
        "आपकी Aave पोज़िशन दिखाने के लिए Tokenping को आपके वॉलेट का पता चाहिए। कनेक्ट करने से न कोई फ़ंड हिलता है, न कोई शुल्क लगता है।",
      connect: "वॉलेट कनेक्ट करें",
      connecting: "कनेक्ट हो रहा है",
      approveInWallet: "अपने वॉलेट में कनेक्शन अप्रूव करें।",
    },
    positionsHeading: "आपकी Aave पोज़िशन",
    loadingDashboard: "आपका डैशबोर्ड लोड हो रहा है",
    toolbar: {
      wallet: "वॉलेट",
      refresh: "पोज़िशन रीफ़्रेश करें",
      refreshing: "रीफ़्रेश हो रहा है",
      loadingPositions: "पोज़िशन लोड हो रही हैं",
    },
    errors: {
      positionsDidNotLoad: "पोज़िशन लोड नहीं हुईं",
      refreshFailed: "रीफ़्रेश नहीं हो सका",
      showingLastPositions: "पिछली सफल लोडिंग की पोज़िशन दिखाई जा रही हैं।",
      tryAgain: "फिर से कोशिश करें",
      fetchPositionsFailed: "Aave पोज़िशन नहीं मिल सकीं",
    },
    totals: {
      supplied: "कुल जमा",
      borrowed: "कुल कर्ज़",
      netWorth: "कुल संपत्ति",
      noData: "कोई डेटा नहीं",
    },
    networks: {
      heading: "मार्केट",
      // "सक्रिय" and the loanwords below ("एसेट", "दिन") take no plural ending after a number, so no plural() here.
      active: count => `${count} सक्रिय`,
      noPositions: "समर्थित मार्केट में कोई सक्रिय Aave पोज़िशन नहीं मिली।",
      selectedRegion: "चुना हुआ मार्केट",
      noneSelectedTitle: "कोई मार्केट नहीं चुना गया",
      noneSelectedDescription: "Aave पोज़िशन देखने के लिए कोई मार्केट चुनें।",
      otherMarkets: count => `अन्य मार्केट (${count})`,
      otherMarketsHint: "वे मार्केट जिन्हें Tokenping ने जाँचा और जहाँ इस वॉलेट की न कोई पोज़िशन है, न कोई अलर्ट।",
      alertSet: "अलर्ट सेट है",
      supplied: usd => `${usd} जमा,`,
      borrowed: usd => `${usd} कर्ज़`,
      noPosition: "कोई पोज़िशन नहीं",
    },
    healthFactor: {
      srPrefix: "हेल्थ फ़ैक्टर ",
      noDebt: "कोई कर्ज़ नहीं",
      critical: "गंभीर",
      risky: "जोखिम में",
      safe: "सुरक्षित",
    },
    position: {
      market: version => (version === 4 ? "Aave V4 Spoke" : "Aave V3 मार्केट"),
      noPositionTitle: chainName => `${hiMarket(chainName)} पर कोई सक्रिय पोज़िशन नहीं`,
      noPositionDetail: chainName =>
        `Aave के अनुसार ${hiMarket(chainName)} पर इस वॉलेट का न कोई कोलैटरल है, न कोई कर्ज़।`,
      collateral: "कोलैटरल",
      debt: "कर्ज़",
      netWorth: "कुल संपत्ति",
      suppliedTitle: "जमा",
      borrowedTitle: "कर्ज़",
      noCollateral: "कोई कोलैटरल जमा नहीं",
      noDebt: "कोई बकाया कर्ज़ नहीं",
      tokenIconsFrom: "टोकन और नेटवर्क आइकन का स्रोत:",
      tokenDetailsFailedTitle: "टोकन का विवरण लोड नहीं हुआ",
      tokenDetailsFailedBody:
        "ऊपर के कुल आँकड़े Aave के अकाउंट सारांश से आए हैं। फिर से कोशिश करने के लिए पोज़िशन रीफ़्रेश करें।",
    },
    tokens: {
      asset: "एसेट",
      supplied: "जमा",
      supplyApy: "जमा APY",
      collateral: "कोलैटरल",
      borrowed: "कर्ज़",
      rateType: "दर का प्रकार",
      enabled: "चालू",
      disabled: "बंद",
      stable: amount => `स्टेबल ${amount}`,
      variable: amount => `वेरिएबल ${amount}`,
      count: count => `${count} एसेट`,
    },
    address: {
      defaultLabel: "पता",
      copy: (_label, address) => `पता ${address} कॉपी करें`,
      copied: "पता कॉपी हो गया",
      copyFailed: "कॉपी नहीं हो सका। पता चुनकर उसे खुद कॉपी करें।",
    },
    opensInNewTab: "(नए टैब में खुलता है)",
    paywall: {
      unlockedUntil: date => `अलर्ट ${date} तक अनलॉक हैं`,
      titleNew: "हेल्थ फ़ैक्टर अलर्ट अनलॉक करें",
      titleExtend: "अलर्ट संपादित करने के लिए एक्सेस बढ़ाएँ",
      descriptionNew:
        "अलर्ट सेटिंग अनलॉक करने और हर नेटवर्क के लिए हेल्थ फ़ैक्टर सीमा सेट करने के लिए एक बार भुगतान करें। कुछ भी अपने आप रिन्यू नहीं होता: जब आप एक्सेस बढ़ाना चाहें, तब अपने वॉलेट से भुगतान करते हैं।",
      descriptionExtend:
        "आपकी पिछली अलर्ट सेटिंग सहेजी हुई है। एक्सेस बढ़ाने और उसे संपादित करने के लिए फिर से भुगतान करें।",
      networkDescriptionNew: chainName =>
        `${hiMarket(chainName)} पर और दूसरे मार्केट में हेल्थ फ़ैक्टर अलर्ट सेट करने के लिए एक बार भुगतान करें। कुछ भी अपने आप रिन्यू नहीं होता: जब आप एक्सेस बढ़ाना चाहें, तब अपने वॉलेट से भुगतान करते हैं।`,
      networkDescriptionExtend: chainName =>
        `${hiMarket(chainName)} के लिए आपकी सहेजी हुई अलर्ट सेटिंग अब भी आपके अकाउंट में है। एक्सेस बढ़ाने और उसे संपादित करने के लिए फिर से भुगतान करें।`,
      connectWallet: "एक्सेस का भुगतान करने के लिए अपना वॉलेट कनेक्ट करें।",
      unconfigured: "इस नेटवर्क के लिए भुगतान कॉन्ट्रैक्ट कॉन्फ़िगर नहीं है।",
      noPlan: "फ़िलहाल कोई सशुल्क प्लान उपलब्ध नहीं है।",
      paused: "भुगतान अभी रोके गए हैं। बाद में फिर से कोशिश करें।",
      statusUnavailable: "भुगतान की स्थिति लोड नहीं हो सकी। फिर से कोशिश करने के लिए पेज रीलोड करें।",
      wrongNetworkTitle: "गलत नेटवर्क",
      wrongNetworkBody: (walletChain, target) =>
        `आपका वॉलेट ${walletChain ? `${walletChain} नेटवर्क` : "किसी दूसरे नेटवर्क"} पर है। भुगतान के लिए ${target ? `${target} नेटवर्क` : "भुगतान नेटवर्क"} पर स्विच करें।`,
      switchTo: target => `${target ? `${target} नेटवर्क` : "भुगतान नेटवर्क"} पर स्विच करें`,
      switching: "नेटवर्क बदला जा रहा है",
      loadingDetails: "भुगतान का विवरण लोड हो रहा है",
      price: "कीमत",
      access: "एक्सेस",
      network: "नेटवर्क",
      networkFee: "नेटवर्क शुल्क",
      networkFeeValue: symbol => `हर चरण पर ${symbol} में चुकाया जाता है और आपके वॉलेट में दिखता है`,
      period: (days, about) => {
        const period = `${days} दिन`;
        return about ? `लगभग ${period}` : period;
      },
      pay: amount => `${amount} का भुगतान करें`,
      extend: (days, amount) => `${amount} में ${days} दिन जोड़ें`,
      extendHint: days =>
        `हर भुगतान आपके मौजूदा एक्सेस की समाप्ति तारीख के बाद ${days} दिन जोड़ता है। जितनी बार चाहें भुगतान करें; कुछ भी अपने आप रिन्यू नहीं होता।`,
      accessExtended: date => `एक्सेस ${date} तक बढ़ा दिया गया।`,
      accessActive: "एक्सेस सक्रिय है। अब आप अलर्ट कॉन्फ़िगर कर सकते हैं।",
      paymentPending: "भुगतान कन्फ़र्म हो गया। एक्सेस कुछ ही देर में दिखेगा।",
      loading: {
        processing: "प्रोसेस हो रहा है",
        waitingForWallet: "आपके वॉलेट का इंतज़ार है",
        approving: "अप्रूव हो रहा है",
        paying: "भुगतान हो रहा है",
      },
      unavailable: "सशुल्क एक्सेस अभी उपलब्ध नहीं है।",
      checkFailed: "भुगतान की स्थिति जाँची नहीं जा सकी। थोड़ी देर में फिर से कोशिश करें।",
      approvalNotVisible: "अप्रूवल कन्फ़र्म हो गया है, पर अभी दिख नहीं रहा। थोड़ी देर में फिर से कोशिश करें।",
    },
    payment: {
      stepsLabel: "भुगतान के चरण",
      approveTitle: amount => `${amount} अप्रूव करें`,
      approveHint:
        "पेवॉल को ठीक इतनी ही राशि लेने की अनुमति देता है। अगर पहले का अप्रूवल इसे कवर करता है, तो यह चरण छोड़ दिया जाता है।",
      payTitle: amount => `${amount} का भुगतान करें`,
      payHint: "भुगतान भेजता है और अलर्ट अनलॉक करता है।",
      inProgress: "चल रहा है",
      done: "हो गया",
      notNeeded: "ज़रूरत नहीं",
      transaction: "ट्रांज़ैक्शन ",
      viewOn: explorer => `${explorer} पर देखें`,
      preparingTitle: "भुगतान तैयार हो रहा है",
      preparingBody: "मौजूदा कीमत और आपका अप्रूवल जाँचा जा रहा है।",
      confirmTitle: "अपने वॉलेट में कन्फ़र्म करें",
      approveSignBody: amount =>
        `2 में से चरण 1: ${amount} अप्रूव करें। जब तक आप कन्फ़र्म नहीं करते, कुछ भी नहीं भेजा जाता।`,
      processingOn: network => (network ? `${network} नेटवर्क पर प्रोसेस हो रहा है` : "नेटवर्क पर प्रोसेस हो रहा है"),
      approvePendingBody:
        "2 में से चरण 1: अप्रूवल भेज दिया गया। इसके बाद आपका वॉलेट आपसे भुगतान कन्फ़र्म करने को कहेगा।",
      paySignBody: amount =>
        `2 में से चरण 2: ${amount} का भुगतान करें। जब तक आप कन्फ़र्म नहीं करते, कुछ भी नहीं भेजा जाता।`,
      payPendingBody: "2 में से चरण 2: भुगतान भेज दिया गया। नेटवर्क के कन्फ़र्म करते ही अलर्ट अनलॉक हो जाएँगे।",
    },
  },
  de: {
    page: {
      metaTitle: "Aave V3 und V4: Positionen und Health Factor",
      metaDescription: (networkCount, channels) =>
        `Sieh Sicherheiten, Schulden und Health Factor auf Aave V3 und V4 in ${networkCount} Netzwerken. Alerts per ${channels}, je Markt ein Schwellenwert.`,
      title: "Aave V3 und V4: Positionen und Health-Factor-Alerts",
      networkMarkets: (name, markets) => `${name} (Märkte ${markets})`,
      intro: (v3Networks, v4Networks) =>
        `Verbinde die Wallet, mit der du leihst, um ihre Sicherheiten, Schulden und ihren Health Factor auf Aave V3 auf ${v3Networks} und in jedem Spoke von Aave V4 auf ${v4Networks} zu sehen. Zum Ansehen ist keine Transaktion nötig.`,
      disclosureSummary: "Was Alerts kosten und wie oft wir prüfen",
      alertsCost: (channels, paymentChain) =>
        `Um eine Nachricht per ${channels} zu bekommen, wenn der Health Factor eines Markts unter einen Schwellenwert fällt, den du wählst, schalte die Alerts mit einer USDC-Zahlung${paymentChain ? ` auf ${paymentChain}` : ""} frei. Der aktuelle Preis wird vor dem Bezahlen angezeigt.`,
      checks: minutes =>
        `Tokenping prüft ${plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` })}. Solange der Health Factor unter deinem Schwellenwert bleibt, sendet jede Prüfung eine weitere Nachricht über jeden Kanal, den du gewählt hast.`,
      guideThreshold: "So wählst du einen Schwellenwert",
      guideAlerts: "So funktionieren Alerts",
      morphoDashboard: "Du leihst auf Morpho? Öffne das Morpho-Dashboard",
    },
    gate: {
      title: "Verbinde eine Wallet, um fortzufahren",
      description:
        "Tokenping braucht deine Wallet-Adresse, um deine Aave-Positionen anzuzeigen. Das Verbinden bewegt kein Guthaben und kostet keine Gebühr.",
      connect: "Wallet verbinden",
      connecting: "Wird verbunden",
      approveInWallet: "Bestätige die Verbindung in deiner Wallet.",
    },
    positionsHeading: "Deine Aave-Positionen",
    loadingDashboard: "Dein Dashboard wird geladen",
    toolbar: {
      wallet: "Wallet",
      refresh: "Positionen aktualisieren",
      refreshing: "Wird aktualisiert",
      loadingPositions: "Positionen werden geladen",
    },
    errors: {
      positionsDidNotLoad: "Positionen wurden nicht geladen",
      refreshFailed: "Aktualisierung fehlgeschlagen",
      showingLastPositions: "Angezeigt werden die Positionen vom letzten erfolgreichen Laden.",
      tryAgain: "Erneut versuchen",
      fetchPositionsFailed: "Aave-Positionen konnten nicht abgerufen werden",
    },
    totals: {
      supplied: "Eingezahlt gesamt",
      borrowed: "Geliehen gesamt",
      netWorth: "Nettovermögen",
      noData: "Keine Daten",
    },
    networks: {
      heading: "Märkte",
      active: count => `${count} aktiv`,
      noPositions: "In den unterstützten Märkten wurden keine aktiven Aave-Positionen gefunden.",
      selectedRegion: "Ausgewählter Markt",
      noneSelectedTitle: "Kein Markt ausgewählt",
      noneSelectedDescription: "Wähle einen Markt, um seine Aave-Position zu sehen.",
      otherMarkets: count => `Weitere Märkte (${count})`,
      otherMarketsHint:
        "Märkte, die Tokenping geprüft hat und in denen diese Wallet weder eine Position noch einen Alert hat.",
      alertSet: "Alert eingerichtet",
      supplied: usd => `${usd} eingezahlt,`,
      borrowed: usd => `${usd} geliehen`,
      noPosition: "Keine Position",
    },
    healthFactor: {
      srPrefix: "Health Factor ",
      noDebt: "Keine Schulden",
      critical: "Kritisch",
      risky: "Riskant",
      safe: "Sicher",
    },
    position: {
      market: version => (version === 4 ? "Aave-V4-Spoke" : "Aave-V3-Markt"),
      noPositionTitle: chainName => `Keine aktive Position ${deOnMarket(chainName)}`,
      noPositionDetail: chainName =>
        `Aave meldet für diese Wallet ${deOnMarket(chainName)} keine Sicherheiten und keine Schulden.`,
      collateral: "Sicherheiten",
      debt: "Schulden",
      netWorth: "Nettovermögen",
      suppliedTitle: "Eingezahlt",
      borrowedTitle: "Geliehen",
      noCollateral: "Keine Sicherheiten eingezahlt",
      noDebt: "Keine offenen Schulden",
      tokenIconsFrom: "Token- und Netzwerk-Icons von",
      tokenDetailsFailedTitle: "Token-Details wurden nicht geladen",
      tokenDetailsFailedBody:
        "Die Summen oben stammen aus der Kontoübersicht von Aave. Aktualisiere die Positionen, um es erneut zu versuchen.",
    },
    tokens: {
      asset: "Asset",
      supplied: "Eingezahlt",
      supplyApy: "Einzahlungs-APY",
      collateral: "Als Sicherheit",
      borrowed: "Geliehen",
      rateType: "Zinsart",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
      stable: amount => `Stabil ${amount}`,
      variable: amount => `Variabel ${amount}`,
      count: count => plural("de", count, { one: `${count} Asset`, other: `${count} Assets` }),
    },
    address: {
      defaultLabel: "Adresse",
      copy: (_label, address) => `Adresse ${address} kopieren`,
      copied: "Adresse kopiert",
      copyFailed: "Kopieren fehlgeschlagen. Markiere die Adresse und kopiere sie von Hand.",
    },
    opensInNewTab: "(öffnet in einem neuen Tab)",
    paywall: {
      unlockedUntil: date => `Alerts freigeschaltet bis zum ${date}`,
      titleNew: "Health-Factor-Alerts freischalten",
      titleExtend: "Zugang verlängern, um deine Alerts zu bearbeiten",
      descriptionNew:
        "Zahle einmal, um die Alert-Einstellungen freizuschalten und für jedes Netzwerk einen Health-Factor-Schwellenwert festzulegen. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.",
      descriptionExtend:
        "Deine bisherigen Alert-Einstellungen sind gespeichert. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.",
      networkDescriptionNew: chainName =>
        `Zahle einmal, um Health-Factor-Alerts ${deOnMarket(chainName)} und in anderen Märkten einzurichten. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.`,
      networkDescriptionExtend: chainName =>
        `Deine gespeicherten Alert-Einstellungen ${deForMarket(chainName)} sind noch in deinem Konto. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.`,
      connectWallet: "Verbinde deine Wallet, um den Zugang zu bezahlen.",
      unconfigured: "Für dieses Netzwerk ist kein Zahlungs-Contract eingerichtet.",
      noPlan: "Derzeit ist kein bezahlter Plan verfügbar.",
      paused: "Zahlungen sind gerade pausiert. Versuche es später erneut.",
      statusUnavailable:
        "Der Zahlungsstatus konnte nicht geladen werden. Lade die Seite neu, um es erneut zu versuchen.",
      wrongNetworkTitle: "Falsches Netzwerk",
      wrongNetworkBody: (walletChain, target) =>
        `Deine Wallet ist ${walletChain ? `im Netzwerk ${walletChain}` : "in einem anderen Netzwerk"}. Wechsle ${target ? `zu ${target}` : "zum Zahlungsnetzwerk"}, um zu bezahlen.`,
      switchTo: target => (target ? `Zu ${target} wechseln` : "Zum Zahlungsnetzwerk wechseln"),
      switching: "Netzwerk wird gewechselt",
      loadingDetails: "Zahlungsdetails werden geladen",
      price: "Preis",
      access: "Zugang",
      network: "Netzwerk",
      networkFee: "Netzwerkgebühr",
      networkFeeValue: symbol => `Für jeden Schritt in ${symbol} bezahlt, in deiner Wallet angezeigt`,
      period: (days, about) => {
        const period = plural("de", days, { one: `${days} Tag`, other: `${days} Tage` });
        return about ? `Etwa ${period}` : period;
      },
      pay: amount => `${amount} bezahlen`,
      extend: (days, amount) =>
        `${plural("de", days, { one: `${days} Tag`, other: `${days} Tage` })} für ${amount} hinzufügen`,
      extendHint: days =>
        `Jede Zahlung fügt nach deinem aktuellen Enddatum ${plural("de", days, { one: `${days} Tag`, other: `${days} Tage` })} hinzu. Zahle so oft du willst; nichts verlängert sich von selbst.`,
      accessExtended: date => `Zugang verlängert bis zum ${date}.`,
      accessActive: "Zugang aktiv. Du kannst jetzt die Alerts einrichten.",
      paymentPending: "Zahlung bestätigt. Der Zugang erscheint in Kürze.",
      loading: {
        processing: "Wird verarbeitet",
        waitingForWallet: "Warte auf deine Wallet",
        approving: "Wird freigegeben",
        paying: "Wird bezahlt",
      },
      unavailable: "Bezahlter Zugang ist gerade nicht verfügbar.",
      checkFailed: "Der Zahlungsstatus konnte nicht geprüft werden. Versuche es gleich noch einmal.",
      approvalNotVisible: "Die Freigabe ist bestätigt, aber noch nicht sichtbar. Versuche es gleich noch einmal.",
    },
    payment: {
      stepsLabel: "Zahlungsschritte",
      approveTitle: amount => `${amount} freigeben`,
      approveHint:
        "Erlaubt dem Zahlungs-Contract, genau diesen Betrag einzuziehen. Entfällt, wenn eine frühere Freigabe ihn schon abdeckt.",
      payTitle: amount => `${amount} bezahlen`,
      payHint: "Sendet die Zahlung und schaltet die Alerts frei.",
      inProgress: "Läuft",
      done: "Erledigt",
      notNeeded: "Nicht nötig",
      transaction: "Transaktion ",
      viewOn: explorer => `Auf ${explorer} ansehen`,
      preparingTitle: "Zahlung wird vorbereitet",
      preparingBody: "Der aktuelle Preis und deine Freigabe werden geprüft.",
      confirmTitle: "In deiner Wallet bestätigen",
      approveSignBody: amount => `Schritt 1 von 2: ${amount} freigeben. Nichts wird gesendet, bis du bestätigst.`,
      processingOn: network => (network ? `Wird im Netzwerk ${network} verarbeitet` : "Wird im Netzwerk verarbeitet"),
      approvePendingBody:
        "Schritt 1 von 2: Freigabe gesendet. Als Nächstes bittet dich deine Wallet, die Zahlung zu bestätigen.",
      paySignBody: amount => `Schritt 2 von 2: ${amount} bezahlen. Nichts wird gesendet, bis du bestätigst.`,
      payPendingBody:
        "Schritt 2 von 2: Zahlung gesendet. Die Alerts werden freigeschaltet, sobald das Netzwerk sie bestätigt.",
    },
  },
  vi: {
    page: {
      metaTitle: "Vị thế và hệ số sức khỏe trên Aave V3 và V4",
      metaDescription: (networkCount, channels) =>
        `Tài sản thế chấp, nợ và hệ số sức khỏe của bạn trên Aave V3 và V4, trên ${networkCount} mạng, kèm cảnh báo qua ${channels}, mỗi thị trường một ngưỡng.`,
      title: "Vị thế trên Aave V3 và V4, cảnh báo hệ số sức khỏe",
      networkMarkets: (name, markets) => `${name} (các thị trường ${markets})`,
      intro: (v3Networks, v4Networks) =>
        `Kết nối ví mà bạn dùng để vay, rồi xem tài sản thế chấp, khoản nợ và hệ số sức khỏe (health factor) của ví đó trên Aave V3 trên các mạng ${v3Networks}, và trong mọi Spoke của Aave V4 trên các mạng ${v4Networks}. Việc xem không cần giao dịch nào.`,
      disclosureSummary: "Chi phí của cảnh báo và tần suất kiểm tra",
      alertsCost: (channels, paymentChain) =>
        `Để nhận tin nhắn qua ${channels} khi hệ số sức khỏe của một thị trường giảm xuống dưới ngưỡng bạn chọn, hãy mở khóa cảnh báo bằng một khoản thanh toán USDC${paymentChain ? ` trên mạng ${paymentChain}` : ""}. Giá hiện tại được hiển thị trước khi bạn thanh toán.`,
      checks: minutes =>
        `Tokenping kiểm tra ${minutes} phút một lần. Khi hệ số sức khỏe vẫn ở dưới ngưỡng của bạn, mỗi lần kiểm tra lại gửi thêm một tin nhắn qua từng kênh bạn đã chọn.`,
      guideThreshold: "Cách chọn ngưỡng",
      guideAlerts: "Cách cảnh báo hoạt động",
      morphoDashboard: "Bạn vay trên Morpho? Mở bảng điều khiển Morpho",
    },
    gate: {
      title: "Kết nối ví để tiếp tục",
      description:
        "Tokenping cần địa chỉ ví của bạn để hiển thị các vị thế Aave của bạn. Việc kết nối không chuyển tiền và không mất phí.",
      connect: "Kết nối ví",
      connecting: "Đang kết nối",
      approveInWallet: "Hãy xác nhận kết nối trong ví của bạn.",
    },
    positionsHeading: "Vị thế Aave của bạn",
    loadingDashboard: "Đang tải bảng điều khiển của bạn",
    toolbar: {
      wallet: "Ví",
      refresh: "Làm mới vị thế",
      refreshing: "Đang làm mới",
      loadingPositions: "Đang tải vị thế",
    },
    errors: {
      positionsDidNotLoad: "Không tải được vị thế",
      refreshFailed: "Không làm mới được",
      showingLastPositions: "Đang hiển thị các vị thế từ lần tải thành công gần nhất.",
      tryAgain: "Thử lại",
      fetchPositionsFailed: "Không lấy được các vị thế Aave",
    },
    totals: {
      supplied: "Tổng đã gửi",
      borrowed: "Tổng đã vay",
      netWorth: "Giá trị ròng",
      noData: "Không có dữ liệu",
    },
    networks: {
      heading: "Thị trường",
      active: count => `${count} đang hoạt động`,
      noPositions: "Không tìm thấy vị thế Aave nào đang hoạt động trong các thị trường được hỗ trợ.",
      selectedRegion: "Thị trường đã chọn",
      noneSelectedTitle: "Chưa chọn thị trường",
      noneSelectedDescription: "Chọn một thị trường để xem vị thế Aave trên thị trường đó.",
      otherMarkets: count => `Thị trường khác (${count})`,
      otherMarketsHint: "Các thị trường Tokenping đã kiểm tra mà ví này không có vị thế và không có cảnh báo.",
      alertSet: "Đã đặt cảnh báo",
      supplied: usd => `${usd} đã gửi,`,
      borrowed: usd => `${usd} đã vay`,
      noPosition: "Không có vị thế",
    },
    healthFactor: {
      srPrefix: "Hệ số sức khỏe ",
      noDebt: "Không có nợ",
      critical: "Nguy cấp",
      risky: "Rủi ro",
      safe: "An toàn",
    },
    position: {
      market: version => (version === 4 ? "Spoke của Aave V4" : "Thị trường Aave V3"),
      noPositionTitle: chainName => `Không có vị thế đang hoạt động trên ${viMarket(chainName)}`,
      noPositionDetail: chainName =>
        `Theo Aave, ví này không có tài sản thế chấp và không có nợ trên ${viMarket(chainName)}.`,
      collateral: "Tài sản thế chấp",
      debt: "Nợ",
      netWorth: "Giá trị ròng",
      suppliedTitle: "Đã gửi",
      borrowedTitle: "Đã vay",
      noCollateral: "Chưa gửi tài sản thế chấp",
      noDebt: "Không có khoản nợ nào",
      tokenIconsFrom: "Biểu tượng token và mạng từ",
      tokenDetailsFailedTitle: "Không tải được chi tiết token",
      tokenDetailsFailedBody: "Các tổng số ở trên lấy từ bản tóm tắt tài khoản của Aave. Làm mới vị thế để thử lại.",
    },
    tokens: {
      asset: "Tài sản",
      supplied: "Đã gửi",
      supplyApy: "APY khi gửi",
      collateral: "Thế chấp",
      borrowed: "Đã vay",
      rateType: "Loại lãi suất",
      enabled: "Bật",
      disabled: "Tắt",
      stable: amount => `Ổn định ${amount}`,
      variable: amount => `Thả nổi ${amount}`,
      count: count => plural("vi", count, { one: `${count} tài sản`, other: `${count} tài sản` }),
    },
    address: {
      defaultLabel: "Địa chỉ",
      copy: (_label, address) => `Sao chép địa chỉ ${address}`,
      copied: "Đã sao chép địa chỉ",
      copyFailed: "Không sao chép được. Hãy chọn địa chỉ và sao chép thủ công.",
    },
    opensInNewTab: "(mở trong thẻ mới)",
    paywall: {
      unlockedUntil: date => `Cảnh báo đã mở khóa đến ngày ${date}`,
      titleNew: "Mở khóa cảnh báo hệ số sức khỏe",
      titleExtend: "Gia hạn quyền truy cập để sửa cảnh báo",
      descriptionNew:
        "Thanh toán một lần để mở khóa cài đặt cảnh báo và đặt ngưỡng hệ số sức khỏe cho từng mạng. Không có gì tự động gia hạn: bạn thanh toán từ ví của mình khi muốn gia hạn.",
      descriptionExtend:
        "Cài đặt cảnh báo trước đây của bạn vẫn được lưu. Thanh toán lại để gia hạn quyền truy cập và chỉnh sửa chúng.",
      networkDescriptionNew: chainName =>
        `Thanh toán một lần để đặt cảnh báo hệ số sức khỏe trên ${viMarket(chainName)} và các thị trường khác. Không có gì tự động gia hạn: bạn thanh toán từ ví của mình khi muốn gia hạn.`,
      networkDescriptionExtend: chainName =>
        `Cài đặt cảnh báo bạn đã lưu cho ${viMarket(chainName)} vẫn còn trong tài khoản của bạn. Thanh toán lại để gia hạn quyền truy cập và chỉnh sửa chúng.`,
      connectWallet: "Kết nối ví để thanh toán quyền truy cập.",
      unconfigured: "Hợp đồng thanh toán chưa được cấu hình cho mạng này.",
      noPlan: "Hiện chưa có gói trả phí nào.",
      paused: "Thanh toán đang tạm dừng. Hãy thử lại sau.",
      statusUnavailable: "Không tải được trạng thái thanh toán. Tải lại trang để thử lại.",
      wrongNetworkTitle: "Sai mạng",
      wrongNetworkBody: (walletChain, target) =>
        `Ví của bạn đang ở ${walletChain ? `mạng ${walletChain}` : "một mạng khác"}. Chuyển sang ${target ? `mạng ${target}` : "mạng thanh toán"} để thanh toán.`,
      switchTo: target => `Chuyển sang ${target ? `mạng ${target}` : "mạng thanh toán"}`,
      switching: "Đang chuyển mạng",
      loadingDetails: "Đang tải chi tiết thanh toán",
      price: "Giá",
      access: "Quyền truy cập",
      network: "Mạng",
      networkFee: "Phí mạng",
      networkFeeValue: symbol => `Trả bằng ${symbol} cho mỗi bước, hiển thị trong ví của bạn`,
      period: (days, about) => {
        const period = `${days} ngày`;
        return about ? `Khoảng ${period}` : period;
      },
      pay: amount => `Thanh toán ${amount}`,
      extend: (days, amount) => `Thêm ${days} ngày với giá ${amount}`,
      extendHint: days =>
        `Mỗi lần thanh toán thêm ${days} ngày tính từ ngày kết thúc hiện tại của bạn. Bạn có thể thanh toán bao nhiêu lần tùy ý; không có gì tự gia hạn.`,
      accessExtended: date => `Đã gia hạn quyền truy cập đến ngày ${date}.`,
      accessActive: "Quyền truy cập đang hoạt động. Giờ bạn có thể cài đặt cảnh báo.",
      paymentPending: "Đã xác nhận thanh toán. Quyền truy cập sẽ sớm xuất hiện.",
      loading: {
        processing: "Đang xử lý",
        waitingForWallet: "Đang chờ ví của bạn",
        approving: "Đang phê duyệt",
        paying: "Đang thanh toán",
      },
      unavailable: "Quyền truy cập trả phí hiện không khả dụng.",
      checkFailed: "Không kiểm tra được trạng thái thanh toán. Hãy thử lại sau giây lát.",
      approvalNotVisible: "Phê duyệt đã được xác nhận nhưng chưa hiển thị. Hãy thử lại sau giây lát.",
    },
    payment: {
      stepsLabel: "Các bước thanh toán",
      approveTitle: amount => `Phê duyệt ${amount}`,
      approveHint:
        "Cho phép hợp đồng thanh toán lấy đúng số tiền này. Được bỏ qua nếu một lần phê duyệt trước đó đã đủ.",
      payTitle: amount => `Thanh toán ${amount}`,
      payHint: "Gửi khoản thanh toán và mở khóa cảnh báo.",
      inProgress: "Đang thực hiện",
      done: "Xong",
      notNeeded: "Không cần",
      transaction: "Giao dịch ",
      viewOn: explorer => `Xem trên ${explorer}`,
      preparingTitle: "Đang chuẩn bị thanh toán",
      preparingBody: "Đang kiểm tra giá hiện tại và phê duyệt của bạn.",
      confirmTitle: "Xác nhận trong ví của bạn",
      approveSignBody: amount => `Bước 1/2: phê duyệt ${amount}. Không có gì được gửi cho đến khi bạn xác nhận.`,
      processingOn: network => (network ? `Đang xử lý trên mạng ${network}` : "Đang xử lý trên mạng"),
      approvePendingBody: "Bước 1/2: đã gửi phê duyệt. Tiếp theo, ví của bạn sẽ yêu cầu bạn xác nhận thanh toán.",
      paySignBody: amount => `Bước 2/2: thanh toán ${amount}. Không có gì được gửi cho đến khi bạn xác nhận.`,
      payPendingBody: "Bước 2/2: đã gửi thanh toán. Cảnh báo được mở khóa khi mạng xác nhận giao dịch.",
    },
  },
};
