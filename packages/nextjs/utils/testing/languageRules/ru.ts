import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Образовательный материал, а не финансовая рекомендация. Оповещения снижают риск, но не предотвращают ликвидацию.";

const MONTHS = "января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря";

// "(дата обращения: 14 октября 2026 г.)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])дата обращения:? \d{1,2} (?:${MONTHS}) \d{4}(?: г\.)?`, "u");

const FREE_WORDS = /(?<!\p{L})(?:бесплатн\p{L}*|даром|безвозмездн\p{L}*)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /никогда не (?:будет |будете )?ликвидирован/iu, reason: "guarantee: never liquidated" },
  { pattern: /в реальном времени/iu, reason: "real time (alerts are checked every 5 minutes)" },
  {
    pattern: /мгновенн\p{L}* (?:оповещени|уведомлени|сообщени)/iu,
    reason: "instant alert (alerts are checked every 5 minutes)",
  },
  { pattern: /мультипротокольн/iu, reason: "multi-protocol (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:всегда |равен |составляет )+(?:50 ?%|0,5(?!\d)|половин)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:за|на) 30 дней/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'бесплатно' must not appear: write 'платить не нужно' or 'без оплаты'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Источники",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "дата обращения: <d месяца yyyy г.>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
