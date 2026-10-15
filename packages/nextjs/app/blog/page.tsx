import type { NextPage } from "next";
import { RssIcon } from "@heroicons/react/24/outline";
import { BlogPageShell } from "~~/components/blog/BlogPageShell";
import { ARTICLE_LINK_CLASS_NAME } from "~~/components/blog/MdxElements";
import { PostSummary } from "~~/components/blog/PostSummary";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { HUB_SLUG, PUBLISHED_POSTS } from "~~/content/blog";
import { type Crumb, RSS_PATH, breadcrumbJsonLd, pageMetadata } from "~~/utils/seo";

export const metadata = pageMetadata({
  title: "Aave Health Factor & Liquidation Guides",
  description:
    "Guides to the Aave V3 health factor, liquidation thresholds, liquidation prices and alerts, with worked examples and dated, sourced figures.",
  path: "/blog",
  // An index with no articles yet is a thin page: indexable from the first published post on.
  noIndex: PUBLISHED_POSTS.length === 0,
});

const CRUMBS: Crumb[] = [{ name: "Home", path: "/" }, { name: "Blog" }];

const BlogIndex: NextPage = () => {
  const hub = PUBLISHED_POSTS.find(({ meta }) => meta.slug === HUB_SLUG);
  const spokes = PUBLISHED_POSTS.filter(post => post !== hub);

  return (
    <BlogPageShell>
      <Breadcrumbs crumbs={CRUMBS} />
      <header className="mb-8">
        <h1 className="m-0 mb-3 text-3xl sm:text-4xl font-bold leading-tight text-base-content">
          Aave health factor and liquidation guides
        </h1>
        <p className="my-3 leading-relaxed text-base-content/80 dark:text-gray-300">
          How the Aave V3 health factor works, what happens in a liquidation, how to calculate your liquidation price
          and how to get warned before it gets close. Every figure in these guides names its source and the date it was
          checked.
        </p>
        <p className="m-0 text-sm">
          {/* A plain <a>: the feed is a route handler, not a page next/link could prefetch. */}
          <a href={RSS_PATH} className={`inline-flex items-center gap-1.5 ${ARTICLE_LINK_CLASS_NAME}`}>
            <RssIcon className="h-4 w-4" aria-hidden />
            Subscribe with RSS
          </a>
        </p>
      </header>

      {hub && (
        <section aria-label="Start here" className="mb-6">
          <PostSummary meta={hub.meta} featured />
        </section>
      )}

      {spokes.length > 0 && (
        <section aria-labelledby="all-guides">
          <h2 id="all-guides" className="mb-4 text-xl font-bold text-base-content">
            All guides
          </h2>
          <ul className="grid list-none gap-4 p-0">
            {spokes.map(({ meta }) => (
              <li key={meta.slug} className="m-0 p-0">
                <PostSummary meta={meta} as="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {PUBLISHED_POSTS.length === 0 && (
        <p className="my-3 leading-relaxed text-base-content/80 dark:text-gray-300">
          The first guides are being written. Subscribe with RSS to get them when they are published.
        </p>
      )}

      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
    </BlogPageShell>
  );
};

export default BlogIndex;
