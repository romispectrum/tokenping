// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NETWORK_ICONS } from "~~/config/networkIcons.generated";
import { SUPPORTED_NETWORKS } from "~~/config/networks";
import type { PostMeta } from "~~/content/blog/types";
import { POST_SLUGS } from "~~/i18n/postSlugs";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

/** The homepage's "From the blog" posts, by key (the English slug). */
const HOME_BLOG_KEYS = ["aave-health-factor", "morpho-health-factor", "aave-health-factor-alert-setup"];

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
  "Jak to funguje",
  "Všechny trhy Aave a všechny uvedené trhy Morpho",
  "Ceník",
  "Na co se zeptat, než připojíte peněženku",
  "Omezení bez příkras",
  "Z blogu",
  "Nastavte si upozornění na health factor na Aave nebo Morpho",
];

const ENGLISH_HEADINGS = [
  "Health factors fall while you sleep",
  "How it works",
  "Where to put your line",
  "Every Aave market and every listed Morpho market",
  "Pricing",
  "Questions to ask before you connect a wallet",
  "Limits, stated plainly",
  "From the blog",
  "Set up your Aave or Morpho health factor alert",
  "What an alert says",
];

// The Aave V3 networks in dashboard order, then Arc, which only has Aave V4, then the networks only Morpho adds; the
// names are the same in Czech.
const NETWORK_COUNT = 29;
/** The networks with a logo yet (yarn next:network-icons); the others show their initial. */
const LOGO_COUNT = SUPPORTED_NETWORKS.filter(({ chain }) => NETWORK_ICONS[chain.id]).length;

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

    // Brand first on the home page; og:title is the headline, without the brand.
    expect(metadata.title).toEqual({ absolute: "Tokenping: upozornění na health factor na Aave a Morpho" });
    expect(metadata.openGraph).toMatchObject({
      title: "Upozornění na health factor na Aave a Morpho přes Signal a e-mail",
    });
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
      "Upozornění na health factor na Aave a Morpho přes Signal a e-mail",
    ]);
    expect(screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)).toEqual(SECTION_HEADINGS);
  });

  it("names Telegram in the headline once the bot is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    await renderHome();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Upozornění na health factor na Aave a Morpho přes Signal, Telegram a e-mail",
    );
  });

  it("leaks no English section heading", async () => {
    const { container } = await renderHome();
    const headings = [...container.querySelectorAll("h1, h2, h3, figure p")].map(heading => heading.textContent);

    for (const english of ENGLISH_HEADINGS) expect(headings).not.toContain(english);
  });

  it("names the logo strip and the coverage line in Czech, and badges the Czech channel names", async () => {
    const { container } = await renderHome();
    const strip = screen.getByRole("list", { name: "Sítě" });
    const items = within(strip).getAllByRole("listitem");

    expect(items).toHaveLength(NETWORK_COUNT);
    const logos = items.map(item => within(item).getByRole("img"));
    const nameOf = (logo: HTMLElement) => logo.getAttribute("alt") ?? logo.getAttribute("aria-label");
    expect(logos.slice(0, 2).map(nameOf)).toEqual(["Ethereum", "Polygon"]);
    expect(nameOf(logos[21])).toBe("Arc");
    expect(nameOf(logos.at(-1)!)).toBe("Tempo");
    expect(strip.querySelectorAll("img")).toHaveLength(LOGO_COUNT);
    expect(screen.getByText("29 sítí")).toBeTruthy();
    expect(screen.getAllByText(/.+/, { selector: ".badge" }).map(badge => badge.textContent)).toEqual([
      "Signal",
      "E-mail",
    ]);
    expect(container.querySelector(".badge img")).toBeNull();
  });

  it("draws the chart's figures with a decimal comma", async () => {
    await renderHome();
    const chart = within(section("Health factor klesá, i když spíte")).getByRole("figure");

    expect(within(chart).getByText("1,5").nextElementSibling?.textContent).toBe("váš práh");
    expect(within(chart).getByText("Upozornění odesláno (1,49)").textContent).toBe("03:05 Upozornění odesláno (1,49)");
    expect(within(chart).getByText("Podíváte se do telefonu").textContent).toBe("08:00 Podíváte se do telefonu");
    expect(chart.querySelector("figcaption")?.textContent).toBe(
      "Ukázková noc. Upozornění odchází ve 3:05, při první kontrole pod 1,5, pět hodin předtím, než se podíváte.",
    );
  });

  it("lists the four steps in Czech, then the scale with Czech zones and a decimal comma", async () => {
    await renderHome();
    const howItWorks = section("Jak to funguje");

    expect(within(howItWorks).getAllByRole("listitem")).toHaveLength(4);
    expect(
      within(howItWorks)
        .getAllByRole("heading", { level: 3 })
        .map(heading => heading.textContent),
    ).toEqual([
      "1. Připojte peněženku, se kterou si půjčujete",
      "2. Odemkněte upozornění za 3 USDC",
      "3. Pro každý trh zvolte hranici",
      "4. Dostávejte zprávy, dokud jste pod ní",
      "Kam hranici umístit",
    ]);
    expect(within(howItWorks).getByText("Výchozí 1,5")).toBeTruthy();
    expect([...howItWorks.querySelectorAll("dt")].map(term => term.textContent)).toEqual([
      "Kritický",
      "Rizikový",
      "Bezpečný",
    ]);
    expect([...howItWorks.querySelectorAll("dd")].map(detail => detail.textContent)).toEqual([
      "Pod 1,1",
      "1,1 až 1,5",
      "1,5 a více",
    ]);
    expect(within(howItWorks).getByText("Libovolná hodnota od 1,1 do 10.")).toBeTruthy();
    expect(within(howItWorks).getByRole("link", { name: "Jak zvolit práh" }).getAttribute("href")).toBe(
      `/cz/blog/${csSlug("safe-aave-health-factor")}`,
    );
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
    expect(within(alert).getByText(/^Ukázka\./).textContent).toContain(`„${buildAlertEmail(example, "cs").subject}“`);
  });

  it("states the live price in Czech in the steps, the pricing rows, the call to action and under both buttons", async () => {
    await renderHome();
    const pricing = section("Ceník");

    expect(screen.getByText("Odemkněte upozornění za 3 USDC", { selector: "h3" }).textContent).toBe(
      "2. Odemkněte upozornění za 3 USDC",
    );
    expect(screen.getByText("Na 30 dní, platba v USDC na síti Arbitrum One. Bez automatického obnovení.")).toBeTruthy();
    // No row for viewing: the page says what alerts cost and leaves it there.
    expect([...pricing.querySelectorAll("dt")].map(term => term.textContent)).toEqual([
      "Upozornění",
      "Obnovení",
      "Platba",
    ]);
    expect(within(pricing).getByText("3 USDC na 30 dní")).toBeTruthy();
    expect(within(pricing).getByText("Prohlížení pozic nevyžaduje žádnou platbu.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Nastavit upozornění: 3 USDC na 30 dní" }).getAttribute("href")).toBe(
      "/cz/aave",
    );
    expect(
      screen.getAllByText("Připojte peněženku a uvidíte všechny pozice. Upozornění stojí 3 USDC na 30 dní."),
    ).toHaveLength(2);
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

  it("shows every network as a tile with Czech market counts, under a dated lead and the wind-down note", async () => {
    await renderHome();
    const coverage = section("Všechny trhy Aave a všechny uvedené trhy Morpho");
    const tiles = within(coverage).getAllByRole("listitem");

    expect(
      within(coverage).getByText(
        "24 trhů Aave V3 na 21 sítích a 20 trhů (Spoke) Aave V4 na 4 sítích, ke 16. říjnu 2026, a k tomu všechny uvedené trhy Morpho na 14 sítích.",
      ),
    ).toBeTruthy();
    expect(tiles).toHaveLength(NETWORK_COUNT);
    expect(within(tiles[0]).getByText("Ethereum")).toBeTruthy();
    expect(within(tiles[0]).getByText("4 trhy V3 · 13 trhů V4 (Spoke) · Morpho")).toBeTruthy();
    expect(within(tiles[1]).getByText("1 trh V3 · Morpho")).toBeTruthy();
    expect(within(tiles[4]).getByText("1 trh V3 · 1 trh V4 (Spoke) · Morpho")).toBeTruthy();
    expect(within(tiles[6]).getByText("1 trh V3")).toBeTruthy();
    expect(within(tiles[21]).getByText("Arc")).toBeTruthy();
    expect(within(tiles[21]).getByText("3 trhy V4 (Spoke) · Morpho")).toBeTruthy();
    expect(within(tiles[28]).getByText("Tempo")).toBeTruthy();
    expect(within(tiles[28]).getByText("Morpho")).toBeTruthy();
    expect(
      within(coverage).getByText(
        "Trhy na sítích Scroll, ZKsync, Metis, Soneium a Sonic governance Aave postupně ukončuje a dál je hlídáme. Nepokrýváme trh Aave V3 na síti Harmony, neuvedené trhy Morpho ani jiné protokoly.",
      ),
    ).toBeTruthy();
  });

  it("keeps the six limits and the eight questions, coverage having moved to its own section", async () => {
    await renderHome();
    const limits = within(section("Omezení bez příkras"))
      .getAllByRole("listitem")
      .map(item => item.textContent);

    expect(limits).toHaveLength(6);
    expect(limits[0]).toBe("Kontroly každých 5 minut, ne v reálném čase.");
    expect(limits[3]).toBe("Jen USDC na síti Arbitrum One: bez karty, bez vracení peněz.");
    expect(
      within(section("Na co se zeptat, než připojíte peněženku"))
        .getAllByRole("heading", { level: 3 })
        .map(heading => heading.textContent),
    ).toEqual([
      "Může Tokenping sáhnout na mé prostředky?",
      "Co ukládáte?",
      "Kolik to stojí?",
      "Které půjčky na Morpho pokrýváte?",
      "Co když upozornění nedorazí?",
      "Jak upozornění zastavím?",
      "Můžu sledovat peněženku, kterou nepřipojím?",
      "Jiné nástroje nic nestojí. Proč platit?",
    ]);
    expect(screen.queryByRole("heading", { name: "Je moje pozice podporovaná?" })).toBeNull();
  });
});

describe("links", () => {
  it("points every internal link at a Czech page", async () => {
    const { container } = await renderHome();
    const hrefs = internalHrefs(container);

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(href).toMatch(/^\/cz(\/|$)/);
    expect(
      screen.getAllByRole("link", { name: "Otevřít přehled Aave" }).map(link => link.getAttribute("href")),
    ).toEqual(["/cz/aave", "/cz/aave"]);
    expect(
      screen.getAllByRole("link", { name: "Otevřít přehled Morpho" }).map(link => link.getAttribute("href")),
    ).toEqual(["/cz/morpho", "/cz/morpho"]);
    expect(screen.getByRole("link", { name: "přehled Morpho" }).getAttribute("href")).toBe("/cz/morpho");
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
    expect(within(blog).getByRole("link", { name: "Všichni průvodci k Aave a Morpho" }).getAttribute("href")).toBe(
      "/cz/blog",
    );
    expect(screen.getByRole("link", { name: "jak funguje likvidace" }).getAttribute("href")).toBe(
      `/cz/blog/${csSlug("how-aave-liquidation-works")}`,
    );
    expect(screen.getByRole("link", { name: "Jak zvolit práh" }).getAttribute("href")).toBe(
      `/cz/blog/${csSlug("safe-aave-health-factor")}`,
    );
    expect(screen.getByRole("link", { name: "srovnání" }).getAttribute("href")).toBe(
      `/cz/blog/${csSlug("aave-liquidation-alert-tools")}`,
    );
  });

  // An untranslated guide is a placeholder: the Czech page links nothing there, never the English post instead.
  it("links no guide whose Czech translation is a placeholder", async () => {
    vi.resetModules();
    mockPostStubs();
    mockCzechPostStubs(Object.keys(POST_SLUGS));
    const { container } = await renderHome();

    expect(screen.queryByRole("region", { name: "Z blogu" })).toBeNull();
    expect(container.querySelector('a[href*="/blog/"]')).toBeNull();
    expect(screen.getByRole("heading", { name: "Kam hranici umístit" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Jiné nástroje nic nestojí. Proč platit?" }).nextElementSibling!.textContent,
    ).toBe(
      "Pokud vám vyhovuje bot na Telegramu nebo mobilní aplikace, použijte je. Tokenping je pro upozornění přes Signal nebo e-mail, na každém trhu Aave a uvedeném trhu Morpho.",
    );
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
      "Otevřít přehled Aave",
      "Otevřít přehled Aave",
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

  // The page says what alerts cost; nothing on it, the JSON-LD and the metadata included, is described as zdarma.
  it("never describes anything by what it does not cost", async () => {
    const { metadata } = await loadHome();
    const { container } = await renderHome();

    expect(container.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
  });
});
