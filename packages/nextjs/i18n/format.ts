import { LOCALE_INFO, type Locale } from "~~/i18n/locales";

type PluralForms = {
  one: string;
  /** Czech 2 to 4 ("2 sítě"); no other language uses it. */
  few?: string;
  /** Czech fractions ("1,5 sítě"); Spanish uses it for a million and up, and falls back to `other` there. */
  many?: string;
  other: string;
};

/**
 * The plural form for a count, by the language's CLDR rules: English, Spanish and German one/other, Hindi one/other
 * with 0 as one, Czech one/few/many/other, Vietnamese other only (pass the same text as `one`).
 * A missing form falls back to `other`. Write the number into the form yourself: plural("cs", n, { one: `${n} síť`, ... }).
 */
export const plural = (locale: Locale, count: number, forms: PluralForms) => {
  const category = new Intl.PluralRules(LOCALE_INFO[locale].intl).select(count) as keyof PluralForms;
  return forms[category] ?? forms.other;
};

/**
 * A YYYY-MM-DD day as "October 14, 2026" / "14. října 2026" / "14 de octubre de 2026" / "14 अक्टूबर 2026", in UTC so
 * the server and the browser agree.
 */
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
  es: { conjunction: "y", disjunction: "o" },
  hi: { conjunction: "और", disjunction: "या" },
  de: { conjunction: "und", disjunction: "oder" },
  vi: { conjunction: "và", disjunction: "hoặc" },
};

/**
 * Spanish "y" turns into "e" before an i sound ("Signal e Ink", but "y hierro"), "o" into "u" before an o sound
 * ("Arbitrum u OP Mainnet").
 */
const spanishListWord = (word: string, next: string) => {
  if (word === "y" && /^h?i(?![aeouáéó])/i.test(next)) return "e";
  if (word === "o" && /^h?[oó]/i.test(next)) return "u";
  return word;
};

/** A list the site's way, with no comma before the last word: "A, B and C" / "A, B a C" / "A, B y C" / "A, B और C". */
export const joinList = (
  locale: Locale,
  items: readonly string[],
  type: "conjunction" | "disjunction" = "conjunction",
) => {
  if (items.length <= 1) return items[0] ?? "";
  const last = items.at(-1)!;
  const word = locale === "es" ? spanishListWord(LIST_WORDS.es[type], last) : LIST_WORDS[locale][type];
  return `${items.slice(0, -1).join(", ")} ${word} ${last}`;
};

/**
 * A number the user reads in running text: as written in English ("1.42"), with a decimal comma in Czech, German and
 * Vietnamese ("1,42"). Spanish and Hindi keep the decimal point, as Latin America and Indian apps write it and the app
 * shows it. Takes the already-formatted string (a health factor such as "1.42" or "∞") or a number.
 */
const DECIMAL_COMMA: ReadonlySet<Locale> = new Set(["cs", "de", "vi"]);

export const formatDecimal = (locale: Locale, value: string | number) =>
  DECIMAL_COMMA.has(locale) ? String(value).replace(".", ",") : String(value);

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

/** Spanish "la red" before a V3 market's name (its network's), "el mercado" before a V4 Spoke's or a Morpho market's. */
export const esMarketNoun = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? "el mercado" : "la red";

/** Spanish "la red Ethereum" for a V3 market, "el mercado Ethereum (V4 Lido)" for a V4 Spoke. */
export const esMarket = (name: string, kind?: MarketNameKind) => `${esMarketNoun(name, kind)} ${name}`;

/** Hindi "नेटवर्क" for a V3 market (named by its network), "मार्केट" for a V4 Spoke or a Morpho market. */
export const hiMarketNoun = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? "मार्केट" : "नेटवर्क";

/** Hindi "Ethereum नेटवर्क" for a V3 market, "Ethereum (V4 Lido) मार्केट" for a V4 Spoke; the caller adds "पर". */
export const hiMarket = (name: string, kind?: MarketNameKind) => `${name} ${hiMarketNoun(name, kind)}`;

/** German "im Netzwerk Ethereum" for a V3 market, "im Markt Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const deOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `im Markt ${name}` : `im Netzwerk ${name}`;

/** German "für das Netzwerk Ethereum" for a V3 market, "für den Markt Ethereum (V4 Lido)" for a V4 Spoke. */
export const deForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `für den Markt ${name}` : `für das Netzwerk ${name}`;

/** Vietnamese "mạng" before a V3 market's name (its network's), "thị trường" before a V4 Spoke's or a Morpho market's. */
export const viMarketNoun = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? "thị trường" : "mạng";

/** Vietnamese "mạng Ethereum" for a V3 market, "thị trường Ethereum (V4 Lido)" for a V4 Spoke; add "trên" before it. */
export const viMarket = (name: string, kind?: MarketNameKind) => `${viMarketNoun(name, kind)} ${name}`;

/** The text with its first letter upper case, for a phrase that starts a sentence. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
