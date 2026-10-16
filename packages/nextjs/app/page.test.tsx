// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertPlan } from "~~/services/marketing/alertPlan";
import { buildAlertEmail, buildAlertText } from "~~/services/notifications/runNotificationCheck";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { renderMarkup } from "~~/utils/testing/render";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

const HOME_BLOG_SLUGS = ["aave-health-factor", "aave-health-factor-alert-setup", "safe-aave-health-factor"];

const NETWORKS = ["Ethereum", "Polygon", "Arbitrum", "Optimism", "Base", "Avalanche", "Gnosis"];

const loadHome = () => import("~~/app/page");

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
      "Signal or email alerts when your Aave V3 health factor drops below your threshold on 7 networks. Checked every 5 minutes. No approvals on your position.",
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

  it("shows the 7 network badges and the channel badges", async () => {
    await renderHome();

    expect(screen.getAllByText(/.+/, { selector: ".badge" }).map(badge => badge.textContent)).toEqual([
      ...NETWORKS,
      "Signal",
      "Email",
    ]);
  });

  it("repeats one primary action that says what happens, in the hero and at the end", async () => {
    await renderHome();
    const ctas = screen.getAllByRole("link", { name: "Open the free dashboard" });

    expect(ctas.map(link => link.getAttribute("href"))).toEqual(["/aave", "/aave"]);
    expect(
      screen.getAllByText("Connect a wallet to see your Aave V3 health factor on 7 networks. Viewing is read-only."),
    ).toHaveLength(2);
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

    expect(screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)).toEqual([
      "Health factors fall while you sleep",
      "How it works, in 4 steps",
      "Pricing",
      "Questions to ask before you connect a wallet",
      "Limits, stated plainly",
      "From the blog",
      "Check your Aave V3 health factor, free",
    ]);
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
    expect(within(alert).getByText(/Example only/).textContent).toContain(`"${buildAlertEmail(example).subject}"`);
  });

  it("links each forum account to its own thread and dates the 1.01 case to the Polygon forum in 2021", async () => {
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
    expect(links[2].closest("p")?.textContent).toContain("On the Polygon forum in 2021, before Aave V3");
  });
});

describe("price", () => {
  it("shows the live plan in the steps, the pricing block and its call to action", async () => {
    await renderHome();

    expect(
      screen.getByRole("heading", {
        name: "2. Unlock alerts: 3 USDC for 30 days, paid on Arbitrum One (approve, then pay)",
      }),
    ).toBeTruthy();
    expect(within(section("Pricing")).getByText("3 USDC per 30 days")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Set up alerts: 3 USDC for 30 days" }).getAttribute("href")).toBe("/aave");
  });

  it("falls back to text without a number when the plan cannot be read", async () => {
    mocks.getAlertPlan.mockResolvedValue(null);
    const { container } = await renderHome();

    expect(
      screen.getByRole("heading", { name: /^2\. Unlock alerts with a small USDC payment on Arbitrum One/ }),
    ).toBeTruthy();
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
      "What does it cost, and is there a catch?",
      "What if an alert doesn't arrive?",
      "Is my position supported?",
      "How often will I be alerted, and how do I stop it?",
      "Can I watch a wallet I don't connect, or several wallets?",
      "Other tools are free. Why pay?",
    ]);
    questions.forEach(heading => expect(heading.nextElementSibling?.tagName).toBe("P"));
    expect(container.querySelector("details, summary")).toBeNull();
  });

  it("links the payment contract's Sourcify page, the source code and the privacy page", async () => {
    await renderHome();
    const objections = section("Questions to ask before you connect a wallet");

    expect(within(objections).getByRole("link", { name: "verified on Sourcify" }).getAttribute("href")).toBe(
      "https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553",
    );
    expect(within(objections).getByRole("link", { name: "source code is public on GitHub" }).getAttribute("href")).toBe(
      "https://github.com/romispectrum/tokenping",
    );
    expect(within(objections).getByRole("link", { name: "privacy page" }).getAttribute("href")).toBe("/privacy");
  });

  it("names V3 coverage, the Ethereum Core market and what is not supported", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "Is my position supported?" }).nextElementSibling!.textContent;

    expect(answer).toContain(
      "Aave V3 on Ethereum (Core market), Polygon, Arbitrum, Optimism, Base, Avalanche and Gnosis.",
    );
    expect(answer).toContain("Aave V4");
    expect(answer).toContain("Prime/Lido, EtherFi, Horizon");
  });

  it("mentions Telegram data and /stop only once the bot is configured", async () => {
    const { container } = await renderHome();
    expect(pageText(container)).not.toMatch(/Telegram chat ID|\/stop/);

    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const telegram = await renderHome();

    expect(pageText(telegram.container)).toContain("Telegram chat ID and username if you link Telegram");
    expect(pageText(telegram.container)).toContain("In Telegram you can also send /stop to the alert bot.");
  });

  it("says who can look up saved contact details, and points to the privacy page", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "What do you store?" }).nextElementSibling!.textContent;

    expect(answer).toContain(
      "Until the app checks wallet signatures, anyone who knows your wallet address can look up the contact details saved for it. The privacy page explains this",
    );
  });

  // Deleting needs active access and the cron keeps sending after expiry, so the answer must name the way out.
  it("tells people with expired access how to get an alert deleted", async () => {
    await renderHome();
    const answer = screen.getByRole("heading", { name: "How often will I be alerted, and how do I stop it?" })
      .nextElementSibling as HTMLElement;

    expect(answer.textContent).toContain(
      "or when you delete the alert, which needs active access. If your access has expired, message us on X or in our Telegram community and we'll delete it. There is no snooze",
    );
    expect(within(answer).getByRole("link", { name: "X" }).getAttribute("href")).toBe("https://x.com/tokenping");
    expect(within(answer).getByRole("link", { name: "Telegram community" }).getAttribute("href")).toBe(
      "https://t.me/tokenping_xyz",
    );
  });

  it("links the tool comparison only while it is published", async () => {
    await renderHome();
    expect(
      screen.getByRole("link", { name: "our comparison of Aave liquidation alert tools" }).getAttribute("href"),
    ).toBe("/blog/aave-liquidation-alert-tools");

    cleanup();
    vi.resetModules();
    mockPostStubs(["aave-liquidation-alert-tools"]);
    await renderHome();

    expect(screen.queryByRole("link", { name: /comparison/ })).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Other tools are free. Why pay?" }).nextElementSibling!.textContent,
    ).toContain("free tools exist. Tokenping is for people who want the alert on Signal or email");
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

    expect(limits).toHaveLength(7);
    expect(limits.join(" ")).toMatch(/every 5 minutes, not in real time/);
    expect(limits.join(" ")).toMatch(/no unsubscribe link/);
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
      "Open the free dashboard",
      "Open the free dashboard",
    ]);
    expect(screen.getByRole("link", { name: "Set up alerts: 3 USDC for 30 days" }).className).toContain("btn-neutral");
  });

  it("closes with an always-dark band around the second call to action", async () => {
    await renderHome();
    const closing = section("Check your Aave V3 health factor, free");
    const band = closing.querySelector(".dark")!;

    expect(band.className).toContain("bg-background");
    expect(within(band as HTMLElement).getByRole("link", { name: "Open the free dashboard" })).toBeTruthy();
  });

  it("puts a brand divider only between two plain sections", async () => {
    const { container } = await renderHome();
    const dividers = [...container.querySelectorAll(".divider-brand")].map(divider => divider.parentElement!);
    const neighbour = (divider: Element, side: "previousElementSibling" | "nextElementSibling") =>
      divider[side] as HTMLElement;

    expect(dividers).toHaveLength(3);
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
