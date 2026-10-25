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

/** A YYYY-MM-DD day as "October 14, 2026" / "14. října 2026", in UTC so the server and the browser agree. */
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

// A V4 Spoke's market name ends "(V4 Spoke)" (config/aaveConfig marketLabel); a V3 market is named by its network.
const isV4MarketName = (name: string) => / \(V4 [^)]+\)$/.test(name);

/**
 * What a market's name names: a network (an Aave V3 market is named by its network) or a market of its own (an Aave V4
 * Spoke, a Morpho market). Callers that know it pass it; otherwise it is read from an Aave label.
 */
export type MarketNameKind = "network" | "market";

const marketNameKind = (name: string, kind?: MarketNameKind): MarketNameKind =>
  kind ?? (isV4MarketName(name) ? "market" : "network");

/** Czech "na síti Ethereum" for a V3 market, "na trhu Ethereum (V4 Lido)" for a V4 Spoke, which is no network. */
export const csOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `na trhu ${name}` : `na síti ${name}`;

/** Czech "pro síť Ethereum" for a V3 market, "pro trh Ethereum (V4 Lido)" for a V4 Spoke. */
export const csForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `pro trh ${name}` : `pro síť ${name}`;

/** The text with its first letter upper case, for a phrase that starts a sentence. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
