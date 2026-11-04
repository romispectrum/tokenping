import { LOCALE_INFO, type Locale } from "~~/i18n/locales";

/** The CLDR plural categories a language may use; Intl.PluralRules picks one. */
type PluralForms = {
  /** Only languages with a zero form (none of the site's yet). */
  zero?: string;
  one: string;
  /** Slovenian's dual ("2 omrežji"). */
  two?: string;
  /** Czech 2 to 4 ("2 sítě"), and the Slavic languages' few. */
  few?: string;
  /** Czech fractions ("1,5 sítě"), the Slavic languages' many; Spanish uses it for a million and up. */
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

type ListWords = Record<"conjunction" | "disjunction", string> & {
  /** Between the items before the last: ", " unless the language uses another mark (Chinese and Japanese "、"). */
  separator?: string;
  /** False where the word joins the last item without spaces (Chinese "A、B和C"). */
  spaced?: boolean;
};

// Written out, not Intl.ListFormat: the site never puts a comma before the last item, which Intl does in English.
const LIST_WORDS: Record<Locale, ListWords> = {
  en: { conjunction: "and", disjunction: "or" },
  cs: { conjunction: "a", disjunction: "nebo" },
  es: { conjunction: "y", disjunction: "o" },
  hi: { conjunction: "और", disjunction: "या" },
  de: { conjunction: "und", disjunction: "oder" },
  vi: { conjunction: "và", disjunction: "hoặc" },
  fr: { conjunction: "et", disjunction: "ou" },
  pt: { conjunction: "e", disjunction: "ou" },
  it: { conjunction: "e", disjunction: "o" },
  pl: { conjunction: "i", disjunction: "lub" },
  tr: { conjunction: "ve", disjunction: "veya" },
  id: { conjunction: "dan", disjunction: "atau" },
  nl: { conjunction: "en", disjunction: "of" },
  ro: { conjunction: "și", disjunction: "sau" },
  hu: { conjunction: "és", disjunction: "vagy" },
  hr: { conjunction: "i", disjunction: "ili" },
  sl: { conjunction: "in", disjunction: "ali" },
  sr: { conjunction: "i", disjunction: "ili" },
  sv: { conjunction: "och", disjunction: "eller" },
  da: { conjunction: "og", disjunction: "eller" },
  nb: { conjunction: "og", disjunction: "eller" },
  fil: { conjunction: "at", disjunction: "o" },
  bg: { conjunction: "и", disjunction: "или" },
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
  const { separator = ", ", spaced = true, ...words } = LIST_WORDS[locale];
  const word = locale === "es" ? spanishListWord(words[type], last) : words[type];
  const join = spaced ? ` ${word} ` : word;
  return `${items.slice(0, -1).join(separator)}${join}${last}`;
};

const DECIMAL_MARKS = new Map<Locale, string>();

/** The decimal mark of the language's number format (LOCALE_INFO.numbers): "." or ",". */
const decimalMark = (locale: Locale) => {
  let mark = DECIMAL_MARKS.get(locale);
  if (mark === undefined) {
    const parts = new Intl.NumberFormat(LOCALE_INFO[locale].numbers).formatToParts(1.5);
    mark = parts.find(({ type }) => type === "decimal")?.value ?? ".";
    DECIMAL_MARKS.set(locale, mark);
  }
  return mark;
};

/**
 * A number the user reads in running text, with the language's decimal mark: "1.42" in English, Spanish and Hindi
 * (as Latin America and Indian apps write it and the app shows it), "1,42" in Czech, German and Vietnamese. Takes the
 * already-formatted string (a health factor such as "1.42" or "∞") or a number.
 */
export const formatDecimal = (locale: Locale, value: string | number) =>
  decimalMark(locale) === "," ? String(value).replace(".", ",") : String(value);

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

/** French "sur Arbitrum" for a V3 market, "sur le marché Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const frOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `sur le marché ${name}` : `sur ${name}`;

/** French "pour Arbitrum" for a V3 market, "pour le marché Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const frForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `pour le marché ${name}` : `pour ${name}`;

/** Portuguese "na rede Arbitrum" for a V3 market, "no mercado Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const ptOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `no mercado ${name}` : `na rede ${name}`;

/** Portuguese "para a rede Arbitrum" for a V3 market, "para o mercado Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const ptForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `para o mercado ${name}` : `para a rede ${name}`;

/** Italian "su Arbitrum" for a V3 market, "sul mercato Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
/** Italian "a" before a name, "ad" before one that starts with an a ("Passa a Base", "Passa ad Arbitrum One"). */
export const itTo = (name: string) => `${/^[aàAÀ]/.test(name) ? "ad" : "a"} ${name}`;

export const itOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `sul mercato ${name}` : `su ${name}`;

/** Italian "per Arbitrum" for a V3 market, "per il mercato Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const itForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `per il mercato ${name}` : `per ${name}`;

/** Polish "w sieci Arbitrum" for a V3 market, "na rynku Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const plOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `na rynku ${name}` : `w sieci ${name}`;

/** Polish "dla sieci Arbitrum" for a V3 market, "dla rynku Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const plForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `dla rynku ${name}` : `dla sieci ${name}`;

/**
 * Turkish "Arbitrum ağında" for a V3 market, "Ethereum (V4 Lido) piyasasında" for a V4 Spoke or a Morpho market: the
 * name stands before a noun, so no suffix (and no vowel harmony) touches it.
 */
export const trOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `${name} piyasasında` : `${name} ağında`;

/** Turkish "Arbitrum ağı için" for a V3 market, "Ethereum (V4 Lido) piyasası için" for a V4 Spoke or a Morpho market. */
export const trForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `${name} piyasası için` : `${name} ağı için`;

/** Indonesian "di jaringan Arbitrum" for a V3 market, "di pasar Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const idOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `di pasar ${name}` : `di jaringan ${name}`;

/** Indonesian "untuk jaringan Arbitrum" for a V3 market, "untuk pasar Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const idForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `untuk pasar ${name}` : `untuk jaringan ${name}`;

/** Dutch "op Arbitrum" for a V3 market, "op de markt Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const nlOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `op de markt ${name}` : `op ${name}`;

/** Dutch "voor Arbitrum" for a V3 market, "voor de markt Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const nlForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `voor de markt ${name}` : `voor ${name}`;

/** Romanian "pe Arbitrum" for a V3 market, "pe piața Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const roOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `pe piața ${name}` : `pe ${name}`;

/** Romanian "pentru Arbitrum" for a V3 market, "pentru piața Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const roForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `pentru piața ${name}` : `pentru ${name}`;

// A name that starts with a capital not followed by a small letter is spelled out ("BNB Chain", "LBTC/USDC",
// "X Layer"); these Hungarian letter names start with a vowel sound (ef, el, em, en, er, es, iksz, ipszilon).
const HU_SPELLED_VOWEL = /^[AEFILMNORSUXYÁÉÍÓÖŐÚÜŰ]/u;
const HU_VOWEL = /^[aáeéiíoóöőuúüű]/iu;

/** The Hungarian article before a name: "az" before a vowel sound ("az Arbitrum", "az LBTC/USDC"), "a" otherwise. */
export const huArticle = (name: string) =>
  (/^[A-Z]+(?![a-z])/u.test(name) ? HU_SPELLED_VOWEL : HU_VOWEL).test(name) ? "az" : "a";

/**
 * Hungarian "az Arbitrum hálózaton" for a V3 market, "az Ethereum (V4 Lido) piacon" for a V4 Spoke or a Morpho market:
 * the suffix goes on the noun after the name, so nothing attaches to the name itself.
 */
export const huOnMarket = (name: string, kind?: MarketNameKind) =>
  `${huArticle(name)} ${name} ${marketNameKind(name, kind) === "market" ? "piacon" : "hálózaton"}`;

/** Hungarian "az Arbitrum hálózatra" for a V3 market, "a Base (V4 Coinbase Stocks) piacra" for a V4 Spoke or a Morpho market. */
export const huForMarket = (name: string, kind?: MarketNameKind) =>
  `${huArticle(name)} ${name} ${marketNameKind(name, kind) === "market" ? "piacra" : "hálózatra"}`;

const HR_SR_CHANNEL_GENITIVE: Record<string, string> = {
  Signal: "Signala",
  Telegram: "Telegrama",
  "e-pošta": "e-pošte",
};

/**
 * Croatian and Serbian: the joined channel names ("Signal, Telegram i e-pošta", a fixed set from
 * services/marketing/alertChannels) in the genitive, for after "putem" or "preko": "Signala, Telegrama i e-pošte".
 */
export const hrSrChannelsGenitive = (channels: string) =>
  channels.replace(/Signal|Telegram|e-pošta/g, name => HR_SR_CHANNEL_GENITIVE[name]);

/** Croatian "na mreži Arbitrum" for a V3 market, "na tržištu Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const hrOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `na tržištu ${name}` : `na mreži ${name}`;

/** Croatian "za mrežu Arbitrum" for a V3 market, "za tržište Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const hrForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `za tržište ${name}` : `za mrežu ${name}`;

/** Slovenian "na omrežju Arbitrum" for a V3 market, "na trgu Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const slOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `na trgu ${name}` : `na omrežju ${name}`;

/** Slovenian "za omrežje Arbitrum" for a V3 market, "za trg Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const slForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `za trg ${name}` : `za omrežje ${name}`;

/** Serbian "na mreži Arbitrum" for a V3 market, "na tržištu Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const srOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `na tržištu ${name}` : `na mreži ${name}`;

/** Serbian "za mrežu Arbitrum" for a V3 market, "za tržište Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const srForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `za tržište ${name}` : `za mrežu ${name}`;

/** Swedish "på Arbitrum" for a V3 market, "på marknaden Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const svOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `på marknaden ${name}` : `på ${name}`;

/** Swedish "för Arbitrum" for a V3 market, "för marknaden Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const svForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `för marknaden ${name}` : `för ${name}`;

/** Danish "på Arbitrum" for a V3 market, "på markedet Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const daOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `på markedet ${name}` : `på ${name}`;

/** Danish "for Arbitrum" for a V3 market, "for markedet Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const daForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `for markedet ${name}` : `for ${name}`;

/** Norwegian "på Arbitrum" for a V3 market, "på markedet Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const nbOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `på markedet ${name}` : `på ${name}`;

/** Norwegian "for Arbitrum" for a V3 market, "for markedet Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const nbForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `for markedet ${name}` : `for ${name}`;

/** Filipino "sa Arbitrum" for a V3 market, "sa market na Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const filOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `sa market na ${name}` : `sa ${name}`;

/** Filipino "para sa Arbitrum" for a V3 market, "para sa market na Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const filForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `para sa market na ${name}` : `para sa ${name}`;

/** Bulgarian "в мрежата Arbitrum" for a V3 market, "на пазара Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const bgOnMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `на пазара ${name}` : `в мрежата ${name}`;

/** Bulgarian "за мрежата Arbitrum" for a V3 market, "за пазара Ethereum (V4 Lido)" for a V4 Spoke or a Morpho market. */
export const bgForMarket = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? `за пазара ${name}` : `за мрежата ${name}`;

/** Vietnamese "mạng" before a V3 market's name (its network's), "thị trường" before a V4 Spoke's or a Morpho market's. */
export const viMarketNoun = (name: string, kind?: MarketNameKind) =>
  marketNameKind(name, kind) === "market" ? "thị trường" : "mạng";

/** Vietnamese "mạng Ethereum" for a V3 market, "thị trường Ethereum (V4 Lido)" for a V4 Spoke; add "trên" before it. */
export const viMarket = (name: string, kind?: MarketNameKind) => `${viMarketNoun(name, kind)} ${name}`;

/** The text with its first letter upper case, for a phrase that starts a sentence. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
