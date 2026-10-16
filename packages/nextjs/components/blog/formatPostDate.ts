import { formatLongDate } from "~~/i18n/format";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";

// UTC, so the server and every reader see the same calendar day as the YYYY-MM-DD in the post meta. English keeps
// the day-month order of en-GB ("14 October 2026"); formatLongDate's English is en-US ("October 14, 2026").
const EN_POST_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-10-14" -> "14 October 2026" / "14. října 2026". */
export const formatPostDate = (date: string, locale: Locale = DEFAULT_LOCALE) =>
  locale === "en" ? EN_POST_DATE_FORMAT.format(new Date(`${date}T00:00:00Z`)) : formatLongDate(locale, date);
