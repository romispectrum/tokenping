// @vitest-environment jsdom
import type { ComponentType } from "react";
import { render, screen, within } from "@testing-library/react";
import type { MDXComponents } from "mdx/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ARTICLE_BODY_CLASS_NAME } from "~~/components/blog/blogLayout";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const loadPage = () => import("~~/app/(en)/blog/[slug]/page");

/** A post's own meta, so the assertions follow the copy in content/blog instead of repeating its titles. */
const postMeta = async (slug: string) => {
  const { getPost } = await import("~~/content/blog");
  return getPost(slug)!.meta;
};

const renderPost = async (slug: string) => {
  const { default: BlogPostPage } = await loadPage();
  return render(await BlogPostPage({ params: Promise.resolve({ slug }) }));
};

/** The byline's <time>, inside the article header (related posts show dates too). */
const publishedTime = () =>
  within(screen.getByRole("heading", { level: 1 }).closest("header")!).getByText("14 October 2026");

/** The byline's "Updated" <time>: the posts were last updated when they started naming Telegram as an alert channel. */
const updatedTime = () =>
  within(screen.getByRole("heading", { level: 1 }).closest("header")!).getByText("20 October 2026");

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
    const { title } = await postMeta("aave-health-factor");

    // 50 characters + " | Tokenping" would be 62, so the title is absolute.
    expect(`${title} | Tokenping`.length).toBeGreaterThan(60);
    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.alternates?.canonical).toBe("/blog/aave-health-factor");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "/blog/aave-health-factor",
      publishedTime: "2026-10-14T00:00:00Z",
      modifiedTime: "2026-10-26T00:00:00Z",
      images: [
        {
          url: "/og/en/aave-health-factor",
          width: 1200,
          height: 630,
          alt: `${title} (Tokenping Aave V3 guide)`,
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
    const { title } = await postMeta("aave-liquidation-price");

    expect(`${title} | Tokenping`.length).toBeLessThanOrEqual(60);
    expect(metadata.title).toBe(title);
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
    ).toEqual(["Home", "Blog", (await postMeta("safe-aave-health-factor")).title]);
    // The breadcrumb is site navigation: the article starts at the post's own header.
    const article = screen.getByRole("heading", { level: 1 }).closest("article")!;
    expect(article.contains(nav)).toBe(false);
    expect(article.firstElementChild?.querySelector("header h1")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "What is a safe health factor on Aave?",
    ]);
    expect(screen.getByText("By the Tokenping team")).toBeDefined();
    expect(publishedTime().getAttribute("dateTime")).toBe("2026-10-14T00:00:00Z");

    const endBox = screen.getByRole("complementary", { name: "About Tokenping" });
    expect(endBox.textContent).toContain(
      "Alerts cost 3 USDC per 30 days, paid on Arbitrum One; looking at your positions needs no payment.",
    );
    expect(endBox.textContent).toContain("they don't prevent liquidation");
    expect(within(endBox).getByRole("link", { name: "Open the dashboard" }).getAttribute("href")).toBe("/aave");

    const related = screen.getByRole("navigation", { name: "Related guides" });
    expect(within(related).getAllByRole("link")[0].getAttribute("href")).toBe("/blog/aave-health-factor");
  });

  it("keeps the article body calm: no pink and no marketing effect between the header and the end box", async () => {
    const { container } = await renderPost("aave-liquidation-price");

    const article = container.querySelector("article")!;
    expect(article.querySelectorAll(".btn-primary, .bg-primary, .grain, .divider-brand")).toHaveLength(0);
    expect(article.querySelectorAll("[class*='brand-pink'], [class*='brand-violet']")).toHaveLength(0);
    // The calculator in the body is product UI on the shared primitives.
    expect(within(article).getByRole("region", { name: "Aave liquidation price calculator" })).toBeDefined();

    const endBox = screen.getByRole("complementary", { name: "About Tokenping" });
    expect(endBox.classList.contains("dark")).toBe(true);
    const pink = [...container.querySelectorAll(".btn-primary, .bg-primary")];
    expect(pink).toHaveLength(1);
    expect(endBox.contains(pink[0])).toBe(true);
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
    const updated = updatedTime().getAttribute("dateTime");

    expect(updated).toBe("2026-10-20T00:00:00Z");
    expect(posting).toMatchObject({
      "@type": "BlogPosting",
      headline: "What is a safe health factor on Aave?",
      datePublished: published,
      dateModified: updated,
      mainEntityOfPage: { "@id": "https://tokenping.xyz/blog/safe-aave-health-factor" },
    });
    expect(breadcrumbs.itemListElement.map(({ name }: { name: string }) => name)).toEqual([
      "Home",
      "Blog",
      (await postMeta("safe-aave-health-factor")).title,
    ]);
  });

  it("falls back to price-free copy when the plan cannot be read", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    await renderPost("aave-health-factor");

    expect(screen.getByRole("complementary", { name: "About Tokenping" }).textContent).toContain(
      "Alerts cost a small USDC fee (see the dashboard for the current price), paid on Arbitrum One; looking at your positions needs no payment.",
    );
  });

  // The article body is the writers' (content/blog) and may compare tools that cost nothing; the page's own copy, the
  // end box and the metadata included, says what alerts cost and never describes the dashboard by what it does not.
  it("never describes the dashboard by what it does not cost, outside the article body", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "safe-aave-health-factor" }) });
    const { container } = await renderPost("safe-aave-health-factor");
    const page = container.cloneNode(true) as HTMLElement;
    const body = [...page.querySelectorAll("article div")].find(div => div.className.includes(ARTICLE_BODY_CLASS_NAME));

    expect(body).toBeDefined();
    body!.remove();
    expect(page.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
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

describe("a Morpho guide", () => {
  it("carries Morpho's label, card and end box", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "morpho-health-factor" }) });
    const { title } = await postMeta("morpho-health-factor");
    await renderPost("morpho-health-factor");

    expect(screen.getByText("Morpho guide")).toBeTruthy();
    expect(screen.queryByText("Aave V3 guide")).toBeNull();
    const endBox = screen.getByRole("complementary", { name: "About Tokenping" });
    expect(within(endBox).getByRole("heading").textContent).toBe("Morpho health factor alerts from Tokenping");
    expect(
      within(endBox).getByText(/Morpho Blue and Midnight health factor every 5 minutes on 14 networks/),
    ).toBeTruthy();
    expect(
      within(endBox)
        .getByRole("link", { name: /Open the Morpho dashboard/ })
        .getAttribute("href"),
    ).toBe("/morpho");
    expect(JSON.stringify(metadata.openGraph?.images)).toContain(`${title} (Tokenping Morpho guide)`);
  });

  it("keeps Aave's label and end box under an Aave guide", async () => {
    await renderPost("aave-health-factor");

    expect(screen.getByText("Aave V3 guide")).toBeTruthy();
    const endBox = screen.getByRole("complementary", { name: "About Tokenping" });
    expect(
      within(endBox)
        .getByRole("link", { name: /Open the dashboard/ })
        .getAttribute("href"),
    ).toBe("/aave");
  });
});
