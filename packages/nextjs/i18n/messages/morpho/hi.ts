import type { MorphoMessages } from "./shared";
import { hiMarket, plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho Blue और Midnight लोन के हेल्थ फ़ैक्टर अलर्ट",
    metaDescription: (networkCount, channels) =>
      `${networkCount} नेटवर्क पर Morpho Blue और Midnight लोन के लिए ${channels} से हेल्थ फ़ैक्टर अलर्ट, फ़िक्स्ड रेट लोन की मैच्योरिटी से पहले रिमाइंडर के साथ।`,
    title: "Morpho Blue और Midnight पोज़िशन और हेल्थ फ़ैक्टर अलर्ट",
    intro: networks =>
      `${networks} पर, Morpho ऐप में सूचीबद्ध मार्केट में आपकी उधार पोज़िशन: वेरिएबल रेट लोन (Morpho Blue) और फ़िक्स्ड रेट लोन (Morpho Midnight)। हेल्थ फ़ैक्टर सीधे चेन से पढ़े जाते हैं।`,
    checks: minutes =>
      `अलर्ट हर ${plural("hi", minutes, { one: "मिनट", other: `${minutes} मिनट` })} जाँचे जाते हैं। फ़िक्स्ड रेट लोन को मैच्योरिटी से 7 दिन और 1 दिन पहले रिमाइंडर भी मिलता है, और मैच्योरिटी के बाद जब तक कर्ज़ बाकी है, हर जाँच पर एक अलर्ट।`,
    access: "एक्सेस का एक भुगतान आपके Aave और Morpho, दोनों के अलर्ट कवर करता है।",
    notAffiliated: "Tokenping का Morpho से कोई संबंध नहीं है।",
    guideHealthFactor: "Morpho का हेल्थ फ़ैक्टर कैसे काम करता है",
    guideLiquidation: "Morpho पर लिक्विडेशन कैसे काम करता है",
    guideMidnight: "Morpho Midnight के फ़िक्स्ड रेट लोन",
    aaveDashboard: "Aave पर उधार लेते हैं? Aave डैशबोर्ड खोलें",
  },
  positionsHeading: "आपकी Morpho पोज़िशन",
  gate: {
    title: "जारी रखने के लिए वॉलेट कनेक्ट करें",
    description:
      "आपकी Morpho पोज़िशन खोजने के लिए Tokenping को आपके वॉलेट का पता चाहिए। कनेक्ट करने से न कोई फ़ंड हिलता है, न कोई शुल्क लगता है।",
    connect: "वॉलेट कनेक्ट करें",
    connecting: "कनेक्ट हो रहा है",
    approveInWallet: "अपने वॉलेट में कनेक्शन अप्रूव करें।",
  },
  list: {
    heading: "मार्केट",
    count: count => `${count} में कर्ज़`,
    none: "Morpho ऐप में सूचीबद्ध मार्केट में कोई उधार नहीं मिला।",
    discoveryFailed: "Morpho के API ने जवाब नहीं दिया, इसलिए सिर्फ़ वे मार्केट दिखाए गए हैं जिनमें सहेजा हुआ अलर्ट है।",
    variableRate: "वेरिएबल रेट",
    fixedRate: "फ़िक्स्ड रेट",
    matures: date => `मैच्योरिटी ${date}`,
    matured: "मैच्योरिटी बीत चुकी",
    unreadable: "पढ़ा नहीं जा सका",
    noneSelectedDescription: "Morpho पोज़िशन देखने के लिए कोई मार्केट चुनें।",
  },
  details: {
    collateralValue: "कोलैटरल का मूल्य",
    debt: "कर्ज़",
    ltv: "LTV",
    lltv: "लिक्विडेशन LTV",
    maturity: "मैच्योरिटी",
    // Hindi counts 0 as "one", so the number is written into both forms rather than a literal 1.
    timeLeft: (days, hours) =>
      days > 0
        ? plural("hi", days, { one: `${days} दिन में`, other: `${days} दिनों में` })
        : plural("hi", hours, { one: `${hours} घंटे में`, other: `${hours} घंटों में` }),
    pastMaturity:
      "इस लोन की मैच्योरिटी बीत चुकी है: बचा हुआ कोई भी कर्ज़ किसी भी समय लिक्विडेट किया जा सकता है, चाहे उसका हेल्थ फ़ैक्टर कुछ भी हो। लिक्विडेशन से बचने के लिए उसे चुकाएँ।",
    preLiquidation: "प्री-लिक्विडेशन",
    preLiquidationNote:
      "आपने इस मार्केट में प्री-लिक्विडेशन चुना है, इसलिए हेल्थ फ़ैक्टर उसकी पहले आने वाली रेखा के हिसाब से मापा जाता है: 1 से नीचे आपकी पोज़िशन का एक हिस्सा बेचा जा सकता है।",
    amountsIn: token => `राशियाँ ${token} में हैं, मार्केट के ओरेकल से आँकी गई।`,
    noDebtTitle: "इस मार्केट में कोई कर्ज़ नहीं",
    noDebtDetail: "सहेजा हुआ अलर्ट सहेजा रहता है, और जब तक कर्ज़ नहीं है, कुछ नहीं भेजता।",
    unreadableTitle: "यह पोज़िशन पढ़ी नहीं जा सकी",
    unreadableDetail: "नेटवर्क ने जवाब नहीं दिया। आपका अलर्ट जाँचा जाता रहेगा।",
  },
  paywall: {
    descriptionNew: marketName =>
      `${hiMarket(marketName, "market")} पर और दूसरे मार्केट में हेल्थ फ़ैक्टर अलर्ट सेट करने के लिए एक बार भुगतान करें। कुछ भी अपने आप रिन्यू नहीं होता: जब आप एक्सेस बढ़ाना चाहें, तब अपने वॉलेट से भुगतान करते हैं।`,
    descriptionExtend: marketName =>
      `${hiMarket(marketName, "market")} के लिए आपकी सहेजी हुई अलर्ट सेटिंग अब भी आपके अकाउंट में है। एक्सेस बढ़ाने और उसे संपादित करने के लिए फिर से भुगतान करें।`,
  },
};
