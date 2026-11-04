import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Undervisningsindhold, ikke økonomisk rådgivning. Alarmer mindsker risikoen, men forhindrer ikke likvidation.";

const MONTHS = "januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december";

// "(hentet 29. oktober 2026)": the day with its full stop, the month in lower case, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])hentet (?:den )?\d{1,2}\. (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:gratis|omkostningsfri\p{L}*|vederlagsfri\p{L}*)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /aldrig (?:at )?blive likvider/iu, reason: "guarantee: never liquidated" },
  { pattern: /gå aldrig glip|aldrig (?:mere )?gå glip/iu, reason: "guarantee: never miss" },
  { pattern: /realtid/iu, reason: "real time (alerts are checked every 5 minutes)" },
  {
    pattern: /øjeblikkelig[et]? (?:alarm|besked|notifikation)/iu,
    reason: "instant alert (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protokol/iu, reason: "multi-protocol (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:er |ligger på )(?:altid |fast )?(?:50 ?%|0,5(?!\d)|halvdelen)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:per|for|hver) 30\. dag|USDC for 30 dage/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'gratis' must not appear: write 'du betaler ikke noget' or 'uden betaling'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Kilder",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "hentet <d. måned yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
