// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage, { metadata } from "~~/app/(cs)/cs/ochrana-soukromi/page";
import { renderMarkup } from "~~/utils/testing/render";

const renderPage = () => render(<PrivacyPage />);

const processorNames = () =>
  [
    ...within(screen.getByRole("heading", { name: "Kdo s vašimi daty pracuje" }).parentElement!).getAllByRole("term"),
  ].map(term => term.textContent);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/cs/ochrana-soukromi", () => {
  it("has a Czech title and description, a self canonical and the English alternate", () => {
    expect(metadata.title).toBe("Ochrana soukromí a data");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.alternates?.canonical).toBe("/cs/ochrana-soukromi");
    expect(metadata.alternates?.languages).toMatchObject({ en: "/privacy", cs: "/cs/ochrana-soukromi" });
  });

  it("titles the page and every section in Czech", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Ochrana soukromí: co Tokenping ukládá a kdo s daty pracuje",
    );
    expect(screen.getAllByRole("heading", { level: 2 }).map(heading => heading.textContent)).toEqual([
      "Co můžete dělat, aniž byste nám cokoli poskytli",
      "Co ukládáme, když uložíte upozornění",
      "Co neukládáme",
      "Kdo vidí nastavení vašich upozornění",
      "Kdo s vašimi daty pracuje",
      "Co je na blockchainu veřejné",
      "Jak dlouho data uchováváme a jak je smazat",
    ]);
  });

  it("keeps every stored item and every processor of the English page", () => {
    renderPage();

    expect(
      within(screen.getByRole("heading", { name: "Co ukládáme, když uložíte upozornění" }).parentElement!)
        .getAllByRole("listitem")
        .map(item => item.textContent),
    ).toHaveLength(6);
    expect(processorNames()).toEqual([
      "Vercel",
      "Supabase",
      "Resend",
      "Fly.io (náš přenosový server pro Signal)",
      "Poskytovatelé RPC (PublicNode, Alchemy a veřejné endpointy jednotlivých sítí)",
      "WalletConnect",
    ]);
    expect(screen.queryByText(/ID vašeho chatu na Telegramu/)).toBeNull();
  });

  it("adds Telegram's data, processor and /stop once the bot is configured", () => {
    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    renderPage();

    expect(processorNames()).toContain("Telegram");
    expect(screen.getByText(/ukládáme také ID vašeho chatu na Telegramu/)).toBeTruthy();
    expect(screen.getByText(/pošlete \/stop/)).toBeTruthy();
    expect(screen.getByText(/kdokoli, kdo zná adresu vaší peněženky/).textContent).toContain(
      "zobrazit e-mailovou adresu, uživatelské jméno na Signalu a uživatelské jméno na Telegramu",
    );
  });

  it("says plainly that settings are not protected by a wallet signature, and never calls them safe", () => {
    const { container } = renderPage();

    expect(screen.getByText(/aplikace po vás zatím nežádá podpis zprávy/)).toBeTruthy();
    expect(screen.getByText(/kdokoli, kdo zná adresu vaší peněženky/).textContent).toBe(
      "Dokud aplikace neověřuje podpisy peněženek, může si kdokoli, kdo zná adresu vaší peněženky, zobrazit e-mailovou adresu a uživatelské jméno na Signalu, které jsou k ní uložené, a dokud má tato peněženka aktivní přístup, může její upozornění změnit nebo smazat. Veřejné záznamy o platbách popsané níže ukazují, které peněženky zaplatily.",
    );
    expect(container.textContent).not.toMatch(/bezpečn|soukromé|jen vy vidíte/i);
  });

  it("shows a Czech breadcrumb with matching BreadcrumbList JSON-LD and one h1", () => {
    const { container } = renderPage();
    const [jsonLd] = [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
      JSON.parse(script.textContent ?? ""),
    );
    const trail = screen.getByRole("navigation", { name: "Drobečková navigace" });

    expect(within(trail).getByRole("link", { name: "Úvod" }).getAttribute("href")).toBe("/cs");
    expect(jsonLd.itemListElement.map(({ name }: { name: string }) => name)).toEqual(["Úvod", "Ochrana soukromí"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("dates the page in Czech with a machine-readable time", () => {
    renderPage();

    expect(screen.getByText("14. října 2026").getAttribute("dateTime")).toBe("2026-10-14T00:00:00Z");
    expect(screen.getByText(/^Naposledy aktualizováno/)).toBeTruthy();
  });

  it("links X, the Telegram community and the Czech home page", () => {
    renderPage();

    expect(screen.getByRole("link", { name: "X" }).getAttribute("href")).toBe("https://x.com/tokenping");
    expect(screen.getByRole("link", { name: "komunity na Telegramu" }).getAttribute("href")).toBe(
      "https://t.me/tokenping_xyz",
    );
    expect(screen.getByRole("link", { name: "úvodní stránce" }).getAttribute("href")).toBe("/cs");
  });

  it("uses Czech quotation marks and no em or en dash", () => {
    const html = renderMarkup(<PrivacyPage />);

    expect(html).toContain("„Jak jste se o Tokenpingu dozvěděli?“");
    expect(html).not.toMatch(new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`));
    expect(html).not.toMatch(/How did you hear|Receives:|Last updated/);
  });
});
