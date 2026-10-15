import { formatPostDate } from "~~/components/blog/formatPostDate";
import type { PostMeta } from "~~/content/blog/types";
import { toIsoDateTime } from "~~/utils/seo";

type PostBylineProps = {
  meta: PostMeta;
};

/** Author, dates and reading time. The dateTime values are the exact datePublished / dateModified of the JSON-LD. */
export const PostByline = ({ meta }: PostBylineProps) => (
  <p className="m-0 flex flex-wrap gap-x-2 gap-y-1 text-sm text-base-content/70 dark:text-gray-400">
    <span>By the Tokenping team</span>
    <span aria-hidden>·</span>
    <span>
      Published <time dateTime={toIsoDateTime(meta.publishedAt)}>{formatPostDate(meta.publishedAt)}</time>
    </span>
    {meta.updatedAt && (
      <>
        <span aria-hidden>·</span>
        <span>
          Updated <time dateTime={toIsoDateTime(meta.updatedAt)}>{formatPostDate(meta.updatedAt)}</time>
        </span>
      </>
    )}
    <span aria-hidden>·</span>
    <span>{`${meta.readingMinutes} min read`}</span>
  </p>
);
