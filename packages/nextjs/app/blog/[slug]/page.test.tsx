// @vitest-environment jsdom
import type { ComponentType } from "react";
import { render, screen, within } from "@testing-library/react";
import type { MDXComponents } from "mdx/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { mockPostStubs } from "~~/utils/testing/blogPosts";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const loadPage = () => import("~~/app/blog/[slug]/page");

const renderPost = async (slug: string) => {
  const { default: BlogPostPage } = await loadPage();
  return render(await BlogPostPage({ params: Promise.resolve({ slug }) }));
};

/** The byline's <time>, inside the article header (related posts show dates too). */
const publishedTime = () =>
  within(screen.getByRole("heading", { level: 1 }).closest("header")!).getByText("14 October 2026");

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/content/blog");
  // Every post published, so related links do not depend on which articles are written yet.
  mockPostStubs();
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

describe("route config", () => {
  it("prerenders every post, 404s unknown slugs and revalidates hourly with the price cache", async () => {
    const { generateStaticParams, dynamicParams, revalidate } = await loadPage();
    const { POSTS } = await import("~~/content/blog");
    const { ALERT_PLAN_REVALIDATE_SECONDS } = await vi.importActual<typeof import("~~/services/marketing/alertPlan")>(
      "~~/services/marketing/alertPlan",
    );

    expect(generateStaticParams()).toEqual(POSTS.map(({ meta }) => ({ slug: meta.slug })));
    expect(dynamicParams).toBe(false);
    expect(revalidate).toBe(ALERT_PLAN_REVALIDATE_SECONDS);
  });
});

describe("generateMetadata", () => {
  it("builds the post's canonical, article Open Graph with its dates, and its own card with a per-post alt", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "aave-health-factor" }) });

    // 50 characters + " | Tokenping" would be 62, so the title is absolute.
    expect(metadata.title).toEqual({ absolute: "Aave Health Factor Explained: Formula and Examples" });
    expect(metadata.alternates?.canonical).toBe("/blog/aave-health-factor");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/blog/aave-health-factor",
      publishedTime: "2026-10-14T00:00:00Z",
      modifiedTime: "2026-10-14T00:00:00Z",
      images: [
        {
          url: "/blog/aave-health-factor/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Aave Health Factor Explained: Formula and Examples (Tokenping Aave V3 guide)",
        },
      ],
    });
    // Next copies og:image into twitter:image when twitter sets none.
    expect(metadata.twitter).not.toHaveProperty("images");
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps a placeholder post out of search results", async () => {
    vi.resetModules();
    mockPostStubs(["aave-health-factor"]);
    const { generateMetadata } = await loadPage();
    const stub = await generateMetadata({ params: Promise.resolve({ slug: "aave-health-factor" }) });
    const published = await generateMetadata({ params: Promise.resolve({ slug: "safe-aave-health-factor" }) });

    expect(stub.robots).toEqual({ index: false, follow: false });
    expect(published.robots).toBeUndefined();
  });

  it("keeps the brand suffix when the title still fits in 60 characters", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "aave-liquidation-price" }) });

    expect(metadata.title).toBe("How to Calculate Your Aave Liquidation Price");
  });

  it("returns nothing for an unknown slug", async () => {
    const { generateMetadata } = await loadPage();

    await expect(generateMetadata({ params: Promise.resolve({ slug: "nope" }) })).resolves.toEqual({});
  });
});

describe("blog post page", () => {
  it("renders breadcrumb, one H1, byline, the body, the end box and related posts", async () => {
    await renderPost("safe-aave-health-factor");

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(nav)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toEqual(["Home", "Blog", "What Is a Safe Health Factor on Aave? A Buffer Table"]);
    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "What is a safe health factor on Aave?",
    ]);
    expect(screen.getByText("By the Tokenping team")).toBeDefined();
    expect(publishedTime().getAttribute("dateTime")).toBe("2026-10-14T00:00:00Z");

    const endBox = screen.getByRole("complementary", { name: "About Tokenping" });
    expect(endBox.textContent).toContain("alerts cost 3 USDC per 30 days, paid on Arbitrum One");
    expect(endBox.textContent).toContain("they don't prevent liquidation");
    expect(within(endBox).getByRole("link", { name: "Open the free dashboard" }).getAttribute("href")).toBe("/aave");

    const related = screen.getByRole("navigation", { name: "Related guides" });
    expect(within(related).getAllByRole("link")[0].getAttribute("href")).toBe("/blog/aave-health-factor");
  });

  it("does not link placeholder posts as related guides", async () => {
    vi.resetModules();
    mockPostStubs(["aave-health-factor"]);
    await renderPost("safe-aave-health-factor");

    const related = screen.getByRole("navigation", { name: "Related guides" });
    expect(
      within(related)
        .getAllByRole("link")
        .map(link => link.getAttribute("href")),
    ).not.toContain("/blog/aave-health-factor");
  });

  it("emits BlogPosting and BreadcrumbList JSON-LD whose dates equal the visible byline", async () => {
    const { container } = await renderPost("safe-aave-health-factor");
    const [posting, breadcrumbs] = jsonLdBlocks(container);
    const published = publishedTime().getAttribute("dateTime");

    expect(posting).toMatchObject({
      "@type": "BlogPosting",
      headline: "What is a safe health factor on Aave?",
      datePublished: published,
      dateModified: published,
      mainEntityOfPage: { "@id": "https://tokenping.xyz/blog/safe-aave-health-factor" },
    });
    expect(breadcrumbs.itemListElement.map(({ name }: { name: string }) => name)).toEqual([
      "Home",
      "Blog",
      "What Is a Safe Health Factor on Aave? A Buffer Table",
    ]);
  });

  it("falls back to price-free copy when the plan cannot be read", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    await renderPost("aave-health-factor");

    expect(screen.getByRole("complementary", { name: "About Tokenping" }).textContent).toContain(
      "alerts cost a small USDC fee (see the dashboard for the current price), paid on Arbitrum One",
    );
  });

  it("reads the plan once and gives the body's <AlertPrice /> the same price as the end box", async () => {
    const PriceBody = ({ components }: { components?: MDXComponents }) => {
      const AlertPrice = components?.AlertPrice as ComponentType;
      return (
        <p>
          Alerts cost <AlertPrice />.
        </p>
      );
    };
    vi.doMock("~~/content/blog", async importOriginal => {
      const blog = await importOriginal<typeof import("~~/content/blog")>();
      const [first, ...rest] = blog.POSTS;
      const POSTS = [{ ...first, Content: PriceBody }, ...rest];
      return { ...blog, POSTS, getPost: (slug: string) => POSTS.find(({ meta }) => meta.slug === slug) };
    });
    await renderPost("aave-health-factor");

    expect(screen.getByText("Alerts cost 3 USDC per 30 days.")).toBeDefined();
    expect(mocks.getAlertPlan).toHaveBeenCalledTimes(1);
  });

  it("404s an unknown slug", async () => {
    await expect(renderPost("nope")).rejects.toThrow();
  });
});
