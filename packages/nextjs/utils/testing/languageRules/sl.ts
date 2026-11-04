import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Izobraževalna vsebina, ne finančni nasvet. Opozorila zmanjšajo tveganje, a ne preprečijo likvidacije.";

const MONTHS =
  "januar(?:ja)?|februar(?:ja)?|marec|marca|april(?:a)?|maj(?:a)?|junij(?:a)?|julij(?:a)?|avgust(?:a)?|september|septembra|oktober|oktobra|november|novembra|december|decembra";

// "(dostopano 29. oktobra 2026)" or "(dostopano: 29. oktober 2026)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])dostopano:? \d{1,2}\. (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:brezplačn\p{L}*|zastonj|gratis)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /nikoli (?:ne )?(?:boš )?(?:likvidiran|likvidirali)/iu, reason: "guarantee: 'nikoli likvidiran'" },
  { pattern: /nikoli (?:več )?(?:ne )?(?:boš )?(?:zamudil|spregledal)/iu, reason: "guarantee: 'nikoli ne zamudiš'" },
  { pattern: /v realnem času/iu, reason: "'v realnem času' (alerts are checked every 5 minutes)" },
  {
    pattern: /takojšnj[aeiou]+ (?:opozoril|obvestil|sporočil)/iu,
    reason: "'takojšnje opozorilo' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protokol/iu, reason: "'multi-protokol' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:je |znaša )(?:vedno |fiksno )?(?:50 ?%|0,5(?!\d)|polovic)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:za|na|vsakih) 30 dni/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'brezplačno' must not appear: write 'ne plačaš ničesar' or 'brez plačila'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Viri",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "dostopano <d. mesec yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
