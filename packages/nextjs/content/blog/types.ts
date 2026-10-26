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
};

export type Post = {
  meta: PostMeta;
  Content: MDXContent;
};
