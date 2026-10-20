import createMDX from "@next/mdx";
import type { NextConfig } from "next";

// Set by `yarn vercel:yolo`, so keep the name even though it is build-only and needs no NEXT_PUBLIC_ prefix.
const IGNORE_BUILD_ERRORS = process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true";
const IS_IPFS_BUILD = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

// RFC 8288 Link headers on each homepage, for agents that look for a machine-readable description before parsing the
// HTML: /llms.txt, the language's RSS feed and its privacy page. No api-catalog or service-doc: Tokenping has no public
// API. The paths repeat i18n/routes (this file can't use the ~~ alias), and next.config.test.ts checks they match.
const HOME_LINKS = [
  { source: "/", feed: "/blog/feed.xml", privacy: "/privacy" },
  { source: "/cz", feed: "/cz/blog/feed.xml", privacy: "/cz/ochrana-soukromi" },
];
const homeLinkHeader = ({ feed, privacy }: { feed: string; privacy: string }) =>
  [
    '</llms.txt>; rel="describedby"; type="text/plain"',
    `<${feed}>; rel="alternate"; type="application/rss+xml"`,
    `<${privacy}>; rel="privacy-policy"`,
  ].join(", ");

// Markdown for agents: a public page requested with `Accept: text/markdown` is answered by app/md/[[...path]]/route.ts.
// Only the page patterns of i18n/routes (next.config.test.ts checks them against the sitemap), so feeds, images, the
// API and the developer pages never match, and a request without text/markdown in Accept never sees the rewrite.
// Before the filesystem, so the prerendered page is not served instead.
const MARKDOWN_PAGES = [
  "/",
  "/aave",
  "/blog",
  "/blog/:slug([^./]+)",
  "/privacy",
  "/cz",
  "/cz/aave",
  "/cz/blog",
  "/cz/blog/:slug([^./]+)",
  "/cz/ochrana-soukromi",
];
const ACCEPTS_MARKDOWN = { type: "header", key: "accept", value: ".*text/markdown.*" } as const;
const markdownRewrite = (source: string) => ({
  source,
  has: [ACCEPTS_MARKDOWN],
  destination: source === "/" ? "/md" : `/md${source.replace(/\(.*\)/, "")}`,
});

const nextConfig: NextConfig = {
  // "mdx" is listed so Next applies its vendored React aliases to .mdx modules too: without it the posts import
  // node_modules' react/jsx-dev-runtime and crash in Server Components under `next dev`. Posts live in content/blog,
  // and no .mdx file sits under app/, so this adds no MDX routes.
  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx"],
  reactStrictMode: true,
  // No "X-Powered-By: Next.js" header: it tells scanners the framework and helps nobody.
  poweredByHeader: false,
  // Each language has its own root layout (app/(en), app/(cs)), so a URL that matches no route needs
  // app/global-not-found.tsx, which brings its own <html>.
  experimental: {
    globalNotFound: true,
  },
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: IGNORE_BUILD_ERRORS,
  },
  eslint: {
    ignoreDuringBuilds: IGNORE_BUILD_ERRORS,
    // `next lint` / `next build` only lint app, pages, components, lib and src by default.
    dirs: ["app", "components", "content", "hooks", "services", "utils", "config", "constants", "types", "scripts"],
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  // A static export has no server to send headers or rewrite requests.
  ...(!IS_IPFS_BUILD && {
    // Not on a markdown request: Next keeps a config header over a route's header of the same name, so the markdown
    // route sends these links itself, after the page's canonical.
    headers: async () =>
      HOME_LINKS.map(({ source, ...paths }) => ({
        source,
        missing: [ACCEPTS_MARKDOWN],
        headers: [{ key: "Link", value: homeLinkHeader(paths) }],
      })),
    rewrites: async () => ({ beforeFiles: MARKDOWN_PAGES.map(markdownRewrite), afterFiles: [], fallback: [] }),
  }),
  ...(IS_IPFS_BUILD && {
    output: "export",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
};

// Blog posts are .mdx modules imported from content/blog. Plugins are named as strings so the options stay
// serializable for Turbopack as well as webpack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
