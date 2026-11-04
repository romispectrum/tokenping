import { BlogPostPage, blogPostMetadata, blogPostParams } from "~~/components/pages/BlogPostPage";
import { POST_CONTENT_LOADERS } from "~~/content/blog/content";
import { requireSegmentLocale } from "~~/i18n/localeSegment";

// Unknown slugs are a real 404. The pages are prerendered and re-rendered at most hourly, matching the cache of the
// alert price they show (ALERT_PLAN_REVALIDATE_SECONDS; route config must be a literal).
export const dynamicParams = false;
export const revalidate = 3600;

export const generateStaticParams = ({ params }: { params: { lang: string } }) =>
  blogPostParams(requireSegmentLocale(params.lang));

type PostRouteProps = {
  params: Promise<{ lang: string; slug: string }>;
};

export const generateMetadata = async ({ params }: PostRouteProps) => {
  const { lang, slug } = await params;
  return blogPostMetadata(requireSegmentLocale(lang), slug);
};

const Post = async ({ params }: PostRouteProps) => {
  const { lang, slug } = await params;
  const locale = requireSegmentLocale(lang);
  return BlogPostPage({ locale, slug, content: await POST_CONTENT_LOADERS[locale]() });
};

export default Post;
