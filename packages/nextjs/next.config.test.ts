import type { Rewrite } from "next/dist/lib/load-custom-routes";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { matchHas, prepareDestination } from "next/dist/shared/lib/router/utils/prepare-destination";
import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALES } from "~~/i18n/locales";
import { routePath } from "~~/i18n/routes";
import { acceptsMarkdown } from "~~/utils/markdown";
import { CONTENT_SIGNAL } from "~~/utils/robots";
import { sitemapEntries } from "~~/utils/sitemap";

const ACCEPTS_MARKDOWN = { type: "header", key: "accept", value: ".*text/markdown.*" };

// next.config reads env vars at module load, so every case imports a fresh copy.
const loadNextConfig = async (env: Record<string, string | undefined>): Promise<NextConfig> => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import("~~/next.config")).default;
};

const LINT_DIRS = [
  "app",
  "components",
  "content",
  "hooks",
  "services",
  "utils",
  "config",
  "constants",
  "types",
  "scripts",
];

type WebpackConfig = Parameters<NonNullable<NextConfig["webpack"]>>[0];
type WebpackOptions = Parameters<NonNullable<NextConfig["webpack"]>>[1];
type MdxRule = { test: RegExp; use: [unknown, { loader: string; options: Record<string, unknown> }] };

/** The parts of webpack's config and options that next.config and @next/mdx touch. */
const webpackFixture = () => ({
  config: {
    resolve: { fallback: { path: false }, alias: {} },
    module: { rules: [] as MdxRule[] },
    externals: [{ some: "external" }],
  },
  options: { defaultLoaders: { babel: "babel-loader" } } as unknown as WebpackOptions,
});

describe("next.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the default config with type checks and lint enabled", async () => {
    const config = await loadNextConfig({
      NEXT_PUBLIC_IGNORE_BUILD_ERROR: undefined,
      NEXT_PUBLIC_IPFS_BUILD: undefined,
      TURBOPACK: undefined,
    });

    expect(config).toEqual({
      pageExtensions: ["tsx", "ts", "jsx", "js", "mdx"],
      reactStrictMode: true,
      poweredByHeader: false,
      devIndicators: false,
      typescript: { ignoreBuildErrors: false },
      eslint: { ignoreDuringBuilds: false, dirs: LINT_DIRS },
      webpack: expect.any(Function),
      headers: expect.any(Function),
      rewrites: expect.any(Function),
      // One root layout per language needs app/global-not-found.tsx for URLs that match no route. The CSS goes into
      // each page's <head> instead of render-blocking stylesheet requests.
      experimental: { globalNotFound: true, inlineCss: true },
    });
    expect(Object.keys(config)).toEqual([
      "pageExtensions",
      "reactStrictMode",
      "poweredByHeader",
      "experimental",
      "devIndicators",
      "typescript",
      "eslint",
      "webpack",
      "headers",
      "rewrites",
    ]);
  });

  it("sends a Link header on each homepage pointing at llms.txt and that language's feed and privacy page", async () => {
    const config = await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: undefined });

    const linkRules = (await config.headers!()).filter(({ headers }) => headers.some(({ key }) => key === "Link"));

    expect(linkRules).toEqual(
      LOCALES.map(locale => ({
        source: routePath(locale, "home"),
        missing: [ACCEPTS_MARKDOWN],
        headers: [
          {
            key: "Link",
            value: [
              '</llms.txt>; rel="describedby"; type="text/plain"',
              `<${routePath(locale, "blogFeed")}>; rel="alternate"; type="application/rss+xml"`,
              `<${routePath(locale, "privacy")}>; rel="privacy-policy"`,
            ].join(", "),
          },
        ],
      })),
    );
  });

  describe("security headers", () => {
    const securityRule = async () => {
      const rules = await (await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: undefined })).headers!();
      return rules.find(({ source }) => source === "/:path*");
    };
    const valueOf = (headers: { key: string; value: string }[] | undefined, key: string) =>
      headers?.find(header => header.key === key)?.value;

    it("sends nosniff, a referrer policy and a permissions policy on every path, whatever the request", async () => {
      const rule = await securityRule();

      expect(rule).toBeDefined();
      // No has or missing: a markdown request, a crawler and a browser all get them.
      expect(rule).not.toHaveProperty("has");
      expect(rule).not.toHaveProperty("missing");
      expect(valueOf(rule?.headers, "X-Content-Type-Options")).toBe("nosniff");
      expect(valueOf(rule?.headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(valueOf(rule?.headers, "Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=(), payment=()");
    });

    // The "safe" connector needs the Safe app's iframe; X-Frame-Options could not list its origin.
    it("lets only this site and Safe frame the pages, with frame-ancestors and not X-Frame-Options", async () => {
      const rule = await securityRule();
      const csp = valueOf(rule?.headers, "Content-Security-Policy");

      expect(csp).toBe("frame-ancestors 'self' https://safe.global https://*.safe.global");
      expect(csp).not.toMatch(/'none'| \*(;|$| )/);
      expect(rule?.headers.map(({ key }) => key)).not.toContain("X-Frame-Options");
    });

    // Only a script-src and connect-src policy would need the wallet SDKs' hosts: it is not shipped.
    it("does not set a full Content-Security-Policy that wallet SDKs and Next's inline scripts would break", async () => {
      const csp = valueOf((await securityRule())?.headers, "Content-Security-Policy");

      expect(csp).not.toMatch(/script-src|default-src|connect-src|style-src|frame-src/);
    });

    // The markdown route sends the same header; Next lets this rule override it, so the values must match.
    it("sends robots.txt's Content Signal on every response", async () => {
      expect(valueOf((await securityRule())?.headers, "Content-Signal")).toBe(CONTENT_SIGNAL);
    });

    it("does not share a header name with the homepage Link rules, which Next would let override each other", async () => {
      const rules = await (await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: undefined })).headers!();
      const security = rules.filter(({ source }) => source === "/:path*").flatMap(({ headers }) => headers);
      const others = rules.filter(({ source }) => source !== "/:path*").flatMap(({ headers }) => headers);
      const securityKeys = new Set(security.map(({ key }) => key.toLowerCase()));

      expect(others.length).toBeGreaterThan(0);
      for (const { key } of others) expect(securityKeys.has(key.toLowerCase()), key).toBe(false);
    });
  });

  // Build checks are skipped only when NEXT_PUBLIC_IGNORE_BUILD_ERROR is exactly "true".
  it.each([
    // BUG(B4.7): the documented production deploy sets this, so type and lint errors can ship.
    ["true", true],
    ["TRUE", false],
    ["1", false],
    ["", false],
  ] as const)(
    "NEXT_PUBLIC_IGNORE_BUILD_ERROR=%j sets ignoreBuildErrors and ignoreDuringBuilds to %s",
    async (value, expected) => {
      const config = await loadNextConfig({ NEXT_PUBLIC_IGNORE_BUILD_ERROR: value });

      expect(config.typescript).toEqual({ ignoreBuildErrors: expected });
      expect(config.eslint).toEqual({ ignoreDuringBuilds: expected, dirs: LINT_DIRS });
    },
  );

  it("adds static export settings only when NEXT_PUBLIC_IPFS_BUILD is exactly 'true'", async () => {
    const ipfs = await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: "true" });

    expect(Object.keys(ipfs)).toEqual([
      "pageExtensions",
      "reactStrictMode",
      "poweredByHeader",
      "experimental",
      "devIndicators",
      "typescript",
      "eslint",
      "webpack",
      "output",
      "trailingSlash",
      "images",
    ]);
    expect(ipfs).not.toHaveProperty("headers");
    expect(ipfs).not.toHaveProperty("rewrites");
    expect(ipfs.output).toBe("export");
    expect(ipfs.trailingSlash).toBe(true);
    expect(ipfs.images).toEqual({ unoptimized: true });

    const notIpfs = await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: "1" });

    expect(notIpfs).not.toHaveProperty("output");
    expect(notIpfs).not.toHaveProperty("trailingSlash");
    expect(notIpfs).not.toHaveProperty("images");
  });

  it("stubs node built-ins and externalizes optional logger and storage packages in webpack", async () => {
    const { webpack } = await loadNextConfig({});
    const { config, options } = webpackFixture();
    const [existingExternal] = config.externals;

    const result = webpack?.(config as WebpackConfig, options);

    expect(result).toBe(config);
    expect(config.resolve.fallback).toEqual({ fs: false, net: false, tls: false });
    expect(config.externals).toEqual([existingExternal, "pino-pretty", "lokijs", "encoding"]);
  });

  it("compiles .mdx with remark-gfm and the root mdx-components.tsx as provider", async () => {
    const { webpack } = await loadNextConfig({});
    const { config, options } = webpackFixture();

    webpack?.(config as WebpackConfig, options);

    const [rule] = config.module.rules;
    expect(config.module.rules).toHaveLength(1);
    expect(rule.test).toEqual(/\.mdx$/);
    expect(rule.use[0]).toBe("babel-loader");
    expect(rule.use[1].options).toEqual({
      providerImportSource: "next-mdx-import-source-file",
      remarkPlugins: ["remark-gfm"],
    });
    expect(config.resolve.alias).toMatchObject({
      "next-mdx-import-source-file": expect.arrayContaining(["private-next-root-dir/mdx-components"]),
    });
  });

  // Next applies its vendored React aliases only to files matching pageExtensions (or JS/TS). Without "mdx" there, posts
  // import node_modules' react/jsx-dev-runtime and crash in Server Components under `next dev`.
  it("lists mdx as a page extension so .mdx modules get Next's React aliases", async () => {
    const { pageExtensions } = await loadNextConfig({});

    expect(pageExtensions).toEqual(expect.arrayContaining(["tsx", "ts", "jsx", "js", "mdx"]));
  });

  // The flip side of the mdx page extension: an app/**/page.mdx would become a route, so posts stay in content/blog.
  it("keeps .mdx files out of app/, where they could become routes", () => {
    const appFiles = readdirSync(new URL("./app", import.meta.url), { recursive: true }).map(String);

    expect(appFiles.filter(file => file.endsWith(".mdx"))).toEqual([]);
  });

  // Strings, not imported functions: Turbopack passes loader options across a serialization boundary.
  it("names remark plugins as strings so the options also work under Turbopack", async () => {
    const config = await loadNextConfig({ TURBOPACK: "1" });

    expect(config.turbopack?.rules?.["#next-mdx"]).toMatchObject({
      loaders: [{ options: { remarkPlugins: ["remark-gfm"] } }],
      as: "*.tsx",
    });
  });
});

// Next's own matchers, as its router runs them, so these cases are what `next start` and the build do.
const requestWith = (accept: string | undefined) =>
  ({ headers: accept === undefined ? {} : { accept } }) as unknown as IncomingMessage;

/** The path Next serves for a request: the destination of the first rewrite that matches, or undefined. */
const rewrittenPath = (rules: Rewrite[], path: string, accept: string | undefined) => {
  for (const rule of rules) {
    const params = getPathMatch(rule.source, { strict: true, removeUnnamedParams: true })(path);
    if (!params || !matchHas(requestWith(accept), {}, rule.has, rule.missing)) continue;
    return prepareDestination({ appendParamsToQuery: false, destination: rule.destination, params, query: {} })
      .parsedDestination.pathname;
  }
  return undefined;
};

const MARKDOWN = "text/markdown, text/html;q=0.9, */*;q=0.8";
const BROWSER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8," +
  "application/signed-exchange;v=b3;q=0.7";
/** Every page the sitemap lists, by path. */
const SITEMAP_PATHS = sitemapEntries().map(({ url }) => new URL(url).pathname);

describe("next.config markdown rewrites", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const loadRewrites = async () => {
    const rewrites = await (await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: undefined })).rewrites!();
    if (Array.isArray(rewrites)) throw new Error("expected beforeFiles, afterFiles and fallback");
    const { beforeFiles = [], afterFiles = [], fallback = [] } = rewrites;
    return { beforeFiles, afterFiles, fallback };
  };

  // A page is prerendered, so a rewrite checked after the filesystem would never see it.
  it("rewrites before the filesystem, with nothing after it", async () => {
    const rewrites = await loadRewrites();

    expect(rewrites.afterFiles).toEqual([]);
    expect(rewrites.fallback).toEqual([]);
    for (const rule of rewrites.beforeFiles) {
      expect(rule).toEqual({ source: expect.any(String), has: [ACCEPTS_MARKDOWN], destination: expect.any(String) });
    }
  });

  it("sends a markdown request for every page in the sitemap to the markdown route", async () => {
    const { beforeFiles } = await loadRewrites();

    expect(SITEMAP_PATHS).toEqual(expect.arrayContaining(["/", "/cz", "/aave", "/cz/blog", "/cz/ochrana-soukromi"]));
    for (const path of SITEMAP_PATHS) {
      expect(rewrittenPath(beforeFiles, path, MARKDOWN), path).toBe(path === "/" ? "/md" : `/md${path}`);
    }
  });

  it.each([undefined, BROWSER, "*/*", "text/html", "application/json", "TEXT/HTML"])(
    "leaves every page alone for Accept %j",
    async accept => {
      const { beforeFiles } = await loadRewrites();

      for (const path of SITEMAP_PATHS) expect(rewrittenPath(beforeFiles, path, accept), path).toBeUndefined();
    },
  );

  // An agent may send text/markdown with every request it makes, so only page paths are rewritten.
  it.each([
    "/blog/feed.xml",
    "/cz/blog/feed.xml",
    "/robots.txt",
    "/llms.txt",
    "/sitemap.xml",
    "/indexnow-key.txt",
    "/manifest.json",
    "/favicon.ico",
    "/logo.png",
    "/icon.svg",
    "/apple-icon",
    "/og/en",
    "/og/cs/aave-health-factor-vysvetleni",
    "/api/auth/session",
    "/api/cron/notifications",
    "/_next/static/chunks/main.js",
    "/admin",
    "/debug",
    "/blockexplorer",
    "/aave/extra",
    "/blog/a/b",
    "/md",
    "/md/aave",
  ])("leaves %s alone, also for a markdown request", async path => {
    const { beforeFiles } = await loadRewrites();

    expect(rewrittenPath(beforeFiles, path, MARKDOWN)).toBeUndefined();
  });

  it("rewrites for the same Accept values the markdown route answers", async () => {
    const { beforeFiles } = await loadRewrites();
    const accepts = [MARKDOWN, "text/markdown", "text/html, text/markdown;q=0.5", BROWSER, "*/*", "text/plain", ""];

    for (const accept of accepts) {
      expect(rewrittenPath(beforeFiles, "/aave", accept) !== undefined, accept).toBe(acceptsMarkdown(accept));
    }
  });

  // The markdown route sends the home links itself, after the canonical: Next would keep this header over its own.
  it("sends the home page Link header with the HTML only", async () => {
    const rules = (await (await loadNextConfig({ NEXT_PUBLIC_IPFS_BUILD: undefined })).headers!()).filter(
      ({ headers }) => headers.some(({ key }) => key === "Link"),
    );

    expect(rules).toHaveLength(LOCALES.length);
    for (const { has, missing } of rules) {
      expect(matchHas(requestWith(BROWSER), {}, has, missing)).not.toBe(false);
      expect(matchHas(requestWith(undefined), {}, has, missing)).not.toBe(false);
      expect(matchHas(requestWith(MARKDOWN), {}, has, missing)).toBe(false);
    }
  });
});
