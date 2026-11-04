import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Conteúdo educativo, não é recomendação financeira. Os alertas reduzem o risco, mas não impedem a liquidação.";

const MONTHS = "janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";

// "(consultado em 29 de outubro de 2026)"; the participle may agree ("dados consultados em").
const FETCHED_DATE = new RegExp(
  String.raw`(?:^|[\s(])consultad[oa]s? em \d{1,2}(?:º)? de (?:${MONTHS}) de \d{4}(?!\d)`,
  "iu",
);

const FREE_WORDS = /grátis|gratuit|\bde graça\b/iu;

// Brazilian Portuguese copy that must not appear, on top of the English list. The English list's claims, in Portuguese.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnunca (?:será|serão|vai ser|vão ser|seja) liquidad/iu, reason: "guarantee: 'nunca será liquidado'" },
  { pattern: /\bnunca (?:mais )?(?:perca|perde|perderá|vai perder)\b/iu, reason: "guarantee: 'nunca perca'" },
  { pattern: /\bem tempo real\b/iu, reason: "'em tempo real' (alerts are checked every 5 minutes)" },
  {
    pattern: /\binstantâne|\b(?:alertas?|avisos?|notificaç\S*|mensagens?) imediat/iu,
    reason: "'instantâneo' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protocolos?\b/iu, reason: "'multiprotocolo' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\bclose factor (?:é|vale) (?:sempre |fixo em |de )?(?:50 ?%|0,5\b|a metade)/iu,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /(?<![\p{L}\d.,])3(?:,0+)? ?USDC\b/iu,
    reason: "hard-coded alert price: use <AlertPrice /> (the owner can change the plan on-chain)",
  },
  { pattern: /\bUSDC (?:por|para|a cada) 30 dias\b/iu, reason: "hard-coded alert plan: use <AlertPrice />" },
  // The Portuguese "free"; "sem taxa", "não custa nada" and "não exige pagamento" are fine.
  {
    pattern: FREE_WORDS,
    reason: "'grátis' must not appear: write 'sem taxa', 'não custa nada' or 'não exige pagamento'",
  },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Fontes",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "consultado em <d de mês de yyyy>",
  freeWords: FREE_WORDS,
  bannedPatterns: BANNED_PATTERNS,
};
