import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import type { PostMeta } from "~~/content/blog/types";

// A path string, not a URL object: jsdom test files replace the global URL, which node:fs does not accept.
const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../content/blog");

const slugsIn = (dir: string) =>
  readdirSync(dir)
    .filter(file => file.endsWith(".mdx"))
    .map(file => file.replace(/\.mdx$/, ""));

/** Every English post file's slug, read from content/blog. */
export const POST_SLUGS = slugsIn(BLOG_DIR);

/** Every Czech post file's slug, read from content/blog/cs. */
export const CS_POST_SLUGS = slugsIn(path.join(BLOG_DIR, "cs"));

const mockStubs = (modulePrefix: string, slugs: readonly string[], stubSlugs: readonly string[]) => {
  for (const slug of slugs) {
    vi.doMock(`${modulePrefix}${slug}.mdx`, async importOriginal => {
      const post = await importOriginal<{ meta: PostMeta }>();
      const meta: PostMeta = { ...post.meta };
      if (stubSlugs.includes(slug)) meta.stub = true;
      else delete meta.stub;
      return { ...post, meta };
    });
  }
};

/**
 * Sets each post's `stub` flag, so tests of what is published do not depend on which articles the writers and
 * translators have finished: the given slugs become placeholders and every other post is published. English posts
 * are always set; Czech posts only when `csStubSlugs` is given (Czech slugs; [] publishes every translation, even a
 * placeholder file, which then renders its placeholder text). Call it after vi.resetModules() and before importing
 * ~~/content/blog or a module that uses it. Import those one after another: concurrent dynamic imports of the
 * re-mocked posts can get the previous test's modules.
 */
export const mockPostStubs = (stubSlugs: readonly string[] = [], csStubSlugs?: readonly string[]) => {
  mockStubs("~~/content/blog/", POST_SLUGS, stubSlugs);
  if (csStubSlugs) mockStubs("~~/content/blog/cs/", CS_POST_SLUGS, csStubSlugs);
};
