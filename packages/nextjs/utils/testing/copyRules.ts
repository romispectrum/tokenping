/**
 * The site says what alerts cost and never describes anything by what it does not cost: "free" as a whole word in
 * any case, the Czech "zdarma" and every form of "bezplatný", and the Spanish "gratis" and every form of "gratuito".
 * The page tests hold rendered text and metadata against it.
 */
export const FREE_WORDS = /\bfree\b|zdarma|bezplatn|\bgratis\b|gratuit/i;
