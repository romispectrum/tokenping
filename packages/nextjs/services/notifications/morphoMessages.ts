import { formatUnits } from "viem";
import { HEALTH_FACTOR_CRITICAL, HEALTH_FACTOR_RISKY } from "~~/constants/notifications";
import { formatDecimal, formatLongDate } from "~~/i18n/format";
import { LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { NOTIFICATION_MESSAGES, type TestPosition } from "~~/i18n/messages/notifications";
import { NO_DEBT_HEALTH_FACTOR, WAD } from "~~/services/morpho/math";
import type { MorphoMarketParams, MorphoReading } from "~~/services/morpho/types";
import { renderTestMessage } from "~~/services/notifications/testMessage";
import { formatUtcTimestamp } from "~~/utils/format";
import { formatHealthFactorDown } from "~~/utils/healthFactor";

// The messages of a Morpho alert: the health alert, the Midnight maturity reminders and the test message. Amounts are
// in the loan token, as the chain reports them: Tokenping prices nothing in USD for Morpho.

type AlertMessage = { text: string; subject: string; html: string };

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Lines whose last one is the footer: paragraphs in text and html, the footer apart and small. */
const render = (subject: string, lines: string[]): AlertMessage => {
  const body = lines.slice(0, -1);
  const footer = lines[lines.length - 1];
  return {
    subject,
    text: `${body.join("\n")}\n\n${footer}`,
    html: [...body.map(line => `<p>${escapeHtml(line)}</p>`), `<p><small>${escapeHtml(footer)}</small></p>`].join(""),
  };
};

const percent = (locale: Locale, wad: string) =>
  new Intl.NumberFormat(LOCALE_INFO[locale].intl, { style: "percent", maximumFractionDigits: 2 }).format(
    Number(wad) / 1e18,
  );

const maturityDate = (maturity: number) => new Date(maturity * 1000);

/** "OETH/USDC (86% LLTV)", "USDC fixed rate, matures October 30, 2026", in the language's own number and date forms. */
export const morphoMarketName = (params: MorphoMarketParams, locale: Locale) =>
  NOTIFICATION_MESSAGES[locale].morphoMarketName(
    params.kind === "blue"
      ? {
          kind: "blue",
          collateral: params.collateralToken.symbol,
          loan: params.loanToken.symbol,
          lltv: percent(locale, params.lltv),
        }
      : {
          kind: "midnight",
          loan: params.loanToken.symbol,
          maturity: formatLongDate(locale, maturityDate(params.maturity).toISOString().slice(0, 10)),
        },
  );

/** "501,010.14 USDC" / "501 010,14 USDC": four decimals below 1, two above. */
export const formatLoanAmount = (amount: bigint, params: MorphoMarketParams, locale: Locale) => {
  const value = Number(formatUnits(amount, params.loanToken.decimals));
  const digits = Math.abs(value) < 1 ? 4 : 2;
  const number = new Intl.NumberFormat(LOCALE_INFO[locale].intl, { maximumFractionDigits: digits }).format(value);
  return `${number} ${params.loanToken.symbol}`;
};

/** The health factor as alerts write it: 2 decimals rounded down, with the language's decimal mark. */
const formatHealth = (reading: MorphoReading, locale: Locale) =>
  formatDecimal(locale, formatHealthFactorDown(reading.healthFactor));

/** Whether a reading is below the threshold, compared exactly in 18 decimals (1.049999 alerts against 1.05). */
export const isBelowMorphoThreshold = (reading: MorphoReading, threshold: number) =>
  reading.healthFactor < (BigInt(Math.round(threshold * 100)) * WAD) / 100n;

type MessageInput = {
  chainName: string;
  params: MorphoMarketParams;
  reading: MorphoReading;
  locale: Locale;
  now?: Date;
};

export const buildMorphoAlert = ({
  chainName,
  params,
  reading,
  threshold,
  locale,
  now = new Date(),
}: MessageInput & { threshold: number }) => {
  const t = NOTIFICATION_MESSAGES[locale];
  return render(
    t.morphoAlertSubject(chainName),
    t.morphoAlertLines({
      chainName,
      market: morphoMarketName(params, locale),
      healthFactor: formatHealth(reading, locale),
      threshold: formatDecimal(locale, threshold),
      timestamp: formatUtcTimestamp(now, locale),
      preLiquidation: reading.line === "pre-liquidation",
    }),
  );
};

export const buildMaturityMessage = ({
  stage,
  chainName,
  params,
  reading,
  locale,
  now = new Date(),
}: MessageInput & { stage: "7d" | "1d" | "matured" }) => {
  const t = NOTIFICATION_MESSAGES[locale];
  const maturity = params.kind === "midnight" ? params.maturity : 0;
  return render(
    t.maturitySubject({ stage, chainName }),
    t.maturityLines({
      stage,
      chainName,
      market: morphoMarketName(params, locale),
      when: formatUtcTimestamp(maturityDate(maturity), locale),
      debt: formatLoanAmount(reading.debt, params, locale),
      timestamp: formatUtcTimestamp(now, locale),
    }),
  );
};

/** What the test message says about the position: null `reading` means the read failed. */
const toTestPosition = (
  reading: MorphoReading | null,
  params: MorphoMarketParams,
  threshold: number,
  locale: Locale,
): TestPosition => {
  if (!reading) return { kind: "unknown" };
  if (reading.debt === 0n || reading.healthFactor === NO_DEBT_HEALTH_FACTOR) return { kind: "noDebt" };
  const value = Number(formatUnits(reading.healthFactor, 18));
  return {
    kind: "debt",
    healthFactor: formatHealth(reading, locale),
    status: value < HEALTH_FACTOR_CRITICAL ? "critical" : value < HEALTH_FACTOR_RISKY ? "risky" : "safe",
    collateral: formatLoanAmount(reading.collateralValue, params, locale),
    debt: formatLoanAmount(reading.debt, params, locale),
    belowThreshold: isBelowMorphoThreshold(reading, threshold),
  };
};

/** The "Send test" message of a Morpho alert, named "Morpho OETH/USDC (86% LLTV), Base". */
export const buildMorphoTestMessage = ({
  chainName,
  params,
  reading,
  threshold,
  locale,
  now = new Date(),
}: Omit<MessageInput, "reading"> & { reading: MorphoReading | null; threshold: number }) =>
  renderTestMessage({
    name: `Morpho ${morphoMarketName(params, locale)}, ${chainName}`,
    position: toTestPosition(reading, params, threshold, locale),
    threshold,
    locale,
    now,
  });
