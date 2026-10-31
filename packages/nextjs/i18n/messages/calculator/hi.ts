import type { CalculatorMessages } from "./shared";
import { joinList } from "~~/i18n/format";

export const MESSAGES: CalculatorMessages = {
  title: "Aave लिक्विडेशन कीमत कैलकुलेटर",
  intro:
    "हेल्थ फ़ैक्टर और वे कीमतें जानने के लिए जिन पर पोज़िशन लिक्विडेट हो सकती है, हर कोलैटरल एसेट और अपना कर्ज़ दर्ज करें। कैलकुलेटर Aave V3 का फ़ॉर्मूला इस्तेमाल करता है: Σ(कोलैटरल का मूल्य × लिक्विडेशन सीमा) ÷ कर्ज़ का मूल्य।",
  examplesLabel: "हल किया गया उदाहरण लोड करें:",
  examples: {
    "one-collateral": "10 WETH, 12,000 USDC कर्ज़",
    "two-collaterals": "10 WETH + 0.2 WBTC, 20,000 USDC कर्ज़",
    "volatile-debt": "10,000 USDC, 2.5 WETH उधार लिया",
  },
  defaultCollateralName: index => `कोलैटरल ${index}`,
  defaultDebtName: "कर्ज़ वाला एसेट",
  collateralLegend: index => `कोलैटरल ${index}`,
  presetLabel: "Aave V3 एसेट (सीमा अपने आप भरती है)",
  eModeHint: (collateral, borrowable) =>
    `यह सीमा ${joinList("hi", collateral)} के लिए गिनी जाती है; बाकी कोलैटरल अपनी सीमा रखता है। इस E-Mode में आप सिर्फ़ ${joinList("hi", borrowable)} उधार ले सकते हैं।`,
  otherAsset: "दूसरा एसेट: सीमा खुद दर्ज करें",
  presetGroup: (market, date) => `${market} (${date} को पढ़ा गया)`,
  presetLabels: {
    "ethereum-core-emode-eth": 'E-Mode "ETH correlated" (जैसे WETH, wstETH, weETH)',
    "arbitrum-usdc": "USDC (नेटिव)",
  },
  nameLabel: "एसेट का नाम",
  namePlaceholder: symbols => `जैसे ${joinList("hi", symbols, "disjunction")}`,
  amountSupplied: "जमा की गई राशि",
  price: "कीमत (USD)",
  priceHint: "Aave के ओरेकल की कीमत, जो Aave ऐप में एसेट के पेज पर दिखती है।",
  threshold: "लिक्विडेशन सीमा (%)",
  thresholdHint: "E-Mode में, श्रेणी की सीमा। Aave V4 पर, कोलैटरल फ़ैक्टर (collateral factor)।",
  removeCollateral: index => `कोलैटरल ${index} हटाएं`,
  addCollateral: "दूसरा कोलैटरल जोड़ें",
  debtLegend: "कर्ज़",
  debtKindLegend: "आपने क्या उधार लिया?",
  debtKinds: { stable: "एक स्टेबलकॉइन ($1.00 पर गिना जाता है)", volatile: "एक अस्थिर एसेट, जैसे WETH" },
  debtAmount: { stable: "उधार ली गई राशि (USD)", volatile: "उधार ली गई राशि (टोकन)" },
  debtAmountHint: "अब तक जुड़ा ब्याज शामिल करें।",
  debtPrice: "उधार लिए गए एसेट की कीमत (USD)",
  errors: {
    number: "10 या 0.25 जैसी संख्या दर्ज करें, दशमलव के लिए बिंदु के साथ।",
    price: "0 से ऊपर की कीमत दर्ज करें।",
    threshold: "0 से ऊपर और ज़्यादा से ज़्यादा 100 का प्रतिशत दर्ज करें।",
    samePrice: (name, price) =>
      `${name} ऊपर पहले से ${price} पर दर्ज है। वही कीमत इस्तेमाल करें: एक एसेट की एक ही कीमत होती है।`,
  },
  eModeLead: "कोई नतीजा नहीं: Aave इस संयोजन की अनुमति नहीं देता।",
  eModeConflict: ({ market, category, borrowable, loan, thresholdPercent, ownThresholds }) => {
    const borrowableList = joinList("hi", borrowable);
    const loanText = loan.kind === "stable" ? "स्टेबलकॉइन लोन" : `उधार लिए गए ${loan.name}`;
    const own = ownThresholds.length ? ` (${ownThresholds.join(", ")})` : "";
    return (
      `${market} का "${category}" E-Mode सिर्फ़ ${borrowableList} उधार लेने देता है, इसलिए ${loanText} वाला अकाउंट ` +
      `उसकी ${thresholdPercent}% सीमा इस्तेमाल नहीं कर सकता। इसके बजाय कोलैटरल की अपनी सीमा चुनें${own}, या ${borrowableList} उधार लें।`
    );
  },
  results: {
    heading: "नतीजा",
    empty: "नतीजा देखने के लिए हर फ़ील्ड में संख्या दर्ज करें।",
    summaryLine: (title, value) => `${title}: ${value}।`,
    healthFactor: "हेल्थ फ़ैक्टर",
    noDebt: "कोई कर्ज़ नहीं, इसलिए लिक्विडेट करने को कुछ नहीं है।",
    liquidatableNow: "1.00 से नीचे: पोज़िशन अभी लिक्विडेट हो सकती है।",
    liquidatableBelow: "पोज़िशन 1.00 से नीचे लिक्विडेट हो सकती है।",
    none: "कोई नहीं",
    priceTitle: name => `${name} लिक्विडेशन कीमत`,
    priceTitleBorrowed: name => `${name} लिक्विडेशन कीमत (उधार लिया गया)`,
    priceTitleShared: name => `${name} लिक्विडेशन कीमत (जमा और उधार दोनों)`,
    recover: ({ name, change, now, rises, alike }) =>
      `हेल्थ फ़ैक्टर 1.00 पर वापस आ जाता है अगर ${name}${alike ? " (जमा और उधार दोनों)" : ""} ${now} से ${change} ${
        rises ? "बढ़ता" : "गिरता"
      } है और बाकी कीमतें नहीं बदलतीं।`,
    collateralFall: ({ change, now }) => `${now} से ${change} नीचे, अगर बाकी हर कीमत वैसी ही रहे।`,
    collateralNone: name =>
      `$0 पर भी अकेला ${name} हेल्थ फ़ैक्टर को 1.00 से नीचे नहीं ले जा सकता: बाकी कोलैटरल कर्ज़ को कवर करता है।`,
    debtRise: ({ change, now }) =>
      `${now} से ${change} ऊपर: उधार लिए गए एसेट की कीमत बढ़ने पर वे हेल्थ फ़ैक्टर को नीचे धकेलते हैं।`,
    sharedRise: ({ name, change, now }) =>
      `${now} से ${change} ऊपर: आपने उतने ${name} से ज़्यादा उधार लिया है जितना आपका ${name} कोलैटरल गिना जाता है, इसलिए कीमत बढ़ने पर हेल्थ फ़ैक्टर नीचे जाता है। बाकी कीमतें नहीं बदलतीं।`,
    sharedFallBorrowed: ({ name, change, now }) =>
      `${now} से ${change} नीचे, उधार लिए गए ${name} की वही कीमत रहने और बाकी हर कीमत न बदलने पर।`,
    sharedFallRows: ({ name, change, now }) =>
      `हर ${name} पंक्ति के लिए ${now} से ${change} नीचे, अगर बाकी हर कीमत वैसी ही रहे।`,
    bothSidesNeutral: name =>
      `${name} आपका कोलैटरल भी है और कर्ज़ भी, इसलिए दोनों साथ चलते हैं और इसकी कीमत हेल्थ फ़ैक्टर नहीं बदलती। ब्याज, सीमा में बदलाव या आपके अपने ट्रांज़ैक्शन उसे फिर भी बदलते हैं।`,
    bothSidesRecover: name =>
      `${name} दोनों तरफ़ है, इसलिए दोनों साथ चलते हैं: अकेली कोई ${name} कीमत हेल्थ फ़ैक्टर को 1.00 पर वापस नहीं लाती।`,
    bothSidesSafe: name =>
      `${name} दोनों तरफ़ है, इसलिए दोनों साथ चलते हैं: अकेली इसकी कीमत हेल्थ फ़ैक्टर को 1.00 से नीचे नहीं ले जा सकती।`,
    uniformTitle: "सारा कोलैटरल एक साथ गिरता है",
    uniformDescription: prices =>
      `अगर हर कोलैटरल की कीमत इतनी गिरे और कर्ज़ की कीमत न हिले, तो हेल्थ फ़ैक्टर 1.00 पर पहुंचता है: ${joinList(
        "hi",
        prices.map(({ name, price }) => `${name} ${price} पर`),
      )}।`,
    ratioTitle: (numerator, denominator) => `लिक्विडेशन पर ${numerator} ÷ ${denominator} कीमत`,
    ratioDescription: (now, change, falls) =>
      `अभी ${now}। अगर दोनों कीमतें हिलें, तो इस अनुपात में ${change} की ${falls ? "गिरावट" : "बढ़त"} हेल्थ फ़ैक्टर को 1.00 पर ले जाती है।`,
    breakdown: ({ collateral, weighted, debt, healthFactor }) =>
      `कोलैटरल ${collateral}, अपनी लिक्विडेशन सीमाओं पर गिना गया: ${weighted}। हेल्थ फ़ैक्टर = ${weighted} ÷ ${debt} कर्ज़ = ${healthFactor}।`,
  },
  noscript:
    "कैलकुलेटर को दोबारा गणना के लिए JavaScript चाहिए। ऊपर का नतीजा 12,000 USDC के मुकाबले $2,400 पर 10 WETH (लिक्विडेशन सीमा 83%) के लिए है; इस पेज के हल किए गए उदाहरण वही फ़ॉर्मूला इस्तेमाल करते हैं।",
  disclaimer: {
    lead: "शैक्षिक अनुमान, वित्तीय सलाह नहीं।",
    beforeDate:
      "यह सिर्फ़ आपके दर्ज किए गए नंबरों का इस्तेमाल करता है। Aave के लाइव पैरामीटर बदल सकते हैं: ऊपर की सीमाएं ऑन-चेन",
    afterDate:
      " को पढ़ी गई थीं, और गवर्नेंस या Risk Stewards उन्हें कभी भी बदल सकते हैं। ओरेकल कीमतें हिलती हैं, ब्याज आपके कर्ज़ में जुड़ता रहता है, और हर लिक्विडेशन कीमत मानती है कि बाकी हर कीमत वैसी ही रहे। कार्रवाई से पहले Aave ऐप में अपनी पोज़िशन जांचें।",
  },
};
