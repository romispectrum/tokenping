import type { MDXComponents } from "mdx/types";
import { AlertPrice } from "~~/components/blog/AlertPrice";
import { Callout } from "~~/components/blog/Callout";
import { LiquidationCalculator } from "~~/components/blog/LiquidationCalculator";
import { MDX_ELEMENTS } from "~~/components/blog/MdxElements";
import { ScopeNote } from "~~/components/blog/ScopeNote";
import { ShortAnswer } from "~~/components/blog/ShortAnswer";
import type { MdxVocabularyName } from "~~/components/blog/vocabulary";

/** The JSX components an article may use; `satisfies` keeps this in step with MDX_VOCABULARY_NAMES. */
export const MDX_VOCABULARY = {
  ShortAnswer,
  ScopeNote,
  Callout,
  AlertPrice,
  LiquidationCalculator,
} satisfies Record<MdxVocabularyName, unknown>;

export const BLOG_MDX_COMPONENTS: MDXComponents = { ...MDX_ELEMENTS, ...MDX_VOCABULARY };
