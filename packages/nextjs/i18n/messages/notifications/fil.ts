import type { NotificationMessages } from "./shared";
import { filOnMarket } from "~~/i18n/format";

// Read on a phone: short, plain sentences with the same facts as the English.
export const MESSAGES: NotificationMessages = {
  alertText: ({ chainName, healthFactor, threshold, timestamp }) =>
    `Ang Aave health factor mo ${filOnMarket(chainName)} ay ${healthFactor}. ` +
    `Mas mababa ito sa threshold mo na ${threshold}. ` +
    `Pag-isipang magdagdag ng collateral o magbayad ng utang para maiwasan ang liquidation.\n\nIpinadala noong: ${timestamp}`,
  alertSubject: chainName => `Aave health factor alert - ${chainName}`,
  // The html footer says "Ginawa noong" (created at) where the text says "Ipinadala noong" (sent at).
  alertHtml: ({ chainName, healthFactor, threshold, timestamp }) =>
    `<p>Ang Aave health factor mo ${filOnMarket(chainName).replace(chainName, `<strong>${chainName}</strong>`)} ay ` +
    `<strong>${healthFactor}</strong>. Mas mababa ito sa threshold mo na <strong>${threshold}</strong>.</p>` +
    `<p>Pag-isipang magdagdag ng collateral o magbayad ng utang para maiwasan ang liquidation.</p>` +
    `<p><small>Ginawa noong: ${timestamp}</small></p>`,
  testLines: ({ chainName, threshold, minutes, timestamp, position }) => {
    const statusWord = { critical: "kritikal", risky: "delikado", safe: "ligtas" };
    const now =
      position.kind === "debt"
        ? `Sa ngayon: health factor ${position.healthFactor} (${statusWord[position.status]}), collateral ${position.collateral}, utang ${position.debt}.`
        : position.kind === "noDebt"
          ? `Sa ngayon: walang utang, kaya walang puwedeng ma-liquidate${position.collateral ? ` (collateral ${position.collateral})` : ""}.`
          : position.kind === "none"
            ? "Sa ngayon: walang bukas na posisyon sa market na ito."
            : "Sa ngayon: hindi mabasa ang posisyon mo. Sumusubok ulit ang mga totoong alerto sa bawat pagtingin.";
    const verdict =
      position.kind === "debt"
        ? position.belowThreshold
          ? "Mas mababa ito sa threshold mo, kaya magpapadala ng totoong alerto ang susunod na pagtingin."
          : "Mas mataas ito sa threshold mo, kaya walang alertong ipapadala sa ngayon."
        : null;
    return [
      "Test na mensahe mula sa Tokenping: gumagana ang mga alerto sa channel na ito.",
      `Ang alerto mo: ${chainName}, kapag bumaba ang health factor sa ilalim ng ${threshold}.`,
      now,
      ...(verdict ? [verdict] : []),
      `Tinitingnan bawat ${minutes} minuto. Ipinadala noong: ${timestamp}`,
    ];
  },
  testSubject: chainName => `Test na mensahe ng Tokenping - ${chainName}`,
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} fixed rate, maturity sa ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Ang Morpho health factor mo ${filOnMarket(chainName, "network")} ay ${healthFactor}. Mas mababa ito sa threshold mo na ${threshold}.`,
    `Market: ${market}.`,
    ...(preLiquidation
      ? [
          "Pumayag ka sa pre-liquidation sa market na ito, kaya sinusukat ang health factor laban sa mas maagang linya nito: kapag mas mababa sa 1, puwedeng maibenta ang bahagi ng posisyon mo.",
        ]
      : []),
    "Pag-isipang magdagdag ng collateral o magbayad ng utang para maiwasan ang liquidation.",
    `Ipinadala noong: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho health factor alert - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Umabot na sa maturity noong ${when} ang fixed-rate na loan mo sa Morpho ${filOnMarket(chainName, "network")}, at may utang pa itong ${debt}.`,
          `Market: ${market}.`,
          "Puwede na itong ma-liquidate anumang oras, anuman ang health factor nito. Bayaran ito para maiwasan ang liquidation.",
          `Ipinadala noong: ${timestamp}`,
        ]
      : [
          `Magma-maturity ang fixed-rate na loan mo sa Morpho ${filOnMarket(chainName, "network")} sa loob ng ${stage === "7d" ? "7 araw" : "24 oras"}, sa ${when}.`,
          `Market: ${market}.`,
          `Utang: ${debt}.`,
          "Pagkalipas ng maturity, puwedeng ma-liquidate ang anumang utang na hindi pa nababayaran, kaya bayaran ito bago iyon.",
          `Ipinadala noong: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Lampas na sa maturity ang Morpho loan - ${chainName}`
      : `Magma-maturity ang Morpho loan sa loob ng ${stage === "7d" ? "7 araw" : "24 oras"} - ${chainName}`,
};
