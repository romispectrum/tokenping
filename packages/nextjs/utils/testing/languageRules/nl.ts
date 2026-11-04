import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Educatieve inhoud, geen financieel advies. Alerts verkleinen het risico, maar voorkomen geen liquidatie.";

const MONTHS = "januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december";

// "(geraadpleegd op 29 oktober 2026)": the day, the month in lower case, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])geraadpleegd op \d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:gratis|kosteloos|kostenloos)(?!\p{L})/iu;

// Dutch copy that must not appear, on top of the English list. The English list's claims, in Dutch.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /nooit (?:meer )?geliquideerd/iu, reason: "guarantee: 'nooit geliquideerd'" },
  {
    pattern: /(?:mis|missen) (?:je )?nooit|nooit (?:meer )?(?:missen|mis)(?!\p{L})/iu,
    reason: "guarantee: 'nooit missen'",
  },
  { pattern: /real[- ]?time|in real time/iu, reason: "'realtime' (alerts are checked every 5 minutes)" },
  { pattern: /(?<!\p{L})onmiddellijk(?:e)?(?!\p{L})/iu, reason: "'onmiddellijk' (alerts are checked every 5 minutes)" },
  {
    pattern: /(?<!\p{L})directe? (?:alerts?|melding(?:en)?|waarschuwing(?:en)?)/iu,
    reason: "'directe melding' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protocol/iu, reason: "'multi-protocol' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:is |bedraagt )(?:altijd |vast |steeds )?(?:50 ?%|0,5(?!\d)|de helft)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /USDC (?:per|voor|elke) 30 dagen/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Dutch "free"; "je betaalt niets", "zonder betaling" and "zonder kosten" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'gratis' must not appear: write 'je betaalt niets', 'zonder betaling' or 'zonder kosten'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Bronnen",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "geraadpleegd op <d maand yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
