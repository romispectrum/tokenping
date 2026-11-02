import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Contenu éducatif, pas un conseil financier. Les alertes réduisent le risque, elles n'empêchent pas la liquidation.";

const MONTHS = "janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre";

// "(consulté le 29 octobre 2026)", the first of the month as "1er"; the participle agrees ("données consultées le").
const FETCHED_DATE = new RegExp(
  String.raw`(?:^|[\s(])consulté(?:e|s|es)? le \d{1,2}(?:er)? (?:${MONTHS}) \d{4}(?!\d)`,
  "iu",
);

const FREE_WORDS = /gratuit|\bgratis\b/iu;

// French copy that must not appear, on top of the English list. The English list's claims, in French word forms.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  {
    pattern: /\bjamais (?:être |été )?liquidée?s?\b|\bne (?:serez|sera|seront) jamais liquid/iu,
    reason: "guarantee: 'jamais liquidé'",
  },
  {
    pattern: /\bne (?:manquerez|ratez|raterez) (?:plus )?jamais\b|\bjamais (?:manquer|rater)\b/iu,
    reason: "guarantee: 'ne manquez jamais'",
  },
  { pattern: /\ben temps réel\b/iu, reason: "'en temps réel' (alerts are checked every 5 minutes)" },
  {
    pattern: /\binstantané|\b(?:alertes?|notifications?|messages?) immédiat/iu,
    reason: "'instantané' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protocoles?\b/iu, reason: "'multiprotocole' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:est|vaut) (?:toujours |fixé à |de )?(?:50 ?%|0,5\b|la moitié)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\d.,\s])3(?:,0+)? ?USDC\b/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /\bUSDC (?:par|pour|tous les) 30 jours\b/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The French "free"; "sans frais", "ne coûte rien" and "aucun paiement nécessaire" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'gratuit' must not appear: write 'sans frais', 'ne coûte rien' or 'aucun paiement nécessaire'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Sources",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "consulté le <d mois yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
