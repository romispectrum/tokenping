import type { Locale } from "~~/i18n/locales";

/**
 * Each blog post's slug in every language, keyed by the English slug. Data only (no MDX imports), so the language
 * switcher in the client bundle can map a post URL to its translation. content/blog tests check that every entry has
 * a post file with that slug in each language.
 */
export const POST_SLUGS: Readonly<Record<string, Record<Locale, string>>> = {
  "aave-health-factor": {
    en: "aave-health-factor",
    cs: "aave-health-factor-vysvetleni",
    es: "factor-de-salud-aave",
    hi: "aave-health-factor-kya-hai",
  },
  "safe-aave-health-factor": {
    en: "safe-aave-health-factor",
    cs: "bezpecny-health-factor-aave",
    es: "factor-de-salud-seguro-aave",
    hi: "aave-surakshit-health-factor",
  },
  "how-aave-liquidation-works": {
    en: "how-aave-liquidation-works",
    cs: "jak-funguje-likvidace-aave",
    es: "como-funciona-la-liquidacion-en-aave",
    hi: "aave-liquidation-kaise-hoti-hai",
  },
  "aave-liquidation-price": {
    en: "aave-liquidation-price",
    cs: "likvidacni-cena-aave",
    es: "precio-de-liquidacion-aave",
    hi: "aave-liquidation-price-kaise-nikalein",
  },
  "why-aave-health-factor-dropped": {
    en: "why-aave-health-factor-dropped",
    cs: "proc-klesl-health-factor-aave",
    es: "por-que-bajo-el-factor-de-salud-aave",
    hi: "aave-health-factor-kyon-gira",
  },
  "aave-health-factor-alert-setup": {
    en: "aave-health-factor-alert-setup",
    cs: "nastaveni-upozorneni-health-factor-aave",
    es: "configurar-alertas-factor-de-salud-aave",
    hi: "aave-health-factor-alert-kaise-lagayen",
  },
  "aave-liquidation-alert-tools": {
    en: "aave-liquidation-alert-tools",
    cs: "nastroje-pro-upozorneni-na-likvidaci-aave",
    es: "herramientas-de-alertas-de-liquidacion-aave",
    hi: "aave-liquidation-alert-tools-tulna",
  },
  "avoid-aave-liquidation": {
    en: "avoid-aave-liquidation",
    cs: "jak-se-vyhnout-likvidaci-aave",
    es: "como-evitar-la-liquidacion-en-aave",
    hi: "aave-liquidation-se-kaise-bachein",
  },
  "private-aave-liquidation-alerts": {
    en: "private-aave-liquidation-alerts",
    cs: "soukroma-upozorneni-na-likvidaci-aave",
    es: "alertas-aave-y-privacidad",
    hi: "aave-alert-aur-privacy",
  },
  "crypto-backed-loans": {
    en: "crypto-backed-loans",
    cs: "pujcky-zajistene-kryptomenami",
    es: "prestamos-respaldados-por-cripto",
    hi: "crypto-backed-loan-kya-hai",
  },
  "short-fiat-with-aave": {
    en: "short-fiat-with-aave",
    cs: "short-fiatu-pujckou-na-aave",
    es: "short-de-moneda-fiat-con-aave",
    hi: "aave-se-fiat-short-kaise-karein",
  },
  "aave-interest-rates": {
    en: "aave-interest-rates",
    cs: "urokove-sazby-aave",
    es: "tasas-de-interes-aave",
    hi: "aave-interest-rate-kaise-tay-hoti-hai",
  },
  "aave-alerts-do-not-disturb": {
    en: "aave-alerts-do-not-disturb",
    cs: "upozorneni-aave-rezim-nerusit",
    es: "alertas-aave-modo-no-molestar",
    hi: "aave-alert-do-not-disturb-mein",
  },
  "aave-market-wind-down": {
    en: "aave-market-wind-down",
    cs: "ukonceni-trhu-aave",
    es: "cierre-de-mercados-aave",
    hi: "aave-market-band-hone-par",
  },
  "morpho-health-factor": {
    en: "morpho-health-factor",
    cs: "morpho-health-factor-vysvetleni",
    es: "factor-de-salud-morpho",
    hi: "morpho-health-factor-kya-hai",
  },
  "how-morpho-liquidation-works": {
    en: "how-morpho-liquidation-works",
    cs: "jak-funguje-likvidace-morpho",
    es: "como-funciona-la-liquidacion-en-morpho",
    hi: "morpho-liquidation-kaise-hoti-hai",
  },
  "morpho-pre-liquidation": {
    en: "morpho-pre-liquidation",
    cs: "predbezna-likvidace-morpho",
    es: "preliquidacion-morpho",
    hi: "morpho-pre-liquidation-kya-hai",
  },
  "aave-e-mode": { en: "aave-e-mode", cs: "aave-e-mode-vysvetleni", es: "e-mode-de-aave", hi: "aave-e-mode-kya-hai" },
  "stablecoin-depeg-aave": {
    en: "stablecoin-depeg-aave",
    cs: "depeg-stablecoinu-a-aave",
    es: "depeg-de-stablecoin-y-aave",
    hi: "stablecoin-depeg-aur-aave",
  },
  "why-aave-withdraw-or-borrow-fails": {
    en: "why-aave-withdraw-or-borrow-fails",
    cs: "proc-nejde-vybrat-nebo-pujcit-na-aave",
    es: "por-que-falla-retirar-o-pedir-prestado-en-aave",
    hi: "aave-par-withdraw-ya-borrow-kyon-fail-hota-hai",
  },
  "wrapped-bitcoin-aave-collateral": {
    en: "wrapped-bitcoin-aave-collateral",
    cs: "wrapped-bitcoin-jako-kolateral-na-aave",
    es: "bitcoin-envuelto-como-colateral-en-aave",
    hi: "wrapped-bitcoin-aave-collateral",
  },
  "morpho-midnight-fixed-rate-loans": {
    en: "morpho-midnight-fixed-rate-loans",
    cs: "morpho-midnight-pujcky-s-pevnou-sazbou",
    es: "morpho-midnight-prestamos-a-tasa-fija",
    hi: "morpho-midnight-fixed-rate-loan",
  },
};

/** The English slug (the post's key) for a slug in any language, or undefined. */
export const postKeyForSlug = (locale: Locale, slug: string) =>
  Object.keys(POST_SLUGS).find(key => POST_SLUGS[key][locale] === slug);
