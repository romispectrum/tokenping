import type { DashboardMessages } from "./shared";
import { filForMarket, filOnMarket, plural } from "~~/i18n/format";

/** "1 araw", "30 araw": Filipino nouns do not change after a number, so both forms read the same. */
const days = (count: number) => plural("fil", count, { one: `${count} araw`, other: `${count} araw` });

export const MESSAGES: DashboardMessages = {
  page: {
    metaTitle: "Mga posisyon at health factor sa Aave V3 at V4",
    metaDescription: (networkCount, channels) =>
      `Tingnan ang collateral, utang at health factor mo sa Aave V3 at V4 sa ${networkCount} network, at mag-set ng alerto sa ${channels}, threshold kada market.`,
    title: "Mga posisyon sa Aave V3 at V4 at mga health factor alert",
    networkMarkets: (name, markets) => `${name} (mga market na ${markets})`,
    intro: (v3Networks, v4Networks) =>
      `Ikonekta ang wallet na ginagamit mo sa pag-borrow para makita ang collateral, utang at health factor nito sa Aave V3 sa ${v3Networks}, at sa bawat Aave V4 Spoke sa ${v4Networks}. Walang kailangang transaksyon para tumingin.`,
    disclosureSummary: "Magkano ang mga alerto at gaano kadalas kami tumitingin",
    alertsCost: (channels, paymentChain) =>
      `Para makatanggap ng mensahe sa ${channels} kapag bumaba ang health factor ng isang market sa threshold na pipiliin mo, i-unlock ang mga alerto sa pamamagitan ng bayad na USDC${paymentChain ? ` sa ${paymentChain}` : ""}. Ipapakita ang kasalukuyang presyo bago ka magbayad.`,
    checks: (minutes, repeatMinutes) =>
      `Tumitingin ang Tokenping bawat ${minutes} minuto. Habang nananatiling mas mababa sa threshold mo ang health factor, makakatanggap ka ng mensahe bawat ${repeatMinutes} minuto sa bawat channel na pinili mo.`,
    guideThreshold: "Paano pumili ng threshold",
    guideAlerts: "Paano gumagana ang mga alerto",
    morphoDashboard: "Nagbo-borrow sa Morpho? Buksan ang Morpho dashboard",
  },
  gate: {
    title: "Ikonekta ang wallet para magpatuloy",
    description:
      "Kailangan ng Tokenping ang wallet address mo para ipakita ang mga posisyon mo sa Aave. Hindi naglilipat ng pondo ang pagkonekta at walang bayad ito.",
    connect: "Ikonekta ang wallet",
    connecting: "Kumokonekta",
    approveInWallet: "I-approve ang koneksyon sa wallet mo.",
  },
  positionsHeading: "Ang mga posisyon mo sa Aave",
  loadingDashboard: "Nilo-load ang dashboard mo",
  toolbar: {
    wallet: "Wallet",
    refresh: "I-refresh ang mga posisyon",
    refreshing: "Nire-refresh",
    loadingPositions: "Nilo-load ang mga posisyon",
  },
  errors: {
    positionsDidNotLoad: "Hindi na-load ang mga posisyon",
    refreshFailed: "Hindi na-refresh",
    showingLastPositions: "Ipinapakita ang mga posisyon mula sa huling matagumpay na pag-load.",
    tryAgain: "Subukan ulit",
    fetchPositionsFailed: "Hindi makuha ang mga posisyon sa Aave",
  },
  totals: {
    supplied: "Kabuuang naka-deposit",
    borrowed: "Kabuuang hiniram",
    netWorth: "Net worth",
    noData: "Walang data",
  },
  networks: {
    heading: "Mga market",
    active: count => plural("fil", count, { one: `${count} aktibo`, other: `${count} aktibo` }),
    noPositions: "Walang nakitang aktibong posisyon sa Aave sa mga sinusuportahang market.",
    selectedRegion: "Napiling market",
    noneSelectedTitle: "Walang napiling market",
    noneSelectedDescription: "Pumili ng market para makita ang posisyon mo sa Aave doon.",
    otherMarkets: count => `Iba pang market (${count})`,
    otherMarketsHint:
      "Mga market na tiningnan ng Tokenping kung saan walang posisyon at walang alerto ang wallet na ito.",
    alertSet: "May alerto",
    supplied: usd => `${usd} naka-deposit,`,
    borrowed: usd => `${usd} hiniram`,
    noPosition: "Walang posisyon",
  },
  healthFactor: {
    srPrefix: "Health factor ",
    noDebt: "Walang utang",
    critical: "Kritikal",
    risky: "Delikado",
    safe: "Ligtas",
  },
  position: {
    market: version => (version === 4 ? "Aave V4 Spoke" : "Market ng Aave V3"),
    noPositionTitle: chainName => `Walang aktibong posisyon ${filOnMarket(chainName)}`,
    noPositionDetail: chainName =>
      `Walang collateral at walang utang na naitala ang Aave para sa wallet na ito ${filOnMarket(chainName)}.`,
    collateral: "Collateral",
    debt: "Utang",
    netWorth: "Net worth",
    suppliedTitle: "Naka-deposit",
    borrowedTitle: "Hiniram",
    noCollateral: "Walang naka-deposit na collateral",
    noDebt: "Walang natitirang utang",
    tokenIconsFrom: "Mga icon ng token at network mula sa",
    tokenDetailsFailedTitle: "Hindi na-load ang mga detalye ng token",
    tokenDetailsFailedBody:
      "Galing sa account summary ng Aave ang mga kabuuan sa itaas. I-refresh ang mga posisyon para subukan ulit.",
  },
  tokens: {
    asset: "Asset",
    supplied: "Naka-deposit",
    supplyApy: "Supply APY",
    collateral: "Collateral",
    borrowed: "Hiniram",
    rateType: "Uri ng rate",
    enabled: "Naka-on",
    disabled: "Naka-off",
    stable: amount => `Stable ${amount}`,
    variable: amount => `Variable ${amount}`,
    count: count => plural("fil", count, { one: `${count} asset`, other: `${count} asset` }),
  },
  address: {
    defaultLabel: "Address",
    copy: (_label, address) => `Kopyahin ang address na ${address}`,
    copied: "Nakopya ang address",
    copyFailed: "Hindi makopya. Piliin ang address at kopyahin ito nang mano-mano.",
  },
  opensInNewTab: "(bubukas sa bagong tab)",
  paywall: {
    unlockedUntil: date => `Naka-unlock ang mga alerto hanggang ${date}`,
    titleNew: "I-unlock ang mga health factor alert",
    titleExtend: "I-extend ang access para ma-edit ang mga alerto mo",
    descriptionNew:
      "Magbayad nang isang beses para i-unlock ang mga setting ng alerto at mag-set ng health factor threshold para sa bawat network. Walang awtomatikong nire-renew: magbabayad ka mula sa wallet mo kapag gusto mong mag-extend.",
    descriptionExtend:
      "Naka-save ang dati mong mga setting ng alerto. Magbayad ulit para i-extend ang access at i-edit ang mga ito.",
    networkDescriptionNew: chainName =>
      `Magbayad nang isang beses para mag-set ng mga health factor alert ${filOnMarket(chainName)} at sa ibang market. Walang awtomatikong nire-renew: magbabayad ka mula sa wallet mo kapag gusto mong mag-extend.`,
    networkDescriptionExtend: chainName =>
      `Nasa account mo pa ang mga naka-save mong setting ng alerto ${filForMarket(chainName)}. Magbayad ulit para i-extend ang access at i-edit ang mga ito.`,
    connectWallet: "Ikonekta ang wallet mo para magbayad para sa access.",
    unconfigured: "Hindi pa naka-configure ang payment contract para sa network na ito.",
    noPlan: "Walang available na bayad na plan sa ngayon.",
    paused: "Naka-pause ang mga bayad ngayon. Subukan ulit mamaya.",
    statusUnavailable: "Hindi ma-load ang status ng bayad. I-reload ang page para subukan ulit.",
    wrongNetworkTitle: "Maling network",
    wrongNetworkBody: (walletChain, target) =>
      `Nasa ${walletChain ?? "ibang network"} ang wallet mo. Lumipat sa ${target ?? "network ng bayad"} para magbayad.`,
    switchTo: target => `Lumipat sa ${target ?? "network ng bayad"}`,
    switching: "Nagpapalit ng network",
    loadingDetails: "Nilo-load ang mga detalye ng bayad",
    price: "Presyo",
    access: "Access",
    network: "Network",
    networkFee: "Network fee",
    networkFeeValue: symbol => `Binabayaran sa ${symbol} sa bawat hakbang, makikita sa wallet mo`,
    period: (count, about) => (about ? `Mga ${days(count)}` : days(count)),
    pay: amount => `Magbayad ng ${amount}`,
    extend: (count, amount) => `Magdagdag ng ${days(count)} sa halagang ${amount}`,
    extendHint: count =>
      `Nagdadagdag ang bawat bayad ng ${days(count)} pagkatapos ng kasalukuyang end date mo. Magbayad nang ilang beses mo gusto; walang kusang nire-renew.`,
    accessExtended: date => `Na-extend ang access hanggang ${date}.`,
    accessActive: "Aktibo ang access. Puwede mo nang i-set up ang mga alerto.",
    paymentPending: "Kumpirmado ang bayad. Lalabas na ang access maya-maya.",
    loading: {
      processing: "Pinoproseso",
      waitingForWallet: "Hinihintay ang wallet mo",
      approving: "Ina-approve",
      paying: "Nagbabayad",
    },
    unavailable: "Hindi available ang bayad na access sa ngayon.",
    checkFailed: "Hindi matingnan ang status ng bayad. Subukan ulit maya-maya.",
    approvalNotVisible: "Kumpirmado na ang approval pero hindi pa ito nakikita. Subukan ulit maya-maya.",
  },
  payment: {
    stepsLabel: "Mga hakbang sa pagbabayad",
    approveTitle: amount => `I-approve ang ${amount}`,
    approveHint:
      "Pinapayagan ang paywall na kunin ang eksaktong halagang ito. Nilalaktawan kapag sakop na ito ng naunang approval.",
    payTitle: amount => `Magbayad ng ${amount}`,
    payHint: "Ipinapadala ang bayad at ina-unlock ang mga alerto.",
    inProgress: "Ginagawa",
    done: "Tapos na",
    notNeeded: "Hindi kailangan",
    transaction: "Transaksyon ",
    viewOn: explorer => `Tingnan sa ${explorer}`,
    preparingTitle: "Inihahanda ang bayad",
    preparingBody: "Tinitingnan ang kasalukuyang presyo at ang approval mo.",
    confirmTitle: "Kumpirmahin sa wallet mo",
    approveSignBody: amount =>
      `Hakbang 1 sa 2: i-approve ang ${amount}. Walang maipapadala hangga't hindi mo kinukumpirma.`,
    processingOn: network => `Pinoproseso sa ${network ?? "network"}`,
    approvePendingBody:
      "Hakbang 1 sa 2: naipasa na ang approval. Susunod, hihilingin ng wallet mo na kumpirmahin ang bayad.",
    paySignBody: amount => `Hakbang 2 sa 2: magbayad ng ${amount}. Walang maipapadala hangga't hindi mo kinukumpirma.`,
    payPendingBody:
      "Hakbang 2 sa 2: naipasa na ang bayad. Maa-unlock ang mga alerto kapag nakumpirma na ito ng network.",
  },
};
