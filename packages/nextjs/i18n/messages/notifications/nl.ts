import type { NotificationMessages } from "./shared";
import { nlOnMarket, plural } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Je health factor bij Aave ${nlOnMarket(chainName)} is ${healthFactor}. ` +
    `Dat is onder je drempel van ${threshold}. ` +
    `Overweeg onderpand toe te voegen of schuld af te lossen om liquidatie te voorkomen.\n\nVerstuurd: ${timestamp}`,
  alertSubject: chainName => `Health factor-alert voor Aave - ${chainName}`,
  // The html footer says "Aangemaakt" (created at) where the text says "Verstuurd" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Je health factor bij Aave ${nlOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} is ` +
    `<strong>${healthFactor}</strong>. Dat is onder je drempel van <strong>${threshold}</strong>.</p>` +
    `<p>Overweeg onderpand toe te voegen of schuld af te lossen om liquidatie te voorkomen.</p>` +
    `<p><small>Aangemaakt: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritiek", risky: "riskant", safe: "veilig" };
    const now =
      position.kind === "debt"
        ? `Nu: health factor ${position.healthFactor} (${statusWord[position.status]}), onderpand ${position.collateral}, schuld ${position.debt}.`
        : position.kind === "noDebt"
          ? `Nu: geen schuld, dus er kan niets worden geliquideerd${position.collateral ? ` (onderpand ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Nu: geen open positie in deze markt."
            : "Nu: je positie kon niet worden gelezen. Echte alerts proberen het bij elke controle opnieuw.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Dat is onder je drempel, dus de volgende controle stuurt een echte alert."
          : "Dat is boven je drempel, dus nu zou er geen alert worden verstuurd."
        : null;
    const every = plural("nl", minutes, { one: "elke minuut", other: `elke ${minutes} minuten` });
    return [
      "Testbericht van Tokenping: alerts via dit kanaal werken.",
      `Je alert: ${chainName}, als de health factor onder ${threshold} zakt.`,
      now,
      ...(verdict ? [verdict] : []),
      `Controle ${every}. Verstuurd: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Testbericht van Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} met vaste rente, vervalt op ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Je health factor bij Morpho ${nlOnMarket(chainName, "network")} is ${healthFactor}. Dat is onder je drempel van ${threshold}.`,
    `Markt: ${market}.`,
    ...(preLiquidation
      ? [
          "Je hebt op deze markt gekozen voor pre-liquidatie, dus de health factor wordt gemeten tegen die eerdere grens: onder 1 kan een deel van je positie worden verkocht.",
        ]
      : []),
    "Overweeg onderpand toe te voegen of schuld af te lossen om liquidatie te voorkomen.",
    `Verstuurd: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Health factor-alert voor Morpho - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Je lening met vaste rente bij Morpho ${nlOnMarket(chainName, "network")} is op ${when} vervallen en heeft nog ${debt} schuld.`,
          `Markt: ${market}.`,
          "Hij kan nu op elk moment worden geliquideerd, wat de health factor ook is. Los hem af om liquidatie te voorkomen.",
          `Verstuurd: ${timestamp}`,
        ]
      : [
          `Je lening met vaste rente bij Morpho ${nlOnMarket(chainName, "network")} vervalt binnen ${stage === "7d" ? "7 dagen" : "24 uur"}, op ${when}.`,
          `Markt: ${market}.`,
          `Schuld: ${debt}.`,
          "Na de vervaldatum kan alle onbetaalde schuld worden geliquideerd, dus los hem daarvoor af.",
          `Verstuurd: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho-lening voorbij de vervaldatum - ${chainName}`
      : `Morpho-lening vervalt binnen ${stage === "7d" ? "7 dagen" : "24 uur"} - ${chainName}`,
};
