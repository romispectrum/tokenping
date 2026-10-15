import type { MDXComponents } from "mdx/types";
import { BLOG_MDX_COMPONENTS } from "~~/components/blog/mdxComponents";

// @next/mdx resolves this root file as the provider for every compiled .mdx module (App Router requires it).
// Components passed to a post's `components` prop still win over these defaults.
export const useMDXComponents = (components?: MDXComponents): MDXComponents => ({
  ...BLOG_MDX_COMPONENTS,
  ...components,
});
