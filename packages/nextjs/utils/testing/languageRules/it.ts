import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Contenuto informativo, non è una consulenza finanziaria. Gli avvisi riducono il rischio, ma non impediscono la liquidazione.";

const MONTHS = "gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre";

// "(consultato il 29 ottobre 2026)", the first of the month as "1º" or "1°"; the participle may agree ("consultati il").
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])consultat[oaie] il \d{1,2}[º°]? (?:${MONTHS}) \d{4}(?!\d)`, "iu");

const FREE_WORDS = /\bgratis\b|gratuit/iu;

// Italian copy that must not appear, on top of the English list. The English list's claims, in Italian.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnon (?:sarai|sarà|saranno) mai liquidat/iu, reason: "guarantee: 'non sarai mai liquidato'" },
  {
    pattern: /\bnon (?:perderai|perdi) mai\b|\bmai più (?:perdere|un avviso perso)/iu,
    reason: "guarantee: 'non perderai mai'",
  },
  { pattern: /\bin tempo reale\b/iu, reason: "'in tempo reale' (alerts are checked every 5 minutes)" },
  {
    pattern: /\bistantane|\b(?:avvisi|avviso|notifiche|notifica|messaggi|messaggio) immediat/iu,
    reason: "'istantaneo' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protocoll/iu, reason: "'multiprotocollo' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:è|vale) (?:sempre |fisso al |del )?(?:50 ?%|0,5\b|la metà)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC\b/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /\bUSDC (?:per|ogni) 30 giorni\b/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Italian "free"; "senza costi", "non costa nulla" and "nessun pagamento richiesto" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'gratis' must not appear: write 'senza costi', 'non costa nulla' or 'nessun pagamento richiesto'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Fonti",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "consultato il <d mese yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
