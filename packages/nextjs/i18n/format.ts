import { LOCALE_INFO, type Locale } from "~~/i18n/locales";

type PluralForms = {
  one: string;
  /** Czech 2 to 4 ("2 sítě"); English never uses it. */
  few?: string;
  /** Czech fractions ("1,5 sítě"). */
  many?: string;
  other: string;
};

/**
 * The plural form for a count, by the language's CLDR rules: English one/other, Czech one/few/many/other. A missing
 * form falls back to `other`. Write the number into the form yourself: plural("cs", n, { one: `${n} síť`, ... }).
 */
export const plural = (locale: Locale, count: number, forms: PluralForms) => {
  const category = new Intl.PluralRules(LOCALE_INFO[locale].intl).select(count) as keyof PluralForms;
  return forms[category] ?? forms.other;
};

/** A YYYY-MM-DD day as "14 October 2026" / "14. října 2026", in UTC so the server and the browser agree. */
export const formatLongDate = (locale: Locale, isoDate: string) =>
  new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));

const LIST_WORDS: Record<Locale, Record<"conjunction" | "disjunction", string>> = {
  en: { conjunction: "and", disjunction: "or" },
  cs: { conjunction: "a", disjunction: "nebo" },
};

/** A list the site's way, with no comma before the last word: "A, B and C" / "A, B a C" / "A, B nebo C". */
export const joinList = (
  locale: Locale,
  items: readonly string[],
  type: "conjunction" | "disjunction" = "conjunction",
) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${LIST_WORDS[locale][type]} ${items.at(-1)}`;

/**
 * A number the user reads in running text: as written in English ("1.42"), with a decimal comma in Czech ("1,42").
 * Takes the already-formatted string (a health factor such as "1.42" or "∞") or a number.
 */
export const formatDecimal = (locale: Locale, value: string | number) =>
  locale === "cs" ? String(value).replace(".", ",") : String(value);
