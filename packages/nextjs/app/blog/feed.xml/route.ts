import { buildRssFeed } from "~~/app/blog/feed.xml/rss";
import { PUBLISHED_POSTS } from "~~/content/blog";

// Built once at build time; also required for the `yarn ipfs` static export. Placeholder posts are left out.
export const dynamic = "force-static";

export const GET = () =>
  new Response(buildRssFeed(PUBLISHED_POSTS), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
