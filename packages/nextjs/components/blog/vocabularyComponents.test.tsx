// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AlertPlan } from "~~/services/marketing/alertPlan";

const mocks = vi.hoisted(() => ({ getAlertPlan: vi.fn() }));

vi.mock("~~/services/marketing/alertPlan", () => ({ getAlertPlan: mocks.getAlertPlan }));

const PLAN: AlertPlan = { priceLabel: "3 USDC", days: 30 };

beforeEach(() => {
  mocks.getAlertPlan.mockReset().mockResolvedValue(PLAN);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatAlertPrice / AlertPrice", () => {
  it("prints the live plan, or a price-free fallback that still reads as part of a sentence", async () => {
    const { formatAlertPrice, ALERT_PRICE_FALLBACK } = await import("~~/components/blog/AlertPrice");

    expect(formatAlertPrice(PLAN)).toBe("3 USDC per 30 days");
    expect(formatAlertPrice({ priceLabel: "1.5 USDC", days: 1 })).toBe("1.5 USDC per day");
    expect(formatAlertPrice(null)).toBe(ALERT_PRICE_FALLBACK);
    expect(ALERT_PRICE_FALLBACK).not.toMatch(/\d/);
  });

  it("reads the plan itself when MDX renders outside a post page", async () => {
    const { AlertPrice } = await import("~~/components/blog/AlertPrice");
    render(<p>{await AlertPrice()}</p>);

    expect(screen.getByText("3 USDC per 30 days")).toBeDefined();
    expect(mocks.getAlertPlan).toHaveBeenCalledTimes(1);
  });
});

describe("ShortAnswer", () => {
  it("labels the answer without adding a heading to the outline", async () => {
    const { ShortAnswer } = await import("~~/components/blog/ShortAnswer");
    render(
      <ShortAnswer>
        <p>The answer.</p>
      </ShortAnswer>,
    );

    expect(screen.getByText("Short answer")).toBeDefined();
    expect(screen.getByText("The answer.")).toBeDefined();
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("ScopeNote", () => {
  it("states the version, the seven markets, the V4 note and the figures date", async () => {
    const { ScopeNote, FIGURES_AS_OF } = await import("~~/components/blog/ScopeNote");
    const { container } = render(<ScopeNote />);

    expect(container.textContent).toBe(
      "Applies to Aave V3.7, checked on the Ethereum Core, Arbitrum, Base, Optimism, Polygon, Avalanche and Gnosis markets. Other V3 markets and networks may run older versions. Aave V4 differences are noted where rules differ. Figures as of 14 Oct 2026.",
    );
    expect(container.querySelector("time")?.getAttribute("dateTime")).toBe(FIGURES_AS_OF);
  });
});

describe("Callout", () => {
  it.each([
    ["info", "Note: "],
    ["warning", "Warning: "],
  ] as const)("renders tone %s as a note with a screen-reader label", async (tone, label) => {
    const { Callout } = await import("~~/components/blog/Callout");
    render(
      <Callout tone={tone}>
        <p>Body</p>
      </Callout>,
    );

    expect(screen.getByRole("note").textContent).toBe(`${label}Body`);
  });

  it("defaults to info", async () => {
    const { Callout } = await import("~~/components/blog/Callout");
    render(<Callout>Body</Callout>);

    expect(screen.getByRole("note").textContent).toBe("Note: Body");
  });
});

describe("PostByline", () => {
  it("shows the team byline, machine-readable dates and the reading time", async () => {
    const { PostByline } = await import("~~/components/blog/PostByline");
    const { container } = render(
      <PostByline
        meta={{
          slug: "s",
          title: "t",
          description: "d",
          h1: "h",
          publishedAt: "2026-10-14",
          updatedAt: "2026-11-02",
          primaryQuestion: "q?",
          readingMinutes: 9,
        }}
      />,
    );

    expect(container.textContent).toBe(
      "By the Tokenping team·Published 14 October 2026·Updated 2 November 2026·9 min read",
    );
    expect([...container.querySelectorAll("time")].map(time => time.getAttribute("dateTime"))).toEqual([
      "2026-10-14T00:00:00Z",
      "2026-11-02T00:00:00Z",
    ]);
  });
});

describe("AlertEndBox", () => {
  it("names the configured channels, the cadence, the networks and the live price, with the limit stated", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    const { AlertEndBox } = await import("~~/components/blog/AlertEndBox");
    render(<AlertEndBox plan={PLAN} />);

    expect(screen.getByRole("complementary", { name: "About Tokenping" }).textContent).toContain(
      "Tokenping checks your Aave V3 health factor every 5 minutes on 7 networks and messages you on Signal or email when it is below your threshold. The dashboard is free; alerts cost 3 USDC per 30 days, paid on Arbitrum One. Alerts give you time to act; they don't prevent liquidation.",
    );
  });

  it("adds Telegram only when the bot is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { AlertEndBox } = await import("~~/components/blog/AlertEndBox");
    render(<AlertEndBox plan={null} />);

    expect(screen.getByRole("complementary").textContent).toContain("messages you on Signal, Telegram or email");
  });

  it("names the payment network from config, and leaves it out when no target network has a paywall", async () => {
    vi.resetModules();
    vi.doMock("~~/services/marketing/paymentChain", () => ({ getPaymentChainName: () => undefined }));
    try {
      const { AlertEndBox } = await import("~~/components/blog/AlertEndBox");
      render(<AlertEndBox plan={PLAN} />);

      expect(screen.getByRole("complementary").textContent).toContain(
        "alerts cost 3 USDC per 30 days. Alerts give you time to act",
      );
    } finally {
      vi.doUnmock("~~/services/marketing/paymentChain");
      vi.resetModules();
    }
  });
});

describe("formatPostDate", () => {
  it("formats the meta date in UTC, whatever the server's time zone", async () => {
    const { formatPostDate } = await import("~~/components/blog/formatPostDate");

    expect(formatPostDate("2026-10-14")).toBe("14 October 2026");
    expect(formatPostDate("2027-01-01")).toBe("1 January 2027");
  });
});
