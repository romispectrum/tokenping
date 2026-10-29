// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_BLOG_SLUGS } from "~~/components/home/homeContent";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const loadHome = () => import("~~/app/(vi)/vi/page");

const renderHome = async () => {
  const { default: Home } = await loadHome();
  return render(await Home());
};

/** Visible page text, without the JSON-LD. */
const pageText = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach(script => script.remove());
  return clone.textContent ?? "";
};

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  // Every post published in every language, so the blog links do not depend on who has finished.
  mockPostStubs([], [], [], [], [], []);
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("metadata", () => {
  it("has a brand-first Vietnamese title, a /vi canonical and hreflang to every language", async () => {
    const { metadata } = await loadHome();
    const title = (metadata.title as { absolute: string }).absolute;

    expect(title).toMatch(/^Tokenping: /);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.alternates?.canonical).toBe("/vi");
    expect(metadata.alternates?.languages).toEqual({
      en: "/",
      cs: "/cz",
      es: "/es",
      hi: "/hi",
      de: "/de",
      vi: "/vi",
      "x-default": "/",
    });
    expect(metadata.openGraph).toMatchObject({ url: "/vi", locale: "vi_VN" });
    expect(String(metadata.openGraph?.title)).not.toMatch(/Tokenping/);
  });

  it("keeps the Telegram variant of the description within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadHome();

    expect(String(metadata.description)).toContain("Telegram");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });
});

describe("Vietnamese copy", () => {
  it("has one h1 naming the live channels in Vietnamese", async () => {
    await renderHome();
    const [h1] = screen.getAllByRole("heading", { level: 1 });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(h1.textContent).toMatch(/Signal và email/);
  });

  it("badges the channels with their Vietnamese names", async () => {
    await renderHome();

    expect(screen.getAllByText(/.+/, { selector: ".badge" }).map(badge => badge.textContent)).toEqual([
      "Signal",
      "Email",
    ]);
  });

  it("addresses the reader with bạn, uses no dashes and never describes anything by what it does not cost", async () => {
    const { container } = await renderHome();
    const { metadata } = await loadHome();
    const text = pageText(container);

    // bạn throughout: never the formal quý khách or the rude mày.
    expect(text).not.toMatch(/quý khách|\bmày\b/iu);
    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(text).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
    expect(text).not.toMatch(/thời gian thực|tức thì|đa giao thức/iu);
  });
});

describe("links", () => {
  it("points every internal link at a Vietnamese page", async () => {
    const { container } = await renderHome();
    const hrefs = [...container.querySelectorAll("a[href]")]
      .map(link => link.getAttribute("href")!)
      .filter(href => href.startsWith("/"));

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/vi(\/|$)/);
  });

  it("links the Vietnamese translations of the homepage's guides", async () => {
    const { container } = await renderHome();

    for (const key of HOME_BLOG_SLUGS)
      expect(container.querySelector(`a[href="/vi/blog/${POST_SLUGS[key].vi}"]`), key).not.toBeNull();
  });
});

describe("JSON-LD", () => {
  it("describes the Vietnamese page, its questions and the site, in Vietnamese", async () => {
    const { container } = await renderHome();
    const [app, faq, site] = jsonLdBlocks(container);

    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      url: "https://tokenping.xyz/vi",
      inLanguage: "vi",
      offers: { url: "https://tokenping.xyz/vi/aave" },
    });
    expect(faq).toMatchObject({ "@type": "FAQPage", inLanguage: "vi" });
    expect(site["@graph"][1]).toMatchObject({ "@type": "WebSite", inLanguage: ["en", "cs", "es", "hi", "de", "vi"] });
  });
});
