import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";
import type { Post } from "~~/content/blog/types";
import { DEFAULT_LOCALE, LOCALES, type Locale, type Localized } from "~~/i18n/locales";

// A path string, not a URL object: jsdom test files replace the global URL, which node:fs does not accept.
const BLOG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../content/blog");

const slugsIn = (dir: string) =>
  readdirSync(dir)
    .filter(file => file.endsWith(".mdx"))
    .map(file => file.replace(/\.mdx$/, ""));

/** Every English post file's slug, read from content/blog. */
export const POST_SLUGS = slugsIn(BLOG_DIR);

/** Every post file's slug in one translation, read from content/blog/<locale>. */
export const translatedPostSlugs = (locale: Locale) => slugsIn(path.join(BLOG_DIR, locale));

/** Every translation published, placeholders included: `mockPostStubs([], PUBLISH_EVERY_TRANSLATION)`. */
export const PUBLISH_EVERY_TRANSLATION: Partial<Record<Locale, readonly string[]>> = Object.fromEntries(
  LOCALES.filter(locale => locale !== DEFAULT_LOCALE).map(locale => [locale, []]),
);

const withStubs = (posts: readonly Post[], stubSlugs: readonly string[]): Post[] =>
  posts.map(post => {
    const meta = { ...post.meta };
    if (stubSlugs.includes(meta.slug)) meta.stub = true;
    else delete meta.stub;
    return { meta };
  });

/**
 * Sets each post's `stub` flag, so tests of what is published do not depend on which articles the writers and
 * translators have finished: the given slugs become placeholders and every other post is published. English posts
 * are always set; a translation only when `translations` has its language (slugs in that language; [] publishes every
 * translation, even a placeholder file, which then renders its placeholder text). Call it after vi.resetModules() and
 * before importing ~~/content/blog or a module that uses it. Import those one after another: concurrent dynamic
 * imports of the re-mocked posts can get the previous test's modules.
 */
export const mockPostStubs = (
  stubSlugs: readonly string[] = [],
  translations: Partial<Record<Locale, readonly string[]>> = {},
) => {
  vi.doMock("~~/content/blog/posts", async importOriginal => {
    const { POSTS_BY_LOCALE } = await importOriginal<{ POSTS_BY_LOCALE: Localized<readonly Post[]> }>();
    return {
      POSTS_BY_LOCALE: Object.fromEntries(
        LOCALES.map(locale => {
          const stubs = locale === DEFAULT_LOCALE ? stubSlugs : translations[locale];
          return [locale, stubs ? withStubs(POSTS_BY_LOCALE[locale], stubs) : POSTS_BY_LOCALE[locale]];
        }),
      ),
    };
  });
};
