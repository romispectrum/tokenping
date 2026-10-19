// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatPostDate } from "~~/components/blog/formatPostDate";
import { POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";

// Each test sets which posts are placeholders, so none depends on how many articles are written yet.
const loadIndex = async (stubSlugs: readonly string[] = []) => {
  mockPostStubs(stubSlugs);
  const blog = await import("~~/content/blog");
  const page = await import("~~/app/(en)/blog/page");
  return { blog, BlogIndex: page.default, metadata: page.metadata };
};

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

const postLinks = () =>
  screen
    .queryAllByRole("link")
    .filter(link => link.getAttribute("href")?.startsWith("/blog/") && !link.getAttribute("href")?.endsWith(".xml"))
    .map(link => link.getAttribute("href"));

beforeEach(() => {
  vi.resetModules();
});

/** The order /blog lists guides in after the hub: latest publish date first, same-day guides in registration order. */
const latestFirst = <T extends { meta: { publishedAt: string } }>(posts: readonly T[]) =>
  posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => b.post.meta.publishedAt.localeCompare(a.post.meta.publishedAt) || a.index - b.index)
    .map(({ post }) => post);
describe("/blog metadata", () => {
  it("has its own title, description and canonical within search-result lengths", async () => {
    const { metadata } = await loadIndex();

    expect(metadata.title).toBe("Aave health factor and liquidation guides");
    expect(metadata.alternates?.canonical).toBe("/blog");
    expect(`${metadata.title} | Tokenping`.length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.openGraph).toMatchObject({ url: "/blog", images: [expect.objectContaining({ width: 1200 })] });
    expect(metadata.robots).toBeUndefined();
  });

  it("is noindex while every post is a placeholder", async () => {
    const { metadata } = await loadIndex(POST_SLUGS);

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("/blog", () => {
  it("renders one H1, the hub first and then every other published post, latest first, with its date", async () => {
    const { BlogIndex, blog } = await loadIndex(["aave-liquidation-price"]);
    render(<BlogIndex />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Aave health factor and liquidation guides",
    ]);
    const [hub, ...rest] = blog.PUBLISHED_POSTS;
    const published = [hub, ...latestFirst(rest)].map(({ meta }) => `/blog/${meta.slug}`);
    expect(postLinks()).toEqual(published);
    expect(postLinks()).not.toContain("/blog/aave-liquidation-price");
    expect(postLinks()[0]).toBe(`/blog/${blog.HUB_SLUG}`);
    // Each card shows its own publish date: as many cards as posts share a day.
    const dates = blog.PUBLISHED_POSTS.map(({ meta }) => formatPostDate(meta.publishedAt, "en"));
    for (const date of new Set(dates)) {
      expect(screen.getAllByText(date)).toHaveLength(dates.filter(other => other === date).length);
    }
  });

  it("shows every published post's description", async () => {
    const { BlogIndex, blog } = await loadIndex();
    render(<BlogIndex />);

    for (const { meta } of blog.PUBLISHED_POSTS) expect(screen.getByText(meta.description)).toBeDefined();
  });

  it("says the guides are coming and links no placeholder while nothing is published", async () => {
    const { BlogIndex } = await loadIndex(POST_SLUGS);
    render(<BlogIndex />);

    expect(postLinks()).toEqual([]);
    expect(screen.queryByRole("heading", { name: "All guides" })).toBeNull();
    expect(screen.getByText(/The first guides are being written/)).toBeDefined();
  });

  it("links the RSS feed visibly", async () => {
    const { BlogIndex } = await loadIndex();
    render(<BlogIndex />);

    expect(screen.getByRole("link", { name: "Subscribe with RSS" }).getAttribute("href")).toBe("/blog/feed.xml");
  });

  it("never describes the dashboard by what it does not cost", async () => {
    const { BlogIndex, metadata } = await loadIndex();
    const { container } = render(<BlogIndex />);

    expect(container.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
  });

  it("keeps the marketing moment in the hero: one pink action, the glow and the grain card, none in the guide list", async () => {
    const { BlogIndex } = await loadIndex();
    const { container } = render(<BlogIndex />);

    const hero = screen.getByRole("region", { name: "Aave health factor and liquidation guides" });
    const pink = [...container.querySelectorAll(".btn-primary, .bg-primary")];
    expect(pink).toHaveLength(1);
    expect(hero.contains(pink[0])).toBe(true);
    expect(pink[0].textContent).toBe("Open the dashboard");
    expect(pink[0].getAttribute("href")).toBe("/aave");
    for (const effect of container.querySelectorAll(".grain, [class*='from-brand-pink']")) {
      expect(hero.contains(effect)).toBe(true);
    }
    expect(hero.querySelectorAll(".grain")).toHaveLength(1);
  });

  it("makes each guide card one link named by its title", async () => {
    const { BlogIndex, blog } = await loadIndex();
    render(<BlogIndex />);

    const [hub] = blog.PUBLISHED_POSTS;
    const card = screen.getByRole("heading", { name: hub.meta.title }).closest("article")!;
    expect(
      within(card)
        .getAllByRole("link")
        .map(link => link.getAttribute("href")),
    ).toEqual([`/blog/${hub.meta.slug}`]);
  });

  it("keeps the hub as Start here and lists the other guides latest first, same-day guides in their usual order", async () => {
    const { BlogIndex, blog } = await loadIndex();
    render(<BlogIndex />);

    const start = screen.getByRole("region", { name: "Start here" });
    expect(within(start).getByRole("heading").textContent).toBe(blog.PUBLISHED_POSTS[0].meta.title);
    const listed = within(screen.getByRole("region", { name: "All guides" }))
      .getAllByRole("heading", { level: 3 })
      .map(heading => heading.textContent);
    expect(listed).toEqual(latestFirst(blog.PUBLISHED_POSTS.slice(1)).map(({ meta }) => meta.title));
    // The latest guide is the first card.
    const latest = blog.PUBLISHED_POSTS.slice(1).reduce((a, b) => (b.meta.publishedAt > a.meta.publishedAt ? b : a));
    expect(listed[0]).toBe(latest.meta.title);
  });

  it("renders a breadcrumb trail that matches its BreadcrumbList JSON-LD", async () => {
    const { BlogIndex } = await loadIndex();
    const { container } = render(<BlogIndex />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(nav)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toEqual(["Home", "Blog"]);
    expect(jsonLdBlocks(container)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://tokenping.xyz/" },
          { "@type": "ListItem", position: 2, name: "Blog" },
        ],
      },
    ]);
  });
});
