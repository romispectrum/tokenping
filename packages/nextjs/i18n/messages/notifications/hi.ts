import type { NotificationMessages } from "./shared";
import { hiMarket, hiMarketNoun, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `${hiMarket(chainName)} पर आपका Aave हेल्थ फ़ैक्टर ${healthFactor} है, ` +
    `जो आपकी ${threshold} की सीमा से नीचे है। ` +
    `लिक्विडेशन से बचने के लिए कोलैटरल जोड़ने या कर्ज़ चुकाने पर विचार करें।\n\nभेजा गया: ${timestamp}`,
  alertSubject: chainName => `Aave हेल्थ फ़ैक्टर अलर्ट - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p><strong>${chainName}</strong> ${hiMarketNoun(chainName)} पर आपका Aave हेल्थ फ़ैक्टर ` +
    `<strong>${healthFactor}</strong> है, जो आपकी ` +
    `<strong>${threshold}</strong> की सीमा से नीचे है।</p>` +
    `<p>लिक्विडेशन से बचने के लिए कोलैटरल जोड़ने या कर्ज़ चुकाने पर विचार करें।</p>` +
    `<p><small>बनाया गया: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "गंभीर", risky: "जोखिम में", safe: "सुरक्षित" };
    const now =
      position.kind === "debt"
        ? `अभी: हेल्थ फ़ैक्टर ${position.healthFactor} (${statusWord[position.status]}), कोलैटरल ${position.collateral}, कर्ज़ ${position.debt}।`
        : position.kind === "noDebt"
          ? `अभी: कोई कर्ज़ नहीं, इसलिए कुछ भी लिक्विडेट नहीं हो सकता${position.collateral ? ` (कोलैटरल ${position.collateral})` : ""}।`
          : position.kind === "none"
            ? "अभी: इस मार्केट में आपकी कोई खुली पोज़िशन नहीं है।"
            : "अभी: आपकी पोज़िशन पढ़ी नहीं जा सकी। असली अलर्ट हर जांच में फिर से कोशिश करते हैं।";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "यह आपकी सीमा से नीचे है, इसलिए अगली जांच असली अलर्ट भेजेगी।"
          : "यह आपकी सीमा से ऊपर है, इसलिए अभी कोई अलर्ट नहीं भेजा जाता।"
        : null;
    const every = plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट में` });
    return [
      "Tokenping से टेस्ट संदेश: इस चैनल पर अलर्ट काम करते हैं।",
      `आपका अलर्ट: ${chainName}, जब हेल्थ फ़ैक्टर ${threshold} से नीचे गिरे।`,
      now,
      ...(verdict ? [verdict] : []),
      `जांच ${every}। भेजा गया: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tokenping टेस्ट संदेश - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} फ़िक्स्ड रेट, मैच्योरिटी ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `${hiMarket(chainName, "network")} पर आपका Morpho हेल्थ फ़ैक्टर ${healthFactor} है, जो आपकी ${threshold} की सीमा से नीचे है।`,
    `मार्केट: ${market}।`,
    ...(preLiquidation
      ? [
          "आपने इस मार्केट में प्री-लिक्विडेशन चुना है, इसलिए हेल्थ फ़ैक्टर उसकी पहले आने वाली रेखा के हिसाब से मापा जाता है: 1 से नीचे, आपकी पोज़िशन का एक हिस्सा बेचा जा सकता है।",
        ]
      : []),
    "लिक्विडेशन से बचने के लिए कोलैटरल जोड़ने या कर्ज़ चुकाने पर विचार करें।",
    `भेजा गया: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho हेल्थ फ़ैक्टर अलर्ट - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `${hiMarket(chainName, "network")} पर आपका Morpho फ़िक्स्ड रेट लोन ${when} को मैच्योरिटी पर पहुंच गया और उस पर अभी भी ${debt} का कर्ज़ बाकी है।`,
          `मार्केट: ${market}।`,
          "अब यह किसी भी समय लिक्विडेट हो सकता है, चाहे उसका हेल्थ फ़ैक्टर कुछ भी हो। लिक्विडेशन से बचने के लिए इसे चुकाएं।",
          `भेजा गया: ${timestamp}`,
        ]
      : [
          `${hiMarket(chainName, "network")} पर आपका Morpho फ़िक्स्ड रेट लोन ${stage === "7d" ? "7 दिन" : "24 घंटे"} के भीतर, ${when} को मैच्योर होगा।`,
          `मार्केट: ${market}।`,
          `कर्ज़: ${debt}।`,
          "मैच्योरिटी के बाद, जो भी कर्ज़ बिना चुकाए रह जाए, वह लिक्विडेट हो सकता है, इसलिए उससे पहले उसे चुका दें।",
          `भेजा गया: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho लोन की मैच्योरिटी बीत गई - ${chainName}`
      : `Morpho लोन ${stage === "7d" ? "7 दिन" : "24 घंटे"} के भीतर मैच्योर होगा - ${chainName}`,
};
