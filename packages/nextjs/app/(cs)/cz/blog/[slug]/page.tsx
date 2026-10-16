import { BlogPostPage, blogPostMetadata, blogPostParams } from "~~/components/pages/BlogPostPage";

// Unknown slugs are a real 404. The pages are prerendered and re-rendered at most hourly, matching the cache of the
// alert price they show (ALERT_PLAN_REVALIDATE_SECONDS; route config must be a literal).
export const dynamicParams = false;
export const revalidate = 3600;

export const generateStaticParams = () => blogPostParams("cs");

type PostRouteProps = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: PostRouteProps) => blogPostMetadata("cs", (await params).slug);

const Post = async ({ params }: PostRouteProps) => BlogPostPage({ locale: "cs", slug: (await params).slug });

export default Post;
