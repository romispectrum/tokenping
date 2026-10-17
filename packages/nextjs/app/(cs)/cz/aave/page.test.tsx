// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AAVE_V3_NETWORKS } from "~~/config/aaveConfig";
import type { PostMeta } from "~~/content/blog/types";
import { FREE_WORDS } from "~~/utils/testing/copyRules";
import { renderMarkup } from "~~/utils/testing/render";

vi.mock("~~/components/dashboard/AaveDashboard", () => ({ AaveDashboard: () => <div data-stub="aave-dashboard" /> }));

const CS_GUIDES = ["bezpecny-health-factor-aave", "nastaveni-upozorneni-health-factor-aave"];

/** Publishes the two Czech guides the page links, or marks the given ones as placeholders. */
const mockCzechGuides = (stubSlugs: readonly string[] = []) => {
  for (const slug of CS_GUIDES) {
    vi.doMock(`~~/content/blog/cs/${slug}.mdx`, async importOriginal => {
      const post = await importOriginal<{ meta: PostMeta }>();
      const meta: PostMeta = { ...post.meta };
      if (stubSlugs.includes(slug)) meta.stub = true;
      else delete meta.stub;
      return { ...post, meta };
    });
  }
};

const loadPage = () => import("~~/app/(cs)/cz/aave/page");

const renderPage = async () => {
  const { default: AavePage } = await loadPage();
  return render(<AavePage />);
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
  mockCzechGuides();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Czech Aave page metadata", () => {
  it("has a Czech title and description and a self canonical under /cz", async () => {
    const { metadata } = await loadPage();

    expect(metadata.title).toBe("Pozice na Aave V3 a V4 a health factor");
    // 22 networks: the 21 Aave V3 ones and Arc, which only has Aave V4.
    expect(metadata.description).toBe(
      "Uvidíte kolaterál, dluh a health factor na Aave V3 a V4 na 22 sítích. Pak si nastavte upozornění přes Signal nebo e-mail, jeden práh na trh.",
    );
    expect(metadata.alternates?.canonical).toBe("/cz/aave");
    expect(metadata.openGraph).toMatchObject({ url: "/cz/aave", title: "Pozice na Aave V3 a V4 a health factor" });
  });

  it("names Telegram once the bot is configured, within 155 characters", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    const { metadata } = await loadPage();

    expect(String(metadata.description)).toContain("na 22 sítích");
    expect(String(metadata.description)).toContain("přes Signal, Telegram nebo e-mail");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
  });

  it("never describes viewing by what it does not cost", async () => {
    const { metadata } = await loadPage();
    const { container } = await renderPage();

    expect(container.textContent).not.toMatch(FREE_WORDS);
    expect(String(metadata.description)).not.toMatch(FREE_WORDS);
  });
});

describe("Czech Aave page shell", () => {
  it("server-renders the Czech heading and explanation, with no em or en dash", async () => {
    const { default: AavePage } = await loadPage();
    const html = renderMarkup(<AavePage />);

    expect(html).toContain(">Pozice na Aave V3 a V4 a upozornění na health factor</h1>");
    expect(html).toContain(
      "Připojte peněženku, se kterou si půjčujete, a uvidíte její kolaterál, dluh a health factor na Aave V3 na sítích Ethereum (trhy Core, Prime, EtherFi a Horizon), Polygon, Arbitrum, Optimism, Base, Avalanche, Gnosis, Metis, BNB Chain, Scroll, ZKsync, Linea, Sonic, Celo, Soneium, Plasma, Ink, MegaETH, Mantle, X Layer a Monad a ve všech trzích (Spoke) Aave V4 na sítích Ethereum, Avalanche, Arc a Base. Prohlížení nevyžaduje žádnou transakci.",
    );
    // The same 21 V3 networks as the English page, Ethereum's four markets in Czech word order ("trhy Core, ...").
    expect(html).not.toContain("markets)");
    expect(html).not.toContain("(trh Core)");
    const v3List = html.match(/na Aave V3 na sítích (.*?) a ve všech trzích/)?.[1] ?? "";
    expect(AAVE_V3_NETWORKS).toHaveLength(21);
    expect(v3List.replace("Ethereum (trhy Core, Prime, EtherFi a Horizon)", "Ethereum").split(/, | a /)).toEqual(
      AAVE_V3_NETWORKS.map(({ name }) => name),
    );
    expect(html).toContain("Kolik upozornění stojí a jak často kontrolujeme");
    expect(html).toContain(
      "Pokud chcete dostat zprávu přes Signal nebo e-mail, když health factor na některém trhu klesne pod zvolený práh, odemkněte upozornění platbou v USDC na síti Arbitrum One.",
    );
    expect(html).toContain(
      "Tokenping kontroluje každých 5 minut. Dokud health factor zůstává pod vaším prahem, každá kontrola pošle další zprávu do každého kanálu, který jste zvolili.",
    );
    expect(html).toContain('<div data-stub="aave-dashboard">');
    expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(html).not.toMatch(/Connect the wallet|What alerts cost/);
  });

  it("links the Czech threshold and alert setup guides under /cz/blog", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: "Jak zvolit práh" }).getAttribute("href")).toBe(
      "/cz/blog/bezpecny-health-factor-aave",
    );
    expect(screen.getByRole("link", { name: "Jak fungují upozornění" }).getAttribute("href")).toBe(
      "/cz/blog/nastaveni-upozorneni-health-factor-aave",
    );
  });

  it("does not link a guide whose Czech translation is still a placeholder", async () => {
    vi.resetModules();
    mockCzechGuides(["bezpecny-health-factor-aave"]);
    await renderPage();

    expect(screen.queryByRole("link", { name: "Jak zvolit práh" })).toBeNull();
    expect(screen.getByRole("link", { name: "Jak fungují upozornění" })).toBeDefined();
  });

  it("is the page's only h1", async () => {
    await renderPage();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
