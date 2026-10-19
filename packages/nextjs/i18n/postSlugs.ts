import type { Locale } from "~~/i18n/locales";

/**
 * Each blog post's slug in every language, keyed by the English slug. Data only (no MDX imports), so the language
 * switcher in the client bundle can map a post URL to its translation. content/blog tests check that every entry has
 * a post file with that slug in each language.
 */
export const POST_SLUGS: Readonly<Record<string, Record<Locale, string>>> = {
  "aave-health-factor": { en: "aave-health-factor", cs: "aave-health-factor-vysvetleni" },
  "safe-aave-health-factor": { en: "safe-aave-health-factor", cs: "bezpecny-health-factor-aave" },
  "how-aave-liquidation-works": { en: "how-aave-liquidation-works", cs: "jak-funguje-likvidace-aave" },
  "aave-liquidation-price": { en: "aave-liquidation-price", cs: "likvidacni-cena-aave" },
  "why-aave-health-factor-dropped": { en: "why-aave-health-factor-dropped", cs: "proc-klesl-health-factor-aave" },
  "aave-health-factor-alert-setup": {
    en: "aave-health-factor-alert-setup",
    cs: "nastaveni-upozorneni-health-factor-aave",
  },
  "aave-liquidation-alert-tools": {
    en: "aave-liquidation-alert-tools",
    cs: "nastroje-pro-upozorneni-na-likvidaci-aave",
  },
  "avoid-aave-liquidation": { en: "avoid-aave-liquidation", cs: "jak-se-vyhnout-likvidaci-aave" },
  "private-aave-liquidation-alerts": {
    en: "private-aave-liquidation-alerts",
    cs: "soukroma-upozorneni-na-likvidaci-aave",
  },
};

/** The English slug (the post's key) for a slug in any language, or undefined. */
export const postKeyForSlug = (locale: Locale, slug: string) =>
  Object.keys(POST_SLUGS).find(key => POST_SLUGS[key][locale] === slug);
