import { readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import { mockPostStubs } from "~~/utils/testing/blogPosts";

// The fixed slugs of the Aave cluster (blog build spec), hub first.
const AAVE_SLUGS = [
  "aave-health-factor",
  "safe-aave-health-factor",
  "how-aave-liquidation-works",
  "aave-liquidation-price",
  "why-aave-health-factor-dropped",
  "aave-health-factor-alert-setup",
  "aave-liquidation-alert-tools",
  "avoid-aave-liquidation",
  "private-aave-liquidation-alerts",
  "crypto-backed-loans",
  "short-fiat-with-aave",
  "aave-interest-rates",
  "aave-alerts-do-not-disturb",
  "aave-market-wind-down",
  "stablecoin-depeg-aave",
  "aave-e-mode",
  "why-aave-withdraw-or-borrow-fails",
  "wrapped-bitcoin-aave-collateral",
  "tokenized-stocks-collateral",
];

// The Morpho guides, their own hub first.
const MORPHO_SLUGS = [
  "morpho-health-factor",
  "how-morpho-liquidation-works",
  "morpho-pre-liquidation",
  "morpho-midnight-fixed-rate-loans",
];

const EXPECTED_SLUGS = [...AAVE_SLUGS, ...MORPHO_SLUGS];

const CS_SLUGS = EXPECTED_SLUGS.map(slug => POST_SLUGS[slug].cs);

const mdxFiles = (dir: string) => readdirSync(new URL(dir, import.meta.url)).filter(file => file.endsWith(".mdx"));
const MDX_FILES = mdxFiles("./");
const CS_MDX_FILES = mdxFiles("./cs/");

// Each test sets which posts are placeholders, so none depends on how many articles are written or translated yet.
const loadBlog = (stubSlugs: readonly string[] = [], csStubSlugs: readonly string[] = []) => {
  mockPostStubs(stubSlugs, csStubSlugs);
  return import("~~/content/blog");
};

beforeEach(() => {
  vi.resetModules();
});

describe("POSTS", () => {
  it("lists the cluster posts, hub first", async () => {
    const { HUB_SLUG, POSTS } = await loadBlog();

    expect(POSTS.map(({ meta }) => meta.slug)).toEqual(EXPECTED_SLUGS);
    expect(POSTS[0].meta.slug).toBe(HUB_SLUG);
  });

  it("registers every .mdx file in content/blog", () => {
    expect(MDX_FILES.map(file => file.replace(/\.mdx$/, "")).sort()).toEqual([...EXPECTED_SLUGS].sort());
  });

  it("renders every post body through mdx-components without an H1", async () => {
    const { POSTS } = await loadBlog();
    for (const { meta, Content } of POSTS) {
      const html = renderToStaticMarkup(<Content components={{ AlertPrice: () => "3 USDC per 30 days" }} />);

      expect(html, meta.slug).not.toBe("");
      expect(html, meta.slug).not.toMatch(/<h1[\s>]/);
    }
  });
});

describe("PUBLISHED_POSTS", () => {
  it("leaves placeholders out and keeps the hub-first order", async () => {
    const { PUBLISHED_POSTS, isPublished, POSTS } = await loadBlog([
      "safe-aave-health-factor",
      "aave-liquidation-price",
    ]);

    expect(PUBLISHED_POSTS.map(({ meta }) => meta.slug)).toEqual(
      EXPECTED_SLUGS.filter(slug => slug !== "safe-aave-health-factor" && slug !== "aave-liquidation-price"),
    );
    expect(POSTS.filter(post => !isPublished(post)).map(({ meta }) => meta.slug)).toEqual([
      "safe-aave-health-factor",
      "aave-liquidation-price",
    ]);
  });

  it("is empty while every post is a placeholder", async () => {
    const { PUBLISHED_POSTS, POSTS } = await loadBlog(EXPECTED_SLUGS);

    expect(PUBLISHED_POSTS).toEqual([]);
    expect(POSTS).toHaveLength(EXPECTED_SLUGS.length);
  });
});

describe("getPost", () => {
  it("finds a post by slug, placeholders included, and returns undefined for unknown slugs", async () => {
    const { getPost } = await loadBlog(["aave-liquidation-price"]);

    expect(getPost("aave-liquidation-price")?.meta.title).toBe("How to calculate your Aave liquidation price");
    expect(getPost("nope")).toBeUndefined();
  });
});

describe("getRelatedPosts", () => {
  it.each(EXPECTED_SLUGS)("gives %s two or three other existing posts", async slug => {
    const { RELATED_POST_COUNT, getRelatedPosts } = await loadBlog();
    const related = getRelatedPosts(slug).map(({ meta }) => meta.slug);

    expect(related.length).toBeGreaterThanOrEqual(2);
    expect(related.length).toBeLessThanOrEqual(RELATED_POST_COUNT);
    expect(related).not.toContain(slug);
    expect(new Set(related).size).toBe(related.length);
  });

  it("links every spoke back to its hub: the Aave guides to Aave's, the Morpho guides to Morpho's", async () => {
    const { HUB_SLUG, MORPHO_HUB_SLUG, getRelatedPosts } = await loadBlog();
    for (const slug of EXPECTED_SLUGS.filter(slug => slug !== HUB_SLUG && slug !== MORPHO_HUB_SLUG)) {
      expect(
        getRelatedPosts(slug).map(({ meta }) => meta.slug),
        slug,
      ).toContain(MORPHO_SLUGS.includes(slug) ? MORPHO_HUB_SLUG : HUB_SLUG);
    }
  });

  it("only maps existing posts to other existing posts", async () => {
    const { RELATED_SLUGS } = await loadBlog();

    expect(Object.keys(RELATED_SLUGS).sort()).toEqual([...EXPECTED_SLUGS].sort());
    for (const [slug, related] of Object.entries(RELATED_SLUGS)) {
      expect(
        related.every(other => other !== slug && EXPECTED_SLUGS.includes(other)),
        slug,
      ).toBe(true);
    }
  });

  it("skips placeholders and fills the slots from the rest of the map", async () => {
    const { RELATED_SLUGS, getRelatedPosts } = await loadBlog(["safe-aave-health-factor"]);
    const related = getRelatedPosts("aave-health-factor").map(({ meta }) => meta.slug);

    expect(related).not.toContain("safe-aave-health-factor");
    expect(related).toEqual(
      RELATED_SLUGS["aave-health-factor"].filter(slug => slug !== "safe-aave-health-factor").slice(0, 3),
    );
  });

  it("returns nothing for an unknown slug", async () => {
    const { getRelatedPosts } = await loadBlog();

    expect(getRelatedPosts("nope")).toEqual([]);
  });
});

describe("post dates", () => {
  it("uses updatedAt when set, otherwise publishedAt", async () => {
    const { POSTS, getPostLastModified } = await loadBlog();
    const [post] = POSTS;

    expect(getPostLastModified(post)).toBe(post.meta.updatedAt ?? post.meta.publishedAt);
    expect(getPostLastModified({ ...post, meta: { ...post.meta, updatedAt: "2027-01-02" } })).toBe("2027-01-02");
  });

  it("reports the newest content date across the published posts", async () => {
    const { POSTS, getLatestPostDate } = await loadBlog(EXPECTED_SLUGS.slice(1));
    const [hub, spoke] = POSTS;

    expect(getLatestPostDate()).toBe(hub.meta.updatedAt ?? hub.meta.publishedAt);
    expect(getLatestPostDate([hub, { ...spoke, meta: { ...spoke.meta, updatedAt: "2027-01-02" } }])).toBe("2027-01-02");
  });

  it("has no date while nothing is published", async () => {
    const { getLatestPostDate } = await loadBlog(EXPECTED_SLUGS);

    expect(getLatestPostDate()).toBeUndefined();
  });
});

describe("Czech posts", () => {
  it("lists a translation of every post, in the English order, hub first", async () => {
    const { getPosts, hubSlug } = await loadBlog();

    expect(getPosts("cs").map(({ meta }) => meta.slug)).toEqual(CS_SLUGS);
    expect(getPosts("cs")[0].meta.slug).toBe(hubSlug("cs"));
    expect(hubSlug("cs")).toBe("aave-health-factor-vysvetleni");
  });

  it("registers every .mdx file in content/blog/cs", () => {
    expect(CS_MDX_FILES.map(file => file.replace(/\.mdx$/, "")).sort()).toEqual([...CS_SLUGS].sort());
  });

  it("renders every Czech post body through mdx-components without an H1", async () => {
    const { getPosts } = await loadBlog();
    for (const { meta, Content } of getPosts("cs")) {
      const html = renderToStaticMarkup(<Content components={{ AlertPrice: () => "3 USDC na 30 dní" }} />);

      expect(html, meta.slug).not.toBe("");
      expect(html, meta.slug).not.toMatch(/<h1[\s>]/);
    }
  });

  it("publishes only the finished translations, independently of English", async () => {
    const { getPublishedPosts } = await loadBlog(["aave-health-factor"], ["likvidacni-cena-aave"]);

    expect(getPublishedPosts("cs").map(({ meta }) => meta.slug)).toEqual(
      CS_SLUGS.filter(slug => slug !== "likvidacni-cena-aave"),
    );
    expect(getPublishedPosts("en").map(({ meta }) => meta.slug)).not.toContain("aave-health-factor");
    expect(getPublishedPosts("cs").map(({ meta }) => meta.slug)).toContain("aave-health-factor-vysvetleni");
  });

  it("finds a Czech post by its slug or its key, and not by its English slug", async () => {
    const { getPost, getPostByKey } = await loadBlog();

    expect(getPost("likvidacni-cena-aave", "cs")?.meta.slug).toBe("likvidacni-cena-aave");
    expect(getPostByKey("aave-liquidation-price", "cs")?.meta.slug).toBe("likvidacni-cena-aave");
    expect(getPost("aave-liquidation-price", "cs")).toBeUndefined();
  });

  it.each(CS_SLUGS)("gives %s two or three related Czech posts, the hub among them for a spoke", async slug => {
    const { RELATED_POST_COUNT, getRelatedPosts, hubSlug } = await loadBlog();
    const related = getRelatedPosts(slug, "cs").map(({ meta }) => meta.slug);
    const hub = MORPHO_SLUGS.some(key => POST_SLUGS[key].cs === slug)
      ? POST_SLUGS["morpho-health-factor"].cs
      : hubSlug("cs");

    expect(related.length).toBeGreaterThanOrEqual(2);
    expect(related.length).toBeLessThanOrEqual(RELATED_POST_COUNT);
    expect(related.every(other => CS_SLUGS.includes(other) && other !== slug)).toBe(true);
    if (slug !== hub) expect(related).toContain(hub);
  });

  it("skips Czech placeholders in related posts", async () => {
    const { getRelatedPosts } = await loadBlog([], ["aave-health-factor-vysvetleni"]);

    expect(getRelatedPosts("bezpecny-health-factor-aave", "cs").map(({ meta }) => meta.slug)).not.toContain(
      "aave-health-factor-vysvetleni",
    );
  });
});
