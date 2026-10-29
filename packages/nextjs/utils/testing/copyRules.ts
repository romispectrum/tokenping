/**
 * The site says what alerts cost and never describes anything by what it does not cost: "free" as a whole word in
 * any case, the Czech "zdarma" and every form of "bezplatný", the Spanish "gratis" and every form of "gratuito", and the
 * Hindi "मुफ़्त", "फ़्री" and "निःशुल्क" (with or without the nukta).
 * The page tests hold rendered text and metadata against it.
 */
export const FREE_WORDS =
  /\bfree\b|zdarma|bezplatn|\bgratis\b|gratuit|मुफ़?्त|फ़?्री(?![\p{L}\p{M}])|निः?शुल्क|नि:शुल्क/iu;
