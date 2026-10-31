import type { NotificationMessages } from "./shared";
import { deOnMarket, plural } from "~~/i18n/format";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Dein Health Factor auf Aave ${deOnMarket(chainName)} liegt bei ${healthFactor}, ` +
    `unter deinem Schwellenwert von ${threshold}. ` +
    `Erwäge, Sicherheiten nachzulegen oder Schulden zurückzuzahlen, um eine Liquidation zu vermeiden.\n\nGesendet: ${timestamp}`,
  alertSubject: chainName => `Health-Factor-Alert für Aave - ${chainName}`,
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Dein Health Factor auf Aave ${deOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} liegt bei ` +
    `<strong>${healthFactor}</strong>, unter deinem Schwellenwert von ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>Erwäge, Sicherheiten nachzulegen oder Schulden zurückzuzahlen, um eine Liquidation zu vermeiden.</p>` +
    `<p><small>Erstellt: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritisch", risky: "riskant", safe: "sicher" };
    const now =
      position.kind === "debt"
        ? `Aktuell: Health Factor ${position.healthFactor} (${statusWord[position.status]}), Sicherheiten ${position.collateral}, Schulden ${position.debt}.`
        : position.kind === "noDebt"
          ? `Aktuell: keine Schulden, also kann nichts liquidiert werden${position.collateral ? ` (Sicherheiten ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Aktuell: keine offene Position in diesem Markt."
            : "Aktuell: deine Position konnte nicht gelesen werden. Echte Alerts versuchen es bei jeder Prüfung erneut.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Das liegt unter deinem Schwellenwert, also sendet die nächste Prüfung einen echten Alert."
          : "Das liegt über deinem Schwellenwert, also würde jetzt kein Alert gesendet."
        : null;
    const every = plural("de", minutes, { one: "jede Minute", other: `alle ${minutes} Minuten` });
    return [
      "Testnachricht von Tokenping: Alerts über diesen Kanal funktionieren.",
      `Dein Alert: ${chainName}, wenn der Health Factor unter ${threshold} fällt.`,
      now,
      ...(verdict ? [verdict] : []),
      `Prüfung ${every}. Gesendet: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tokenping-Testnachricht - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} mit festem Zinssatz, fällig am ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Dein Health Factor auf Morpho ${deOnMarket(chainName, "network")} liegt bei ${healthFactor}, unter deinem Schwellenwert von ${threshold}.`,
    `Markt: ${market}.`,
    ...(preLiquidation
      ? [
          "Du hast in diesem Markt die Vorliquidation (pre-liquidation) aktiviert, daher wird der Health Factor an ihrer früheren Grenze gemessen: unter 1 kann ein Teil deiner Position verkauft werden.",
        ]
      : []),
    "Erwäge, Sicherheiten nachzulegen oder Schulden zurückzuzahlen, um eine Liquidation zu vermeiden.",
    `Gesendet: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Health-Factor-Alert für Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Dein Kredit mit festem Zinssatz auf Morpho ${deOnMarket(chainName, "network")} ist am ${when} fällig geworden und hat noch ${debt} Schulden.`,
          `Markt: ${market}.`,
          "Er kann jetzt jederzeit liquidiert werden, unabhängig von seinem Health Factor. Zahle ihn zurück, um eine Liquidation zu vermeiden.",
          `Gesendet: ${timestamp}`,
        ]
      : [
          `Dein Kredit mit festem Zinssatz auf Morpho ${deOnMarket(chainName, "network")} wird innerhalb von ${stage === "7d" ? "7 Tagen" : "24 Stunden"} fällig, am ${when}.`,
          `Markt: ${market}.`,
          `Schulden: ${debt}.`,
          "Nach der Fälligkeit können alle nicht zurückgezahlten Schulden liquidiert werden, also zahle sie vorher zurück.",
          `Gesendet: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho-Kredit nach Fälligkeit - ${chainName}`
      : `Morpho-Kredit wird innerhalb von ${stage === "7d" ? "7 Tagen" : "24 Stunden"} fällig - ${chainName}`,
};
