import type { MDXContent } from "mdx/types";

/** The `export const meta` every post declares as the first statement of its .mdx file. */
export type PostMeta = {
  /** Must equal the file name without `.mdx`. */
  slug: string;
  /** The `<title>`, at most 60 characters. */
  title: string;
  /** The meta description, at most 155 characters. */
  description: string;
  /** The visible headline. The MDX body itself must not contain an H1. */
  h1: string;
  /** YYYY-MM-DD, the same day shown in the byline and in the JSON-LD. */
  publishedAt: string;
  /** YYYY-MM-DD; set only when the content really changed after publishing. */
  updatedAt?: string;
  primaryQuestion: string;
  /** Honest estimate at about 230 words per minute. */
  readingMinutes: number;
  /** Marks a placeholder file; the content-lint test reports it as pending until a writer replaces it. */
  stub?: true;
  /** "morpho" for a guide about Morpho: it carries Morpho's scope line, label and end box. Absent for Aave. */
  protocol?: "morpho";
  /**
   * YYYY-MM-DD: the day this post's own on-chain and API figures were read, when it differs from its protocol's date in
   * components/blog/ScopeNote.tsx. Its scope line shows this date instead. Translations copy it.
   */
  figuresAsOf?: string;
};

/** A post as the lists, feeds and metadata see it. Its body is in content/blog/content/<locale>.ts. */
export type Post = {
  meta: PostMeta;
};

/** One language's post bodies, by the post's slug in that language. */
export type PostContent = Readonly<Record<string, MDXContent>>;
