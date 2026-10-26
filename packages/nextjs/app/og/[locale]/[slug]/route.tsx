import { notFound } from "next/navigation";
import { blogPostParams } from "~~/components/pages/BlogPostPage";
import { postOgImageResponse } from "~~/components/seo/ogImages";
import { getPost, isAvailable } from "~~/content/blog";
import { LOCALES, isLocale } from "~~/i18n/locales";

// A post's social card, at /og/<locale>/<slug> (utils/seo postOgImage names it). The slug is the post's slug in
// that language.
export const dynamic = "force-static";
export const dynamicParams = false;

export const generateStaticParams = () =>
  LOCALES.flatMap(locale => blogPostParams(locale).map(({ slug }) => ({ locale, slug })));

type PostCardProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const GET = async (_request: Request, { params }: PostCardProps) => {
  const { locale, slug } = await params;
  const post = isLocale(locale) ? getPost(slug, locale) : undefined;
  if (!isLocale(locale) || !post || !isAvailable(post)) notFound();
  return postOgImageResponse(locale, slug);
};
