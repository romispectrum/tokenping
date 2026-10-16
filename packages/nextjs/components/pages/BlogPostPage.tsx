import { notFound } from "next/navigation";
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
import { blogMdxComponents } from "~~/components/blog/mdxComponents";
import { Breadcrumbs } from "~~/components/seo/Breadcrumbs";
import { JsonLd } from "~~/components/seo/JsonLd";
import { Kicker } from "~~/components/ui/Kicker";
import { cx } from "~~/components/ui/classNames";
import { getPost, getPostByKey, getPosts, getRelatedPosts, isPublished } from "~~/content/blog";
import type { PostMeta } from "~~/content/blog/types";
import { LOCALES, type Locale } from "~~/i18n/locales";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { postKeyForSlug } from "~~/i18n/postSlugs";
import { postPath, routePath } from "~~/i18n/routes";
import { getAlertPlan } from "~~/services/marketing/alertPlan";
import {
  type Crumb,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  needsAbsoluteTitle,
  pageMetadata,
  postOgImage,
} from "~~/utils/seo";

type BlogPostPageProps = {
  locale: Locale;
  /** The post's slug in `locale`. */
  slug: string;
};

/** Every post slug of a language, for its route's generateStaticParams. */
export const blogPostParams = (locale: Locale) => getPosts(locale).map(({ meta }) => ({ slug: meta.slug }));

const postCrumbs = (locale: Locale, meta: PostMeta): Crumb[] => {
  const { home, blog } = BLOG_MESSAGES[locale].crumbs;
  return [
    { name: home, path: routePath(locale, "home") },
    { name: blog, path: routePath(locale, "blog") },
    { name: meta.title },
  ];
};

/** The post's path in each language it is published in, for hreflang: a placeholder translation is left out. */
const publishedAlternates = (locale: Locale, slug: string) => {
  const key = postKeyForSlug(locale, slug);
  if (!key) return { [locale]: postPath(locale, slug) };
  return Object.fromEntries(
    LOCALES.flatMap(other => {
      const post = getPostByKey(key, other);
      return post && (other === locale || isPublished(post)) ? [[other, postPath(other, post.meta.slug)]] : [];
    }),
  );
};

export const blogPostMetadata = (locale: Locale, slug: string) => {
  const post = getPost(slug, locale);
  if (!post) return {};
  const { meta } = post;
  return pageMetadata({
    title: meta.title,
    description: meta.description,
    locale,
    alternates: publishedAlternates(locale, meta.slug),
    absoluteTitle: needsAbsoluteTitle(meta.title),
    type: "article",
    publishedAt: meta.publishedAt,
    modifiedAt: meta.updatedAt,
    ogImage: postOgImage(meta, locale),
    // A placeholder renders for preview but is not indexed (and is left out of /blog, the sitemap and the feed).
    noIndex: !!meta.stub,
  });
};

/**
 * Three areas. The breadcrumb and the header (H1, byline) sit on the lavender wash; the article body is plain, at a
 * reading measure, with no effects; the end area (the product box and related guides) closes the page on a second
 * wash.
 */
export const BlogPostPage = async ({ locale, slug }: BlogPostPageProps) => {
  const post = getPost(slug, locale);
  if (!post) notFound();
  const { meta, Content } = post;
  const crumbs = postCrumbs(locale, meta);
  // Read once for the whole page: the end box and every <AlertPrice /> in the body show the same plan.
  const plan = await getAlertPlan();
  const PostAlertPrice = () => <AlertPriceText plan={plan} locale={locale} />;
  // The article components in the post's language, with the plan already read.
  const components = { ...blogMdxComponents(locale), AlertPrice: PostAlertPrice };

  return (
    <div className="flex-1">
      {/* The breadcrumb is site navigation, so it sits above the <article>, which starts at the post's own header. */}
      <div className="relative isolate">
        <div aria-hidden="true" className={POST_HEADER_WASH_CLASS_NAME} />
        <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pt-6 md:pt-10")}>
          <div className={READING_COLUMN_CLASS_NAME}>
            <Breadcrumbs crumbs={crumbs} locale={locale} />
          </div>
        </div>
        <article>
          <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pb-4 md:pb-6")}>
            <header className={cx(READING_COLUMN_CLASS_NAME, "pt-6 md:pt-10")}>
              <Kicker>{BLOG_MESSAGES[locale].post.kicker}</Kicker>
              <h1 className="text-section mb-0 max-w-[20ch]">{meta.h1}</h1>
              <div className="mt-5">
                <PostByline meta={meta} locale={locale} />
              </div>
            </header>
          </div>
          <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pb-12 md:pb-20")}>
            <div className={cx(READING_COLUMN_CLASS_NAME, ARTICLE_BODY_CLASS_NAME)}>
              <Content components={components} />
            </div>
          </div>
        </article>
      </div>
      <div className={END_WASH_CLASS_NAME}>
        <div className={cx(BLOG_CONTAINER_CLASS_NAME, "pt-4 pb-12 md:pb-20")}>
          <AlertEndBox plan={plan} locale={locale} />
          <RelatedPosts posts={getRelatedPosts(meta.slug, locale)} locale={locale} />
        </div>
      </div>
      <JsonLd data={blogPostingJsonLd(meta, locale)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  );
};
