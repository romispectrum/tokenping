/** What a dashboard's wallet gate says before a wallet is connected. */
export type GateMessages = {
  title: string;
  description: string;
  connect: string;
  connecting: string;
  approveInWallet: string;
};

export type DashboardMessages = {
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
