import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Konten edukasi, bukan nasihat keuangan. Peringatan mengurangi risiko, tetapi tidak mencegah likuidasi.";

const MONTHS = "Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember";

// "(diakses 29 Oktober 2026)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])diakses (?:pada )?\d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "iu");

const FREE_WORDS = /(?<!\p{L})(?:gratis|cuma-cuma|percuma)(?!\p{L})/iu;

// Indonesian copy that must not appear, on top of the English list. The English list's claims, in Indonesian.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /tidak akan pernah (?:ter|di)likuidasi/iu, reason: "guarantee: 'tidak akan pernah terlikuidasi'" },
  {
    pattern: /tidak akan pernah (?:lagi )?(?:melewatkan|ketinggalan)/iu,
    reason: "guarantee: 'tidak akan pernah melewatkan'",
  },
  { pattern: /waktu nyata/iu, reason: "'waktu nyata' (alerts are checked every 5 minutes)" },
  { pattern: /(?<!\p{L})(?:seketika|instan)(?!\p{L})/iu, reason: "'instan' (alerts are checked every 5 minutes)" },
  { pattern: /multi[- ]?protokol/iu, reason: "'multi-protokol' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:selalu |tetap )?(?:adalah |sebesar )?(?:50 ?%|0,5(?!\d)|setengah)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /USDC (?:per|untuk|setiap) 30 hari/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Indonesian "free"; "tanpa biaya", "tidak dipungut biaya" and "tidak perlu membayar" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'gratis' must not appear: write 'tanpa biaya', 'tidak dipungut biaya' or 'tidak perlu membayar'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Sumber",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "diakses <d Bulan yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
