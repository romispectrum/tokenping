import { csForMarket, csOnMarket, deForMarket, deOnMarket, hiMarket, plural, viMarket } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";
import type { GateMessages } from "~~/i18n/messages/dashboard";

// The /morpho dashboard. Plain functional copy; the wording of the product pages around it is left to the SEO pass.
// Amounts in the dashboard keep the app's number format, as on /aave.

type MorphoMessages = {
  page: {
    metaTitle: string;
    metaDescription: (networkCount: number, channels: string) => string;
    title: string;
    /** `networks` is the list of Morpho's networks, joined. */
    intro: (networks: string) => string;
    checks: (minutes: number) => string;
    access: string;
    notAffiliated: string;
    guideHealthFactor: string;
    guideLiquidation: string;
    guideMidnight: string;
    /** The link to the Aave dashboard, for a borrower who is on the wrong page. */
    aaveDashboard: string;
  };
  positionsHeading: string;
  gate: GateMessages;
  list: {
    heading: string;
    count: (count: number) => string;
    none: string;
    discoveryFailed: string;
    variableRate: string;
    fixedRate: string;
    matures: (date: string) => string;
    matured: string;
    unreadable: string;
    noneSelectedDescription: string;
  };
  details: {
    collateralValue: string;
    debt: string;
    ltv: string;
    lltv: string;
    maturity: string;
    timeLeft: (days: number, hours: number) => string;
    pastMaturity: string;
    preLiquidation: string;
    preLiquidationNote: string;
    amountsIn: (token: string) => string;
    noDebtTitle: string;
    noDebtDetail: string;
    unreadableTitle: string;
    unreadableDetail: string;
  };
  paywall: {
    descriptionNew: (marketName: string) => string;
    descriptionExtend: (marketName: string) => string;
  };
};

export const MORPHO_MESSAGES: Localized<MorphoMessages> = {
  en: {
    page: {
      metaTitle: "Morpho health factor alerts for Blue and Midnight loans",
      metaDescription: (networkCount, channels) =>
        `Health factor alerts for Morpho Blue and Midnight loans by ${channels}, on ${networkCount} networks, with reminders before a fixed-rate loan matures.`,
      title: "Morpho Blue and Midnight positions and health factor alerts",
      intro: networks =>
        `Your borrow positions in the markets the Morpho app lists, on ${networks}: variable-rate loans (Morpho Blue) and fixed-rate loans (Morpho Midnight). Health factors are read from the chain.`,
      checks: minutes =>
        `Alerts are checked every ${minutes} minutes. A fixed-rate loan also gets a reminder 7 days and 1 day before it matures, and an alert at every check after maturity while debt remains.`,
      access: "One access payment covers your Aave and Morpho alerts.",
      notAffiliated: "Tokenping is not affiliated with Morpho.",
      guideHealthFactor: "How the Morpho health factor works",
      guideLiquidation: "How Morpho liquidation works",
      guideMidnight: "Morpho Midnight fixed-rate loans",
      aaveDashboard: "Borrowing on Aave? Open the Aave dashboard",
    },
    positionsHeading: "Your Morpho positions",
    gate: {
      title: "Connect a wallet to continue",
      description:
        "Tokenping needs your wallet address to find your Morpho positions. Connecting does not move funds or cost a fee.",
      connect: "Connect wallet",
      connecting: "Connecting",
      approveInWallet: "Approve the connection in your wallet.",
    },
    list: {
      heading: "Markets",
      count: count => `${count} with debt`,
      none: "No borrowing found in the markets the Morpho app lists.",
      discoveryFailed: "Morpho's API did not answer, so only the markets with a saved alert are listed.",
      variableRate: "Variable rate",
      fixedRate: "Fixed rate",
      matures: date => `Matures ${date}`,
      matured: "Past maturity",
      unreadable: "Could not be read",
      noneSelectedDescription: "Select a market to view its Morpho position.",
    },
    details: {
      collateralValue: "Collateral value",
      debt: "Debt",
      ltv: "LTV",
      lltv: "Liquidation LTV",
      maturity: "Maturity",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("en", days, { one: "in 1 day", other: `in ${days} days` })
          : plural("en", hours, { one: "in 1 hour", other: `in ${hours} hours` }),
      pastMaturity:
        "This loan is past maturity: any debt left can be liquidated at any time, whatever its health factor. Repay it to avoid liquidation.",
      preLiquidation: "Pre-liquidation",
      preLiquidationNote:
        "You opted into pre-liquidation on this market, so the health factor is measured against its earlier line: below 1, part of your position can be sold.",
      amountsIn: token => `Amounts are in ${token}, valued by the market's oracle.`,
      noDebtTitle: "No debt in this market",
      noDebtDetail: "A saved alert stays saved, and sends nothing while there is no debt.",
      unreadableTitle: "This position could not be read",
      unreadableDetail: "The network did not answer. Your alert keeps being checked.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Pay once to set health factor alerts on ${marketName} and other markets. Nothing renews automatically: you pay from your wallet when you want to extend.`,
      descriptionExtend: marketName =>
        `Your saved ${marketName} alert settings are still in your account. Pay again to extend access and edit them.`,
    },
  },
  cs: {
    page: {
      metaTitle: "Upozornění na health factor na Morpho Blue a Midnight",
      metaDescription: (networkCount, channels) =>
        `Upozornění na health factor na Morpho Blue a Midnight přes ${channels}, na ${networkCount} sítích, s připomínkou před splatností půjčky.`,
      title: "Pozice a upozornění na health factor na Morpho Blue a Midnight",
      intro: networks =>
        `Vaše vypůjčené pozice v trzích, které uvádí aplikace Morpho, na sítích ${networks}: půjčky s variabilní sazbou (Morpho Blue) a s pevnou sazbou (Morpho Midnight). Health factor se čte přímo z blockchainu.`,
      checks: minutes =>
        `Upozornění kontrolujeme ${plural("cs", minutes, { one: "každou minutu", few: `každé ${minutes} minuty`, other: `každých ${minutes} minut` })}. Půjčka s pevnou sazbou navíc dostane připomínku 7 dní a 1 den před splatností a po splatnosti upozornění při každé kontrole, dokud na ní zbývá dluh.`,
      access: "Jedna platba za přístup pokrývá upozornění na Aave i na Morpho.",
      notAffiliated: "Tokenping není s Morpho nijak spojený.",
      guideHealthFactor: "Jak funguje health factor na Morpho",
      guideLiquidation: "Jak funguje likvidace na Morpho",
      guideMidnight: "Půjčky s pevnou sazbou na Morpho Midnight",
      aaveDashboard: "Půjčujete si na Aave? Otevřete přehled Aave",
    },
    positionsHeading: "Vaše pozice na Morpho",
    gate: {
      title: "Pro pokračování připojte peněženku",
      description:
        "Tokenping potřebuje adresu vaší peněženky, aby našel vaše pozice na Morpho. Připojení nepřesouvá žádné prostředky a nic nestojí.",
      connect: "Připojit peněženku",
      connecting: "Připojování",
      approveInWallet: "Potvrďte připojení v peněžence.",
    },
    list: {
      heading: "Trhy",
      count: count => `${count} s dluhem`,
      none: "V trzích, které uvádí aplikace Morpho, jsme nenašli žádnou půjčku.",
      discoveryFailed: "API Morpho neodpovědělo, proto jsou uvedeny jen trhy s uloženým upozorněním.",
      variableRate: "Variabilní sazba",
      fixedRate: "Pevná sazba",
      matures: date => `Splatnost ${date}`,
      matured: "Po splatnosti",
      unreadable: "Nepodařilo se načíst",
      noneSelectedDescription: "Vyberte trh a zobrazí se jeho pozice na Morpho.",
    },
    details: {
      collateralValue: "Hodnota kolaterálu",
      debt: "Dluh",
      ltv: "LTV",
      lltv: "Likvidační LTV",
      maturity: "Splatnost",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("cs", days, { one: "za 1 den", few: `za ${days} dny`, other: `za ${days} dní` })
          : plural("cs", hours, { one: "za 1 hodinu", few: `za ${hours} hodiny`, other: `za ${hours} hodin` }),
      pastMaturity:
        "Tato půjčka je po splatnosti: jakýkoli zbývající dluh může být kdykoli zlikvidován, bez ohledu na health factor. Splaťte ho, abyste se vyhnuli likvidaci.",
      preLiquidation: "Předběžná likvidace",
      preLiquidationNote:
        "Na tomto trhu jste zapnuli předběžnou likvidaci (pre-liquidation), proto se health factor měří vůči její dřívější hranici: pod 1 může být část vaší pozice prodána.",
      amountsIn: token => `Částky jsou v ${token}, oceněné orákulem trhu.`,
      noDebtTitle: "Na tomto trhu nemáte dluh",
      noDebtDetail: "Uložené upozornění zůstává uložené a bez dluhu nic neposílá.",
      unreadableTitle: "Tuto pozici se nepodařilo načíst",
      unreadableDetail: "Síť neodpověděla. Vaše upozornění se dál kontroluje.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Zaplaťte jednou a nastavte si upozornění na health factor ${csOnMarket(marketName, "market")} i na dalších trzích. Nic se automaticky neobnovuje: když budete chtít přístup prodloužit, zaplatíte znovu ze své peněženky.`,
      descriptionExtend: marketName =>
        `Vaše uložené nastavení upozornění ${csForMarket(marketName, "market")} ve vašem účtu zůstává. Zaplaťte znovu, tím prodloužíte přístup a nastavení můžete upravit.`,
    },
  },
  es: {
    page: {
      metaTitle: "Alertas del factor de salud en Morpho Blue y Midnight",
      // 155 characters at most with three channels: Midnight's "(tasa fija)" says which loans have a maturity.
      metaDescription: (networkCount, channels) =>
        `Alertas del factor de salud en Morpho Blue y Midnight (tasa fija) por ${channels}, en ${networkCount} redes, con aviso antes del vencimiento.`,
      title: "Posiciones y alertas del factor de salud en Morpho Blue y Midnight",
      intro: networks =>
        `Tus posiciones con deuda en los mercados que figuran en la aplicación de Morpho, en ${networks}: préstamos a tasa variable (Morpho Blue) y préstamos a tasa fija (Morpho Midnight). El factor de salud se lee directamente de la blockchain.`,
      checks: minutes =>
        `Las alertas se revisan ${plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` })}. Un préstamo a tasa fija también recibe un recordatorio 7 días y 1 día antes del vencimiento, y una alerta en cada revisión posterior al vencimiento mientras quede deuda.`,
      access: "Un solo pago de acceso cubre tus alertas de Aave y de Morpho.",
      notAffiliated: "Tokenping no está afiliado a Morpho.",
      guideHealthFactor: "Cómo funciona el factor de salud en Morpho",
      guideLiquidation: "Cómo funciona la liquidación en Morpho",
      guideMidnight: "Préstamos a tasa fija en Morpho Midnight",
      aaveDashboard: "¿Pides prestado en Aave? Abre el panel de Aave",
    },
    positionsHeading: "Tus posiciones en Morpho",
    gate: {
      title: "Conecta una billetera para continuar",
      description:
        "Tokenping necesita la dirección de tu billetera para encontrar tus posiciones en Morpho. Conectarla no mueve fondos y no cuesta nada.",
      connect: "Conectar billetera",
      connecting: "Conectando",
      approveInWallet: "Aprueba la conexión en tu billetera.",
    },
    list: {
      heading: "Mercados",
      count: count => `${count} con deuda`,
      none: "No encontramos préstamos en los mercados que figuran en la aplicación de Morpho.",
      discoveryFailed: "La API de Morpho no respondió, así que solo aparecen los mercados con una alerta guardada.",
      variableRate: "Tasa variable",
      fixedRate: "Tasa fija",
      matures: date => `Vence el ${date}`,
      matured: "Vencido",
      unreadable: "No se pudo leer",
      noneSelectedDescription: "Selecciona un mercado para ver tu posición en Morpho.",
    },
    details: {
      collateralValue: "Valor del colateral",
      debt: "Deuda",
      ltv: "LTV",
      lltv: "LTV de liquidación",
      maturity: "Vencimiento",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("es", days, { one: "en 1 día", other: `en ${days} días` })
          : plural("es", hours, { one: "en 1 hora", other: `en ${hours} horas` }),
      pastMaturity:
        "Este préstamo ya venció: la deuda que quede puede liquidarse en cualquier momento, sea cual sea el factor de salud. Devuelve el préstamo para evitar la liquidación.",
      preLiquidation: "Preliquidación",
      preLiquidationNote:
        "Activaste la preliquidación en este mercado, así que el factor de salud se mide frente al límite de la preliquidación, que se alcanza antes: por debajo de 1, se puede vender parte de tu posición.",
      amountsIn: token => `Las cantidades están en ${token}, valoradas con el oráculo del mercado.`,
      noDebtTitle: "Sin deuda en este mercado",
      noDebtDetail: "Una alerta guardada sigue guardada y no envía nada mientras no haya deuda.",
      unreadableTitle: "No se pudo leer esta posición",
      unreadableDetail: "La red no respondió. Tu alerta se sigue revisando.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Paga una vez para configurar alertas del factor de salud en el mercado ${marketName} y en otros mercados. Nada se renueva automáticamente: cuando quieras extender el acceso, pagas desde tu billetera.`,
      descriptionExtend: marketName =>
        `La configuración de alertas que guardaste para el mercado ${marketName} sigue en tu cuenta. Paga de nuevo para extender el acceso y editarla.`,
    },
  },
  hi: {
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
      discoveryFailed:
        "Morpho के API ने जवाब नहीं दिया, इसलिए सिर्फ़ वे मार्केट दिखाए गए हैं जिनमें सहेजा हुआ अलर्ट है।",
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
  },
  de: {
    page: {
      metaTitle: "Morpho Health-Factor-Alerts für Blue- und Midnight-Kredite",
      metaDescription: (networkCount, channels) =>
        `Health-Factor-Alerts für Morpho Blue und Midnight (Festzins) per ${channels}, in ${networkCount} Netzwerken, mit Erinnerung vor der Fälligkeit.`,
      title: "Morpho Blue und Midnight: Positionen und Health-Factor-Alerts",
      intro: networks =>
        `Deine Kreditpositionen in den Märkten, die die Morpho-App listet, auf ${networks}: Kredite mit variablem Zinssatz (Morpho Blue) und mit festem Zinssatz (Morpho Midnight). Die Health Factors werden direkt aus der Blockchain gelesen.`,
      checks: minutes =>
        `Alerts werden ${plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` })} geprüft. Ein Kredit mit festem Zinssatz bekommt außerdem 7 Tage und 1 Tag vor der Fälligkeit eine Erinnerung und nach der Fälligkeit bei jeder Prüfung einen Alert, solange Schulden offen sind.`,
      access: "Eine Zahlung für den Zugang deckt deine Alerts für Aave und Morpho ab.",
      notAffiliated: "Tokenping ist nicht mit Morpho verbunden.",
      guideHealthFactor: "So funktioniert der Health Factor bei Morpho",
      guideLiquidation: "So funktioniert die Liquidation bei Morpho",
      guideMidnight: "Festzinskredite bei Morpho Midnight",
      aaveDashboard: "Du leihst auf Aave? Öffne das Aave-Dashboard",
    },
    positionsHeading: "Deine Morpho-Positionen",
    gate: {
      title: "Verbinde eine Wallet, um fortzufahren",
      description:
        "Tokenping braucht deine Wallet-Adresse, um deine Morpho-Positionen zu finden. Das Verbinden bewegt kein Guthaben und kostet keine Gebühr.",
      connect: "Wallet verbinden",
      connecting: "Wird verbunden",
      approveInWallet: "Bestätige die Verbindung in deiner Wallet.",
    },
    list: {
      heading: "Märkte",
      count: count => `${count} mit Schulden`,
      none: "In den Märkten, die die Morpho-App listet, wurde kein Kredit gefunden.",
      discoveryFailed:
        "Die API von Morpho hat nicht geantwortet, daher sind nur die Märkte mit einem gespeicherten Alert aufgeführt.",
      variableRate: "Variabler Zinssatz",
      fixedRate: "Fester Zinssatz",
      matures: date => `Fällig am ${date}`,
      matured: "Fälligkeit überschritten",
      unreadable: "Konnte nicht gelesen werden",
      noneSelectedDescription: "Wähle einen Markt, um deine Morpho-Position zu sehen.",
    },
    details: {
      collateralValue: "Wert der Sicherheiten",
      debt: "Schulden",
      ltv: "LTV",
      lltv: "Liquidations-LTV",
      maturity: "Fälligkeit",
      timeLeft: (days, hours) =>
        days > 0
          ? plural("de", days, { one: "in 1 Tag", other: `in ${days} Tagen` })
          : plural("de", hours, { one: "in 1 Stunde", other: `in ${hours} Stunden` }),
      pastMaturity:
        "Dieser Kredit hat seine Fälligkeit überschritten: Offene Schulden können jederzeit liquidiert werden, egal wie hoch der Health Factor ist. Zahle sie zurück, um eine Liquidation zu vermeiden.",
      preLiquidation: "Vorliquidation",
      preLiquidationNote:
        "Du hast in diesem Markt die Vorliquidation (pre-liquidation) aktiviert, daher wird der Health Factor an ihrer früheren Grenze gemessen: Unter 1 kann ein Teil deiner Position verkauft werden.",
      amountsIn: token => `Die Beträge sind in ${token} angegeben, bewertet mit dem Orakel des Markts.`,
      noDebtTitle: "Keine Schulden in diesem Markt",
      noDebtDetail: "Ein gespeicherter Alert bleibt gespeichert und sendet nichts, solange keine Schulden bestehen.",
      unreadableTitle: "Diese Position konnte nicht gelesen werden",
      unreadableDetail: "Das Netzwerk hat nicht geantwortet. Dein Alert wird weiter geprüft.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Zahle einmal, um Health-Factor-Alerts ${deOnMarket(marketName, "market")} und in anderen Märkten einzurichten. Nichts verlängert sich automatisch: Wenn du verlängern willst, zahlst du aus deiner Wallet.`,
      descriptionExtend: marketName =>
        `Deine gespeicherten Alert-Einstellungen ${deForMarket(marketName, "market")} sind noch in deinem Konto. Zahle erneut, um den Zugang zu verlängern und sie zu bearbeiten.`,
    },
  },
  vi: {
    page: {
      metaTitle: "Cảnh báo hệ số sức khỏe trên Morpho Blue và Midnight",
      metaDescription: (networkCount, channels) =>
        `Cảnh báo hệ số sức khỏe cho khoản vay Morpho Blue và Midnight qua ${channels}, trên ${networkCount} mạng, kèm lời nhắc trước ngày đáo hạn của khoản vay.`,
      title: "Vị thế Morpho Blue, Midnight và cảnh báo hệ số sức khỏe",
      intro: networks =>
        `Các vị thế vay của bạn trong những thị trường mà ứng dụng Morpho liệt kê, trên các mạng ${networks}: khoản vay lãi suất thả nổi (Morpho Blue) và khoản vay lãi suất cố định (Morpho Midnight). Hệ số sức khỏe được đọc trực tiếp từ blockchain.`,
      checks: minutes =>
        `Cảnh báo được kiểm tra ${minutes} phút một lần. Khoản vay lãi suất cố định còn nhận lời nhắc 7 ngày và 1 ngày trước ngày đáo hạn, và một cảnh báo ở mỗi lần kiểm tra sau ngày đáo hạn khi vẫn còn nợ.`,
      access: "Một lần thanh toán quyền truy cập áp dụng cho cả cảnh báo Aave và Morpho của bạn.",
      notAffiliated: "Tokenping không liên kết với Morpho.",
      guideHealthFactor: "Cách hệ số sức khỏe trên Morpho hoạt động",
      guideLiquidation: "Cách thanh lý trên Morpho hoạt động",
      guideMidnight: "Khoản vay lãi suất cố định trên Morpho Midnight",
      aaveDashboard: "Bạn vay trên Aave? Mở bảng điều khiển Aave",
    },
    positionsHeading: "Vị thế Morpho của bạn",
    gate: {
      title: "Kết nối ví để tiếp tục",
      description:
        "Tokenping cần địa chỉ ví của bạn để tìm các vị thế Morpho của bạn. Việc kết nối không chuyển tiền và không mất phí.",
      connect: "Kết nối ví",
      connecting: "Đang kết nối",
      approveInWallet: "Hãy xác nhận kết nối trong ví của bạn.",
    },
    list: {
      heading: "Thị trường",
      count: count => `${count} có nợ`,
      none: "Không tìm thấy khoản vay nào trong các thị trường mà ứng dụng Morpho liệt kê.",
      discoveryFailed: "API của Morpho không phản hồi, nên chỉ những thị trường có cảnh báo đã lưu được liệt kê.",
      variableRate: "Lãi suất thả nổi",
      fixedRate: "Lãi suất cố định",
      matures: date => `Đáo hạn ngày ${date}`,
      matured: "Đã qua ngày đáo hạn",
      unreadable: "Không đọc được",
      noneSelectedDescription: "Chọn một thị trường để xem vị thế Morpho của bạn.",
    },
    details: {
      collateralValue: "Giá trị tài sản thế chấp",
      debt: "Nợ",
      ltv: "LTV",
      lltv: "LTV thanh lý",
      maturity: "Ngày đáo hạn",
      // Vietnamese nouns do not change after a number, so the number is written into one form.
      timeLeft: (days, hours) => (days > 0 ? `còn ${days} ngày` : `còn ${hours} giờ`),
      pastMaturity:
        "Khoản vay này đã qua ngày đáo hạn: phần nợ còn lại có thể bị thanh lý bất cứ lúc nào, bất kể hệ số sức khỏe. Hãy trả nợ để tránh bị thanh lý.",
      preLiquidation: "Thanh lý trước",
      preLiquidationNote:
        "Bạn đã chọn tham gia thanh lý trước (pre-liquidation) trên thị trường này, nên hệ số sức khỏe được đo theo ngưỡng sớm hơn của cơ chế đó: dưới 1, một phần vị thế của bạn có thể bị bán.",
      amountsIn: token => `Số tiền tính bằng ${token}, được định giá theo oracle của thị trường.`,
      noDebtTitle: "Không có nợ trên thị trường này",
      noDebtDetail: "Cảnh báo đã lưu vẫn được giữ, và không gửi gì khi không có nợ.",
      unreadableTitle: "Không đọc được vị thế này",
      unreadableDetail: "Mạng không phản hồi. Cảnh báo của bạn vẫn tiếp tục được kiểm tra.",
    },
    paywall: {
      descriptionNew: marketName =>
        `Thanh toán một lần để đặt cảnh báo hệ số sức khỏe trên ${viMarket(marketName, "market")} và các thị trường khác. Không có gì tự động gia hạn: bạn thanh toán từ ví của mình khi muốn gia hạn.`,
      descriptionExtend: marketName =>
        `Cài đặt cảnh báo bạn đã lưu cho ${viMarket(marketName, "market")} vẫn còn trong tài khoản của bạn. Thanh toán lại để gia hạn quyền truy cập và chỉnh sửa chúng.`,
    },
  },
};
