import { getPublishedPosts } from "~~/content/blog";
import { buildRssFeed } from "~~/utils/rss";

// Built once at build time; also required for the `yarn ipfs` static export. Placeholder posts are left out.
export const dynamic = "force-static";

export const GET = () =>
  new Response(buildRssFeed(getPublishedPosts("de"), "de"), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
