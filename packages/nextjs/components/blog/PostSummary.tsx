import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import { cx } from "~~/components/ui/classNames";
import type { PostMeta } from "~~/content/blog/types";
import { DEFAULT_LOCALE } from "~~/i18n/locales";
import { postPath } from "~~/i18n/routes";

type PostSummaryProps = {
  meta: PostMeta;
  /** Heading level of the title inside the surrounding outline. */
  as?: "h2" | "h3";
  featured?: boolean;
};

/**
 * A post as a marketing card that is wholly a link: the title link stretches over the card (one link, one tab stop,
 * named by the title), so the whole card lifts on hover and shows the focus ring. Used by /blog, the related posts
 * and the homepage.
 */
export const PostSummary = ({ meta, as: Heading = "h2", featured = false }: PostSummaryProps) => (
  <article
    className={cx(
      "group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-card",
      // dark has no shadows, so the accent surface is its hover feedback (and the only one under reduced motion)
      "transition-[translate,box-shadow,background-color] duration-200 ease-[ease] hover:shadow-card-hover motion-safe:hover:-translate-y-1 dark:hover:bg-accent",
      "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
      featured ? "md:p-10" : "md:p-7",
    )}
  >
    {/* the card's flex gap already spaces the kicker, so it drops the Kicker margin */}
    {featured && <p className="kicker m-0">Start here</p>}
    <Heading className={cx("m-0 leading-snug", featured ? "text-2xl md:text-3xl" : "text-lg")}>
      <Link
        href={postPath(DEFAULT_LOCALE, meta.slug)}
        className="text-foreground no-underline after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-hidden"
      >
        {meta.title}
      </Link>
    </Heading>
    <p
      className={cx(
        "m-0 text-muted-foreground",
        featured ? "text-lead max-w-[52ch]" : "text-[0.9375rem] leading-relaxed md:text-base",
      )}
    >
      {meta.description}
    </p>
    <p className="m-0 text-sm text-muted-foreground tabular-nums">
      <time dateTime={meta.publishedAt}>{formatPostDate(meta.publishedAt)}</time>
      {` · ${meta.readingMinutes} min read`}
    </p>
    {/* Decoration inside the card link's area: the title already names the destination for screen readers. */}
    <span aria-hidden="true" className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-link">
      Read the guide
      <ArrowRight className="size-4 transition-[translate] duration-200 ease-[ease] motion-safe:group-hover:translate-x-0.5" />
    </span>
  </article>
);
