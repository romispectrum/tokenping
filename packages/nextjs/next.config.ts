import type { NextConfig } from "next";

// Set by `yarn vercel:yolo`, so keep the name even though it is build-only and needs no NEXT_PUBLIC_ prefix.
const IGNORE_BUILD_ERRORS = process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true";
const IS_IPFS_BUILD = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: IGNORE_BUILD_ERRORS,
  },
  eslint: {
    ignoreDuringBuilds: IGNORE_BUILD_ERRORS,
    // `next lint` / `next build` only lint app, pages, components, lib and src by default.
    dirs: ["app", "components", "hooks", "services", "utils", "config", "constants", "types"],
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  ...(IS_IPFS_BUILD && {
    output: "export",
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
