import Link from "next/link";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import type { PostMeta } from "~~/content/blog/types";
import { postPath } from "~~/utils/seo";

type PostSummaryProps = {
  meta: PostMeta;
  /** Heading level of the title inside the surrounding outline. */
  as?: "h2" | "h3";
  featured?: boolean;
};

/** A post as a card: title link, description, date and reading time. Used by /blog and the related-posts list. */
export const PostSummary = ({ meta, as: Heading = "h2", featured = false }: PostSummaryProps) => (
  <article
    className={`card border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/60 ${
      featured ? "border-indigo-300 dark:border-indigo-400/40" : ""
    }`}
  >
    <div className={`card-body gap-2 ${featured ? "p-6 sm:p-8" : "p-5"}`}>
      {featured && (
        <p className="m-0 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
          Start here
        </p>
      )}
      <Heading
        className={`card-title m-0 leading-snug text-base-content ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}
      >
        <Link
          href={postPath(meta.slug)}
          className="link link-hover underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {meta.title}
        </Link>
      </Heading>
      <p className="m-0 text-sm leading-relaxed text-base-content/80 dark:text-gray-300">{meta.description}</p>
      <p className="m-0 text-xs text-base-content/60 dark:text-gray-400">
        <time dateTime={meta.publishedAt}>{formatPostDate(meta.publishedAt)}</time>
        {` · ${meta.readingMinutes} min read`}
      </p>
    </div>
  </article>
);
