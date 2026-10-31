import type { MorphoMessages } from "./shared";
import { plural } from "~~/i18n/format";

export const MESSAGES: MorphoMessages = {
  page: {
    metaTitle: "Morpho health factor alerts for Blue and Midnight loans",
    metaDescription: (networkCount, channels) =>
      `Health factor alerts for Morpho Blue and Midnight loans by ${channels}, on ${networkCount} networks, with reminders before a fixed-rate loan matures.`,
    title: "Morpho Blue and Midnight positions and health factor alerts",
    intro: networks =>
      `Your borrow positions in the markets the Morpho app lists, on ${networks}: variable-rate loans (Morpho Blue) and fixed-rate loans (Morpho Midnight). Health factors are read from the chain.`,
    checks: minutes =>
      `Alerts are checked every ${minutes} minutes. A fixed-rate loan also gets a reminder 7 days and 1 day before it matures, and an alert at every check after maturity while debt remains.`,
    access: "One access payment covers your Aave and Morpho alerts.",
    notAffiliated: "Tokenping is not affiliated with Morpho.",
    guideHealthFactor: "How the Morpho health factor works",
    guideLiquidation: "How Morpho liquidation works",
    guideMidnight: "Morpho Midnight fixed-rate loans",
    aaveDashboard: "Borrowing on Aave? Open the Aave dashboard",
  },
  positionsHeading: "Your Morpho positions",
  gate: {
    title: "Connect a wallet to continue",
    description:
      "Tokenping needs your wallet address to find your Morpho positions. Connecting does not move funds or cost a fee.",
    connect: "Connect wallet",
    connecting: "Connecting",
    approveInWallet: "Approve the connection in your wallet.",
  },
  list: {
    heading: "Markets",
    count: count => `${count} with debt`,
    none: "No borrowing found in the markets the Morpho app lists.",
    discoveryFailed: "Morpho's API did not answer, so only the markets with a saved alert are listed.",
    variableRate: "Variable rate",
    fixedRate: "Fixed rate",
    matures: date => `Matures ${date}`,
    matured: "Past maturity",
    unreadable: "Could not be read",
    noneSelectedDescription: "Select a market to view its Morpho position.",
  },
  details: {
    collateralValue: "Collateral value",
    debt: "Debt",
    ltv: "LTV",
    lltv: "Liquidation LTV",
    maturity: "Maturity",
    timeLeft: (days, hours) =>
      days > 0
        ? plural("en", days, { one: "in 1 day", other: `in ${days} days` })
        : plural("en", hours, { one: "in 1 hour", other: `in ${hours} hours` }),
    pastMaturity:
      "This loan is past maturity: any debt left can be liquidated at any time, whatever its health factor. Repay it to avoid liquidation.",
    preLiquidation: "Pre-liquidation",
    preLiquidationNote:
      "You opted into pre-liquidation on this market, so the health factor is measured against its earlier line: below 1, part of your position can be sold.",
    amountsIn: token => `Amounts are in ${token}, valued by the market's oracle.`,
    noDebtTitle: "No debt in this market",
    noDebtDetail: "A saved alert stays saved, and sends nothing while there is no debt.",
    unreadableTitle: "This position could not be read",
    unreadableDetail: "The network did not answer. Your alert keeps being checked.",
  },
  paywall: {
    descriptionNew: marketName =>
      `Pay once to set health factor alerts on ${marketName} and other markets. Nothing renews automatically: you pay from your wallet when you want to extend.`,
    descriptionExtend: marketName =>
      `Your saved ${marketName} alert settings are still in your account. Pay again to extend access and edit them.`,
  },
};
