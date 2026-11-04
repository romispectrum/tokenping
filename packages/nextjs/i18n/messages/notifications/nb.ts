import type { NotificationMessages } from "./shared";
import { nbOnMarket, plural } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Health factor for Aave ${nbOnMarket(chainName)} er ${healthFactor}. ` +
    `Det er under terskelen din på ${threshold}. ` +
    `Vurder å legge til sikkerhet eller betale tilbake gjeld for å unngå likvidasjon.\n\nSendt: ${timestamp}`,
  alertSubject: chainName => `Health factor-varsel for Aave - ${chainName}`,
  // The html footer says "Opprettet" (created at) where the text says "Sendt" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Health factor for Aave ${nbOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} er ` +
    `<strong>${healthFactor}</strong>. Det er under terskelen din på <strong>${threshold}</strong>.</p>` +
    `<p>Vurder å legge til sikkerhet eller betale tilbake gjeld for å unngå likvidasjon.</p>` +
    `<p><small>Opprettet: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritisk", risky: "risikabel", safe: "trygg" };
    const now =
      position.kind === "debt"
        ? `Akkurat nå: health factor ${position.healthFactor} (${statusWord[position.status]}), sikkerhet ${position.collateral}, gjeld ${position.debt}.`
        : position.kind === "noDebt"
          ? `Akkurat nå: ingen gjeld, så ingenting kan likvideres${position.collateral ? ` (sikkerhet ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Akkurat nå: ingen åpen posisjon i dette markedet."
            : "Akkurat nå: posisjonen din kunne ikke leses. Ekte varsler prøver igjen ved hver sjekk.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Det er under terskelen din, så neste sjekk sender et ekte varsel."
          : "Det er over terskelen din, så ingen varsel ville blitt sendt nå."
        : null;
    const every = plural("nb", minutes, { one: "hvert minutt", other: `hvert ${minutes}. minutt` });
    return [
      "Testmelding fra Tokenping: varsler via denne kanalen fungerer.",
      `Varselet ditt: ${chainName}, når health factor faller under ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Sjekkes ${every}. Sendt: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testmelding fra Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} med fast rente, forfaller ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Health factor for Morpho ${nbOnMarket(chainName, "network")} er ${healthFactor}. Det er under terskelen din på ${threshold}.`,
    `Marked: ${market}.`,
    ...(preLiquidation
      ? [
          "Du har valgt forhåndslikvidasjon (pre-liquidation) på dette markedet, så health factor måles mot den tidligere grensen: under 1 kan en del av posisjonen din selges.",
        ]
      : []),
    "Vurder å legge til sikkerhet eller betale tilbake gjeld for å unngå likvidasjon.",
    `Sendt: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Health factor-varsel for Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Lånet ditt med fast rente på Morpho ${nbOnMarket(chainName, "network")} forfalt ${when} og har fortsatt ${debt} i gjeld.`,
          `Marked: ${market}.`,
          "Det kan nå likvideres når som helst, uansett health factor. Betal det tilbake for å unngå likvidasjon.",
          `Sendt: ${timestamp}`,
        ]
      : [
          `Lånet ditt med fast rente på Morpho ${nbOnMarket(chainName, "network")} forfaller innen ${stage === "7d" ? "7 dager" : "24 timer"}, ${when}.`,
          `Marked: ${market}.`,
          `Gjeld: ${debt}.`,
          "Etter forfallsdatoen kan all ubetalt gjeld likvideres, så betal den tilbake før det.",
          `Sendt: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Lån på Morpho har passert forfallsdatoen - ${chainName}`
      : `Lån på Morpho forfaller innen ${stage === "7d" ? "7 dager" : "24 timer"} - ${chainName}`,
};
