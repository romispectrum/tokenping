import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER = "Vzdělávací obsah, nikoli finanční poradenství. Upozornění snižují riziko, likvidaci ale nezabrání.";

const MONTHS = "ledna|února|března|dubna|května|června|července|srpna|září|října|listopadu|prosince";

const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])načteno (?:dne )?\d{1,2}\. (?:${MONTHS}) \d{4}(?!\d)`, "i");

// Czech copy that must not appear, on top of the English list (Czech posts may quote English text, and product names,
// prices and Aave terms stay English). The English list's claims, in Czech word forms.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnikdy (?:nebudete|nebude|nebudou) zlikvidován/i, reason: "guarantee: 'nikdy nebudete zlikvidováni'" },
  { pattern: /\bnikdy (?:ne)?zmešk/i, reason: "guarantee: 'nikdy nezmeškáte'" },
  { pattern: /\bv reálném čase\b/i, reason: "'v reálném čase' (alerts are checked every 5 minutes)" },
  {
    pattern: /\bokamžit\S* (?:upozorněn|zpráv|notifikac|varován)/i,
    reason: "'okamžité upozornění' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protokol/i, reason: "'multiprotokolový' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:je|činí) (?:vždy |pevně |fixně |napevno )?(?:50 ?%|0[.,]5\b|polovin)/i,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\d.,])\$?3(?:,0+)? ?USDC\b/i,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  {
    pattern: /\bUSDC (?:za|na|každých) ?30 (?:dní|dnů|dny)(?!\p{L})/iu,
    reason: "hard-coded alert plan: use <AlertPrice />",
  },
  // The Czech forms of "free"; "bez poplatku" is fine.
  {
    pattern: /\bzdarma\b/i,
    reason: "'zdarma' must not appear: write 'nic nestojí', 'bez poplatku' or 'nevyžaduje platbu'",
  },
  { pattern: /\bbezplatn/i, reason: "'bezplatný' must not appear: write 'bez poplatku' or 'nic nestojí'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Zdroje",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "načteno <d. měsíce yyyy>",
  freeWords: /zdarma|bezplatn/i,
  bannedPatterns: BANNED_PATTERNS,
};
