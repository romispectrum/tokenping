import type { MetadataRoute } from "next";
import { PUBLISHED_POSTS, getLatestPostDate, getPostLastModified } from "~~/content/blog";
import { absoluteUrl, postPath } from "~~/utils/seo";

// Canonical, indexable, server-rendered 200 URLs only; app/sitemap.test.ts checks every path against its route file.
// Left out: /admin, /debug, /blockexplorer and /api; placeholder posts (and /blog while it lists none); any
// client-rendered page. /aave is listed because its page is a server shell around the wallet island (marketing plan
// §4.7). lastModified is a real content date or absent, never the build time; priority and changeFrequency are left
// out because Google ignores them.
const sitemap = (): MetadataRoute.Sitemap => {
  const latestPostDate = getLatestPostDate();
  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl("/aave") },
    ...(latestPostDate ? [{ url: absoluteUrl("/blog"), lastModified: latestPostDate }] : []),
    ...PUBLISHED_POSTS.map(post => ({
      url: absoluteUrl(postPath(post.meta.slug)),
      lastModified: getPostLastModified(post),
    })),
    { url: absoluteUrl("/privacy") },
  ];
};

export default sitemap;
