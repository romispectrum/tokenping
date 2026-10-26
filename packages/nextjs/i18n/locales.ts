// The site's languages. English is served at the root, Czech under /cz and Spanish under /es (see i18n/routes.ts).

export const LOCALES = ["en", "cs", "es"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

type LocaleInfo = {
  /** The <html lang> and hreflang value. */
  htmlLang: string;
  /** og:locale. */
  ogLocale: string;
  /** The tag for Intl formatters (dates, plural rules). */
  intl: string;
  /** The language's own name, for the switcher's accessible label. */
  name: string;
  /** The short label the switcher shows. */
  short: string;
};

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { htmlLang: "en", ogLocale: "en_US", intl: "en-US", name: "English", short: "EN" },
  cs: { htmlLang: "cs", ogLocale: "cs_CZ", intl: "cs-CZ", name: "Čeština", short: "CZ" },
  // Neutral Spanish for Spain and Latin America: hreflang "es" covers every Spanish-speaking country. Intl formats as
  // Latin American Spanish ("14 de octubre de 2026", decimal point), the way most of its readers write numbers.
  es: { htmlLang: "es", ogLocale: "es_ES", intl: "es-419", name: "Español", short: "ES" },
};

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** One value per language, so a missing translation is a type error. */
export type Localized<T> = Record<Locale, T>;
