import { csOnMarket, plural } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";

// The alert itself, sent by email, Signal and Telegram in the language the alert was saved in. The numbers arrive
// formatted for that language (i18n/format formatDecimal); the timestamp too.

type AlertFields = { chainName: string; healthFactor: string; threshold: string; timestamp: string };

/**
 * What a test message says about the position right now. `collateral` and `debt` arrive formatted as USD,
 * `healthFactor` like an alert's ("1.42", "1,42" in Czech).
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
  | { kind: "noDebt"; collateral: string }
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
            ? `Right now: no debt, so nothing can be liquidated (collateral ${position.collateral}).`
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
            ? `Teď: bez dluhu, takže nic nemůže být zlikvidováno (kolaterál ${position.collateral}).`
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
  },
};
