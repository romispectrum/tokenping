import type { BlogMessages } from "./shared";
import { plural } from "~~/i18n/format";

/** "हर 5 मिनट में", "हर मिनट". */
const hiEveryMinutes = (minutes: number) => plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट में` });

/** "22 नेटवर्क पर", "1 नेटवर्क पर": the noun does not change with the count. */
const hiOnNetworks = (networks: number) => `${networks} नेटवर्क पर`;

export const MESSAGES: BlogMessages = {
  crumbs: { home: "होम", blog: "ब्लॉग" },
  index: {
    title: "Aave और Morpho हेल्थ फ़ैक्टर और लिक्विडेशन गाइड",
    description:
      "Aave और Morpho के हेल्थ फ़ैक्टर, लिक्विडेशन, लिक्विडेशन कीमत और अलर्ट पर गाइड, हल किए गए उदाहरणों और तारीख़ व स्रोत वाले आंकड़ों के साथ।",
    kicker: "Aave और Morpho गाइड",
    lead: "Aave और Morpho पर हेल्थ फ़ैक्टर कैसे काम करता है, लिक्विडेशन में क्या होता है, अपनी लिक्विडेशन कीमत कैसे निकालें और कीमत उसके पास आने से पहले चेतावनी कैसे पाएं। इन गाइड का हर आंकड़ा अपना स्रोत और जांच की तारीख़ बताता है।",
    dashboardCta: "Aave डैशबोर्ड खोलें",
    morphoDashboardCta: "Morpho डैशबोर्ड खोलें",
    rss: "RSS से सब्सक्राइब करें",
    startHere: "यहां से शुरू करें",
    allGuides: "सभी गाइड",
    empty: {
      title: "अभी कोई गाइड नहीं",
      description: "हिंदी गाइड तैयार की जा रही हैं। RSS से सब्सक्राइब करें और प्रकाशित होते ही उन्हें पाएं।",
      otherLanguage: "गाइड अंग्रेज़ी में पढ़ें",
    },
  },
  post: {
    kicker: "Aave V3 गाइड",
    morphoKicker: "Morpho गाइड",
    byline: { author: "Tokenping टीम द्वारा", published: "प्रकाशित", updated: "अपडेट किया गया" },
    readingTime: minutes => `${minutes} मिनट में पढ़ें`,
    readGuide: "गाइड पढ़ें",
    related: "संबंधित गाइड",
  },
  endBox: {
    label: "Tokenping के बारे में",
    title: "Tokenping से हेल्थ फ़ैक्टर अलर्ट",
    body: ({ minutes, networks, channels, price, paymentChain }) =>
      `Tokenping ${hiOnNetworks(networks)} ${hiEveryMinutes(minutes)} आपका Aave V3 और V4 हेल्थ फ़ैक्टर जांचता है और जब वह आपकी सीमा से नीचे होता है तो आपको ${channels} पर संदेश भेजता है। अलर्ट की कीमत ${price} है${paymentChain ? `, भुगतान ${paymentChain} नेटवर्क पर` : ""}; अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अलर्ट आपको कार्रवाई करने का समय देते हैं; वे लिक्विडेशन नहीं रोकते।`,
    cta: "डैशबोर्ड खोलें",
    morpho: {
      title: "Tokenping से Morpho हेल्थ फ़ैक्टर अलर्ट",
      body: ({ minutes, networks, channels, price, paymentChain }) =>
        `Tokenping ${hiOnNetworks(networks)} ${hiEveryMinutes(minutes)} आपका Morpho Blue और Midnight हेल्थ फ़ैक्टर जांचता है और जब वह आपकी सीमा से नीचे होता है तो आपको ${channels} पर संदेश भेजता है, साथ ही फ़िक्स्ड रेट लोन की मैच्योरिटी से पहले रिमाइंडर भेजता है। अलर्ट की कीमत ${price} है${paymentChain ? `, भुगतान ${paymentChain} नेटवर्क पर` : ""}, Aave अलर्ट वाला ही प्लान; अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अलर्ट आपको कार्रवाई करने का समय देते हैं; वे लिक्विडेशन नहीं रोकते।`,
      cta: "Morpho डैशबोर्ड खोलें",
    },
  },
  alertPrice: {
    fallback: "USDC में एक छोटा शुल्क (मौजूदा कीमत डैशबोर्ड पर देखें)",
    plan: ({ priceLabel, days }) => `${priceLabel} प्रति ${plural("hi", days, { one: "दिन", other: `${days} दिन` })}`,
  },
  callout: { info: "नोट", warning: "चेतावनी" },
  shortAnswer: "संक्षिप्त जवाब",
  scopeNote: {
    text: "Aave V3.7 पर लागू, Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche और Gnosis मार्केट पर जांचा गया। दूसरे V3 मार्केट और नेटवर्क पुराने वर्ज़न चला सकते हैं। जहां नियम अलग हैं, वहां Aave V4 के अंतर बताए गए हैं।",
    morphoText:
      "Morpho ऐप में सूचीबद्ध Morpho Blue और Morpho Midnight मार्केट पर लागू। हर मार्केट अपना कोलैटरल, ओरेकल और LLTV खुद तय करता है, इसलिए अपने मार्केट के आंकड़े जांचें।",
    figuresAsOf: "आंकड़ों की तारीख़:",
  },
  table: {
    fallbackLabel: "तालिका, बगल में स्क्रॉल होती है",
    label: (heading, index) => (index === undefined ? `तालिका: ${heading}` : `तालिका ${index}: ${heading}`),
    scrollHint: "सभी कॉलम देखने के लिए बगल में स्क्रॉल करें।",
  },
};
