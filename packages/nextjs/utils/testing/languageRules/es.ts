import type { BannedPattern, LanguageRules } from "./types";

const DISCLAIMER =
  "Contenido educativo, no asesoramiento financiero. Las alertas reducen el riesgo, pero no evitan la liquidación.";

const MONTHS = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";

const FETCHED_DATE = new RegExp(String.raw`(?:^|[\s(])consultad[oa] el \d{1,2} de (?:${MONTHS}) de \d{4}(?!\d)`, "i");

// Spanish copy that must not appear, on top of the English list (Spanish posts may quote English text, and product
// names, prices and Aave terms stay English). The English list's claims, in Spanish word forms.
const BANNED_PATTERNS: readonly BannedPattern[] = [
  { pattern: /\bnunca (?:serás|será|serán|te) liquidad/i, reason: "guarantee: 'nunca serás liquidado'" },
  { pattern: /\bnunca te (?:perderás|pierdas)\b/i, reason: "guarantee: 'nunca te perderás'" },
  { pattern: /\ben tiempo real\b/i, reason: "'en tiempo real' (alerts are checked every 5 minutes)" },
  {
    pattern: /\b(?:instantáne\S*|al instante)\b|\b(?:alertas?|avisos?|notificaci\S*|mensajes?) inmediat/i,
    reason: "'instantáneo' (alerts are checked every 5 minutes)",
  },
  { pattern: /\bmulti[- ]?protocolo/i, reason: "'multiprotocolo' (name the protocols: Aave and Morpho)" },
  {
    pattern: /\b(?:close factor|factor de cierre) (?:es|=) (?:siempre |fijo de |un |una )?(?:50 ?%|0\.5\b|la mitad)/i,
    reason: "stale: since v3.3 the close factor is 50% or 100% depending on HF and position size",
    allowQuoted: true,
  },
  {
    pattern: /\bUSDC (?:por|cada|para) 30 días\b/i,
    reason: "hard-coded alert plan: use <AlertPrice />",
  },
  // The Spanish forms of "free"; "sin comisión" and "no cuesta nada" are fine.
  {
    pattern: /\bgratis\b/i,
    reason: "'gratis' must not appear: write 'no cuesta nada', 'sin comisión' or 'no requiere pago'",
  },
  { pattern: /\bgratuit/i, reason: "'gratuito' must not appear: write 'sin comisión' or 'no cuesta nada'" },
];

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Fuentes",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "consultado el <d de mes de yyyy>",
  freeWords: /\bgratis\b|gratuit/i,
  bannedPatterns: BANNED_PATTERNS,
};
