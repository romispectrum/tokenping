// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_NETWORK_NAMES, AAVE_V3_NETWORKS } from "~~/config/aaveConfig";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
import { FREE_WORDS } from "~~/utils/testing/copyRules";
import { renderMarkup } from "~~/utils/testing/render";

// The wallet UI is a client island with its own tests (AaveDashboard.test.tsx); here it is a marker.
vi.mock("~~/components/dashboard/AaveDashboard", () => ({ AaveDashboard: () => <div data-stub="aave-dashboard" /> }));

const GUIDE_SLUGS = ["safe-aave-health-factor", "aave-health-factor-alert-setup"];

const loadPage = () => import("~~/app/(en)/aave/page");

const renderPage = async () => {
  const { default: AavePage } = await loadPage();
  return render(<AavePage />);
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  mockPostStubs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Aave page metadata", () => {
  it("has its own title, description and self canonical (marketing plan §4.2)", async () => {
    const { metadata } = await loadPage();

    expect(metadata.title).toBe("Aave V3 and V4 positions and health factor");
    // 22 networks: the 21 Aave V3 ones and Arc, which only has Aave V4.
    expect(AAVE_NETWORK_NAMES).toHaveLength(22);
    expect(metadata.description).toBe(
      "See your Aave V3 and V4 collateral, debt and health factor on 22 networks, then set Signal or email alerts, one threshold per market.",
    );
    expect(metadata.alternates?.canonical).toBe("/aave");
    expect(metadata.openGraph).toMatchObject({ url: "/aave", title: "Aave V3 and V4 positions and health factor" });
    expect(metadata.robots).toBeUndefined();
  });

  it("names Telegram in the description once the bot is configured, within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadPage();

    expect(String(metadata.description)).toContain("on 22 networks");
    expect(String(metadata.description)).toContain("then set Signal, Telegram or email alerts");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });

  it("never describes viewing by what it does not cost", async () => {
    const { metadata } = await loadPage();
    const { container } = await renderPage();

    expect(container.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
  });
});

describe("Aave page shell", () => {
  it("server-renders the heading and the explanation around the wallet island", async () => {
    const { default: AavePage } = await loadPage();
    const html = renderMarkup(<AavePage />);

    expect(html).toContain(">Aave V3 and V4 positions and health factor alerts</h1>");
    expect(html).toContain(
      "Connect the wallet you borrow with to see its collateral, debt and health factor on Aave V3 on Ethereum (Core, Prime, EtherFi and Horizon markets), Polygon, Arbitrum, Optimism, Base, Avalanche, Gnosis, Metis, BNB Chain, Scroll, ZKsync, Linea, Sonic, Celo, Soneium, Plasma, Ink, MegaETH, Mantle, X Layer and Monad, and in every Aave V4 Spoke on Ethereum, Avalanche, Arc and Base. Viewing needs no transaction.",
    );
    expect(html).toContain(
      "To get a message on Signal or email when a market&#x27;s health factor drops below a threshold you choose, unlock alerts with a USDC payment on Arbitrum One.",
    );
    // States the repeat behaviour (product limit), and keeps the no-JS text above check_render.sh's 800-char floor.
    expect(html).toContain(
      "Tokenping checks every 5 minutes. While the health factor stays below your threshold, every check sends another message on each channel you chose.",
    );
    expect(html).toContain('<div data-stub="aave-dashboard">');
    // Product UI is calm: none of the marketing effects, no gradient text, no pink in the shell.
    expect(html).not.toMatch(
      /blur-|gradient|animate-pulse|shadow-card|grain|divider-brand|bg-clip-text|\bbg-primary\b/,
    );
    expect(html).toMatchSnapshot();
  });

  it("names every Aave V3 network once in the intro, Ethereum with its four markets", async () => {
    const { default: AavePage } = await loadPage();
    const intro = renderMarkup(<AavePage />).match(/<p class="m-0">(Connect the wallet[^<]*)<\/p>/)?.[1] ?? "";

    const ETHEREUM_MARKETS = "Ethereum (Core, Prime, EtherFi and Horizon markets)";
    const v3List = intro.match(/ on Aave V3 on (.*?), and in every Aave V4 Spoke/)?.[1] ?? "";

    expect(AAVE_V3_NETWORKS).toHaveLength(21);
    expect(v3List.startsWith(`${ETHEREUM_MARKETS}, Polygon`)).toBe(true);
    // Every V3 network once, in dashboard order; Arc runs only Aave V4, so it is named with the Spokes instead.
    expect(v3List.replace(ETHEREUM_MARKETS, "Ethereum").split(/, | and /)).toEqual(
      AAVE_V3_NETWORKS.map(({ name }) => name),
    );
    expect(v3List).not.toContain("Arc");
    expect(intro).toContain("in every Aave V4 Spoke on Ethereum, Avalanche, Arc and Base.");
  });

  // The site header already links home; the dashboard has no breadcrumb trail and so no BreadcrumbList either.
  it("has no breadcrumb trail and no breadcrumb structured data", async () => {
    const { container } = await renderPage();

    expect(screen.queryByRole("navigation", { name: "Breadcrumb" })).toBeNull();
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it("links the threshold and alert setup guides", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: "How to choose a threshold" }).getAttribute("href")).toBe(
      "/blog/safe-aave-health-factor",
    );
    expect(screen.getByRole("link", { name: "How alerts work" }).getAttribute("href")).toBe(
      "/blog/aave-health-factor-alert-setup",
    );
  });

  it("does not link a guide that is still a placeholder", async () => {
    vi.resetModules();
    mockPostStubs(GUIDE_SLUGS);
    await renderPage();

    expect(screen.queryByRole("link", { name: "How to choose a threshold" })).toBeNull();
    expect(screen.queryByRole("link", { name: "How alerts work" })).toBeNull();
  });

  it("is the page's only h1", async () => {
    await renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
