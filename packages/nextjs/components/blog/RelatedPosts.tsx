import { PostSummary } from "~~/components/blog/PostSummary";
import { SectionHeader } from "~~/components/ui/SectionHeader";
import type { Post } from "~~/content/blog/types";
import { DEFAULT_LOCALE, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";

type RelatedPostsProps = {
  posts: readonly Post[];
  /** The language of the page and of every post given. */
  locale?: Locale;
};

export const RelatedPosts = ({ posts, locale = DEFAULT_LOCALE }: RelatedPostsProps) =>
  posts.length === 0 ? null : (
    <nav aria-labelledby="related-guides" className="mt-16 md:mt-20">
      <SectionHeader id="related-guides" title={BLOG_MESSAGES[locale].post.related} align="start" />
      <ul role="list" className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(({ meta }) => (
          <li key={meta.slug} className="m-0 p-0">
            <PostSummary meta={meta} locale={locale} as="h3" />
          </li>
        ))}
      </ul>
    </nav>
  );
