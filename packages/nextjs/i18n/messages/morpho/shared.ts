import type { GateMessages } from "~~/i18n/messages/dashboard";

export type MorphoMessages = {
  page: {
    metaTitle: string;
    metaDescription: (networkCount: number, channels: string) => string;
    title: string;
    /** `networks` is the list of Morpho's networks, joined. */
    intro: (networks: string) => string;
    checks: (minutes: number) => string;
    access: string;
    notAffiliated: string;
    guideHealthFactor: string;
    guideLiquidation: string;
    guideMidnight: string;
    /** The link to the Aave dashboard, for a borrower who is on the wrong page. */
    aaveDashboard: string;
  };
  positionsHeading: string;
  gate: GateMessages;
  list: {
    heading: string;
    count: (count: number) => string;
    none: string;
    discoveryFailed: string;
    variableRate: string;
    fixedRate: string;
    matures: (date: string) => string;
    matured: string;
    unreadable: string;
    /** The accessible name of the button that reads one market again: the market's name in words. */
    retry: (market: string) => string;
    noneSelectedDescription: string;
  };
  details: {
    collateralValue: string;
    debt: string;
    ltv: string;
    lltv: string;
    maturity: string;
    timeLeft: (days: number, hours: number) => string;
    pastMaturity: string;
    preLiquidation: string;
    preLiquidationNote: string;
    amountsIn: (token: string) => string;
    noDebtTitle: string;
    noDebtDetail: string;
    unreadableTitle: string;
    unreadableDetail: string;
  };
  paywall: {
    descriptionNew: (marketName: string) => string;
    descriptionExtend: (marketName: string) => string;
  };
};
