import { LANGUAGE_RULES } from "~~/utils/testing/languageRules";

/**
 * The site says what alerts cost and never describes anything by what it does not cost: every language's words for
 * "free" (utils/testing/languageRules), in any of the languages. The page tests hold rendered text and metadata
 * against it.
 */
export const FREE_WORDS = new RegExp(
  Object.values(LANGUAGE_RULES)
    .map(({ freeWords }) => freeWords.source)
    .join("|"),
  "iu",
);
