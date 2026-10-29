import type { Post } from "~~/content/blog/types";
import { DEFAULT_LOCALE, LOCALE_INFO, type Locale, type Localized } from "~~/i18n/locales";
import { SEO_MESSAGES } from "~~/i18n/messages/seo";
import { postPath, routePath } from "~~/i18n/routes";
import { absoluteUrl, toIsoDateTime } from "~~/utils/seo";

const RSS_DESCRIPTIONS: Localized<string> = {
  en: "Guides to the Aave and Morpho health factor, liquidation risk and alerts.",
  cs: "Průvodci health factorem na Aave a Morpho, rizikem likvidace a upozorněními.",
  es: "Guías sobre el factor de salud en Aave y Morpho, el riesgo de liquidación y las alertas.",
  hi: "Aave और Morpho के हेल्थ फ़ैक्टर, लिक्विडेशन के जोखिम और अलर्ट पर गाइड।",
};

const XML_ENTITIES: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => XML_ENTITIES[char]);

/** RFC 822 date, as RSS 2.0 requires: "Wed, 14 Oct 2026 00:00:00 GMT". */
const rssDate = (date: string) => new Date(toIsoDateTime(date)).toUTCString();

/**
 * RSS 2.0 for the given posts, newest first (a stable sort, so same-day posts keep their order). lastBuildDate is the
 * newest content date, never the build time.
 */
export const buildRssFeed = (posts: readonly Post[], locale: Locale = DEFAULT_LOCALE) => {
  const items = [...posts].sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt));
  const lastModified = posts
    .map(({ meta }) => meta.updatedAt ?? meta.publishedAt)
    .sort()
    .at(-1);
  const itemsXml = items
    .map(({ meta }) => {
      const url = absoluteUrl(postPath(locale, meta.slug));
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
    `<title>${escapeXml(SEO_MESSAGES[locale].rssTitle)}</title>`,
    `<link>${absoluteUrl(routePath(locale, "blog"))}</link>`,
    `<description>${escapeXml(RSS_DESCRIPTIONS[locale])}</description>`,
    `<language>${LOCALE_INFO[locale].htmlLang}</language>`,
    ...(lastModified ? [`<lastBuildDate>${rssDate(lastModified)}</lastBuildDate>`] : []),
    `<atom:link href="${absoluteUrl(routePath(locale, "blogFeed"))}" rel="self" type="application/rss+xml"/>`,
    itemsXml,
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
};
