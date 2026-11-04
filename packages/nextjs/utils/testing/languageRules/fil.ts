import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Pang-edukasyong nilalaman, hindi payong pinansyal. Binabawasan ng mga alerto ang panganib, pero hindi nito napipigilan ang liquidation.";

const MONTHS = "Enero|Pebrero|Marso|Abril|Mayo|Hunyo|Hulyo|Agosto|Setyembre|Oktubre|Nobyembre|Disyembre";

// "(na-access noong Oktubre 29, 2026)": the month, the day, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])na-access (?:noong )?(?:${MONTHS}) \d{1,2}, \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:libre|gratis)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /hindi (?:ka )?(?:na )?(?:kailanman )?ma-?liquidate/iu, reason: "guarantee: never liquidated" },
  { pattern: /real[- ]?time/iu, reason: "real time (alerts are checked every 5 minutes)" },
  {
    pattern: /agarang (?:alerto|abiso|mensahe)|(?<!\p{L})instant(?!\p{L})/iu,
    reason: "instant alert (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protocol/iu, reason: "multi-protocol (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:ay |ng )?(?:palaging |laging )?(?:50 ?%|0\.5(?!\d)|kalahati)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:kada|bawat|para sa) 30 araw/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:\.0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'libre' must not appear: write 'hindi mo kailangang magbayad'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Mga sanggunian",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "na-access noong <Buwan d, yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
