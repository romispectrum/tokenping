import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Utbildningsinnehåll, inte finansiell rådgivning. Larm minskar risken men förhindrar inte likvidation.";

const MONTHS = "januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december";

// "(hämtad 29 oktober 2026)": the day, the month in lower case, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])hämtad (?:den )?\d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:gratis|kostnadsfri\p{L}*|avgiftsfri\p{L}*)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /aldrig (?:bli |blir )?likvider/iu, reason: "guarantee: 'aldrig likvideras'" },
  { pattern: /missa aldrig|aldrig (?:mer )?missa/iu, reason: "guarantee: 'missa aldrig'" },
  { pattern: /realtid/iu, reason: "'realtid' (alerts are checked every 5 minutes)" },
  {
    pattern: /omedelbar[at]? (?:larm|avisering|notis|meddelande)/iu,
    reason: "'omedelbart larm' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protokoll/iu, reason: "'multiprotokoll' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:är |ligger på )(?:alltid |fast )?(?:50 ?%|0,5(?!\d)|hälften)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:per|för|var) 30(?::e)? dag/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'gratis' must not appear: write 'du betalar ingenting' or 'utan betalning'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Källor",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "hämtad <d månad yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
