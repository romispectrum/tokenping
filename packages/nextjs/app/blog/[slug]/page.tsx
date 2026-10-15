import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertEndBox } from "~~/components/blog/AlertEndBox";
import { AlertPriceText } from "~~/components/blog/AlertPrice";
import { PostByline } from "~~/components/blog/PostByline";
import { RelatedPosts } from "~~/components/blog/RelatedPosts";
import {
  ARTICLE_BODY_CLASS_NAME,
  BLOG_CONTAINER_CLASS_NAME,
  END_WASH_CLASS_NAME,
  POST_HEADER_WASH_CLASS_NAME,
  READING_COLUMN_CLASS_NAME,
} from "~~/components/blog/blogLayout";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { Kicker } from "~~/components/ui/Kicker";
import { cx } from "~~/components/ui/classNames";
import { POSTS, getPost, getRelatedPosts } from "~~/content/blog";
import type { PostMeta } from "~~/content/blog/types";
import { getAlertPlan } from "~~/services/marketing/alertPlan";
import {
  type Crumb,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  needsAbsoluteTitle,
  pageMetadata,
  postOgImage,
  postPath,
} from "~~/utils/seo";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

// Unknown slugs are a real 404. The pages are prerendered and re-rendered at most hourly, matching the cache of the
// alert price they show (ALERT_PLAN_REVALIDATE_SECONDS; route config must be a literal).
export const dynamicParams = false;
export const revalidate = 3600;

export const generateStaticParams = () => POSTS.map(({ meta }) => ({ slug: meta.slug }));

const postCrumbs = (meta: PostMeta): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
  { name: meta.title },
];

export const generateMetadata = async ({ params }: BlogPostPageProps): Promise<Metadata> => {
  const post = getPost((await params).slug);
  if (!post) return {};
  const { meta } = post;
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    path: postPath(meta.slug),
    absoluteTitle: needsAbsoluteTitle(meta.title),
    type: "article",
    publishedAt: meta.publishedAt,
    modifiedAt: meta.updatedAt,
    ogImage: postOgImage(meta),
    // A placeholder renders for preview but is not indexed (and is left out of /blog, the sitemap and the feed).
    noIndex: !!meta.stub,
  });
};

/**
 * Three areas. The breadcrumb and the header (H1, byline) sit on the lavender wash; the article body is plain, at a
 * reading measure, with no effects; the end area (the product box and related guides) closes the page on a second
 * wash.
 */
const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { meta, Content } = post;
  const crumbs = postCrumbs(meta);
  // Read once for the whole page: the end box and every <AlertPrice /> in the body show the same plan.
  const plan = await getAlertPlan();
  const PostAlertPrice = () => <AlertPriceText plan={plan} />;

  return (
    <div className="flex-1">
      {/* The breadcrumb is site navigation, so it sits above the <article>, which starts at the post's own header. */}
      <div className="relative isolate">
        <div aria-hidden="true" className={POST_HEADER_WASH_CLASS_NAME} />
        <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pt-6 md:pt-10")}>
          <div className={READING_COLUMN_CLASS_NAME}>
            <Breadcrumbs crumbs={crumbs} />
          </div>
        </div>
        <article>
          <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pb-4 md:pb-6")}>
            <header className={cx(READING_COLUMN_CLASS_NAME, "pt-6 md:pt-10")}>
              <Kicker>Aave V3 guide</Kicker>
              <h1 className="text-section mb-0 max-w-[20ch]">{meta.h1}</h1>
              <div className="mt-5">
                <PostByline meta={meta} />
              </div>
            </header>
          </div>
          <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pb-12 md:pb-20")}>
            <div className={cx(READING_COLUMN_CLASS_NAME, ARTICLE_BODY_CLASS_NAME)}>
              <Content components={{ AlertPrice: PostAlertPrice }} />
            </div>
          </div>
        </article>
      </div>
      <div className={END_WASH_CLASS_NAME}>
        <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pt-4 pb-12 md:pb-20")}>
          <AlertEndBox plan={plan} />
          <RelatedPosts posts={getRelatedPosts(meta.slug)} />
        </div>
      </div>
      <JsonLd data={blogPostingJsonLd(meta)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  );
};

export default BlogPostPage;
