import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

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
      devIndicators: false,
      typescript: { ignoreBuildErrors: false },
      eslint: { ignoreDuringBuilds: false, dirs: LINT_DIRS },
      webpack: expect.any(Function),
      // One root layout per language needs app/global-not-found.tsx for URLs that match no route.
      experimental: { globalNotFound: true },
    });
    expect(Object.keys(config)).toEqual([
      "pageExtensions",
      "reactStrictMode",
      "experimental",
      "devIndicators",
      "typescript",
      "eslint",
      "webpack",
    ]);
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
      "experimental",
      "devIndicators",
      "typescript",
      "eslint",
      "webpack",
      "output",
      "trailingSlash",
      "images",
    ]);
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
