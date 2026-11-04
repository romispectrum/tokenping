import { blogIndexFiles } from "./blogIndex";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Writes content/blog/posts.ts and content/blog/content/<locale>.ts (scripts/blogIndex.ts). Run it after adding a
// post or a translation: `yarn blog-index`.
const main = async () => {
  let written = 0;
  for (const [relativePath, text] of Object.entries(await blogIndexFiles())) {
    const file = path.resolve(__dirname, "..", relativePath);
    const current = (() => {
      try {
        return readFileSync(file, "utf8");
      } catch {
        return undefined;
      }
    })();
    if (current === text) continue;
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
    console.log(`wrote ${relativePath}`);
    written++;
  }
  if (!written) console.log("the blog index is up to date");
};

void main();
