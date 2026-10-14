import type { NextConfig } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";

// next.config reads env vars at module load, so every case imports a fresh copy.
const loadNextConfig = async (env: Record<string, string | undefined>): Promise<NextConfig> => {
  vi.resetModules();
  for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
  return (await import("~~/next.config")).default;
};

const LINT_DIRS = ["app", "components", "hooks", "services", "utils", "config", "constants", "types"];

describe("next.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds the default config with type checks and lint enabled", async () => {
    const config = await loadNextConfig({
      NEXT_PUBLIC_IGNORE_BUILD_ERROR: undefined,
      NEXT_PUBLIC_IPFS_BUILD: undefined,
    });

    expect(config).toEqual({
      reactStrictMode: true,
      devIndicators: false,
      typescript: { ignoreBuildErrors: false },
      eslint: { ignoreDuringBuilds: false, dirs: LINT_DIRS },
      webpack: expect.any(Function),
    });
    expect(Object.keys(config)).toEqual(["reactStrictMode", "devIndicators", "typescript", "eslint", "webpack"]);
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
      "reactStrictMode",
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
    const existingExternal = { some: "external" };
    const webpackConfig = { resolve: { fallback: { path: false } }, externals: [existingExternal] };

    const result = webpack?.(webpackConfig, {} as Parameters<NonNullable<NextConfig["webpack"]>>[1]);

    expect(result).toBe(webpackConfig);
    expect(webpackConfig.resolve.fallback).toEqual({ fs: false, net: false, tls: false });
    expect(webpackConfig.externals).toEqual([existingExternal, "pino-pretty", "lokijs", "encoding"]);
  });
});
