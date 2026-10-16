/** Names of the JSX components articles may use (registered in mdxComponents.ts, enforced by content.test.ts). */
export const MDX_VOCABULARY_NAMES = [
  "ShortAnswer",
  "ScopeNote",
  "Callout",
  "AlertPrice",
  "LiquidationCalculator",
] as const;

export type MdxVocabularyName = (typeof MDX_VOCABULARY_NAMES)[number];

/** Components written self-closing, without children. */
export const CHILDLESS_COMPONENTS: readonly MdxVocabularyName[] = ["ScopeNote", "AlertPrice", "LiquidationCalculator"];

/** Components that belong to a single post, by its key (the English slug): the post and its translations. */
export const SINGLE_POST_COMPONENTS: Partial<Record<MdxVocabularyName, string>> = {
  LiquidationCalculator: "aave-liquidation-price",
};
