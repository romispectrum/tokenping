import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Treści edukacyjne, nie porada finansowa. Alerty zmniejszają ryzyko, ale nie zapobiegają likwidacji.";

const MONTHS = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia";

// "(sprawdzono 29 października 2026)": the day, the month in the genitive, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])sprawdzono \d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "iu");

// \b knows no Polish letters, so the lookarounds end the words.
const FREE_WORDS = /(?<!\p{L})(?:darmow\p{L}*|za darmo|bezpłatn\p{L}*|gratis)(?!\p{L})/iu;

// Polish copy that must not appear, on top of the English list. The English list's claims, in Polish.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  {
    pattern: /nigdy nie (?:zostaniesz|zostanie|zostaną) zlikwidowan/iu,
    reason: "guarantee: 'nigdy nie zostaniesz zlikwidowany'",
  },
  { pattern: /nigdy (?:więcej )?nie przegapisz/iu, reason: "guarantee: 'nigdy nie przegapisz'" },
  { pattern: /w czasie rzeczywistym/iu, reason: "'w czasie rzeczywistym' (alerts are checked every 5 minutes)" },
  { pattern: /natychmiastow/iu, reason: "'natychmiastowy' (alerts are checked every 5 minutes)" },
  { pattern: /wieloprotokołow|multi[- ]?protok/iu, reason: "'wieloprotokołowy' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:wynosi|to) (?:zawsze |stałe )?(?:50 ?%|0,5(?!\d)|połow)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\d.,\s])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /USDC (?:za|na) 30 dni/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Polish "free"; "bez opłat", "nic nie kosztuje" and "nie wymaga płatności" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'darmowy' must not appear: write 'bez opłat', 'nic nie kosztuje' or 'nie wymaga płatności'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Źródła",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "sprawdzono <d miesiąca yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
