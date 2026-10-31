import { BLOG_INDEX_FILE, blogIndexSource } from "./blogIndex";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

it("content/blog/posts.ts lists every post file in the order of i18n/postSlugs.ts (run `yarn blog-index`)", async () => {
  const onDisk = readFileSync(path.resolve(__dirname, "..", BLOG_INDEX_FILE), "utf8");
  expect(onDisk).toBe(await blogIndexSource());
}, 60_000);
