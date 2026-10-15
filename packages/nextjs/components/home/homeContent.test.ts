import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAlertPlanOffer,
  getDashboardDescription,
  getHomeDescription,
  getHomeHeadline,
  getHomeTitle,
  getNetworkNames,
  getPaywallSourcifyUrl,
  getPricingCtaLabel,
  joinList,
  softwareApplicationJsonLd,
} from "~~/components/home/homeContent";

afterEach(() => {
  vi.unstubAllEnvs();
});

const withTelegram = (enabled: boolean) =>
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", enabled ? "tokenping_bot" : "");

describe("joinList", () => {
  it.each([
    [[], ""],
    [["a"], "a"],
    [["a", "b"], "a and b"],
    [["a", "b", "c"], "a, b and c"],
  ] as const)("joins %j as %j", (items, expected) => {
    expect(joinList(items)).toBe(expected);
  });

  it("takes the conjunction", () => {
    expect(joinList(["a", "b", "c"], "or")).toBe("a, b or c");
  });
});

describe("home copy per channel set", () => {
  it.each([
    [
      false,
      "Aave health factor alerts on Signal and email",
      "Aave health factor alerts on Signal and email | Tokenping",
    ],
    [
      true,
      "Aave health factor alerts on Signal, Telegram and email",
      "Aave health factor alerts on Signal, Telegram and email",
    ],
  ])("with Telegram %s: headline %j, title %j", (telegram, headline, title) => {
    withTelegram(telegram);

    expect(getHomeHeadline()).toBe(headline);
    expect(getHomeTitle()).toBe(title);
    expect(getHomeTitle().length).toBeLessThanOrEqual(60);
  });

  it.each([false, true])("keeps the descriptions within 155 characters (Telegram %s)", telegram => {
    withTelegram(telegram);

    for (const description of [getHomeDescription(), getDashboardDescription()]) {
      expect(description.length).toBeLessThanOrEqual(155);
      // Paying takes an approval and a payment, so "read-only" is never claimed on its own.
      expect(description).not.toMatch(/read-only/i);
    }
  });

  it("uses the plan's exact home description while it fits", () => {
    withTelegram(false);

    expect(getHomeDescription()).toBe(
      "Signal or email alerts when your Aave V3 health factor drops below your threshold on 7 networks. Checked every 5 minutes. No approvals on your position.",
    );
  });
});

describe("getNetworkNames", () => {
  it("lists the 7 networks in dashboard order and marks Ethereum as the Core market only", () => {
    expect(getNetworkNames()).toEqual([
      "Ethereum (Core market)",
      "Polygon",
      "Arbitrum",
      "Optimism",
      "Base",
      "Avalanche",
      "Gnosis",
    ]);
  });
});

describe("getPaywallSourcifyUrl", () => {
  it("points at the Sourcify page of the deployed paywall on Arbitrum One", () => {
    expect(getPaywallSourcifyUrl()).toBe("https://repo.sourcify.dev/42161/0x79872d7529cfE1c062838fACDA004Ce4BFB16553");
  });
});

describe("getPricingCtaLabel", () => {
  it.each([
    [{ priceLabel: "3 USDC", days: 30 }, "Set up alerts: 3 USDC for 30 days"],
    [{ priceLabel: "0.5 USDC", days: 1 }, "Set up alerts: 0.5 USDC for 1 day"],
    [null, "Set up alerts"],
  ])("labels %j as %j", (plan, expected) => {
    expect(getPricingCtaLabel(plan)).toBe(expected);
  });
});

describe("getAlertPlanOffer", () => {
  it("splits the visible price label into price and currency", () => {
    expect(getAlertPlanOffer({ priceLabel: "3 USDC", days: 30 })).toEqual({
      "@type": "Offer",
      price: "3",
      priceCurrency: "USDC",
      description: "Health factor alerts for 30 days, paid in USDC from your wallet. No auto-renew.",
      url: "https://tokenping.xyz/aave",
    });
    expect(getAlertPlanOffer({ priceLabel: "2.5 USDC", days: 30 })).toMatchObject({ price: "2.5" });
  });

  it("returns nothing without a plan, or for a label it cannot split, so no unseen price reaches JSON-LD", () => {
    expect(getAlertPlanOffer(null)).toBeUndefined();
    expect(getAlertPlanOffer({ priceLabel: "about 3 USDC", days: 30 })).toBeUndefined();
  });
});

describe("softwareApplicationJsonLd", () => {
  it("includes offers only with a plan and never a rating", () => {
    expect(softwareApplicationJsonLd({ priceLabel: "3 USDC", days: 30 })).toHaveProperty("offers.price", "3");
    expect(softwareApplicationJsonLd(null)).not.toHaveProperty("offers");
    expect(softwareApplicationJsonLd(null)).not.toHaveProperty("aggregateRating");
  });
});
