import {
  HEALTH_FACTOR_CRITICAL,
  HEALTH_FACTOR_RISKY,
  NOTIFICATION_CHECK_INTERVAL_MINUTES,
} from "~~/constants/notifications";
import { formatDecimal } from "~~/i18n/format";
import type { Locale } from "~~/i18n/locales";
import { NOTIFICATION_MESSAGES, type TestPosition } from "~~/i18n/messages/notifications";
import type { MarketSnapshot } from "~~/services/aave/getHealthFactor";
import { formatUSD, formatUtcTimestamp } from "~~/utils/format";

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The badge's zones, as the dashboard and the landing page draw them. */
const statusOf = (healthFactor: number) =>
  healthFactor < HEALTH_FACTOR_CRITICAL ? "critical" : healthFactor < HEALTH_FACTOR_RISKY ? "risky" : "safe";

/** What the message says about the position: null `snapshot` means the read failed. */
export const toTestPosition = (snapshot: MarketSnapshot | null, threshold: number, locale: Locale): TestPosition => {
  if (!snapshot) return { kind: "unknown" };
  if (!snapshot.hasPosition) return { kind: "none" };
  const collateral = formatUSD(String(snapshot.collateralUSD));
  if (!Number.isFinite(snapshot.healthFactorValue)) return { kind: "noDebt", collateral };
  return {
    kind: "debt",
    healthFactor: formatDecimal(locale, snapshot.healthFactor),
    status: statusOf(snapshot.healthFactorValue),
    collateral,
    debt: formatUSD(String(snapshot.debtUSD)),
    // Compared exactly, as the cron does.
    belowThreshold: snapshot.healthFactorValue < threshold,
  };
};

type TestMessageInput = {
  /** The market's name, used when the position could not be read (the snapshot carries it otherwise). */
  chainName: string;
  snapshot: MarketSnapshot | null;
  threshold: number;
  locale: Locale;
  now?: Date;
};

/**
 * The "Send test" message for every channel, in the alert's language: `text` for Signal, Telegram and the email's
 * plain part, `subject` and `html` for the email. Built from the saved alert and the position as it is right now.
 */
export const buildTestMessage = ({ chainName, snapshot, threshold, locale, now = new Date() }: TestMessageInput) => {
  const t = NOTIFICATION_MESSAGES[locale];
  const name = snapshot?.chainName ?? chainName;
  const lines = t.testLines({
    chainName: name,
    threshold: formatDecimal(locale, threshold),
    minutes: NOTIFICATION_CHECK_INTERVAL_MINUTES,
    timestamp: formatUtcTimestamp(now, locale),
    position: toTestPosition(snapshot, threshold, locale),
  });
  const [first, ...rest] = lines;
  return {
    text: [first, "", ...rest.slice(0, -1), "", rest[rest.length - 1]].join("\n"),
    subject: t.testSubject(name),
    html: [
      `<p><strong>${escapeHtml(first)}</strong></p>`,
      ...rest.slice(0, -1).map(line => `<p>${escapeHtml(line)}</p>`),
      `<p><small>${escapeHtml(rest[rest.length - 1])}</small></p>`,
    ].join(""),
  };
};
