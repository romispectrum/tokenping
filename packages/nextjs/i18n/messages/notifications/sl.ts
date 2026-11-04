import type { NotificationMessages } from "./shared";
import { capitalize, plural, slOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's name follows "omrežju" ("na omrežju Arbitrum") and a market's
// "trgu" or a colon, so no name takes a case ending.
const ACT = "Razmisli o dodajanju zavarovanja ali odplačilu dolga, da se izogneš likvidaciji.";

/** "vsako minuto", "vsaki 2 minuti", "vsake 3 minute", "vsakih 5 minut". */
const everyMinutes = (minutes: number) =>
  plural("sl", minutes, {
    one: minutes === 1 ? "vsako minuto" : `vsako ${minutes} minuto`,
    two: `vsaki ${minutes} minuti`,
    few: `vsake ${minutes} minute`,
    other: `vsakih ${minutes} minut`,
  });

const within = (stage: "7d" | "1d") => (stage === "7d" ? "v 7 dneh" : "v 24 urah");

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `${capitalize(slOnMarket(chainName))} je tvoj health factor v Aave ${healthFactor}, ` +
    `kar je pod tvojim pragom ${threshold}. ` +
    `${ACT}\n\nPoslano: ${timestamp}`,
  alertSubject: chainName => `Opozorilo za health factor v Aave - ${chainName}`,
  // The html footer says "Ustvarjeno" (created at) where the text says "Poslano" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>${capitalize(slOnMarket(chainName)).replace(chainName, `<strong>${chainName}</strong>`)} je tvoj health factor v Aave ` +
    `<strong>${healthFactor}</strong>, kar je pod tvojim pragom ` +
    `<strong>${threshold}</strong>.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Ustvarjeno: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritično", risky: "tvegano", safe: "varno" };
    const now =
      position.kind === "debt"
        ? `Trenutno: health factor ${position.healthFactor} (${statusWord[position.status]}), zavarovanje ${position.collateral}, dolg ${position.debt}.`
        : position.kind === "noDebt"
          ? `Trenutno: ni dolga, zato ni česa likvidirati${position.collateral ? ` (zavarovanje ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Trenutno: na tem trgu ni odprte pozicije."
            : "Trenutno: tvoje pozicije ni bilo mogoče prebrati. Prava opozorila poskusijo znova ob vsakem preverjanju.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "To je pod tvojim pragom, zato naslednje preverjanje pošlje pravo opozorilo."
          : "To je nad tvojim pragom, zato zdaj opozorilo ne bi bilo poslano."
        : null;
    return [
      "Testno sporočilo storitve Tokenping: opozorila prek tega kanala delujejo.",
      `Tvoje opozorilo: ${chainName}, ko health factor pade pod ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Preverjanje ${everyMinutes(minutes)}. Poslano: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testno sporočilo Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} s fiksno obrestno mero, zapade ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `${capitalize(slOnMarket(chainName, "network"))} je tvoj health factor v Morpho ${healthFactor}, kar je pod tvojim pragom ${threshold}.`,
    `Trg: ${market}.`,
    ...(preLiquidation
      ? [
          "Na tem trgu imaš vklopljeno predlikvidacijo (pre-liquidation), zato se health factor meri glede na njen zgodnejši prag: pod 1 je mogoče prodati del tvoje pozicije.",
        ]
      : []),
    ACT,
    `Poslano: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Opozorilo za health factor v Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Tvoje posojilo s fiksno obrestno mero v Morpho ${slOnMarket(chainName, "network")} je zapadlo (${when}). Preostali dolg: ${debt}.`,
          `Trg: ${market}.`,
          "Zdaj ga je mogoče kadar koli likvidirati, ne glede na health factor. Odplačaj ga, da se izogneš likvidaciji.",
          `Poslano: ${timestamp}`,
        ]
      : [
          `Tvoje posojilo s fiksno obrestno mero v Morpho ${slOnMarket(chainName, "network")} zapade ${within(stage)}. Zapadlost: ${when}.`,
          `Trg: ${market}.`,
          `Dolg: ${debt}.`,
          "Po zapadlosti je mogoče likvidirati ves neodplačani dolg, zato ga odplačaj pred tem.",
          `Poslano: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Posojilo v Morpho je zapadlo - ${chainName}`
      : `Posojilo v Morpho zapade ${within(stage)} - ${chainName}`,
};
