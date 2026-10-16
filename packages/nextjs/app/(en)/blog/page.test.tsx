// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

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
  it("renders one H1, the hub first and then every other published post with its date", async () => {
    const { BlogIndex, blog } = await loadIndex(["aave-liquidation-price"]);
    render(<BlogIndex />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Aave health factor and liquidation guides",
    ]);
    const published = blog.PUBLISHED_POSTS.map(({ meta }) => `/blog/${meta.slug}`);
    expect(postLinks()).toEqual(published);
    expect(postLinks()).not.toContain("/blog/aave-liquidation-price");
    expect(postLinks()[0]).toBe(`/blog/${blog.HUB_SLUG}`);
    expect(screen.getAllByText("14 October 2026")).toHaveLength(published.length);
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

  it("keeps the marketing moment in the hero: one pink action, the glow and the grain card, none in the guide list", async () => {
    const { BlogIndex } = await loadIndex();
    const { container } = render(<BlogIndex />);

    const hero = screen.getByRole("region", { name: "Aave health factor and liquidation guides" });
    const pink = [...container.querySelectorAll(".btn-primary, .bg-primary")];
    expect(pink).toHaveLength(1);
    expect(hero.contains(pink[0])).toBe(true);
    expect(pink[0].textContent).toBe("Open the free dashboard");
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
