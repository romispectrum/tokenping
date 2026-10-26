import type { ComponentProps } from "react";
import type { MDXComponents } from "mdx/types";
import { AlertPrice } from "~~/components/blog/AlertPrice";
import { Callout } from "~~/components/blog/Callout";
import { LiquidationCalculator } from "~~/components/blog/LiquidationCalculator";
import { MDX_ELEMENTS } from "~~/components/blog/MdxElements";
import { ScopeNote } from "~~/components/blog/ScopeNote";
import { ShortAnswer } from "~~/components/blog/ShortAnswer";
import type { MdxVocabularyName } from "~~/components/blog/vocabulary";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";

/** The JSX components an article may use; `satisfies` keeps this in step with MDX_VOCABULARY_NAMES. */
export const MDX_VOCABULARY = {
  ShortAnswer,
  ScopeNote,
  Callout,
  AlertPrice,
  LiquidationCalculator,
} satisfies Record<MdxVocabularyName, unknown>;

/** The English defaults, which mdx-components.tsx provides to every compiled .mdx module. */
export const BLOG_MDX_COMPONENTS: MDXComponents = { ...MDX_ELEMENTS, ...MDX_VOCABULARY };

/**
 * The article components in a language, for a post's `components` prop. The server components get the locale (and the
 * post's protocol) bound as props (articles never write them); the client ones (the table regions,
 * LiquidationCalculator) read the locale from the LocaleProvider of the root layout.
 */
export const blogMdxComponents = (locale: Locale = DEFAULT_LOCALE, protocol?: "morpho"): MDXComponents => ({
  ...BLOG_MDX_COMPONENTS,
  ShortAnswer: (props: ComponentProps<typeof ShortAnswer>) => <ShortAnswer {...props} locale={locale} />,
  ScopeNote: () => <ScopeNote locale={locale} protocol={protocol} />,
  Callout: (props: ComponentProps<typeof Callout>) => <Callout {...props} locale={locale} />,
  AlertPrice: () => <AlertPrice locale={locale} />,
});
