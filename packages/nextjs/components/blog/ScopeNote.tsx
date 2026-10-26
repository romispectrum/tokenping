import { formatPostDate } from "~~/components/blog/formatPostDate";
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";

/** The day the articles' on-chain and API figures were read. Change it only when the figures are re-read. */
export const FIGURES_AS_OF = "2026-10-14";

/** The same for the Morpho guides, whose figures were read separately. */
export const MORPHO_FIGURES_AS_OF = "2026-10-26";

/** "14 Oct 2026" / "14. 10. 2026". */
const formatShortDate = (date: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-GB" : LOCALE_INFO[locale].intl, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

type ScopeNoteProps = {
  locale?: Locale;
  /** The post's protocol (meta.protocol): a Morpho guide has its own scope and figures date. Aave when absent. */
  protocol?: "morpho";
};

/** The standard scope line every article carries under its short answer. */
export const ScopeNote = ({ locale = DEFAULT_LOCALE, protocol }: ScopeNoteProps) => {
  const { text, morphoText, figuresAsOf } = BLOG_MESSAGES[locale].scopeNote;
  const asOf = protocol === "morpho" ? MORPHO_FIGURES_AS_OF : FIGURES_AS_OF;
  return (
    <p className="my-6 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
      {`${protocol === "morpho" ? morphoText : text} ${figuresAsOf}`}{" "}
      <time dateTime={asOf} title={formatPostDate(asOf, locale)}>
        {formatShortDate(asOf, locale)}
      </time>
      .
    </p>
  );
};
