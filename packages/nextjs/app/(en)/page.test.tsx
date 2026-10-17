// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";
import { renderMarkup } from "~~/utils/testing/render";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const HOME_BLOG_SLUGS = ["aave-health-factor", "aave-health-factor-alert-setup", "safe-aave-health-factor"];

// The Aave V3 networks in dashboard order, then Arc, which only has Aave V4.
const NETWORKS = [
  "Ethereum",
  "Polygon",
  "Arbitrum",
  "Optimism",
  "Base",
  "Avalanche",
  "Gnosis",
  "Metis",
  "BNB Chain",
  "Scroll",
  "ZKsync",
  "Linea",
  "Sonic",
  "Celo",
  "Soneium",
  "Plasma",
  "Ink",
  "MegaETH",
  "Mantle",
  "X Layer",
  "Monad",
  "Arc",
];

const SECTION_HEADINGS = [
  "Health factors fall while you sleep",
  "How it works",
  "Every Aave market, one alert each",
  "Pricing",
  "Questions to ask before you connect a wallet",
  "Limits, stated plainly",
  "From the blog",
  "Set up your Aave health factor alert",
];

const loadHome = () => import("~~/app/(en)/page");

const renderHome = async () => {
  const { default: Home } = await loadHome();
  return render(await Home());
};

const renderHomeMarkup = async () => {
  const { default: Home } = await loadHome();
  return renderMarkup(await Home());
};

const jsonLdBlocks = (container: HTMLElement) =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
    JSON.parse(script.textContent ?? ""),
  );

const section = (name: string) => screen.getByRole("region", { name });

/** Visible page text, without the JSON-LD. */
const pageText = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach(script => script.remove());
  return clone.textContent ?? "";
};

/** Words in the page's text nodes, the JSON-LD left out; text that only assistive technology reads counts too. */
const wordCount = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script").forEach(script => script.remove());
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  let words = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    words += (node.textContent ?? "").split(/\s+/).filter(Boolean).length;
  }
  return words;
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  // Every post published, so the blog links do not depend on which articles are written yet.
  mockPostStubs();
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("route config and metadata", () => {
  it("re-renders at most hourly, with the alert price cache", async () => {
    const { revalidate } = await loadHome();
    const { ALERT_PLAN_REVALIDATE_SECONDS } = await vi.importActual<typeof import("~~/services/marketing/alertPlan")>(
      "~~/services/marketing/alertPlan",
    );

    expect(revalidate).toBe(ALERT_PLAN_REVALIDATE_SECONDS);
  });

  it("owns the product query with an absolute title, a self canonical and the plan's description", async () => {
    const { metadata } = await loadHome();

    expect(metadata.title).toEqual({ absolute: "Aave health factor alerts on Signal and email | Tokenping" });
    expect(metadata.description).toBe(
      "Signal or email alerts when your Aave V3 or V4 health factor drops below your threshold on 22 networks. Checked every 5 minutes. No approvals on Aave.",
    );
    expect(metadata.alternates?.canonical).toBe("/");
    expect(metadata.openGraph).toMatchObject({ url: "/", type: "website" });
  });

  it("switches to the Telegram variant, within 60 and 155 characters, once the bot is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadHome();

    expect(metadata.title).toEqual({ absolute: "Aave health factor alerts on Signal, Telegram and email" });
    expect(String(metadata.description)).toContain("Signal, Telegram or email alerts");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });
});

describe("hero", () => {
  it("has one h1: headline A, naming the live channels", async () => {
    await renderHome();

    expect(screen.getAllByRole("heading", { level: 1 }).map(heading => heading.textContent)).toEqual([
      "Aave health factor alerts on Signal and email",
    ]);
  });

  it("names Telegram in the headline and the badges only once the bot is configured", async () => {
    await renderHome();
    expect(screen.queryByText("Telegram", { selector: ".badge" })).toBeNull();

    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    await renderHome();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Aave health factor alerts on Signal, Telegram and email",
    );
    expect(screen.getByText("Telegram", { selector: ".badge" })).toBeTruthy();
  });

  it("shows the 22 network logos, each named for assistive technology and on hover, and the coverage line", async () => {
    await renderHome();
    const strip = screen.getByRole("list", { name: "Networks" });
    const items = within(strip).getAllByRole("listitem");

    // The names are in the coverage section: here each one is read out or shown on hover only.
    expect(items.map(item => item.textContent)).toEqual(NETWORKS);
    expect(items.map(item => item.getAttribute("title"))).toEqual(NETWORKS);
    items.forEach(item => expect(item.querySelector(".sr-only")?.textContent).toBe(item.textContent));
    // The logos are served by this site and decorative.
    const logos = [...strip.querySelectorAll("img")];
    expect(logos).toHaveLength(NETWORKS.length);
    expect(logos[0].getAttribute("src")).toBe("/network-icons/ethereum.webp");
    logos.forEach(logo => {
      expect(logo.getAttribute("alt")).toBe("");
      expect(logo.closest("[aria-hidden='true']")).not.toBeNull();
    });
    expect(screen.getByText("22 networks, 44 markets")).toBeTruthy();
  });

  it("badges only the channels, each with a decorative glyph before its name", async () => {
    const { container } = await renderHome();
    const badges = screen.getAllByText(/.+/, { selector: ".badge" });

    expect(badges.map(badge => badge.textContent)).toEqual(["Signal", "Email"]);
    badges.forEach(badge => expect(badge.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true"));
    expect(container.querySelector(".badge img")).toBeNull();
  });

  it("repeats one primary action that says what happens, in the hero and at the end", async () => {
    await renderHome();
    const ctas = screen.getAllByRole("link", { name: "Open the dashboard" });

    expect(ctas.map(link => link.getAttribute("href"))).toEqual(["/aave", "/aave"]);
    expect(screen.getAllByText("Connect a wallet, see every position. Alerts cost 3 USDC per 30 days.")).toHaveLength(
      2,
    );
  });
});

describe("page outline", () => {
  it("never skips a heading level", async () => {
    const { container } = await renderHome();
    const levels = [...container.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(heading => Number(heading.tagName[1]));

    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
    });
  });

  it("renders the sections in the plan's order", async () => {
    await renderHome();

    expect(screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)).toEqual(SECTION_HEADINGS);
  });

  // Each section says one thing next to its visual; the guides carry the detail. Measured at 1132 words after the
  // copy cut (questions 302, blog cards 156, coverage 153, hero 136, problem 134, steps and scale 102, limits 59,
  // pricing 54, closing 36): the ceiling keeps it from growing back, and drops once the copy is cut further.
  it("stays under 1150 words", async () => {
    const { container } = await renderHome();

    expect(wordCount(container)).toBeLessThan(1150);
  });
});

describe("product evidence and the problem", () => {
  it("quotes the real alert template, built by the code that sends alerts", async () => {
    await renderHome();
    // The hero's right column: a figure named by its label, not a section of its own.
    const alert = screen.getByRole("figure", { name: "What an alert says" });
    const example = {
      chainName: "Arbitrum",
      healthFactor: "1.42",
      threshold: 1.5,
      timestamp: within(alert)
        .getByText(/Sent at:/)
        .textContent!.split("Sent at: ")[1],
    };

    expect(within(alert).getByText(/Sent at:/).textContent).toBe(buildAlertText(example));
    expect(within(alert).getByText(/^Example\./).textContent).toContain(`"${buildAlertEmail(example).subject}"`);
  });

  it("links each forum account to its own thread, the 1.01 repay included", async () => {
    await renderHome();
    const problem = section("Health factors fall while you sleep");
    const links = within(problem)
      .getAllByRole("link")
      .filter(link => link.getAttribute("href")?.startsWith("https://"));

    expect(links.map(link => link.getAttribute("href"))).toEqual([
      "https://governance.aave.com/t/unexpected-or-poorly-executed-settlement-by-the-system/21120",
      "https://governance.aave.com/t/repeatedly-failed-repayment-attempts-leading-to-liquidation/20379",
      "https://forum.polygon.technology/t/liquidation-on-polygon-aave-json-error/8067",
    ]);
    links.forEach(link => expect(link.getAttribute("rel")).toBe("noopener noreferrer"));
    expect(links[2].closest("p")?.textContent).toBe(
      "Borrowers describe waking up to a liquidated position, an hour of failing repay transactions and a repay at 1.01 that came too late.",
    );
  });

  it("draws the night on a chart beside three causes that are not headings", async () => {
    await renderHome();
    const problem = section("Health factors fall while you sleep");
    const chart = within(problem).getByRole("figure");

    expect(within(chart).getByText("Alert sent (1.49)").textContent).toBe("03:05 Alert sent (1.49)");
    expect(within(chart).getByText("You check your phone").textContent).toBe("08:00 You check your phone");
    expect(chart.querySelector("figcaption")?.textContent).toBe(
      "An example night. The alert goes out at 03:05, the first check below 1.5, five hours before you look.",
    );
    expect(
      within(problem)
        .getAllByRole("listitem")
        .map(cause => cause.textContent),
    ).toEqual([
      "Prices dropETH falls and your collateral is worth less.",
      "Interest accruesYour debt grows every second.",
      "Thresholds changeGovernance can trim a liquidation threshold.",
    ]);
    expect(within(problem).queryByRole("heading", { level: 3 })).toBeNull();
    expect(within(problem).getByRole("link", { name: "how a liquidation works" }).getAttribute("href")).toBe(
      "/blog/how-aave-liquidation-works",
    );
  });
});

describe("how it works", () => {
  it("lists the four steps as cards with numbered headings, then the scale with the threshold guide", async () => {
    await renderHome();
    const howItWorks = section("How it works");
    const steps = within(howItWorks).getAllByRole("listitem");

    expect(steps).toHaveLength(4);
    expect(
      within(howItWorks)
        .getAllByRole("heading", { level: 3 })
        .map(heading => heading.textContent),
    ).toEqual([
      "1. Connect the wallet you borrow with",
      "2. Unlock alerts for 3 USDC",
      "3. Pick a line for each market",
      "4. Get a message while you're below it",
      "Where to put your line",
    ]);
    // The numeral is drawn for the eye and read once: the visible digit is hidden, the heading's prefix is sr-only.
    steps.forEach((step, index) => {
      expect(step.querySelector("[aria-hidden='true'].font-data")?.textContent).toBe(String(index + 1));
      expect(within(step).getByRole("heading", { level: 3 }).querySelector(".sr-only")?.textContent).toBe(
        `${index + 1}.`,
      );
    });
    expect(within(howItWorks).getByRole("link", { name: "How to choose a threshold" }).getAttribute("href")).toBe(
      "/blog/safe-aave-health-factor",
    );
    expect(within(howItWorks).getByText("Default 1.5")).toBeTruthy();
    expect([...howItWorks.querySelectorAll("dt")].map(term => term.textContent)).toEqual(["Critical", "Risky", "Safe"]);
    expect([...howItWorks.querySelectorAll("dd")].map(detail => detail.textContent)).toEqual([
      "Below 1.1",
      "1.1 to 1.5",
      "1.5 and above",
    ]);
    expect(within(howItWorks).getByText("Any value from 1.1 to 10.")).toBeTruthy();
  });

  it("keeps the scale but drops its guide link while the safe health factor guide is a placeholder", async () => {
    vi.resetModules();
    mockPostStubs(["safe-aave-health-factor"]);
    await renderHome();

    expect(screen.getByRole("heading", { name: "Where to put your line" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "How to choose a threshold" })).toBeNull();
  });
});

describe("coverage", () => {
  it("shows every network as a tile with what is read there, under a dated lead", async () => {
    await renderHome();
    const coverage = section("Every Aave market, one alert each");
    const tiles = within(coverage).getAllByRole("listitem");

    expect(
      within(coverage).getByText(
        "24 Aave V3 markets on 21 networks and 20 Aave V4 Spokes on 4 networks, as of 16 October 2026.",
      ),
    ).toBeTruthy();
    expect(tiles).toHaveLength(NETWORKS.length);
    NETWORKS.forEach((name, index) => expect(within(tiles[index]).getByText(name)).toBeTruthy());
    tiles.forEach(tile =>
      expect(tile.querySelector("img")?.getAttribute("src")).toMatch(/^\/network-icons\/.+\.webp$/),
    );
    expect(within(tiles[0]).getByText("4 V3 markets · 13 V4 Spokes")).toBeTruthy();
    expect(within(tiles[1]).getByText("1 V3 market")).toBeTruthy();
    expect(within(tiles[4]).getByText("1 V3 market · 1 V4 Spoke")).toBeTruthy();
    expect(within(tiles[21]).getByText("3 V4 Spokes")).toBeTruthy();
  });

  it("names the wind-down markets and what is not covered in one line", async () => {
    await renderHome();

    expect(
      within(section("Every Aave market, one alert each")).getByText(
        "Scroll, ZKsync, Metis, Soneium and Sonic are being wound down by Aave governance and are still watched. Not covered: Aave V3 on Harmony, and other protocols.",
      ),
    ).toBeTruthy();
  });
});

describe("price", () => {
  it("shows the live plan in the steps, the three pricing rows and its call to action", async () => {
    await renderHome();
    const pricing = section("Pricing");

    expect(screen.getByText("Unlock alerts for 3 USDC", { selector: "h3" }).textContent).toBe(
      "2. Unlock alerts for 3 USDC",
    );
    expect(screen.getByText("30 days, paid in USDC on Arbitrum One. No auto-renew.")).toBeTruthy();
    // No row for viewing: the page says what alerts cost and leaves it there.
    expect([...pricing.querySelectorAll("dt")].map(term => term.textContent)).toEqual(["Alerts", "Renewal", "Payment"]);
    expect(within(pricing).getByText("3 USDC per 30 days")).toBeTruthy();
    expect(within(pricing).getByText("Looking at your positions needs no payment.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Set up alerts: 3 USDC for 30 days" }).getAttribute("href")).toBe("/aave");
  });

  it("falls back to text without a number when the plan cannot be read", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    const { container } = await renderHome();

    expect(screen.getByText("Unlock alerts with a small USDC payment", { selector: "h3" }).textContent).toBe(
      "2. Unlock alerts with a small USDC payment",
    );
    expect(screen.getByText("Paid in USDC on Arbitrum One. No auto-renew.")).toBeTruthy();
    expect(
      within(section("Pricing")).getByText("A small USDC fee (see the dashboard for the current price)"),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Set up alerts" }).getAttribute("href")).toBe("/aave");
    expect(pageText(container)).not.toMatch(/\d+(\.\d+)? USDC/);
  });
});

describe("JSON-LD", () => {
  it("describes the app with an offer that matches the visible price", async () => {
    const { container } = await renderHome();
    const [app] = jsonLdBlocks(container);

    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      name: "Tokenping",
      url: "https://tokenping.xyz/",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      publisher: { "@id": "https://tokenping.xyz/#organization" },
      offers: { "@type": "Offer", price: "3", priceCurrency: "USDC" },
    });
    expect(pageText(container)).toContain(`${app.offers.price} ${app.offers.priceCurrency} per 30 days`);
    expect(app).not.toHaveProperty("aggregateRating");
  });

  it("leaves out offers while no price is visible", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    const { container } = await renderHome();
    const [app] = jsonLdBlocks(container);

    expect(app["@type"]).toBe("SoftwareApplication");
    expect(app).not.toHaveProperty("offers");
  });

  it("carries no FAQPage or HowTo markup", async () => {
    const { container } = await renderHome();

    expect(JSON.stringify(jsonLdBlocks(container))).not.toMatch(/FAQPage|HowTo|Review|aggregateRating/);
  });
});

describe("objections", () => {
  it("answers each objection in visible prose under an h3, with no accordion", async () => {
    const { container } = await renderHome();
    const questions = within(section("Questions to ask before you connect a wallet")).getAllByRole("heading", {
      level: 3,
    });

    expect(questions.map(heading => heading.textContent)).toEqual([
      "Can Tokenping touch my funds?",
      "What do you store?",
      "What does it cost?",
      "What if an alert doesn't arrive?",
      "How do I stop the alerts?",
      "Can I watch a wallet I don't connect?",
      "Other tools cost nothing. Why pay?",
    ]);
    questions.forEach(heading => expect(heading.nextElementSibling?.tagName).toBe("P"));
    expect(container.querySelector("details, summary")).toBeNull();
    // Coverage has its own section now.
    expect(screen.queryByRole("heading", { name: "Is my position supported?" })).toBeNull();
  });

  it("links the payment contract's Sourcify page, the source code and the privacy page", async () => {
    await renderHome();
    const objections = section("Questions to ask before you connect a wallet");

    expect(within(objections).getByRole("link", { name: "verified on Sourcify" }).getAttribute("href")).toBe(
      "https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553",
    );
    expect(within(objections).getByRole("link", { name: "source code is public" }).getAttribute("href")).toBe(
      "https://github.com/romispectrum/tokenping",
    );
    expect(within(objections).getByRole("link", { name: "privacy page" }).getAttribute("href")).toBe("/privacy");
  });

  it("mentions Telegram data and /stop only once the bot is configured", async () => {
    const { container } = await renderHome();
    expect(pageText(container)).not.toMatch(/Telegram chat|\/stop/);

    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const telegram = await renderHome();

    expect(pageText(telegram.container)).toContain("(email, Signal username, Telegram chat).");
    expect(pageText(telegram.container)).toContain("In Telegram, /stop works too.");
  });

  it("says who can look up saved contact details, and points to the privacy page", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "What do you store?" }).nextElementSibling!.textContent;

    expect(answer).toContain(
      "Payments are public on Arbitrum One, and until wallet signatures are checked, anyone who knows your address can read its contact details. The privacy page has the full list.",
    );
  });

  // Deleting needs active access and the cron keeps sending after expiry, so the answer must name the way out.
  it("tells people with expired access how to get an alert deleted", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "How do I stop the alerts?" }).nextElementSibling as HTMLElement;

    expect(answer.textContent).toContain(
      "or when you delete the alert (needs active access). Access expired? Message us on X or in our Telegram community. No snooze",
    );
    expect(within(answer).getByRole("link", { name: "X" }).getAttribute("href")).toBe("https://x.com/tokenping");
    expect(within(answer).getByRole("link", { name: "Telegram community" }).getAttribute("href")).toBe(
      "https://t.me/tokenping_xyz",
    );
  });

  it("links the tool comparison only while it is published", async () => {
    await renderHome();
    expect(screen.getByRole("link", { name: "our comparison" }).getAttribute("href")).toBe(
      "/blog/aave-liquidation-alert-tools",
    );

    cleanup();
    vi.resetModules();
    mockPostStubs(["aave-liquidation-alert-tools"]);
    await renderHome();

    expect(screen.queryByRole("link", { name: /comparison/ })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Other tools cost nothing. Why pay?" }).nextElementSibling!.textContent,
    ).toBe(
      "If a Telegram bot or a mobile app suits you, use one. Tokenping is for alerts on Signal or email, in every Aave market.",
    );
  });
});

describe("from the blog", () => {
  it("links the hub, the alert how-to and the safe health factor guide, then the whole blog", async () => {
    await renderHome();
    const blog = section("From the blog");
    const postLinks = within(blog)
      .getAllByRole("heading", { level: 3 })
      .map(heading => within(heading).getByRole("link").getAttribute("href"));

    expect(postLinks).toEqual(HOME_BLOG_SLUGS.map(slug => `/blog/${slug}`));
    expect(
      within(blog).getByRole("link", { name: "All Aave health factor and liquidation guides" }).getAttribute("href"),
    ).toBe("/blog");
  });

  it("is left out while none of its posts is published, and never links a placeholder", async () => {
    vi.resetModules();
    mockPostStubs(HOME_BLOG_SLUGS);
    const { container } = await renderHome();

    expect(screen.queryByRole("region", { name: "From the blog" })).toBeNull();
    for (const slug of HOME_BLOG_SLUGS) expect(container.querySelector(`a[href="/blog/${slug}"]`)).toBeNull();
  });
});

describe("copy rules", () => {
  it("makes none of the claims the product cannot back", async () => {
    const { container } = await renderHome();

    expect(pageText(container)).not.toMatch(
      /never miss|never get liquidated|real-time|instant|multi-protocol|more protocols|coming soon|DeFi notification|\bprivate\b|\bsecure\b|guaranteed|open-source licen/i,
    );
  });

  it("states the limits a borrower would check", async () => {
    await renderHome();
    const limits = within(section("Limits, stated plainly"))
      .getAllByRole("listitem")
      .map(item => item.textContent);

    // One line each; coverage moved to its own section.
    expect(limits).toEqual([
      "Checks every 5 minutes, not in real time.",
      "Every check below your line sends another message: no snooze or digest.",
      "One line per market, for the connected wallet only.",
      "USDC on Arbitrum One only: no cards, no refunds.",
      "No unsubscribe link in emails yet; deleting an alert needs active access.",
      "Beta: third-party delivery, no uptime guarantee.",
    ]);
  });

  // The page says what alerts cost; nothing on it, the JSON-LD and the metadata included, is described as free.
  it("never describes anything by what it does not cost", async () => {
    const { metadata } = await loadHome();
    const { container } = await renderHome();

    expect(container.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
  });
});

describe("visual identity", () => {
  it("pairs the hero's primary action with an inverse link to the steps", async () => {
    const { container } = await renderHome();
    const hero = screen.getByRole("region", { name: "Aave health factor alerts on Signal and email" });
    const secondary = within(hero).getByRole("link", { name: "See how it works" });

    expect(secondary.getAttribute("href")).toBe("#how-it-works");
    expect(secondary.className).toContain("btn-neutral");
    expect(container.querySelector("section#how-it-works")?.getAttribute("aria-labelledby")).toBe("how-it-works-title");
  });

  // One pink per view: the same primary action in the hero and in the closing band, screens apart.
  it("makes only the two dashboard links pink; the pricing link is inverse", async () => {
    const { container } = await renderHome();

    expect([...container.querySelectorAll(".btn-primary")].map(link => link.textContent)).toEqual([
      "Open the dashboard",
      "Open the dashboard",
    ]);
    expect(screen.getByRole("link", { name: "Set up alerts: 3 USDC for 30 days" }).className).toContain("btn-neutral");
  });

  it("closes with an always-dark band around the second call to action", async () => {
    await renderHome();
    const closing = section("Set up your Aave health factor alert");
    const band = closing.querySelector(".dark")!;

    expect(band.className).toContain("bg-background");
    expect(within(band as HTMLElement).getByRole("link", { name: "Open the dashboard" })).toBeTruthy();
  });

  it("puts a brand divider only between two plain sections", async () => {
    const { container } = await renderHome();
    const dividers = [...container.querySelectorAll(".divider-brand")].map(divider => divider.parentElement!);
    const neighbour = (divider: Element, side: "previousElementSibling" | "nextElementSibling") =>
      divider[side] as HTMLElement;

    // Problem | How it works | Coverage | Pricing, and before From the blog.
    expect(dividers).toHaveLength(4);
    for (const divider of dividers)
      for (const side of ["previousElementSibling", "nextElementSibling"] as const) {
        const next = neighbour(divider, side);
        expect(next.tagName).toBe("SECTION");
        expect(next.className).not.toMatch(/via-accent|from-accent/);
        expect(next.id).not.toBe("closing");
      }
  });

  // At most two washed areas, never adjacent: the hero's wash layer and the questions section.
  it("washes only the hero and the questions section", async () => {
    const { container } = await renderHome();
    const isWashed = (element: Element) => /(from|via)-accent/.test(element.getAttribute("class") ?? "");
    const hero = screen.getByRole("region", { name: "Aave health factor alerts on Signal and email" });
    const heroWashes = [...hero.querySelectorAll(":scope > *")].filter(isWashed);

    expect([...container.querySelectorAll("section")].filter(isWashed).map(washed => washed.id)).toEqual(["questions"]);
    expect(heroWashes).toHaveLength(1);
    expect(heroWashes[0].getAttribute("aria-hidden")).toBe("true");
  });

  it("uses no legacy palette or gradient text", async () => {
    const { container } = await renderHome();
    // The post cards belong to the blog's own components.
    const homeMarkup = container.cloneNode(true) as HTMLElement;
    homeMarkup.querySelectorAll("#from-the-blog article").forEach(card => card.remove());

    expect(homeMarkup.innerHTML).not.toMatch(
      /indigo-|purple-|gray-\d|base-content|base-200|base-300|bg-clip-text|gradient-to-|rounded-full gap-2 px-8|font-semibold|font-mono/,
    );
  });
});

it("renders the homepage markup", async () => {
  expect(await renderHomeMarkup()).toMatchSnapshot();
});
