import type { NotificationMessages } from "./shared";

export const MESSAGES: NotificationMessages = {
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
          ? `Right now: no debt, so nothing can be liquidated${position.collateral ? ` (collateral ${position.collateral})` : ""}.`
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
  morphoMarketName: market =>
    market.kind === "blue"
      ? `${market.collateral}/${market.loan} (${market.lltv} LLTV)`
      : `${market.loan} fixed rate, matures ${market.maturity}`,
  morphoAlertLines: ({ chainName, market, healthFactor, threshold, timestamp, preLiquidation }) => [
    `Your Morpho health factor on ${chainName} is ${healthFactor}, which is below your threshold of ${threshold}.`,
    `Market: ${market}.`,
    ...(preLiquidation
      ? [
          "You opted into pre-liquidation on this market, so the health factor is measured against its earlier line: below 1, part of your position can be sold.",
        ]
      : []),
    "Consider adding collateral or repaying debt to avoid liquidation.",
    `Sent at: ${timestamp}`,
  ],
  morphoAlertSubject: chainName => `Morpho health factor alert - ${chainName}`,
  maturityLines: ({ stage, chainName, market, when, debt, timestamp }) =>
    stage === "matured"
      ? [
          `Your Morpho fixed-rate loan on ${chainName} reached maturity on ${when} and still has ${debt} of debt.`,
          `Market: ${market}.`,
          "It can be liquidated at any time now, whatever its health factor. Repay it to avoid liquidation.",
          `Sent at: ${timestamp}`,
        ]
      : [
          `Your Morpho fixed-rate loan on ${chainName} matures within ${stage === "7d" ? "7 days" : "24 hours"}, on ${when}.`,
          `Market: ${market}.`,
          `Debt: ${debt}.`,
          "After maturity, any debt left unpaid can be liquidated, so repay it before then.",
          `Sent at: ${timestamp}`,
        ],
  maturitySubject: ({ stage, chainName }) =>
    stage === "matured"
      ? `Morpho loan past maturity - ${chainName}`
      : `Morpho loan matures within ${stage === "7d" ? "7 days" : "24 hours"} - ${chainName}`,
};
