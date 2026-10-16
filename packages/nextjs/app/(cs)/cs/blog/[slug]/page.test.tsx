// @vitest-environment jsdom
import type { ComponentType } from "react";
import { render, screen, within } from "@testing-library/react";
import type { MDXComponents } from "mdx/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatLongDate } from "~~/i18n/format";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { mockPostStubs } from "~~/utils/testing/blogPosts";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const loadPage = () => import("~~/app/(cs)/cs/blog/[slug]/page");

/** A Czech post's own meta, so the assertions follow the translation instead of repeating its titles. */
const postMeta = async (slug: string) => {
  const { getPost } = await import("~~/content/blog");
  return getPost(slug, "cs")!.meta;
};

const renderPost = async (slug: string) => {
  const { default: BlogPostPage } = await loadPage();
  // The root layout provides the language to client components (the calculator, the table regions). Imported after
  // vi.resetModules, so it is the same context module the page's components read.
  const { LocaleProvider } = await import("~~/i18n/LocaleProvider");
  return render(
    <LocaleProvider locale="cs">{await BlogPostPage({ params: Promise.resolve({ slug }) })}</LocaleProvider>,
  );
};

const header = () => screen.getByRole("heading", { level: 1 }).closest("header")!;

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~~/content/blog");
  // Every post published in both languages, so related links and hreflang do not depend on who has finished.
  mockPostStubs([], []);
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

describe("route config", () => {
  it("prerenders every Czech post and 404s unknown slugs", async () => {
    const { generateStaticParams, dynamicParams } = await loadPage();
    const { getPosts } = await import("~~/content/blog");

    expect(generateStaticParams()).toEqual(getPosts("cs").map(({ meta }) => ({ slug: meta.slug })));
    expect(dynamicParams).toBe(false);
  });
});

describe("generateMetadata", () => {
  it("builds the Czech canonical, hreflang to the English original and a Czech social card alt", async () => {
    const { generateMetadata } = await loadPage();
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "likvidacni-cena-aave" }) });
    const { title } = await postMeta("likvidacni-cena-aave");

    expect(metadata.alternates?.canonical).toBe("/cs/blog/likvidacni-cena-aave");
    expect(metadata.alternates?.languages).toMatchObject({
      en: "/blog/aave-liquidation-price",
      cs: "/cs/blog/likvidacni-cena-aave",
    });
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      locale: "cs_CZ",
      url: "/cs/blog/likvidacni-cena-aave",
      images: [expect.objectContaining({ alt: `${title} (průvodce Aave V3 od Tokenpingu)` })],
    });
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps a Czech placeholder out of search results", async () => {
    vi.resetModules();
    mockPostStubs([], ["likvidacni-cena-aave"]);
    const { generateMetadata } = await loadPage();
    const stub = await generateMetadata({ params: Promise.resolve({ slug: "likvidacni-cena-aave" }) });

    expect(stub.robots).toEqual({ index: false, follow: false });
  });

  it("returns nothing for an English slug under /cs/blog", async () => {
    const { generateMetadata } = await loadPage();

    await expect(generateMetadata({ params: Promise.resolve({ slug: "aave-liquidation-price" }) })).resolves.toEqual(
      {},
    );
  });
});

describe("Czech blog post page", () => {
  it("renders the Czech breadcrumb, kicker, byline, article components, end box and related posts", async () => {
    const meta = await postMeta("bezpecny-health-factor-aave");
    await renderPost("bezpecny-health-factor-aave");

    const nav = screen.getByRole("navigation", { name: "Drobečková navigace" });
    expect(
      within(nav)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toEqual(["Domů", "Blog", meta.title]);
    expect(within(nav).getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/cs/blog");
    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([meta.h1]);
    expect(within(header()).getByText("Průvodce Aave V3")).toBeDefined();
    expect(header().textContent).toContain("Napsal tým Tokenpingu");
    expect(header().textContent).toContain(`Publikováno ${formatLongDate("cs", meta.publishedAt)}`);
    expect(header().textContent).toMatch(new RegExp(`${meta.readingMinutes} minut[ay]? čtení`));

    const article = header().closest("article")!;
    expect(within(article).getByText("Stručná odpověď")).toBeDefined();
    expect(article.textContent).toContain("Platí pro Aave V3.7, ověřeno na trzích Ethereum Core");
    expect(article.querySelector("time[title='14. října 2026']")?.textContent).toBe("14. 10. 2026");
    // The post's info callout is labelled in Czech.
    expect(within(article).getAllByRole("note")[0].textContent).toMatch(/^Poznámka: /);
    expect(article.textContent).not.toMatch(/Short answer|Figures as of|Note: /);

    const endBox = screen.getByRole("complementary", { name: "O Tokenpingu" });
    expect(endBox.textContent).toContain("upozornění stojí 3 USDC na 30 dní s platbou na síti Arbitrum One");
    expect(endBox.textContent).toContain("likvidaci ale nezabrání");
    expect(within(endBox).getByRole("link", { name: "Otevřít přehled zdarma" }).getAttribute("href")).toBe("/cs/aave");

    const related = screen.getByRole("navigation", { name: "Související průvodci" });
    const hrefs = within(related)
      .getAllByRole("link")
      .map(link => link.getAttribute("href"));
    expect(hrefs[0]).toBe("/cs/blog/aave-health-factor-vysvetleni");
    expect(hrefs.every(href => href?.startsWith("/cs/blog/"))).toBe(true);
  });

  it("shows the calculator in Czech in the Czech liquidation price article", async () => {
    await renderPost("likvidacni-cena-aave");

    const calculator = screen.getByRole("region", { name: "Kalkulačka likvidační ceny na Aave" });
    expect(within(calculator).getByRole("group", { name: "Kolaterál 1" })).toBeDefined();
    expect(calculator.textContent).toContain("Vzdělávací odhad, nikoli finanční poradenství.");
    expect(within(calculator).getByText("Likvidační cena WETH", { selector: "dt" })).toBeDefined();
  });

  it("names the article's table regions and scroll hints in Czech", async () => {
    const { container } = await renderPost("bezpecny-health-factor-aave");

    const regions = [...container.querySelectorAll("article [role='region'][tabindex='0']")];
    expect(regions.length).toBeGreaterThan(0);
    for (const region of regions) expect(region.getAttribute("aria-label")).toMatch(/^Tabulka/);
    expect(container.textContent).not.toContain("Scroll sideways");
  });

  it("does not link Czech placeholders as related guides", async () => {
    vi.resetModules();
    mockPostStubs([], ["aave-health-factor-vysvetleni"]);
    await renderPost("bezpecny-health-factor-aave");

    const related = screen.getByRole("navigation", { name: "Související průvodci" });
    expect(
      within(related)
        .getAllByRole("link")
        .map(link => link.getAttribute("href")),
    ).not.toContain("/cs/blog/aave-health-factor-vysvetleni");
  });

  it("emits BlogPosting and BreadcrumbList JSON-LD with the Czech names", async () => {
    const meta = await postMeta("bezpecny-health-factor-aave");
    const { container } = await renderPost("bezpecny-health-factor-aave");
    const [posting, breadcrumbs] = jsonLdBlocks(container);

    expect(posting).toMatchObject({
      "@type": "BlogPosting",
      headline: meta.h1,
      mainEntityOfPage: { "@id": "https://tokenping.xyz/cs/blog/bezpecny-health-factor-aave" },
    });
    expect(breadcrumbs.itemListElement.map(({ name }: { name: string }) => name)).toEqual(["Domů", "Blog", meta.title]);
  });

  it("falls back to price-free Czech copy when the plan cannot be read", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    await renderPost("aave-health-factor-vysvetleni");

    expect(screen.getByRole("complementary", { name: "O Tokenpingu" }).textContent).toContain(
      "upozornění stojí malý poplatek v USDC (aktuální cenu najdete v přehledu) s platbou na síti Arbitrum One",
    );
  });

  it("gives the body's <AlertPrice /> the Czech price of the end box", async () => {
    const PriceBody = ({ components }: { components?: MDXComponents }) => {
      const AlertPrice = components?.AlertPrice as ComponentType;
      return (
        <p>
          Upozornění stojí <AlertPrice />.
        </p>
      );
    };
    vi.doMock("~~/content/blog", async importOriginal => {
      const blog = await importOriginal<typeof import("~~/content/blog")>();
      return {
        ...blog,
        getPost: (slug: string, locale?: "en" | "cs") => {
          const post = blog.getPost(slug, locale);
          return post && { ...post, Content: PriceBody };
        },
      };
    });
    await renderPost("aave-health-factor-vysvetleni");

    expect(screen.getByText("Upozornění stojí 3 USDC na 30 dní.")).toBeDefined();
    expect(mocks.getAlertPlan).toHaveBeenCalledTimes(1);
  });

  it("404s an English slug", async () => {
    await expect(renderPost("aave-health-factor")).rejects.toThrow();
  });
});
