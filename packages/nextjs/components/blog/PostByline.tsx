import { formatPostDate } from "~~/components/blog/formatPostDate";
import type { PostMeta } from "~~/content/blog/types";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { toIsoDateTime } from "~~/utils/seo";

type PostBylineProps = {
  meta: PostMeta;
  locale?: Locale;
};

/** Author, dates and reading time. The dateTime values are the exact datePublished / dateModified of the JSON-LD. */
export const PostByline = ({ meta, locale = DEFAULT_LOCALE }: PostBylineProps) => {
  const { byline, readingTime } = BLOG_MESSAGES[locale].post;
  return (
    <p className="m-0 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground tabular-nums">
      <span>{byline.author}</span>
      <span aria-hidden>·</span>
      <span>
        {`${byline.published} `}
        <time dateTime={toIsoDateTime(meta.publishedAt)}>{formatPostDate(meta.publishedAt, locale)}</time>
      </span>
      {meta.updatedAt && (
        <>
          <span aria-hidden>·</span>
          <span>
            {`${byline.updated} `}
            <time dateTime={toIsoDateTime(meta.updatedAt)}>{formatPostDate(meta.updatedAt, locale)}</time>
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>{readingTime(meta.readingMinutes)}</span>
    </p>
  );
};
