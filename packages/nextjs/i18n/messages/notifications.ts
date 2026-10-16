import { csOnMarket } from "~~/i18n/format";
import type { Localized } from "~~/i18n/locales";

// The alert itself, sent by email, Signal and Telegram in the language the alert was saved in. The numbers arrive
// formatted for that language (i18n/format formatDecimal); the timestamp too.

type AlertFields = { chainName: string; healthFactor: string; threshold: string; timestamp: string };

type NotificationMessages = {
  alertText: (alert: AlertFields) => string;
  alertSubject: (chainName: string) => string;
  alertHtml: (alert: AlertFields) => string;
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
  },
};
