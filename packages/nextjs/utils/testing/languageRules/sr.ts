import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Edukativni sadržaj, a ne finansijski savet. Upozorenja smanjuju rizik, ali ne sprečavaju likvidaciju.";

const MONTHS =
  "januar(?:a)?|februar(?:a)?|mart(?:a)?|april(?:a)?|maj(?:a)?|jun(?:a)?|jul(?:a)?|avgust(?:a)?|septemb(?:ar|ra)|oktob(?:ar|ra)|novemb(?:ar|ra)|decemb(?:ar|ra)";

// "(pristupljeno 29. oktobra 2026)": the day, the month (nominative or genitive), the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])pristupljeno \d{1,2}\. (?:${MONTHS}) \d{4}\.?`, "u");

const FREE_WORDS = /(?<!\p{L})(?:besplatn\p{L}*|gratis)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /nikad(?:a)? (?:nećeš biti |ne budeš )?likvidiran/iu, reason: "guarantee: 'nikad likvidiran'" },
  { pattern: /nikad(?:a)? (?:više )?(?:nećeš )?(?:ne )?propust/iu, reason: "guarantee: 'nikad ne propusti'" },
  { pattern: /u realnom vremenu/iu, reason: "'u realnom vremenu' (alerts are checked every 5 minutes)" },
  {
    pattern: /trenutn[aeiou]+ (?:upozorenj|obaveštenj|poruk)/iu,
    reason: "'trenutno upozorenje' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protokol/iu, reason: "'multi-protokol' (name the protocols: Aave and Morpho)" },
  {
    pattern: /close factor (?:je |iznosi )(?:uvek |fiksno )?(?:50 ?%|0,5(?!\d)|polovin)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:za|na|svakih) 30 dana/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'besplatno' must not appear: write 'ne plaćaš ništa' or 'bez plaćanja'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Izvori",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "pristupljeno <d. mesec yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
