import type { NotificationMessages } from "./shared";
import { capitalize, huOnMarket } from "~~/i18n/format";

// Read on a phone: short sentences. The network's name stands before "hálózaton" ("az Arbitrum hálózaton"), and the
// threshold in brackets, so no suffix attaches to a name or a number.
const ACT = "A likvidálás elkerüléséhez érdemes fedezetet hozzáadni vagy adósságot visszafizetni.";

export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `${capitalize(huOnMarket(chainName))} az Aave health factorod ${healthFactor}. ` +
    `Ez a küszöbértéked (${threshold}) alatt van. ` +
    `${ACT}\n\nElküldve: ${timestamp}`,
  alertSubject: chainName => `Aave health factor-riasztás - ${chainName}`,
  // The html footer says "Létrehozva" (created at) where the text says "Elküldve" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>${capitalize(huOnMarket(chainName)).replace(chainName, `<strong>${chainName}</strong>`)} az Aave health factorod ` +
    `<strong>${healthFactor}</strong>. Ez a küszöbértéked (<strong>${threshold}</strong>) alatt van.</p>` +
    `<p>${ACT}</p>` +
    `<p><small>Létrehozva: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritikus", risky: "kockázatos", safe: "biztonságos" };
    const now =
      position.kind === "debt"
        ? `Most: health factor ${position.healthFactor} (${statusWord[position.status]}), fedezet ${position.collateral}, adósság ${position.debt}.`
        : position.kind === "noDebt"
          ? `Most: nincs adósság, így nincs mit likvidálni${position.collateral ? ` (fedezet: ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Most: ezen a piacon nincs nyitott pozíció."
            : "Most: a pozíciódat nem sikerült kiolvasni. A valódi riasztások minden ellenőrzéskor újrapróbálkoznak.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Ez a küszöbértéked alatt van, így a következő ellenőrzés valódi riasztást küld."
          : "Ez a küszöbértéked fölött van, így most nem menne ki riasztás."
        : null;
    return [
      "Tesztüzenet a Tokenpingtől: a riasztások ezen a csatornán működnek.",
      `A riasztásod: ${chainName}, ha a health factor ${threshold} alá esik.`,
      now,
      ...(verdict ? [verdict] : []),
      `Ellenőrzés ${minutes} percenként. Elküldve: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Tokenping-tesztüzenet - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} fix kamat (lejárat: ${market.maturity})`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `${capitalize(huOnMarket(chainName, "network"))} a Morpho health factorod ${healthFactor}. Ez a küszöbértéked (${threshold}) alatt van.`,
    `Piac: ${market}.`,
    ...(preLiquidation
      ? [
          "Ezen a piacon bekapcsoltad az előlikvidálást (pre-liquidation), ezért a health factor egy korábbi határhoz mérődik: 1 alatt a pozíciód egy része eladható.",
        ]
      : []),
    ACT,
    `Elküldve: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho health factor-riasztás - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `${capitalize(huOnMarket(chainName, "network"))} a fix kamatozású Morpho-hiteled lejárt (${when}). Még ennyi adósság van rajta: ${debt}.`,
          `Piac: ${market}.`,
          "Mostantól bármikor likvidálható, a health factortól függetlenül. A likvidálás elkerüléséhez fizesd vissza.",
          `Elküldve: ${timestamp}`,
        ]
      : [
          `${capitalize(huOnMarket(chainName, "network"))} a fix kamatozású Morpho-hiteled ${stage === "7d" ? "7 napon" : "24 órán"} belül lejár. Lejárat: ${when}.`,
          `Piac: ${market}.`,
          `Adósság: ${debt}.`,
          "A lejárat után a vissza nem fizetett adósság likvidálható, ezért addig fizesd vissza.",
          `Elküldve: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Lejárt Morpho-hitel - ${chainName}`
      : `A Morpho-hiteled ${stage === "7d" ? "7 napon" : "24 órán"} belül lejár - ${chainName}`,
};
