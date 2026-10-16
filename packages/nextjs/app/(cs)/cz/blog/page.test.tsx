// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CS_POST_SLUGS, mockPostStubs } from "~~/utils/testing/blogPosts";

// Each test sets which Czech posts are placeholders, so none depends on how many translations are finished yet.
const loadIndex = async (csStubSlugs: readonly string[] = []) => {
  mockPostStubs([], csStubSlugs);
  const blog = await import("~~/content/blog");
  const page = await import("~~/app/(cs)/cz/blog/page");
  return { blog, BlogIndex: page.default, metadata: page.metadata };
};

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

const postLinks = () =>
  screen
    .queryAllByRole("link")
    .map(link => link.getAttribute("href") ?? "")
    .filter(href => /^\/(?:cz\/)?blog\/[^/]+$/.test(href) && !href.endsWith(".xml"));

beforeEach(() => {
  vi.resetModules();
});

describe("/cz/blog metadata", () => {
  it("has a Czech title, description and canonical within search-result lengths, with hreflang to /blog", async () => {
    const { metadata } = await loadIndex();

    expect(metadata.title).toBe("Průvodci health factorem a likvidací na Aave");
    expect(metadata.alternates?.canonical).toBe("/cz/blog");
    expect(metadata.alternates?.languages).toMatchObject({ en: "/blog", cs: "/cz/blog" });
    expect(`${metadata.title} | Tokenping`.length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.openGraph).toMatchObject({ url: "/cz/blog", locale: "cs_CZ" });
    expect(metadata.robots).toBeUndefined();
  });

  it("is noindex while every Czech post is a placeholder", async () => {
    const { metadata } = await loadIndex(CS_POST_SLUGS);

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("/cz/blog", () => {
  it("renders the Czech H1, the Czech hub first and then every other published Czech post with its Czech date", async () => {
    const { BlogIndex, blog } = await loadIndex(["likvidacni-cena-aave"]);
    render(<BlogIndex />);

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Průvodci health factorem a likvidací na Aave",
    ]);
    const published = blog.getPublishedPosts("cs").map(({ meta }) => `/cz/blog/${meta.slug}`);
    expect(postLinks()).toEqual(published);
    expect(postLinks()).not.toContain("/cz/blog/likvidacni-cena-aave");
    expect(postLinks()[0]).toBe(`/cz/blog/${blog.hubSlug("cs")}`);
    expect(screen.getAllByText("14. října 2026")).toHaveLength(published.length);
    expect(screen.getByRole("region", { name: "Začněte tady" })).toBeDefined();
    expect(screen.getByRole("heading", { level: 2, name: "Všichni průvodci" })).toBeDefined();
  });

  it("gives each card its Czech reading time and link label", async () => {
    const { BlogIndex, blog } = await loadIndex();
    render(<BlogIndex />);

    const hub = blog.getPost(blog.hubSlug("cs"), "cs")!;
    const card = screen.getByRole("heading", { name: hub.meta.title }).closest("article")!;
    expect(card.textContent).toMatch(new RegExp(`· ${hub.meta.readingMinutes} minut[ay]? čtení`));
    expect(card.textContent).toContain("Číst průvodce");
    expect(
      within(card)
        .getAllByRole("link")
        .map(link => link.getAttribute("href")),
    ).toEqual([`/cz/blog/${hub.meta.slug}`]);
  });

  it("says the translations are coming, points to the English guides and links no placeholder while none is published", async () => {
    const { BlogIndex } = await loadIndex(CS_POST_SLUGS);
    render(<BlogIndex />);

    expect(postLinks()).toEqual([]);
    expect(screen.queryByRole("heading", { name: "Všichni průvodci" })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Zatím tu nejsou žádní průvodci" })).toBeDefined();
    expect(screen.getByText(/České překlady průvodců se připravují/)).toBeDefined();
    const english = screen.getByRole("link", { name: "Číst průvodce v angličtině" });
    expect(english.getAttribute("href")).toBe("/blog");
    expect(english.getAttribute("hrefLang")).toBe("en");
  });

  it("links the Czech RSS feed and the Czech dashboard, with one pink action in the hero", async () => {
    const { BlogIndex } = await loadIndex();
    const { container } = render(<BlogIndex />);

    expect(screen.getByRole("link", { name: "Odebírat přes RSS" }).getAttribute("href")).toBe("/cz/blog/feed.xml");
    const pink = [...container.querySelectorAll(".btn-primary, .bg-primary")];
    expect(pink).toHaveLength(1);
    expect(pink[0].textContent).toBe("Otevřít přehled zdarma");
    expect(pink[0].getAttribute("href")).toBe("/cz/aave");
  });

  it("renders a Czech breadcrumb trail that matches its BreadcrumbList JSON-LD", async () => {
    const { BlogIndex } = await loadIndex();
    const { container } = render(<BlogIndex />);

    const nav = screen.getByRole("navigation", { name: "Drobečková navigace" });
    expect(
      within(nav)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toEqual(["Domů", "Blog"]);
    expect(within(nav).getByRole("link", { name: "Domů" }).getAttribute("href")).toBe("/cz");
    expect(jsonLdBlocks(container)).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Domů", item: "https://tokenping.xyz/cz" },
          { "@type": "ListItem", position: 2, name: "Blog" },
        ],
      },
    ]);
  });
});
