import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import type { PostMeta } from "~~/content/blog/types";

// A path string, not a URL object: jsdom test files replace the global URL, which node:fs does not accept.
const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../content/blog");

/** Every post file's slug, read from content/blog. */
export const POST_SLUGS = readdirSync(BLOG_DIR)
  .filter(file => file.endsWith(".mdx"))
  .map(file => file.replace(/\.mdx$/, ""));

/**
 * Sets each post's `stub` flag, so tests of what is published do not depend on which articles the writers have
 * finished: the given slugs become placeholders and every other post is published. Call it after vi.resetModules()
 * and before importing ~~/content/blog or a module that uses it. Import those one after another: concurrent dynamic
 * imports of the re-mocked posts can get the previous test's modules.
 */
export const mockPostStubs = (stubSlugs: readonly string[] = []) => {
  for (const slug of POST_SLUGS) {
    vi.doMock(`~~/content/blog/${slug}.mdx`, async importOriginal => {
      const post = await importOriginal<{ meta: PostMeta }>();
      const meta: PostMeta = { ...post.meta };
      if (stubSlugs.includes(slug)) meta.stub = true;
      else delete meta.stub;
      return { ...post, meta };
    });
  }
};
