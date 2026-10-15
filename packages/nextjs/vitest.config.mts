import { compile } from "@mdx-js/mdx";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));

// `server-only` throws unless it is resolved with the "react-server" export condition, which only Next's
// server bundler sets. Tests import server modules directly, so point it at the package's no-op entry.
const SERVER_ONLY_NOOP = path.join(path.dirname(createRequire(import.meta.url).resolve("server-only")), "empty.js");

// Compiles .mdx imports (content/blog posts) the way @next/mdx does in next.config.ts: remark-gfm, and the root
// mdx-components.tsx as the component provider.
const mdx = (): Plugin => ({
  name: "tokenping-mdx",
  enforce: "pre",
  async transform(source, id) {
    if (!id.endsWith(".mdx")) return null;
    const file = await compile(
      { value: source, path: id },
      { remarkPlugins: [remarkGfm], providerImportSource: path.join(PACKAGE_ROOT, "mdx-components.tsx") },
    );
    return { code: String(file), map: null };
  },
});

export default defineConfig({
  // Paths in this file resolve against the package, not process.cwd(), so vitest also works when started elsewhere.
  root: PACKAGE_ROOT,
  plugins: [mdx()],
  resolve: {
    alias: [
      { find: "~~", replacement: PACKAGE_ROOT },
      { find: /^server-only$/, replacement: SERVER_ONLY_NOOP },
    ],
  },
  // tsconfig keeps `jsx: "preserve"` for Next, so component tests need an explicit JSX transform.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    // Server and pure-logic tests run in node. Tests that render with @testing-library/react opt into a DOM per file
    // with a `// @vitest-environment jsdom` docblock on the first line.
    environment: "node",
    setupFiles: [path.join(PACKAGE_ROOT, "utils/testing/setupTests.ts")],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
});
