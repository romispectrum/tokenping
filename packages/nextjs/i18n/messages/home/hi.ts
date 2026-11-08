import { type HomeMessages, rich } from "./shared";
import { capitalize, plural } from "~~/i18n/format";

// Hindi counts with the bare noun ("1 दिन", "30 दिन", "29 नेटवर्क"), so only "हर मिनट" needs a plural form.
const hiDays = (days: number) => `${days} दिन`;

/** "हर 5 मिनट में", "हर मिनट". */
const hiEveryMinutes = (minutes: number) => plural("hi", minutes, { one: "हर मिनट", other: `हर ${minutes} मिनट में` });

const hiNetworks = (networks: number) => `${networks} नेटवर्क`;

const hiMarkets = (markets: number) => `${markets} मार्केट`;

/** "13 Spoke": the Aave term, uncounted in Hindi. */
const hiSpokes = (spokes: number) => `${spokes} Spoke`;

/** "Arbitrum One नेटवर्क पर", or the payment network unnamed. */
const hiOnChain = (chainName: string | undefined) => (chainName ? `${chainName} नेटवर्क पर` : "भुगतान नेटवर्क पर");

export const MESSAGES: HomeMessages = {
  headline: channels => `${channels} पर Aave और Morpho हेल्थ फ़ैक्टर अलर्ट`,
  description: ({ channels, networks, minutes, short }) =>
    short
      ? `${channels} पर अलर्ट, जब Aave या Morpho पर आपका हेल्थ फ़ैक्टर आपकी सीमा से नीचे हो, ${hiNetworks(networks)} पर, ${hiEveryMinutes(minutes)}।`
      : `${channels} पर अलर्ट, जब Aave या Morpho पर आपका हेल्थ फ़ैक्टर आपकी सीमा से नीचे गिरे, ${hiNetworks(networks)} पर। जाँच ${hiEveryMinutes(minutes)}।`,
  channelBadge: capitalize,
  pricingCta: plan => (plan ? `अलर्ट सेट करें: ${hiDays(plan.days)} के लिए ${plan.priceLabel}` : "अलर्ट सेट करें"),
  offerDescription: ({ days, currency }) =>
    `${hiDays(days)} के हेल्थ फ़ैक्टर अलर्ट, ${currency} में आपके वॉलेट से भुगतान। अपने आप रिन्यू नहीं होता।`,

  kicker: "Aave V3 और V4, Morpho Blue और Midnight",
  heroLead: ({ minutes, channels }) =>
    `जाँच ${hiEveryMinutes(minutes)}। जब तक आप अपनी सीमा से नीचे हैं, ${channels} पर संदेश। केवल पढ़ने के लिए, कोई अप्रूवल नहीं।`,
  networksLabel: "नेटवर्क",
  heroCoverage: networks => hiNetworks(networks),
  channelsLabel: "अलर्ट इनके ज़रिए:",
  exampleAlertLabel: "अलर्ट में क्या लिखा होता है",
  exampleAlertCaption: subject => `उदाहरण। ईमेल इस विषय के साथ आते हैं: "${subject}"।`,

  dashboardCta: "Aave डैशबोर्ड खोलें",
  morphoDashboardCta: "Morpho डैशबोर्ड खोलें",
  dashboardCtaMicrocopy: alertPrice => `वॉलेट कनेक्ट करें और अपनी हर पोज़िशन देखें। अलर्ट की कीमत ${alertPrice} है।`,

  problemTitle: "हेल्थ फ़ैक्टर आपके सोते समय गिरता है",
  problemLead:
    "Aave आपका हेल्थ फ़ैक्टर दिखाता है, पर अलर्ट नहीं भेजता (अक्टूबर 2026)। रात भर में इसे तीन चीज़ें बदलती हैं:",
  problemCauses: [
    { title: "कीमतें गिरती हैं", body: "ETH गिरता है और आपके कोलैटरल की कीमत घट जाती है।" },
    { title: "ब्याज जुड़ता रहता है", body: "आपका कर्ज़ हर सेकंड बढ़ता है।" },
    { title: "सीमाएँ बदलती हैं", body: "Aave पर गवर्नेंस लिक्विडेशन सीमा घटा सकती है।" },
  ],
  problemEvidence: ({ morning, failedRepays, polygon }) =>
    rich(
      "उधार लेने वाले बताते हैं कि ",
      morning("सुबह उठे तो पोज़िशन लिक्विडेट हो चुकी थी"),
      ", ",
      failedRepays("कर्ज़ चुकाने की ट्रांज़ैक्शन एक घंटे तक फ़ेल होती रहीं"),
      " और ",
      polygon("1.01 पर किया गया भुगतान बहुत देर से पहुँचा"),
      "।",
    ),
  problemLiquidator: guide =>
    rich(
      "ऊपर से लिक्विडेटर को बोनस मिलता है: Ethereum के Core मार्केट में WETH पर 5% (अक्टूबर 2026)।",
      guide && rich(" जानें ", guide("लिक्विडेशन कैसे काम करता है"), "।"),
    ),
  chart: {
    threshold: "आपकी सीमा",
    liquidation: "लिक्विडेशन",
    alertSent: "अलर्ट भेजा गया",
    youCheck: "आप फ़ोन देखते हैं",
    caption: "एक उदाहरण रात। अलर्ट 03:05 पर जाता है, 1.5 से नीचे की पहली जाँच पर, आपके देखने से पाँच घंटे पहले।",
  },

  howItWorksTitle: "यह कैसे काम करता है",
  steps: ({ plan, paymentChain, minutes, channels, threshold, morphoMin }) => {
    const paidOn = paymentChain ? `${paymentChain} नेटवर्क पर ` : "";
    return [
      {
        title: "उस वॉलेट को कनेक्ट करें जिससे आप उधार लेते हैं",
        body: "केवल पढ़ने के लिए। Aave और Morpho, हर एक का अपना पेज।",
      },
      {
        title: plan ? `${plan.priceLabel} में अलर्ट अनलॉक करें` : "एक छोटे USDC भुगतान से अलर्ट अनलॉक करें",
        body: `${plan ? `${hiDays(plan.days)} का एक्सेस, ` : ""}${paidOn}USDC में भुगतान। अपने आप रिन्यू नहीं होता।`,
      },
      {
        title: "हर मार्केट के लिए एक सीमा चुनें",
        body: `${threshold.min} (Morpho पर ${morphoMin}) से ${threshold.max} तक, डिफ़ॉल्ट ${threshold.default}।`,
      },
      {
        title: "जब तक आप उससे नीचे हैं, संदेश पाएँ",
        body: `${capitalize(hiEveryMinutes(minutes))}, ${channels} पर, जब तक आप फिर से अपनी सीमा से ऊपर न आ जाएँ।`,
      },
    ];
  },
  scaleTitle: "अपनी सीमा कहाँ रखें",
  scale: {
    liquidation: "लिक्विडेशन",
    critical: "गंभीर",
    risky: "जोखिम भरा",
    safe: "सुरक्षित",
    defaultThreshold: value => `डिफ़ॉल्ट ${value}`,
    below: value => `${value} से नीचे`,
    between: (from, to) => `${from} से ${to} तक`,
    andAbove: value => `${value} और ऊपर`,
    range: (min, max) => `${min} से ${max} तक कोई भी मान।`,
  },
  scaleGuide: "सीमा कैसे चुनें",

  coverageTitle: "Aave का हर मार्केट और Morpho का हर लिस्टेड मार्केट",
  coverageLead: ({ v3Markets, v3Networks, spokes, v4Networks, morphoNetworks }) =>
    `${hiNetworks(v3Networks)} पर Aave V3 के ${hiMarkets(v3Markets)} और ${hiNetworks(v4Networks)} पर Aave V4 के ${hiSpokes(spokes)}, 4 नवंबर 2026 तक, साथ में ${hiNetworks(morphoNetworks)} पर Morpho का हर लिस्टेड मार्केट।`,
  coverage: {
    v3Markets: count => `${count} V3 मार्केट`,
    v4Spokes: count => `${count} V4 Spoke`,
    morpho: "Morpho",
  },
  coverageNote:
    "Scroll, ZKsync, Metis, Soneium और Sonic को Aave गवर्नेंस धीरे-धीरे बंद कर रही है, पर उन पर अभी भी नज़र रखी जाती है। इनमें शामिल नहीं: Harmony पर Aave V3, Morpho के बिना लिस्टेड मार्केट और दूसरे प्रोटोकॉल।",

  pricingTitle: "कीमत",
  pricingRows: ({ alertPrice, paymentChain }) => [
    { term: "अलर्ट", detail: capitalize(alertPrice) },
    { term: "रिन्यूअल", detail: "अपने आप नहीं: जब और समय चाहिए, फिर से भुगतान करें" },
    {
      term: "भुगतान",
      detail: paymentChain
        ? `${paymentChain} नेटवर्क पर USDC, आपके वॉलेट से (पहले अप्रूव, फिर भुगतान)`
        : "USDC, आपके वॉलेट से",
    },
  ],
  priceSource: "कीमत भुगतान कॉन्ट्रैक्ट से पढ़ी जाती है और हर घंटे रीफ़्रेश होती है।",
  pricingFootnote: "अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं।",

  questionsTitle: "वॉलेट कनेक्ट करने से पहले पूछने लायक सवाल",
  questions: ({ alertPrice, paymentChain, hasTelegram, minutes, morphoMin, links }) => {
    const onChain = hiOnChain(paymentChain);
    return [
      {
        question: "क्या Tokenping मेरे फ़ंड छू सकता है?",
        answer: rich(
          `नहीं। Tokenping सिर्फ़ आपकी पोज़िशन पढ़ता है और Aave या Morpho पर कभी अप्रूवल या सिग्नेचर नहीं माँगता। ट्रांज़ैक्शन सिर्फ़ ${onChain} भुगतान की होती हैं: ठीक कीमत जितना अप्रूवल, फिर भुगतान। `,
          links.sourcify
            ? rich(
                "कॉन्ट्रैक्ट ",
                links.sourcify("Sourcify पर वेरिफ़ाइड है"),
                " और उसका ",
                links.sourceCode("सोर्स कोड सार्वजनिक है"),
              )
            : links.sourceCode("कॉन्ट्रैक्ट का सोर्स कोड सार्वजनिक है"),
          "; टीम का वॉलेट उसकी कीमत बदल सकता है, उसे रोक सकता है और अपग्रेड कर सकता है।",
        ),
      },
      {
        question: "आप कौन सा डेटा रखते हैं?",
        answer: rich(
          "आपके वॉलेट का पता, आपके अलर्ट और वे संपर्क विवरण जो आप देते हैं (ईमेल, Signal यूज़रनेम",
          hasTelegram ? ", Telegram चैट" : "",
          `)। कोई इतिहास नहीं और कोई ट्रैकिंग कुकी नहीं; पेज व्यू गुमनाम रूप से गिने जाते हैं। वे संपर्क विवरण सिर्फ़ वही पढ़ सकता है जो आपके वॉलेट से साइन कर सकता है, पर भुगतान ${onChain} सार्वजनिक होते हैं। पूरी सूची `,
          links.privacy("गोपनीयता पेज"),
          " पर है।",
        ),
      },
      {
        question: "इसकी कीमत क्या है?",
        answer: rich(
          `अलर्ट की कीमत ${alertPrice} है, ${onChain} USDC में, साथ में गैस के लिए थोड़ा ETH। अपनी पोज़िशन देखने के लिए भुगतान की ज़रूरत नहीं। अपने आप रिन्यू नहीं होता, कोई रिफ़ंड नहीं।`,
        ),
      },
      {
        question: "Morpho के कौन से लोन कवर होते हैं?",
        answer: rich(
          `Morpho ऐप में लिस्टेड मार्केट के Morpho Blue (वेरिएबल रेट) और Morpho Midnight (फ़िक्स्ड रेट) लोन, ${morphoMin} से शुरू होने वाली सीमाओं के साथ। फ़िक्स्ड रेट लोन को मैच्योरिटी से पहले रिमाइंडर भी मिलते हैं। एक ही प्लान इन सबको कवर करता है: `,
          links.morphoDashboard("Morpho डैशबोर्ड"),
          " खोलें।",
        ),
      },
      {
        question: "अगर कोई अलर्ट न पहुँचे तो?",
        answer: rich(
          `अगली जाँच, ${plural("hi", minutes, { one: "1 मिनट", other: `${minutes} मिनट` })} बाद, फिर कोशिश करती है। डिलीवरी Resend, एक Signal रिले,`,
          hasTelegram ? " Telegram Bot API," : "",
          " सार्वजनिक RPC नोड और Vercel के शेड्यूलर पर निर्भर है, बिना अपटाइम की गारंटी के। दो चैनल चुनें और कदम उठाने की गुंजाइश रखें।",
        ),
      },
      {
        question: "अलर्ट कैसे रोकूँ?",
        answer: rich(
          "जब आपका हेल्थ फ़ैक्टर फिर से आपकी सीमा से ऊपर आ जाता है, या जब आप अलर्ट हटा देते हैं (सक्रिय एक्सेस चाहिए), तब वे रुक जाते हैं। एक्सेस खत्म हो गया? हमें ",
          links.x("X"),
          " पर या हमारी ",
          links.telegramCommunity("Telegram"),
          " या ",
          links.signalCommunity("Signal"),
          " कम्युनिटी में संदेश भेजें।",
          hasTelegram ? " Telegram में /stop भी काम करता है।" : "",
          " अभी न स्नूज़ है और न अनसब्सक्राइब लिंक।",
        ),
      },
      {
        question: "क्या बिना कनेक्ट किए किसी वॉलेट पर नज़र रखी जा सकती है?",
        answer: rich("अभी नहीं। एक वॉलेट, वही जो आप कनेक्ट करते हैं; एक्सेस हर वॉलेट के लिए अलग है।"),
      },
      {
        question: "दूसरे टूल कुछ नहीं लेते। फिर भुगतान क्यों?",
        answer: rich(
          "अगर Telegram बॉट या मोबाइल ऐप आपके लिए काफ़ी है, तो उसे इस्तेमाल करें",
          links.comparison ? rich(": ", links.comparison("हमारी तुलना"), " उन्हें कवर करती है") : null,
          "। Tokenping Signal या ईमेल पर अलर्ट के लिए है, Aave के हर मार्केट और Morpho के हर लिस्टेड मार्केट में।",
        ),
      },
    ];
  },

  limitsTitle: "हदें, साफ़ शब्दों में",
  limits: ({ minutes, paymentChain, repeatMinutes }) => [
    `जाँच ${hiEveryMinutes(minutes)}, लगातार नहीं।`,
    `आपकी सीमा से नीचे रहने पर हर ${repeatMinutes} मिनट में एक संदेश: न स्नूज़, न डाइजेस्ट।`,
    "हर मार्केट के लिए एक सीमा, सिर्फ़ कनेक्ट किए गए वॉलेट के लिए।",
    `${paymentChain ? `${paymentChain} नेटवर्क पर ` : ""}सिर्फ़ USDC: न कार्ड, न रिफ़ंड।`,
    "ईमेल में अभी अनसब्सक्राइब लिंक नहीं है; अलर्ट हटाने के लिए सक्रिय एक्सेस चाहिए।",
    "बीटा: डिलीवरी तीसरे पक्ष के ज़रिए, अपटाइम की कोई गारंटी नहीं।",
  ],

  blogTitle: "ब्लॉग से",
  allGuides: "Aave और Morpho की सभी गाइड",

  closingTitle: "अपना Aave या Morpho हेल्थ फ़ैक्टर अलर्ट सेट करें",
  closingLead: alertPrice => `${capitalize(alertPrice)}, भुगतान आपके वॉलेट से। अपने आप रिन्यू नहीं होता।`,
};
