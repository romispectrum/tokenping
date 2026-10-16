import { describe, expect, it, vi } from "vitest";
import type { Post, PostMeta } from "~~/content/blog/types";
import { buildRssFeed } from "~~/utils/rss";
import { CS_POST_SLUGS, POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

const post = (meta: Partial<PostMeta>): Post => ({
  meta: {
    slug: "a",
    title: "A",
    description: "About A.",
    h1: "A?",
    publishedAt: "2026-10-14",
    primaryQuestion: "A?",
    readingMinutes: 1,
    ...meta,
  },
  Content: () => null,
});

describe("buildRssFeed", () => {
  it("builds an RSS 2.0 channel with a self link and one item per post", () => {
    const xml = buildRssFeed([post({ slug: "first", title: "First", description: "One." })]);

    expect(xml).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "<channel>",
        "<title>Tokenping blog</title>",
        "<link>https://tokenping.xyz/blog</link>",
        "<description>Guides to the Aave health factor, liquidation risk and alerts.</description>",
        "<language>en</language>",
        "<lastBuildDate>Wed, 14 Oct 2026 00:00:00 GMT</lastBuildDate>",
        '<atom:link href="https://tokenping.xyz/blog/feed.xml" rel="self" type="application/rss+xml"/>',
        '<item><title>First</title><link>https://tokenping.xyz/blog/first</link><guid isPermaLink="true">https://tokenping.xyz/blog/first</guid><pubDate>Wed, 14 Oct 2026 00:00:00 GMT</pubDate><description>One.</description></item>',
        "</channel>",
        "</rss>",
        "",
      ].join("\n"),
    );
  });

  it("escapes XML special characters in titles and descriptions", () => {
    const xml = buildRssFeed([post({ title: `Q&A: <"HF"> isn't 1`, description: "a < b & c > d" })]);

    expect(xml).toContain("<title>Q&amp;A: &lt;&quot;HF&quot;&gt; isn&apos;t 1</title>");
    expect(xml).toContain("<description>a &lt; b &amp; c &gt; d</description>");
  });

  it("lists newest first, keeps same-day order, and dates the build by the newest content change", () => {
    const xml = buildRssFeed([
      post({ slug: "old", publishedAt: "2026-10-01", updatedAt: "2026-11-05" }),
      post({ slug: "new-1", publishedAt: "2026-10-14" }),
      post({ slug: "new-2", publishedAt: "2026-10-14" }),
    ]);
    const order = [...xml.matchAll(/<link>https:\/\/tokenping\.xyz\/blog\/([^<]+)<\/link>/g)].map(match => match[1]);

    expect(order).toEqual(["new-1", "new-2", "old"]);
    expect(xml).toContain("<lastBuildDate>Thu, 05 Nov 2026 00:00:00 GMT</lastBuildDate>");
  });
});

describe("GET /blog/feed.xml", () => {
  const loadRoute = async (stubSlugs: readonly string[]) => {
    vi.resetModules();
    mockPostStubs(stubSlugs);
    return import("~~/app/(en)/blog/feed.xml/route");
  };

  it("is static and serves the published posts as application/rss+xml, without placeholders", async () => {
    const { GET, dynamic } = await loadRoute(["safe-aave-health-factor"]);
    const response = GET();

    expect(dynamic).toBe("force-static");
    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    const xml = await response.text();
    expect(xml.match(/<item>/g)).toHaveLength(POST_SLUGS.length - 1);
    expect(xml).toContain("<link>https://tokenping.xyz/blog/aave-health-factor</link>");
    expect(xml).not.toContain("safe-aave-health-factor");
  });

  it("has no items while every post is a placeholder", async () => {
    const { GET } = await loadRoute(POST_SLUGS);
    const xml = await GET().text();

    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("<lastBuildDate>");
  });
});

describe("buildRssFeed in Czech", () => {
  it("builds the Czech channel: Czech title, description and language, /cs links and the Czech self link", () => {
    const xml = buildRssFeed([post({ slug: "prvni", title: "První", description: "Jedna." })], "cs");

    expect(xml).toContain("<title>Tokenping blog (česky)</title>");
    expect(xml).toContain("<link>https://tokenping.xyz/cs/blog</link>");
    expect(xml).toContain(
      "<description>Průvodci health factorem na Aave, rizikem likvidace a upozorněními.</description>",
    );
    expect(xml).toContain("<language>cs</language>");
    expect(xml).toContain(
      '<atom:link href="https://tokenping.xyz/cs/blog/feed.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain(
      '<item><title>První</title><link>https://tokenping.xyz/cs/blog/prvni</link><guid isPermaLink="true">https://tokenping.xyz/cs/blog/prvni</guid><pubDate>Wed, 14 Oct 2026 00:00:00 GMT</pubDate><description>Jedna.</description></item>',
    );
  });
});

describe("GET /cs/blog/feed.xml", () => {
  const loadRoute = async (csStubSlugs: readonly string[]) => {
    vi.resetModules();
    mockPostStubs([], csStubSlugs);
    return import("~~/app/(cs)/cs/blog/feed.xml/route");
  };

  it("is static and serves the published Czech posts at their Czech URLs, without placeholders", async () => {
    const { GET, dynamic } = await loadRoute(["bezpecny-health-factor-aave"]);
    const response = GET();

    expect(dynamic).toBe("force-static");
    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    const xml = await response.text();
    expect(xml.match(/<item>/g)).toHaveLength(CS_POST_SLUGS.length - 1);
    expect(xml).toContain("<link>https://tokenping.xyz/cs/blog/aave-health-factor-vysvetleni</link>");
    expect(xml).not.toContain("bezpecny-health-factor-aave");
    expect(xml).not.toMatch(/tokenping\.xyz\/blog\//);
  });

  it("has no items while every Czech post is a placeholder, whatever English has published", async () => {
    const { GET } = await loadRoute(CS_POST_SLUGS);
    const xml = await GET().text();

    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("<lastBuildDate>");
  });
});
