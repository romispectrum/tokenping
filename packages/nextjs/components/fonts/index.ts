import { CYRILLIC_GREEK_FONT_CLASSES } from "~~/components/fonts/cyrillicGreek";
import { VIETNAMESE_FONT_CLASSES } from "~~/components/fonts/vietnamese";
import type { Locale } from "~~/i18n/locales";

/**
 * The web font a language adds to <html> when Satoshi lacks its letters. Every prefixed language shares one root
 * layout (app/(intl)/[lang]/layout.tsx), so each face listed here is declared on all of its pages (a few @font-face
 * rules in the inlined CSS) but downloaded only where styles/globals.css uses it (html:lang(...)); none is preloaded,
 * since a preload would reach every language. Thai (components/fonts/thai.ts) joins when it is in LOCALES.
 */
const LOCALE_FONT_CLASSES: Partial<Record<Locale, string>> = {
  vi: VIETNAMESE_FONT_CLASSES,
  ru: CYRILLIC_GREEK_FONT_CLASSES,
  uk: CYRILLIC_GREEK_FONT_CLASSES,
  bg: CYRILLIC_GREEK_FONT_CLASSES,
  el: CYRILLIC_GREEK_FONT_CLASSES,
};

/** The classes a language's <html> gets for its own font, or undefined when Satoshi covers its script. */
export const localeFontClasses = (locale: Locale) => LOCALE_FONT_CLASSES[locale];
