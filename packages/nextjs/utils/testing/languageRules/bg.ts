import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Образователно съдържание, а не финансов съвет. Известията намаляват риска, но не предотвратяват ликвидацията.";

const MONTHS = "януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември";

// "(достъпено на 14 октомври 2026 г.)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])достъпено на:? \d{1,2} (?:${MONTHS}) \d{4}(?: г\.)?`, "u");

const FREE_WORDS = /(?<!\p{L})(?:безплатн\p{L}*|даром)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /никога няма да бъдете ликвидиран/iu, reason: "guarantee: never liquidated" },
  { pattern: /в реално време/iu, reason: "real time (alerts are checked every 5 minutes)" },
  {
    pattern: /мигновен\p{L}* (?:известие|известия|съобщени)/iu,
    reason: "instant alert (alerts are checked every 5 minutes)",
  },
  { pattern: /мултипротоколн/iu, reason: "multi-protocol (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:винаги |е |е равен на )+(?:50 ?%|0,5(?!\d)|половин)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:за|на) 30 дни/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'безплатно' must not appear: write 'не плащате нищо' or 'без плащане'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Източници",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "достъпено на <d месец yyyy г.>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
