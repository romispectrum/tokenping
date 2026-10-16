import { formatPostDate } from "~~/components/blog/formatPostDate";
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";

/** The day the articles' on-chain and API figures were read. Change it only when the figures are re-read. */
export const FIGURES_AS_OF = "2026-10-14";

/** "14 Oct 2026" / "14. 10. 2026". */
const formatShortDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-GB" : LOCALE_INFO[locale].intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

/** The standard scope line every article carries under its short answer (marketing plan §3.0). */
export const ScopeNote = ({ locale = DEFAULT_LOCALE }: { locale?: Locale }) => {
  const { text, figuresAsOf } = BLOG_MESSAGES[locale].scopeNote;
  return (
    <p className="my-6 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
      {`${text} ${figuresAsOf}`}{" "}
      <time dateTime={FIGURES_AS_OF} title={formatPostDate(FIGURES_AS_OF, locale)}>
        {formatShortDate(FIGURES_AS_OF, locale)}
      </time>
      .
    </p>
  );
};
