import { csOnMarket, plural } from "~~/i18n/format";
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
};
