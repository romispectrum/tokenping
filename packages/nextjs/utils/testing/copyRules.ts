/**
 * The site says what alerts cost and never describes anything by what it does not cost: "free" as a whole word in
 * any case, and the Czech "zdarma" and every form of "bezplatný". The page tests hold rendered text and metadata
 * against it.
 */
export const FREE_WORDS = /\bfree\b|zdarma|bezplatn/i;
