import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));

// `server-only` throws unless it is resolved with the "react-server" export condition, which only Next's
// server bundler sets. Tests import server modules directly, so point it at the package's no-op entry.
const SERVER_ONLY_NOOP = path.join(path.dirname(createRequire(import.meta.url).resolve("server-only")), "empty.js");

export default defineConfig({
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
    environment: "node",
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
});
