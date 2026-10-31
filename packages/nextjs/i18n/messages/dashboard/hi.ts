import type { DashboardMessages } from "./shared";
import { hiMarket, plural } from "~~/i18n/format";

export const MESSAGES: DashboardMessages = {
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
    approvePendingBody: "2 में से चरण 1: अप्रूवल भेज दिया गया। इसके बाद आपका वॉलेट आपसे भुगतान कन्फ़र्म करने को कहेगा।",
    paySignBody: amount =>
      `2 में से चरण 2: ${amount} का भुगतान करें। जब तक आप कन्फ़र्म नहीं करते, कुछ भी नहीं भेजा जाता।`,
    payPendingBody: "2 में से चरण 2: भुगतान भेज दिया गया। नेटवर्क के कन्फ़र्म करते ही अलर्ट अनलॉक हो जाएँगे।",
  },
};
