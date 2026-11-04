import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Εκπαιδευτικό περιεχόμενο, όχι χρηματοοικονομική συμβουλή. Οι ειδοποιήσεις μειώνουν τον κίνδυνο, αλλά δεν αποτρέπουν τη ρευστοποίηση.";

const MONTHS =
  "Ιανουαρίου|Φεβρουαρίου|Μαρτίου|Απριλίου|Μαΐου|Ιουνίου|Ιουλίου|Αυγούστου|Σεπτεμβρίου|Οκτωβρίου|Νοεμβρίου|Δεκεμβρίου";

// "(πρόσβαση: 14 Οκτωβρίου 2026)": the day, the month, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])πρόσβαση:? \d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:δωρεάν|χωρίς χρέωση)(?!\p{L})/iu;

// The English list's claims, in this language, on top of the English list.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /δεν θα ρευστοποιηθεί(?:τε)? ποτέ|ποτέ δεν θα ρευστοποιηθ/iu, reason: "guarantee: never liquidated" },
  { pattern: /σε πραγματικό χρόνο/iu, reason: "real time (alerts are checked every 5 minutes)" },
  {
    pattern: /άμεσ\p{L}* (?:ειδοποίηση|ειδοποιήσεις|μήνυμα)/iu,
    reason: "instant alert (alerts are checked every 5 minutes)",
  },
  {
    pattern: /πολλαπλών πρωτοκόλλων|multi[- ]?protocol/iu,
    reason: "multi-protocol (name the protocols: Aave and Morpho)",
  },
  {
    pattern: /close factor (?:είναι |ισούται με )(?:πάντα )?(?:50 ?%|0,5(?!\d)|το μισό)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  { pattern: /USDC (?:για|ανά) 30 ημέρες/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: FREE_WORDS, reason: "'δωρεάν' must not appear: write 'δεν πληρώνετε τίποτα' or 'χωρίς πληρωμή'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Πηγές",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "πρόσβαση: <d Μηνός yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
