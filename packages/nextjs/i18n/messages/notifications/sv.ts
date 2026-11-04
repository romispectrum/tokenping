import type { NotificationMessages } from "./shared";
import { plural, svOnMarket } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Din health factor för Aave ${svOnMarket(chainName)} är ${healthFactor}. ` +
    `Det är under ditt tröskelvärde på ${threshold}. ` +
    `Överväg att lägga till säkerhet eller betala tillbaka skuld för att undvika likvidation.\n\nSkickat: ${timestamp}`,
  alertSubject: chainName => `Health factor-larm för Aave - ${chainName}`,
  // The html footer says "Skapat" (created at) where the text says "Skickat" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Din health factor för Aave ${svOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} är ` +
    `<strong>${healthFactor}</strong>. Det är under ditt tröskelvärde på <strong>${threshold}</strong>.</p>` +
    `<p>Överväg att lägga till säkerhet eller betala tillbaka skuld för att undvika likvidation.</p>` +
    `<p><small>Skapat: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritisk", risky: "riskabel", safe: "säker" };
    const now =
      position.kind === "debt"
        ? `Just nu: health factor ${position.healthFactor} (${statusWord[position.status]}), säkerhet ${position.collateral}, skuld ${position.debt}.`
        : position.kind === "noDebt"
          ? `Just nu: ingen skuld, så inget kan likvideras${position.collateral ? ` (säkerhet ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Just nu: ingen öppen position i den här marknaden."
            : "Just nu: din position kunde inte läsas. Riktiga larm försöker igen vid varje kontroll.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Det är under ditt tröskelvärde, så nästa kontroll skickar ett riktigt larm."
          : "Det är över ditt tröskelvärde, så inget larm skulle skickas nu."
        : null;
    const every = plural("sv", minutes, { one: "en gång i minuten", other: `var ${minutes} minuter` });
    return [
      "Testmeddelande från Tokenping: larm via den här kanalen fungerar.",
      `Ditt larm: ${chainName}, när health factor sjunker under ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Kontroll ${every}. Skickat: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testmeddelande från Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} med fast ränta, förfaller ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Din health factor för Morpho ${svOnMarket(chainName, "network")} är ${healthFactor}. Det är under ditt tröskelvärde på ${threshold}.`,
    `Marknad: ${market}.`,
    ...(preLiquidation
      ? [
          "Du har valt förlikvidation (pre-liquidation) på den här marknaden, så health factor mäts mot dess tidigare gräns: under 1 kan en del av din position säljas.",
        ]
      : []),
    "Överväg att lägga till säkerhet eller betala tillbaka skuld för att undvika likvidation.",
    `Skickat: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Health factor-larm för Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Ditt lån med fast ränta på Morpho ${svOnMarket(chainName, "network")} förföll ${when} och har fortfarande ${debt} i skuld.`,
          `Marknad: ${market}.`,
          "Det kan nu likvideras när som helst, oavsett health factor. Betala tillbaka det för att undvika likvidation.",
          `Skickat: ${timestamp}`,
        ]
      : [
          `Ditt lån med fast ränta på Morpho ${svOnMarket(chainName, "network")} förfaller inom ${stage === "7d" ? "7 dagar" : "24 timmar"}, ${when}.`,
          `Marknad: ${market}.`,
          `Skuld: ${debt}.`,
          "Efter förfallodagen kan all obetald skuld likvideras, så betala tillbaka den innan dess.",
          `Skickat: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Lån på Morpho har passerat förfallodagen - ${chainName}`
      : `Lån på Morpho förfaller inom ${stage === "7d" ? "7 dagar" : "24 timmar"} - ${chainName}`,
};
