import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Освітній матеріал, а не фінансова порада. Сповіщення знижують ризик, але не запобігають ліквідації.";

const MONTHS = "січня|лютого|березня|квітня|травня|червня|липня|серпня|вересня|жовтня|листопада|грудня";

// "(дата звернення: 14 жовтня 2026 р.)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])дата звернення:? \d{1,2} (?:${MONTHS}) \d{4}(?: р\.)?`, "u");

const FREE_WORDS = /(?<!\p{L})(?:безкоштовн\p{L}*|задарма|безоплатн\p{L}*)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /ніколи не (?:буде |будете )?ліквідован/iu, reason: "guarantee: never liquidated" },
  { pattern: /в реальному часі/iu, reason: "real time (alerts are checked every 5 minutes)" },
  { pattern: /миттєв\p{L}* (?:сповіщенн|повідомленн)/iu, reason: "instant alert (alerts are checked every 5 minutes)" },
  { pattern: /мультипротокольн/iu, reason: "multi-protocol (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:завжди |дорівнює |становить )+(?:50 ?%|0,5(?!\d)|половин)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:за|на) 30 днів/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'безкоштовно' must not appear: write 'платити не потрібно' or 'без оплати'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Джерела",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "дата звернення: <d місяця yyyy р.>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
