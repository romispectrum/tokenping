// The site's languages. English is served at the root; the others under their prefix (i18n/localePaths.ts).

export const LOCALES = [
  "en",
  "cs",
  "es",
  "hi",
  "de",
  "vi",
  "fr",
  "pt",
  "it",
  "pl",
  "tr",
  "id",
  "nl",
  "ro",
  "hu",
  "hr",
  "sl",
  "sr",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

type LocaleInfo = {
  /** The <html lang> and hreflang value. */
  htmlLang: string;
  /** og:locale. */
  ogLocale: string;
  /** The tag for Intl formatters (dates, plural rules). */
  intl: string;
  /** The tag for Intl number formatters: the same as `intl` unless the language groups digits differently from the app. */
  numbers: string;
  /** The language's own name, for the switcher's accessible label. */
  name: string;
  /** Its name in English, for llms.txt and other English text about the languages. */
  englishName: string;
  /** The short label the switcher shows. */
  short: string;
  /**
   * Countries that read the same pages, each with its own hreflang and its own entry in the language menu ("English
   * (UK)", "Deutsch (Österreich)"). They replace the language's single menu entry; the pages and URLs stay one set.
   */
  regions?: readonly { hreflang: string; name: string; short: string }[];
};

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: {
    htmlLang: "en",
    ogLocale: "en_US",
    intl: "en-US",
    numbers: "en-US",
    name: "English",
    englishName: "English",
    short: "EN",
    regions: [
      { hreflang: "en-GB", name: "English (UK)", short: "UK" },
      { hreflang: "en-US", name: "English (US)", short: "US" },
    ],
  },
  cs: {
    htmlLang: "cs",
    ogLocale: "cs_CZ",
    intl: "cs-CZ",
    numbers: "cs-CZ",
    name: "Čeština",
    englishName: "Czech",
    short: "CZ",
  },
  // Neutral Spanish for Spain and Latin America: hreflang "es" covers every Spanish-speaking country. Intl formats as
  // Latin American Spanish ("14 de octubre de 2026", decimal point), the way most of its readers write numbers.
  es: {
    htmlLang: "es",
    ogLocale: "es_ES",
    intl: "es-419",
    numbers: "es-419",
    name: "Español",
    englishName: "Spanish",
    short: "ES",
  },
  // Hindi in Devanagari, hreflang "hi". Dates as hi-IN writes them ("14 अक्टूबर 2026"); numbers with the Western
  // thousands grouping the app shows ("12,000"), not hi-IN's lakh grouping ("12,00,000").
  hi: {
    htmlLang: "hi",
    ogLocale: "hi_IN",
    intl: "hi-IN",
    numbers: "en-US",
    name: "हिन्दी",
    englishName: "Hindi",
    short: "HI",
  },
  // One German for Germany, Austria and Switzerland: hreflang "de", plus each country's own (regions). Decimal comma
  // and dot thousands ("12.000,5").
  de: {
    htmlLang: "de",
    ogLocale: "de_DE",
    intl: "de-DE",
    numbers: "de-DE",
    name: "Deutsch",
    englishName: "German",
    short: "DE",
    regions: [
      { hreflang: "de-DE", name: "Deutsch (Deutschland)", short: "DE" },
      { hreflang: "de-AT", name: "Deutsch (Österreich)", short: "AT" },
      { hreflang: "de-CH", name: "Deutsch (Schweiz)", short: "CH" },
    ],
  },
  // Decimal comma and dot thousands ("12.000,5"), dates "14 tháng 10, 2026".
  vi: {
    htmlLang: "vi",
    ogLocale: "vi_VN",
    intl: "vi-VN",
    numbers: "vi-VN",
    name: "Tiếng Việt",
    englishName: "Vietnamese",
    short: "VI",
  },
  // One French for France, Belgium, Switzerland, Canada and Africa: hreflang "fr". Decimal comma, a space for
  // thousands ("12 000,5"), dates "14 octobre 2026".
  fr: {
    htmlLang: "fr",
    ogLocale: "fr_FR",
    intl: "fr-FR",
    numbers: "fr-FR",
    name: "Français",
    englishName: "French",
    short: "FR",
  },
  // Brazilian Portuguese for every Portuguese reader: hreflang "pt". Decimal comma, dot thousands ("12.000,5"),
  // dates "14 de outubro de 2026".
  pt: {
    htmlLang: "pt",
    ogLocale: "pt_BR",
    intl: "pt-BR",
    numbers: "pt-BR",
    name: "Português",
    englishName: "Portuguese",
    short: "PT",
  },
  // Italian for Italy and Switzerland: hreflang "it". Decimal comma, dot thousands ("12.000,5"), dates "14 ottobre 2026".
  it: {
    htmlLang: "it",
    ogLocale: "it_IT",
    intl: "it-IT",
    numbers: "it-IT",
    name: "Italiano",
    englishName: "Italian",
    short: "IT",
  },
  // Decimal comma, a space for thousands ("12 000,5"), dates "14 października 2026".
  pl: {
    htmlLang: "pl",
    ogLocale: "pl_PL",
    intl: "pl-PL",
    numbers: "pl-PL",
    name: "Polski",
    englishName: "Polish",
    short: "PL",
  },
  // Decimal comma, dot thousands ("12.000,5"), the percent sign first ("%83"), dates "14 Ekim 2026".
  tr: {
    htmlLang: "tr",
    ogLocale: "tr_TR",
    intl: "tr-TR",
    numbers: "tr-TR",
    name: "Türkçe",
    englishName: "Turkish",
    short: "TR",
  },
  // Decimal comma, dot thousands ("12.000,5"), dates "14 Oktober 2026".
  id: {
    htmlLang: "id",
    ogLocale: "id_ID",
    intl: "id-ID",
    numbers: "id-ID",
    name: "Bahasa Indonesia",
    englishName: "Indonesian",
    short: "ID",
  },
  // Decimal comma, dot thousands ("12.000,5"), dates "14 oktober 2026".
  nl: {
    htmlLang: "nl",
    ogLocale: "nl_NL",
    intl: "nl-NL",
    numbers: "nl-NL",
    name: "Nederlands",
    englishName: "Dutch",
    short: "NL",
  },
  // Decimal comma, dot thousands ("12.000,5"), dates "14 octombrie 2026".
  ro: {
    htmlLang: "ro",
    ogLocale: "ro_RO",
    intl: "ro-RO",
    numbers: "ro-RO",
    name: "Română",
    englishName: "Romanian",
    short: "RO",
  },
  // Decimal comma, space thousands ("12 000,5"), dates "2026. október 14.".
  hu: {
    htmlLang: "hu",
    ogLocale: "hu_HU",
    intl: "hu-HU",
    numbers: "hu-HU",
    name: "Magyar",
    englishName: "Hungarian",
    short: "HU",
  },
  // Decimal comma, dot thousands ("12.000,5"), "83 %", dates "14. listopada 2026.".
  hr: {
    htmlLang: "hr",
    ogLocale: "hr_HR",
    intl: "hr-HR",
    numbers: "hr-HR",
    name: "Hrvatski",
    englishName: "Croatian",
    short: "HR",
  },
  // Decimal comma, dot thousands ("12.000,5"), "83 %", dates "14. oktober 2026".
  sl: {
    htmlLang: "sl",
    ogLocale: "sl_SI",
    intl: "sl-SI",
    numbers: "sl-SI",
    name: "Slovenščina",
    englishName: "Slovenian",
    short: "SI",
  },
  // Serbian in the Latin script. Decimal comma, dot thousands ("12.000,5"), dates "14. oktobar 2026.".
  sr: {
    htmlLang: "sr-Latn",
    ogLocale: "sr_RS",
    intl: "sr-Latn-RS",
    numbers: "sr-Latn-RS",
    name: "Srpski",
    englishName: "Serbian",
    short: "RS",
  },
};

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** One value per language, so a missing translation is a type error. */
export type Localized<T> = Record<Locale, T>;
