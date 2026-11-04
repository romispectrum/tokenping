import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER = "Conținut educațional, nu sfat financiar. Alertele reduc riscul, dar nu împiedică lichidarea.";

const MONTHS = "ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie";

// "(accesat la 29 octombrie 2026)", or "accesată" after a feminine noun: the day, the month in lower case, the year.
const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])accesată? (?:la|pe) \d{1,2} (?:${MONTHS}) \d{4}(?!\d)`, "u");

const FREE_WORDS = /(?<!\p{L})(?:gratuit[ăeiu]?|gratuiți|gratis)(?!\p{L})/iu;

// Romanian copy that must not appear, on top of the English list. The English list's claims, in Romanian.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /niciodată (?:nu )?(?:vei fi |ești |veți fi )?lichidat/iu, reason: "guarantee: 'niciodată lichidat'" },
  { pattern: /nu (?:vei|veți) (?:mai )?rata niciodată/iu, reason: "guarantee: 'nu vei rata niciodată'" },
  { pattern: /în timp real/iu, reason: "'în timp real' (alerts are checked every 5 minutes)" },
  {
    pattern: /(?<!\p{L})instant(?:aneu|anee|anei|ă)?(?!\p{L})/iu,
    reason: "'instant' (alerts are checked every 5 minutes)",
  },
  { pattern: /multi[- ]?protocol/iu, reason: "'multi-protocol' (name the protocols: Aave and Morpho)" },
  // Romanian is written with the comma below (ș ț), never the cedilla forms.
  { pattern: /[şţŞŢ]/u, reason: "cedilla ş/ţ: write the comma-below ș/ț" },
  {
    pattern: /close factor(?:-ul)? (?:este |e )(?:mereu |întotdeauna |fix )?(?:50 ?%|0,5(?!\d)|jumătate)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC(?!\p{L})/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /USDC (?:pe|pentru|la fiecare) 30 de zile/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Romanian "free"; "nu plătești nimic" and "nu necesită plată" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'gratuit' must not appear: write 'nu plătești nimic' or 'nu necesită plată'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Surse",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "accesat la <d lună yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
