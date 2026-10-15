import { PostSummary } from "~~/components/blog/PostSummary";
import type { Post } from "~~/content/blog/types";

type RelatedPostsProps = {
  posts: readonly Post[];
};

export const RelatedPosts = ({ posts }: RelatedPostsProps) =>
  posts.length === 0 ? null : (
    <nav aria-labelledby="related-guides" className="mt-10">
      <h2 id="related-guides" className="mb-4 text-xl font-bold text-base-content">
        Related guides
      </h2>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
        {posts.map(({ meta }) => (
          <li key={meta.slug} className="m-0 p-0">
            <PostSummary meta={meta} as="h3" />
          </li>
        ))}
      </ul>
    </nav>
  );
