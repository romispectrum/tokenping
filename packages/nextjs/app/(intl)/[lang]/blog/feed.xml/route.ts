import { getPublishedPosts } from "~~/content/blog";
import { LANG_PARAMS, requireSegmentLocale } from "~~/i18n/localeSegment";
import { buildRssFeed } from "~~/utils/rss";

// Built once at build time; also required for the `yarn ipfs` static export. Placeholder posts are left out. A route
// handler does not inherit the layout's params, so it lists the languages itself.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => LANG_PARAMS;

export const GET = async (_request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const locale = requireSegmentLocale((await params).lang);
  return new Response(buildRssFeed(getPublishedPosts(locale), locale), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
