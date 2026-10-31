import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER = "Bildungsinhalt, keine Finanzberatung. Alerts senken das Risiko, verhindern aber keine Liquidation.";

const MONTHS = "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";

// "(abgerufen am 29. Oktober 2026)"
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])abgerufen am \d{1,2}\. (?:${MONTHS}) \d{4}(?!\d)`, "u");

// German copy that must not appear, on top of the English list. The English list's claims, in German word forms.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnie(?:mals)? (?:mehr |wieder )?liquidiert\b/iu, reason: "guarantee: 'nie liquidiert'" },
  { pattern: /\bnie(?:mals)? (?:mehr |wieder )?(?:verpass|übersieh)/iu, reason: "guarantee: 'nie verpassen'" },
  // "Echtzeit" and its compounds ("Echtzeitdaten"), not "rechtzeitig" (in time).
  { pattern: /(?<!\p{L})echtzeit/iu, reason: "'Echtzeit' (alerts are checked every 5 minutes)" },
  {
    pattern: /\bsofortige[nrs]? (?:Alerts?|Benachrichtigung|Warnung|Nachricht)/iu,
    reason: "'sofortige Benachrichtigung' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protokoll/iu, reason: "'Multi-Protokoll' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:ist|beträgt) (?:immer |fest |pauschal )?(?:50 ?%|0,5\b|die Hälfte)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /\bUSDC (?:pro|für|alle|je) 30 Tage/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The German forms of "free"; "kostet nichts", "ohne Gebühr" and "keine Zahlung nötig" are fine.
  {
    pattern: /kostenlos|kostenfrei|gebührenfrei|\bgratis\b|\bumsonst\b/iu,
    reason: "'kostenlos' must not appear: write 'keine Zahlung nötig', 'kostet nichts' or 'ohne Gebühr'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Quellen",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "abgerufen am <d. Monat yyyy>",
  freeWords: /kostenlos|kostenfrei|gebührenfrei|\bgratis\b|\bumsonst\b/iu,
  bannedPatterns: BANNED_PATTERNS,
};
