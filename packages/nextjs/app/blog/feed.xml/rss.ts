import type { Post } from "~~/content/blog/types";
import { RSS_PATH, RSS_TITLE, absoluteUrl, postPath, toIsoDateTime } from "~~/utils/seo";

export const RSS_DESCRIPTION = "Guides to the Aave health factor, liquidation risk and alerts.";

const XML_ENTITIES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => XML_ENTITIES[char]);

/** RFC 822 date, as RSS 2.0 requires: "Wed, 14 Oct 2026 00:00:00 GMT". */
const rssDate = (date: string) => new Date(toIsoDateTime(date)).toUTCString();

/**
 * RSS 2.0 for the given posts, newest first (a stable sort, so same-day posts keep their order). lastBuildDate is the
 * newest content date, never the build time.
 */
export const buildRssFeed = (posts: readonly Post[]) => {
  const items = [...posts].sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));
  const lastModified = posts
    .map(({ meta }) => meta.updatedAt ?? meta.publishedAt)
    .sort()
    .at(-1);
  const itemsXml = items
    .map(({ meta }) => {
      const url = absoluteUrl(postPath(meta.slug));
      return [
        "<item>",
        `<title>${escapeXml(meta.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        `<pubDate>${rssDate(meta.publishedAt)}</pubDate>`,
        `<description>${escapeXml(meta.description)}</description>`,
        "</item>",
      ].join("");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(RSS_TITLE)}</title>`,
    `<link>${absoluteUrl("/blog")}</link>`,
    `<description>${escapeXml(RSS_DESCRIPTION)}</description>`,
    "<language>en</language>",
    ...(lastModified ? [`<lastBuildDate>${rssDate(lastModified)}</lastBuildDate>`] : []),
    `<atom:link href="${absoluteUrl(RSS_PATH)}" rel="self" type="application/rss+xml"/>`,
    itemsXml,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
};
