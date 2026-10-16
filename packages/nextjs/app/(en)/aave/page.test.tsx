// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPostStubs } from "~~/utils/testing/blogPosts";
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

    expect(metadata.title).toBe("Aave V3 positions and health factor");
    expect(metadata.description).toBe(
      "See your Aave V3 collateral, debt and health factor on 7 networks for free, then set a Signal or email alert threshold for each network.",
    );
    expect(metadata.alternates?.canonical).toBe("/aave");
    expect(metadata.openGraph).toMatchObject({ url: "/aave", title: "Aave V3 positions and health factor" });
    expect(metadata.robots).toBeUndefined();
  });

  it("names Telegram in the description once the bot is configured, within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadPage();

    expect(String(metadata.description)).toContain("a Signal, Telegram or email alert threshold");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });
});

describe("Aave page shell", () => {
  it("server-renders the heading and the explanation around the wallet island", async () => {
    const { default: AavePage } = await loadPage();
    const html = renderMarkup(<AavePage />);

    expect(html).toContain(">Aave V3 positions and health factor alerts</h1>");
    expect(html).toContain(
      "Connect the wallet you borrow with to see its Aave V3 collateral, debt and health factor on Ethereum (Core market), Polygon, Arbitrum, Optimism, Base, Avalanche and Gnosis. Viewing is free and needs no transaction.",
    );
    expect(html).toContain(
      "To get a message on Signal or email when a network&#x27;s health factor drops below a threshold you choose, unlock alerts with a USDC payment on Arbitrum One.",
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
