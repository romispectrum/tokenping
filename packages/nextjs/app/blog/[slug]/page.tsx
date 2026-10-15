import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AlertEndBox } from "~~/components/blog/AlertEndBox";
import { AlertPriceText } from "~~/components/blog/AlertPrice";
import { BlogPageShell } from "~~/components/blog/BlogPageShell";
import { PostByline } from "~~/components/blog/PostByline";
import { RelatedPosts } from "~~/components/blog/RelatedPosts";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
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

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const { meta, Content } = post;
  const crumbs = postCrumbs(meta);
  // Read once for the whole page: the end box and every <AlertPrice /> in the body show the same plan.
  const plan = await getAlertPlan();
  const PostAlertPrice = () => <AlertPriceText plan={plan} />;

  return (
    <BlogPageShell>
      <Breadcrumbs crumbs={crumbs} />
      <article className="rounded-3xl border border-base-300 bg-base-100 p-5 sm:p-8 dark:border-white/10 dark:bg-gray-900/70">
        <header className="mb-2">
          <h1 className="m-0 mb-3 text-3xl sm:text-4xl font-bold leading-tight text-base-content">{meta.h1}</h1>
          <PostByline meta={meta} />
        </header>
        <Content components={{ AlertPrice: PostAlertPrice }} />
      </article>
      <AlertEndBox plan={plan} />
      <RelatedPosts posts={getRelatedPosts(meta.slug)} />
      <JsonLd data={blogPostingJsonLd(meta)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </BlogPageShell>
  );
};

export default BlogPostPage;
