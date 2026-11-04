import type { NotificationMessages } from "./shared";
import { daOnMarket, plural } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Din health factor for Aave ${daOnMarket(chainName)} er ${healthFactor}. ` +
    `Det er under din tærskel på ${threshold}. ` +
    `Overvej at tilføje sikkerhed eller tilbagebetale gæld for at undgå likvidation.\n\nSendt: ${timestamp}`,
  alertSubject: chainName => `Health factor-alarm for Aave - ${chainName}`,
  // The html footer says "Oprettet" (created at) where the text says "Sendt" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Din health factor for Aave ${daOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} er ` +
    `<strong>${healthFactor}</strong>. Det er under din tærskel på <strong>${threshold}</strong>.</p>` +
    `<p>Overvej at tilføje sikkerhed eller tilbagebetale gæld for at undgå likvidation.</p>` +
    `<p><small>Oprettet: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritisk", risky: "risikabel", safe: "sikker" };
    const now =
      position.kind === "debt"
        ? `Lige nu: health factor ${position.healthFactor} (${statusWord[position.status]}), sikkerhed ${position.collateral}, gæld ${position.debt}.`
        : position.kind === "noDebt"
          ? `Lige nu: ingen gæld, så intet kan likvideres${position.collateral ? ` (sikkerhed ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Lige nu: ingen åben position i dette marked."
            : "Lige nu: din position kunne ikke læses. Rigtige alarmer prøver igen ved hvert tjek.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Det er under din tærskel, så det næste tjek sender en rigtig alarm."
          : "Det er over din tærskel, så der ville ikke blive sendt nogen alarm nu."
        : null;
    const every = plural("da", minutes, { one: "hvert minut", other: `hvert ${minutes}. minut` });
    return [
      "Testbesked fra Tokenping: alarmer via denne kanal virker.",
      `Din alarm: ${chainName}, når health factor falder under ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Tjek ${every}. Sendt: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testbesked fra Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} med fast rente, forfalder ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Din health factor for Morpho ${daOnMarket(chainName, "network")} er ${healthFactor}. Det er under din tærskel på ${threshold}.`,
    `Marked: ${market}.`,
    ...(preLiquidation
      ? [
          "Du har valgt forlikvidation (pre-liquidation) på dette marked, så health factor måles mod dets tidligere grænse: under 1 kan en del af din position blive solgt.",
        ]
      : []),
    "Overvej at tilføje sikkerhed eller tilbagebetale gæld for at undgå likvidation.",
    `Sendt: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Health factor-alarm for Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Dit lån med fast rente på Morpho ${daOnMarket(chainName, "network")} forfaldt ${when} og har stadig ${debt} i gæld.`,
          `Marked: ${market}.`,
          "Det kan nu blive likvideret når som helst, uanset health factor. Tilbagebetal det for at undgå likvidation.",
          `Sendt: ${timestamp}`,
        ]
      : [
          `Dit lån med fast rente på Morpho ${daOnMarket(chainName, "network")} forfalder inden for ${stage === "7d" ? "7 dage" : "24 timer"}, ${when}.`,
          `Marked: ${market}.`,
          `Gæld: ${debt}.`,
          "Efter forfaldsdatoen kan al ubetalt gæld blive likvideret, så tilbagebetal den inden da.",
          `Sendt: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Lån på Morpho har passeret forfaldsdatoen - ${chainName}`
      : `Lån på Morpho forfalder inden for ${stage === "7d" ? "7 dage" : "24 timer"} - ${chainName}`,
};
