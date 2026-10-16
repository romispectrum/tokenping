// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostMeta } from "~~/content/blog/types";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { mockPostStubs } from "~~/utils/testing/blogPosts";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

/** The homepage's "From the blog" posts, by key (the English slug). */
const HOME_BLOG_KEYS = ["aave-health-factor", "aave-health-factor-alert-setup", "safe-aave-health-factor"];

const csSlug = (key: string) => POST_SLUGS[key].cs;

/**
 * Sets the `stub` flag of the Czech posts (mockPostStubs covers the English ones): the given keys stay placeholders
 * and every other Czech post is published. Call it after vi.resetModules() and before rendering.
 */
const mockCzechPostStubs = (stubKeys: readonly string[] = []) => {
  for (const key of Object.keys(POST_SLUGS)) {
    vi.doMock(`~~/content/blog/cs/${csSlug(key)}.mdx`, async importOriginal => {
      const post = await importOriginal<{ meta: PostMeta }>();
      const meta: PostMeta = { ...post.meta };
      if (stubKeys.includes(key)) meta.stub = true;
      else delete meta.stub;
      return { ...post, meta };
    });
  }
};

const loadHome = () => import("~~/app/(cs)/cz/page");

const renderHome = async () => {
  const { default: Home } = await loadHome();
  return render(await Home());
};

const section = (name: string) => screen.getByRole("region", { name });

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

const internalHrefs = (container: HTMLElement) =>
  [...container.querySelectorAll("a[href]")]
    .map(link => link.getAttribute("href")!)
    .filter(href => href.startsWith("/"));

const SECTION_HEADINGS = [
  "Health factor klesá, i když spíte",
  "Jak to funguje, ve 4 krocích",
  "Ceník",
  "Na co se zeptat, než připojíte peněženku",
  "Omezení bez příkras",
  "Z blogu",
  "Zkontrolujte svůj health factor na Aave V3 zdarma",
];

const ENGLISH_HEADINGS = [
  "Health factors fall while you sleep",
  "How it works, in 4 steps",
  "Pricing",
  "Questions to ask before you connect a wallet",
  "Limits, stated plainly",
  "From the blog",
  "Check your Aave V3 health factor, free",
  "What an alert says",
];

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  mockPostStubs();
  mockCzechPostStubs();
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("metadata", () => {
  it("has a Czech title and description, a /cz canonical and hreflang to the English home", async () => {
    const { metadata } = await loadHome();

    // Too long for the " | Tokenping" suffix within 60 characters, so the title stands alone.
    expect(metadata.title).toEqual({ absolute: "Upozornění na Aave health factor přes Signal a e-mail" });
    expect(String(metadata.description)).toMatch(/^Upozornění přes Signal nebo e-mail, když health factor/);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.alternates?.canonical).toBe("/cz");
    expect(metadata.alternates?.languages).toMatchObject({ en: "/", cs: "/cz" });
  });

  it("keeps the Telegram variant within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadHome();

    expect(String(metadata.description)).toContain("Signal, Telegram nebo e-mail");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });
});

describe("Czech copy", () => {
  it("has one Czech h1 naming the live channels, and Czech section headings in the plan's order", async () => {
    await renderHome();

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Upozornění na Aave health factor přes Signal a e-mail",
    ]);
    expect(screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)).toEqual(SECTION_HEADINGS);
  });

  it("names Telegram in the headline once the bot is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    await renderHome();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Upozornění na Aave health factor: Signal, Telegram a e-mail",
    );
  });

  it("leaks no English section heading", async () => {
    const { container } = await renderHome();
    const headings = [...container.querySelectorAll("h1, h2, h3, figure p")].map(heading => heading.textContent);

    for (const english of ENGLISH_HEADINGS) expect(headings).not.toContain(english);
  });

  it("shows the network badges and the Czech channel badges", async () => {
    await renderHome();

    expect(screen.getAllByText(/.+/, { selector: ".badge" }).map(badge => badge.textContent)).toEqual([
      "Ethereum",
      "Polygon",
      "Arbitrum",
      "Optimism",
      "Base",
      "Avalanche",
      "Gnosis",
      "Signal",
      "E-mail",
    ]);
  });

  it("quotes the Czech alert template with a Czech timestamp and decimal commas", async () => {
    await renderHome();
    const alert = screen.getByRole("figure", { name: "Co vám upozornění napíše" });
    const text = within(alert).getByText(/Odesláno:/).textContent!;
    const example = {
      chainName: "Arbitrum",
      healthFactor: "1.42",
      threshold: 1.5,
      timestamp: text.split("Odesláno: ")[1],
    };

    expect(text).toBe(buildAlertText(example, "cs"));
    expect(text).toContain("1,42");
    expect(text).toContain("1,5");
    expect(within(alert).getByText(/Jen ukázka/).textContent).toContain(`„${buildAlertEmail(example, "cs").subject}“`);
  });

  it("states the live price in Czech in the steps, the pricing block and its call to action", async () => {
    await renderHome();

    expect(
      screen.getByRole("heading", {
        name: "2. Odemkněte upozornění: 3 USDC na 30 dní, platba na síti Arbitrum One (schválení, pak platba)",
      }),
    ).toBeTruthy();
    expect(within(section("Ceník")).getByText("3 USDC na 30 dní")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Nastavit upozornění: 3 USDC na 30 dní" }).getAttribute("href")).toBe(
      "/cz/aave",
    );
  });

  it("writes a decimal price with a comma and falls back to no number without a plan", async () => {
    mocks.getAlertPlan.mockResolvedValue({ priceLabel: "2.5 USDC", days: 1 });
    await renderHome();
    expect(screen.getByRole("link", { name: "Nastavit upozornění: 2,5 USDC na 1 den" })).toBeTruthy();

    cleanup();
    mocks.getAlertPlan.mockResolvedValue(null);
    const { container } = await renderHome();
    expect(screen.getByRole("link", { name: "Nastavit upozornění" })).toBeTruthy();
    expect(pageText(container)).not.toMatch(/\d+([.,]\d+)? USDC/);
  });

  it("lists the supported networks in Czech", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "Je moje pozice podporovaná?" }).nextElementSibling!.textContent;

    expect(answer).toContain(
      "Aave V3 na sítích Ethereum (trh Core), Polygon, Arbitrum, Optimism, Base, Avalanche a Gnosis.",
    );
  });

  it("keeps the seven limits and the eight questions", async () => {
    await renderHome();

    expect(within(section("Omezení bez příkras")).getAllByRole("listitem")).toHaveLength(7);
    expect(
      within(section("Na co se zeptat, než připojíte peněženku")).getAllByRole("heading", { level: 3 }),
    ).toHaveLength(8);
  });
});

describe("links", () => {
  it("points every internal link at a Czech page", async () => {
    const { container } = await renderHome();
    const hrefs = internalHrefs(container);

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/cz(\/|$)/);
    expect(
      screen.getAllByRole("link", { name: "Otevřít přehled zdarma" }).map(link => link.getAttribute("href")),
    ).toEqual(["/cz/aave", "/cz/aave"]);
    expect(screen.getByRole("link", { name: "stránka o ochraně soukromí" }).getAttribute("href")).toBe(
      "/cz/ochrana-soukromi",
    );
  });

  it("links the Czech guides from the blog section and in the text while they are published", async () => {
    await renderHome();
    const blog = section("Z blogu");
    const postLinks = within(blog)
      .getAllByRole("heading", { level: 3 })
      .map(heading => within(heading).getByRole("link").getAttribute("href"));

    expect(postLinks).toEqual(HOME_BLOG_KEYS.map(key => `/cz/blog/${csSlug(key)}`));
    expect(
      within(blog)
        .getByRole("link", { name: "Všichni průvodci health factorem a likvidací na Aave" })
        .getAttribute("href"),
    ).toBe("/cz/blog");
    expect(screen.getByRole("link", { name: "Jak funguje likvidace na Aave" }).getAttribute("href")).toBe(
      `/cz/blog/${csSlug("how-aave-liquidation-works")}`,
    );
    expect(
      screen.getByRole("link", { name: "srovnání nástrojů pro upozornění na likvidaci na Aave" }).getAttribute("href"),
    ).toBe(`/cz/blog/${csSlug("aave-liquidation-alert-tools")}`);
  });

  // An untranslated guide is a placeholder: the Czech page links nothing there, never the English post instead.
  it("links no guide whose Czech translation is a placeholder", async () => {
    vi.resetModules();
    mockPostStubs();
    mockCzechPostStubs(Object.keys(POST_SLUGS));
    const { container } = await renderHome();

    expect(screen.queryByRole("region", { name: "Z blogu" })).toBeNull();
    expect(container.querySelector('a[href*="/blog/"]')).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Jiné nástroje jsou zdarma. Proč platit?" }).nextElementSibling!.textContent,
    ).toContain("existují bezplatné nástroje. Tokenping je pro ty");
  });
});

describe("JSON-LD", () => {
  it("describes the Czech page in Czech, with the offer pointing at the Czech dashboard", async () => {
    const { container } = await renderHome();
    const [app] = jsonLdBlocks(container);

    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      url: "https://tokenping.xyz/cz",
      inLanguage: "cs",
      offers: { price: "3", priceCurrency: "USDC", url: "https://tokenping.xyz/cz/aave" },
    });
    expect(app.description).toMatch(/^Upozornění přes Signal nebo e-mail/);
    expect(app.offers.description).toContain("na 30 dní");
  });
});

describe("design rules", () => {
  it("keeps one pink per view: only the two dashboard links are primary", async () => {
    const { container } = await renderHome();

    expect([...container.querySelectorAll(".btn-primary")].map(link => link.textContent)).toEqual([
      "Otevřít přehled zdarma",
      "Otevřít přehled zdarma",
    ]);
  });

  it("uses no em or en dash anywhere, the JSON-LD included", async () => {
    const { container } = await renderHome();

    expect(container.innerHTML).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
  });

  it("addresses the reader formally, never with tykání", async () => {
    const { container } = await renderHome();

    expect(pageText(container)).not.toMatch(/(?<!\p{L})(tvůj|tvoje|tvá|tvé|tvých|tebe|tobě|ti)(?!\p{L})/iu);
  });
});
