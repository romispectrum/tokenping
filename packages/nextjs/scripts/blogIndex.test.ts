import { blogIndexFiles } from "./blogIndex";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = "content/blog/content";

it("content/blog/posts.ts and content/blog/content/*.ts match the post files and i18n/postSlugs.ts (run `yarn blog-index`)", async () => {
  const files = await blogIndexFiles();
  const stale = Object.entries(files)
    .filter(([file, text]) => {
      const onDisk = path.join(PACKAGE_ROOT, file);
      return !existsSync(onDisk) || readFileSync(onDisk, "utf8") !== text;
    })
    .map(([file]) => file);
  expect(stale).toEqual([]);
  // No body module is left over for a language that is gone.
  const modules = readdirSync(path.join(PACKAGE_ROOT, CONTENT_DIR)).map(name => `${CONTENT_DIR}/${name}`);
  expect(modules.sort()).toEqual(
    Object.keys(files)
      .filter(file => file.startsWith(`${CONTENT_DIR}/`))
      .sort(),
  );
}, 60_000);
