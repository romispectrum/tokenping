import type { Locale } from "./locales";

// Each language's URL prefix and its word for the privacy page, in ASCII: the source of every path in i18n/routes.
// English is at the root. Relative imports only: next.config.ts imports this file and cannot use the ~~ alias.
export const LOCALE_PATHS: Record<Locale, { prefix: string; privacy: string }> = {
  en: { prefix: "", privacy: "privacy" },
  cs: { prefix: "/cz", privacy: "ochrana-soukromi" },
  es: { prefix: "/es", privacy: "privacidad" },
  hi: { prefix: "/hi", privacy: "gopaniyata" },
  de: { prefix: "/de", privacy: "datenschutz" },
  vi: { prefix: "/vi", privacy: "quyen-rieng-tu" },
  fr: { prefix: "/fr", privacy: "confidentialite" },
  pt: { prefix: "/pt", privacy: "privacidade" },
  it: { prefix: "/it", privacy: "privacy" },
  pl: { prefix: "/pl", privacy: "prywatnosc" },
  tr: { prefix: "/tr", privacy: "gizlilik" },
  id: { prefix: "/id", privacy: "privasi" },
  nl: { prefix: "/nl", privacy: "privacy" },
  ro: { prefix: "/ro", privacy: "confidentialitate" },
  hu: { prefix: "/hu", privacy: "adatvedelem" },
  hr: { prefix: "/hr", privacy: "privatnost" },
};

/** The page paths of one language, by route: what i18n/routes serves and next.config.ts rewrites and links. */
export const localePagePaths = (locale: Locale) => {
  const { prefix, privacy } = LOCALE_PATHS[locale];
  return {
    home: prefix || "/",
    dashboard: `${prefix}/aave`,
    morpho: `${prefix}/morpho`,
    blog: `${prefix}/blog`,
    blogFeed: `${prefix}/blog/feed.xml`,
    privacy: `${prefix}/${privacy}`,
  };
};
