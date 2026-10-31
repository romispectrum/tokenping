import { BLOG_INDEX_FILE, blogIndexSource } from "./blogIndex";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Writes content/blog/posts.ts (scripts/blogIndex.ts). Run it after adding a post or a translation: `yarn blog-index`.
const main = async () => {
  const file = path.resolve(__dirname, "..", BLOG_INDEX_FILE);
  const text = await blogIndexSource();
  const current = (() => {
    try {
      return readFileSync(file, "utf8");
    } catch {
      return undefined;
    }
  })();
  if (current === text) return console.log(`${BLOG_INDEX_FILE} is up to date`);
  writeFileSync(file, text);
  console.log(`wrote ${BLOG_INDEX_FILE}`);
};

void main();
