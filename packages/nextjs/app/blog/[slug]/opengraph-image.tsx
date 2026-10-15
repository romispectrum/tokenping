import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, OgCard, ogImageOptions } from "~~/components/seo/OgCard";
import { POSTS, getPost } from "~~/content/blog";
import { SITE_NAME } from "~~/utils/seo";

// No `alt` export: it would be one string for every post. The page metadata sets the image with a per-post alt
// (utils/seo postOgImage).
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const dynamicParams = false;

export const generateStaticParams = () => POSTS.map(({ meta }) => ({ slug: meta.slug }));

type PostOpenGraphImageProps = {
  params: Promise<{ slug: string }>;
};

const PostOpenGraphImage = async ({ params }: PostOpenGraphImageProps) => {
  const post = getPost((await params).slug);
  return new ImageResponse(
    <OgCard title={post?.meta.title ?? `${SITE_NAME} blog`} footer={`${SITE_NAME} · Aave V3 guides`} />,
    await ogImageOptions(),
  );
};

export default PostOpenGraphImage;
