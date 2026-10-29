import { csOnMarket, esMarketNoun, hiMarket, hiMarketNoun, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";

// The alert itself, sent by email, Signal and Telegram in the language the alert was saved in. The numbers arrive
// formatted for that language (i18n/format formatDecimal); the timestamp too.

type AlertFields = { chainName: string; healthFactor: string; threshold: string; timestamp: string };

/** A Morpho market's name, from its parts already formatted for the language (LLTV as a percentage, a date). */
export type MorphoMarketName =
  | { kind: "blue"; collateral: string; loan: string; lltv: string }
  | { kind: "midnight"; loan: string; maturity: string };

/** A Morpho health alert. `market` is the market's name (morphoMarketName); `chainName` is the network's. */
export type MorphoAlertFields = AlertFields & {
  market: string;
  /** The borrower opted into a pre-liquidation, so the health factor is measured against its earlier line. */
  preLiquidation: boolean;
};

/**
 * A Morpho Midnight loan nearing or past maturity. `when` is the maturity's date and time, `debt` the amount owed with
 * its token ("501,010.14 USDC").
 */
export type MaturityFields = {
  stage: "7d" | "1d" | "matured";
  chainName: string;
  market: string;
  when: string;
  debt: string;
  timestamp: string;
};

/**
 * What a test message says about the position right now. `collateral` and `debt` arrive formatted as USD (Aave) or
 * in the loan token (Morpho), `healthFactor` like an alert's ("1.42", "1,42" in Czech).
 */
export type TestPosition =
  | {
      kind: "debt";
      healthFactor: string;
      status: "critical" | "risky" | "safe";
      collateral: string;
      debt: string;
      belowThreshold: boolean;
    }
  /** `collateral` is left out when the read does not price it (a Morpho position without debt). */
  | { kind: "noDebt"; collateral?: string }
  | { kind: "none" }
  /** The read failed: the message still proves the channel works. */
  | { kind: "unknown" };

export type TestFields = {
  chainName: string;
  threshold: string;
  minutes: number;
  timestamp: string;
  position: TestPosition;
};

type NotificationMessages = {
  alertText: (alert: AlertFields) => string;
  alertSubject: (chainName: string) => string;
  alertHtml: (alert: AlertFields) => string;
  /** The "Send test" message: the alert as saved and the position right now, as plain lines (text and email). */
  testLines: (test: TestFields) => string[];
  testSubject: (chainName: string) => string;
  morphoMarketName: (market: MorphoMarketName) => string;
  /** A Morpho alert as plain lines, the last one the footer (text and email). */
  morphoAlertLines: (alert: MorphoAlertFields) => string[];
  morphoAlertSubject: (chainName: string) => string;
  maturityLines: (notice: MaturityFields) => string[];
  maturitySubject: (notice: Pick<MaturityFields, "stage" | "chainName">) => string;
};

export const NOTIFICATION_MESSAGES: Localized<NotificationMessages> = {
  en: {
    alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
      `Your Aave Health Factor on ${chainName} is ${healthFactor}, ` +
      `which is below your threshold of ${threshold}. ` +
      `Consider adding collateral or repaying debt to avoid liquidation.\n\nSent at: ${timestamp}`,
    alertSubject: chainName => `Aave Health Factor Alert - ${chainName}`,
    // The html footer says "Created at" where the text says "Sent at".
    alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
      `<p>Your Aave Health Factor on <strong>${chainName}</strong> is ` +
      `<strong>${healthFactor}</strong>, which is below your threshold of ` +
      `<strong>${threshold}</strong>.</p>` +
      `<p>Consider adding collateral or repaying debt to avoid liquidation.</p>` +
      `<p><small>Created at: ${timestamp}</small></p>`,
    testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
      const statusWord = { critical: "Critical", risky: "Risky", safe: "Safe" };
      const now =
        position.kind === "debt"
          ? `Right now: health factor ${position.healthFactor} (${statusWord[position.status]}), collateral ${position.collateral}, debt ${position.debt}.`
          : position.kind === "noDebt"
            ? `Right now: no debt, so nothing can be liquidated${position.collateral ? ` (collateral ${position.collateral})` : ""}.`
            : position.kind === "none"
              ? "Right now: no open position in this market."
              : "Right now: your position could not be read. Real alerts try again at every check.";
      const verdict =
        position.kind === "debt"
          ? position.belowThreshold
            ? "That is below your threshold, so the next check sends a real alert."
            : "That is above your threshold, so no alert would be sent now."
          : null;
      return [
        "Test message from Tokenping: alerts on this channel work.",
        `Your alert: ${chainName}, when the health factor drops below ${threshold}.`,
        now,
        ...(verdict ? [verdict] : []),
        `Checked every ${minutes} minutes. Sent at: ${timestamp}`,
      ];
    },
    testSubject: chainName => `Tokenping test message - ${chainName}`,
    morphoMarketName: market =>
      market.kind === "blue"
        ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
        : `${market.loan} fixed rate, matures ${market.maturity}`,
    morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
      `Your Morpho health factor on ${chainName} is ${healthFactor}, which is below your threshold of ${threshold}.`,
      `Market: ${market}.`,
      ...(preLiquidation
        ? [
            "You opted into pre-liquidation on this market, so the health factor is measured against its earlier line: below 1, part of your position can be sold.",
          ]
        : []),
      "Consider adding collateral or repaying debt to avoid liquidation.",
      `Sent at: ${timestamp}`,
    ],
    morphoAlertSubject: chainName => `Morpho health factor alert - ${chainName}`,
    maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
      stage === "matured"
        ? [
            `Your Morpho fixed-rate loan on ${chainName} reached maturity on ${when} and still has ${debt} of debt.`,
            `Market: ${market}.`,
            "It can be liquidated at any time now, whatever its health factor. Repay it to avoid liquidation.",
            `Sent at: ${timestamp}`,
          ]
        : [
            `Your Morpho fixed-rate loan on ${chainName} matures within ${stage === "7d" ? "7 days" : "24 hours"}, on ${when}.`,
            `Market: ${market}.`,
            `Debt: ${debt}.`,
            "After maturity, any debt left unpaid can be liquidated, so repay it before then.",
            `Sent at: ${timestamp}`,
          ],
    maturitySubject: ({ stage, chainName }) =>
      stage === "matured"
        ? `Morpho loan past maturity - ${chainName}`
        : `Morpho loan matures within ${stage === "7d" ? "7 days" : "24 hours"} - ${chainName}`,
  },
  cs: {
    alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
      `Váš health factor na Aave ${csOnMarket(chainName)} je ${healthFactor}, ` +
      `což je pod vaším prahem ${threshold}. ` +
      `Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.\n\nOdesláno: ${timestamp}`,
    alertSubject: chainName => `Upozornění na health factor Aave - ${chainName}`,
    alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
      `<p>Váš health factor na Aave ${csOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} je ` +
      `<strong>${healthFactor}</strong>, což je pod vaším prahem ` +
      `<strong>${threshold}</strong>.</p>` +
      `<p>Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.</p>` +
      `<p><small>Vytvořeno: ${timestamp}</small></p>`,
    testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
      const statusWord = { critical: "kritický", risky: "rizikový", safe: "bezpečný" };
      const now =
        position.kind === "debt"
          ? `Teď: health factor ${position.healthFactor} (${statusWord[position.status]}), kolaterál ${position.collateral}, dluh ${position.debt}.`
          : position.kind === "noDebt"
            ? `Teď: bez dluhu, takže nic nemůže být zlikvidováno${position.collateral ? ` (kolaterál ${position.collateral})` : ""}.`
            : position.kind === "none"
              ? "Teď: na tomto trhu nemáte otevřenou pozici."
              : "Teď se vaši pozici nepodařilo načíst. Skutečná upozornění to zkoušejí při každé kontrole znovu.";
      const verdict =
        position.kind === "debt"
          ? position.belowThreshold
            ? "To je pod vaším prahem, takže příští kontrola pošle skutečné upozornění."
            : "To je nad vaším prahem, takže teď by žádné upozornění neodešlo."
          : null;
      const every = plural("cs", minutes, {
        one: "každou minutu",
        few: `každé ${minutes} minuty`,
        other: `každých ${minutes} minut`,
      });
      return [
        "Testovací zpráva od Tokenpingu: upozornění přes tento kanál fungují.",
        `Vaše upozornění: ${chainName}, když health factor klesne pod ${threshold}.`,
        now,
        ...(verdict ? [verdict] : []),
        `Kontrola ${every}. Odesláno: ${timestamp}`,
      ];
    },
    testSubject: chainName => `Testovací zpráva Tokenpingu - ${chainName}`,
    morphoMarketName: market =>
      market.kind === "blue"
        ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
        : `${market.loan} s pevnou sazbou, splatnost ${market.maturity}`,
    morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
      `Váš health factor na Morpho ${csOnMarket(chainName, "network")} je ${healthFactor}, což je pod vaším prahem ${threshold}.`,
      `Trh: ${market}.`,
      ...(preLiquidation
        ? [
            "Na tomto trhu jste zapnuli předběžnou likvidaci (pre-liquidation), proto se health factor měří vůči její dřívější hranici: pod 1 může být část vaší pozice prodána.",
          ]
        : []),
      "Zvažte doplnění kolaterálu nebo splacení dluhu, abyste se vyhnuli likvidaci.",
      `Odesláno: ${timestamp}`,
    ],
    morphoAlertSubject: chainName => `Upozornění na health factor Morpho - ${chainName}`,
    maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
      stage === "matured"
        ? [
            `Váš úvěr s pevnou sazbou na Morpho ${csOnMarket(chainName, "network")} dosáhl splatnosti ${when} a stále na něm zbývá dluh ${debt}.`,
            `Trh: ${market}.`,
            "Teď může být kdykoli zlikvidován, bez ohledu na health factor. Splaťte ho, abyste se vyhnuli likvidaci.",
            `Odesláno: ${timestamp}`,
          ]
        : [
            `Váš úvěr s pevnou sazbou na Morpho ${csOnMarket(chainName, "network")} má splatnost do ${stage === "7d" ? "7 dní" : "24 hodin"}, ${when}.`,
            `Trh: ${market}.`,
            `Dluh: ${debt}.`,
            "Po splatnosti může být jakýkoli nesplacený dluh zlikvidován, proto ho splaťte včas.",
            `Odesláno: ${timestamp}`,
          ],
    maturitySubject: ({ stage, chainName }) =>
      stage === "matured"
        ? `Úvěr na Morpho je po splatnosti - ${chainName}`
        : `Splatnost úvěru na Morpho do ${stage === "7d" ? "7 dní" : "24 hodin"} - ${chainName}`,
  },
  es: {
    alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
      `Tu factor de salud de Aave en ${esMarketNoun(chainName)} ${chainName} es ${healthFactor}, ` +
      `por debajo de tu umbral de ${threshold}. ` +
      `Considera agregar colateral o pagar deuda para evitar la liquidación.\n\nEnviado: ${timestamp}`,
    alertSubject: chainName => `Alerta del factor de salud de Aave - ${chainName}`,
    alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
      `<p>Tu factor de salud de Aave en ${esMarketNoun(chainName)} <strong>${chainName}</strong> es ` +
      `<strong>${healthFactor}</strong>, por debajo de tu umbral de ` +
      `<strong>${threshold}</strong>.</p>` +
      `<p>Considera agregar colateral o pagar deuda para evitar la liquidación.</p>` +
      `<p><small>Creado: ${timestamp}</small></p>`,
    testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
      const statusWord = { critical: "crítico", risky: "en riesgo", safe: "seguro" };
      const now =
        position.kind === "debt"
          ? `Ahora mismo: factor de salud ${position.healthFactor} (${statusWord[position.status]}), colateral ${position.collateral}, deuda ${position.debt}.`
          : position.kind === "noDebt"
            ? `Ahora mismo: sin deuda, así que no se puede liquidar nada${position.collateral ? ` (colateral ${position.collateral})` : ""}.`
            : position.kind === "none"
              ? "Ahora mismo: no tienes ninguna posición abierta en este mercado."
              : "Ahora mismo: no se pudo leer tu posición. Las alertas reales lo vuelven a intentar en cada revisión.";
      const verdict =
        position.kind === "debt"
          ? position.belowThreshold
            ? "Eso está por debajo de tu umbral, así que la próxima revisión enviará una alerta real."
            : "Eso está por encima de tu umbral, así que ahora no se enviaría ninguna alerta."
          : null;
      const every = plural("es", minutes, { one: "cada minuto", other: `cada ${minutes} minutos` });
      return [
        "Mensaje de prueba de Tokenping: las alertas por este canal funcionan.",
        `Tu alerta: ${chainName}, cuando el factor de salud caiga por debajo de ${threshold}.`,
        now,
        ...(verdict ? [verdict] : []),
        `Revisión ${every}. Enviado: ${timestamp}`,
      ];
    },
    testSubject: chainName => `Mensaje de prueba de Tokenping - ${chainName}`,
    morphoMarketName: market =>
      market.kind === "blue"
        ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
        : `${market.loan} a tasa fija, vence el ${market.maturity}`,
    morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
      `Tu factor de salud de Morpho en la red ${chainName} es ${healthFactor}, por debajo de tu umbral de ${threshold}.`,
      `Mercado: ${market}.`,
      ...(preLiquidation
        ? [
            "Activaste la preliquidación en este mercado, así que el factor de salud se mide respecto a su línea, que se alcanza antes: por debajo de 1, se puede vender parte de tu posición.",
          ]
        : []),
      "Considera agregar colateral o pagar deuda para evitar la liquidación.",
      `Enviado: ${timestamp}`,
    ],
    morphoAlertSubject: chainName => `Alerta del factor de salud de Morpho - ${chainName}`,
    maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
      stage === "matured"
        ? [
            `Tu préstamo a tasa fija de Morpho en la red ${chainName} venció el ${when} y aún tiene ${debt} de deuda.`,
            `Mercado: ${market}.`,
            "Ahora se puede liquidar en cualquier momento, sea cual sea su factor de salud. Devuelve el préstamo para evitar la liquidación.",
            `Enviado: ${timestamp}`,
          ]
        : [
            `Tu préstamo a tasa fija de Morpho en la red ${chainName} vence en menos de ${stage === "7d" ? "7 días" : "24 horas"}, el ${when}.`,
            `Mercado: ${market}.`,
            `Deuda: ${debt}.`,
            "Después del vencimiento, cualquier deuda que quede sin pagar se puede liquidar, así que págala antes.",
            `Enviado: ${timestamp}`,
          ],
    maturitySubject: ({ stage, chainName }) =>
      stage === "matured"
        ? `Tu préstamo de Morpho ya venció - ${chainName}`
        : `Tu préstamo de Morpho vence en menos de ${stage === "7d" ? "7 días" : "24 horas"} - ${chainName}`,
  },
  hi: {
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
  },
};
