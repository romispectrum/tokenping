import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Eğitim amaçlı içeriktir, finansal tavsiye değildir. Uyarılar riski azaltır ama likidasyonu önlemez.";

const MONTHS = "Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık";

// "(erişim tarihi: 29 Ekim 2026)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])erişim tarihi:? \d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "u");

// \b knows no Turkish letters, so the lookarounds end the words.
const FREE_WORDS = /(?<!\p{L})(?:ücretsiz|bedava|parasız)\p{L}*/iu;

// Turkish copy that must not appear, on top of the English list. The English list's claims, in Turkish.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /asla likide (?:olmaz|olmazsınız|olmayacaksınız)/iu, reason: "guarantee: 'asla likide olmazsınız'" },
  { pattern: /(?:hiçbir şeyi )?asla kaçırma/iu, reason: "guarantee: 'asla kaçırmazsınız'" },
  { pattern: /gerçek zamanlı/iu, reason: "'gerçek zamanlı' (alerts are checked every 5 minutes)" },
  // "anında" alone (instantly), not "anındaki" (at the moment of).
  {
    pattern: /(?<!\p{L})anında(?!\p{L})|anlık (?:uyarı|bildirim)/iu,
    reason: "'anında' (alerts are checked every 5 minutes)",
  },
  { pattern: /çoklu[- ]?protokol/iu, reason: "'çoklu protokol' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:her zaman |sabit )?(?:%50|%0?,5|0,5(?!\d)|yarı)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  {
    pattern: /USDC (?:başına|için|karşılığında) 30 gün|30 gün(?:lük)? (?:için )?3 USDC/iu,
    reason: "hard-coded alert plan: use <AlertPrice />",
  },
  // The Turkish "free"; "ödeme gerekmez" and "hiçbir ücret ödemezsiniz" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'ücretsiz' must not appear: write 'ödeme gerekmez' or 'hiçbir şey ödemezsiniz'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Kaynaklar",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "erişim tarihi: <d Ay yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
