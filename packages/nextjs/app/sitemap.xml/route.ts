import { renderSitemapXml, sitemapEntries } from "~~/utils/sitemap";

// The site's sitemap (utils/sitemap.ts), as a route so the XML follows the sitemap schema's element order. Built once
// per deployment.
export const dynamic = "force-static";

export const GET = () =>
  new Response(renderSitemapXml(sitemapEntries()), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
