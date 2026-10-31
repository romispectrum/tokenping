export type AlertFields = { chainName: string; healthFactor: string; threshold: string; timestamp: string };

/** A Morpho market's name, from its parts already formatted for the language (LLTV as a percentage, a date). */
export type MorphoMarketName =
  | { kind: "blue"; collateral: string; loan: string; lltv: string }
  | { kind: "midnight"; loan: string; maturity: string };

/** A Morpho health alert. `market` is the market's name (morphoMarketName); `chainName` is the network's. */
export type MorphoAlertFields = AlertFields & {
  market: string;
  /** The borrower opted into a pre-liquidation, so the health factor is measured against its earlier line. */
  preLiquidation: boolean;
};

/**
 * A Morpho Midnight loan nearing or past maturity. `when` is the maturity's date and time, `debt` the amount owed with
 * its token ("501,010.14 USDC").
 */
export type MaturityFields = {
  stage: "7d" | "1d" | "matured";
  chainName: string;
  market: string;
  when: string;
  debt: string;
  timestamp: string;
};

/**
 * What a test message says about the position right now. `collateral` and `debt` arrive formatted as USD (Aave) or
 * in the loan token (Morpho), `healthFactor` like an alert's ("1.42", "1,42" in Czech).
 */
export type TestPosition =
  | {
      kind: "debt";
      healthFactor: string;
      status: "critical" | "risky" | "safe";
      collateral: string;
      debt: string;
      belowThreshold: boolean;
    }
  /** `collateral` is left out when the read does not price it (a Morpho position without debt). */
  | { kind: "noDebt"; collateral?: string }
  | { kind: "none" }
  /** The read failed: the message still proves the channel works. */
  | { kind: "unknown" };

export type TestFields = {
  chainName: string;
  threshold: string;
  minutes: number;
  timestamp: string;
  position: TestPosition;
};

export type NotificationMessages = {
  alertText: (alert: AlertFields) => string;
  alertSubject: (chainName: string) => string;
  alertHtml: (alert: AlertFields) => string;
  /** The "Send test" message: the alert as saved and the position right now, as plain lines (text and email). */
  testLines: (test: TestFields) => string[];
  testSubject: (chainName: string) => string;
  morphoMarketName: (market: MorphoMarketName) => string;
  /** A Morpho alert as plain lines, the last one the footer (text and email). */
  morphoAlertLines: (alert: MorphoAlertFields) => string[];
  morphoAlertSubject: (chainName: string) => string;
  maturityLines: (notice: MaturityFields) => string[];
  maturitySubject: (notice: Pick<MaturityFields, "stage" | "chainName">) => string;
};
