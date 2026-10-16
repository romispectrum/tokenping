// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PrivacyPage, { metadata } from "~~/app/(en)/privacy/page";
import { renderMarkup } from "~~/utils/testing/render";

const renderPage = () => render(<PrivacyPage />);

const processorNames = () =>
  [...within(screen.getByRole("heading", { name: "Who handles your data" }).parentElement!).getAllByRole("term")].map(
    term => term.textContent,
  );

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/privacy", () => {
  it("has its own title, description and self canonical", () => {
    expect(metadata.title).toBe("Privacy and data");
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(metadata.alternates?.canonical).toBe("/privacy");
  });

  it("lists what an alert stores, and what is never stored", () => {
    renderPage();

    expect(screen.getByText("Your email address, if you chose email.")).toBeTruthy();
    expect(screen.getByText("Your Signal username, if you chose Signal.")).toBeTruthy();
    expect(screen.getByText("A log of the alerts we sent.")).toBeTruthy();
    expect(screen.getByText(/the site uses none, and Tokenping sets no cookies/)).toBeTruthy();
    // Everything the app itself keeps in the browser: next-themes, wagmi/RainbowKit and the attribution prompt flag.
    expect(screen.getByText(/the site uses none/).textContent).toContain(
      'Your browser keeps your theme choice, your wallet connection and whether it has already shown you the "How did you hear about Tokenping?" question in its own local storage.',
    );
    expect(screen.getByText(/How did you hear about Tokenping\?.*we store your answer/)).toBeTruthy();
  });

  it("names every service that handles data, without Telegram while the bot is not configured", () => {
    renderPage();

    expect(processorNames()).toEqual([
      "Vercel",
      "Supabase",
      "Resend",
      "Fly.io (our Signal relay)",
      "RPC providers (PublicNode, Alchemy and the networks' public endpoints)",
      "WalletConnect",
    ]);
    expect(screen.queryByText(/Telegram chat ID/)).toBeNull();
  });

  it("adds Telegram's data, processor and /stop once the bot is configured", () => {
    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    renderPage();

    expect(processorNames()).toContain("Telegram");
    expect(screen.getByText(/we also store your Telegram chat ID, your Telegram username/)).toBeTruthy();
    expect(screen.getByText(/Sending \/stop to the Tokenping bot/)).toBeTruthy();
    expect(screen.getByText(/anyone who knows your wallet address/).textContent).toContain(
      "can look up the email address, Signal username and Telegram username saved for it",
    );
  });

  it("says plainly that settings are not protected by a wallet signature, and never calls them private or secure", () => {
    const { container } = renderPage();

    expect(screen.getByText(/does not yet ask you to sign a message proving that you own the wallet/)).toBeTruthy();
    expect(container.textContent).not.toMatch(/\bprivate\b|\bsecure\b|only you can see/i);
  });

  // The config API answers reads for any address, and writes check only that address's paid access (product §10.9).
  it("says who can read and change alert settings until wallet signatures are checked", () => {
    renderPage();

    expect(screen.getByText(/anyone who knows your wallet address/).textContent).toBe(
      "Until the app checks wallet signatures, anyone who knows your wallet address can look up the email address and Signal username saved for it and, while that wallet's access is active, change or delete its alerts. The public payment records described below show which wallets have paid.",
    );
  });

  it("shows a breadcrumb with matching BreadcrumbList JSON-LD and one h1", () => {
    const { container } = renderPage();
    const [jsonLd] = [...container.querySelectorAll('script[type="application/ld+json"]')].map(script =>
      JSON.parse(script.textContent ?? ""),
    );

    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "Home" }),
    ).toBeTruthy();
    expect(jsonLd.itemListElement.map(({ name }: { name: string }) => name)).toEqual(["Home", "Privacy"]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("dates the page with a machine-readable time", () => {
    renderPage();

    expect(screen.getByText("14 October 2026").getAttribute("dateTime")).toBe("2026-10-14T00:00:00Z");
  });

  it("styles inline links with the base link style and uses no legacy palette", () => {
    const { container } = renderPage();
    // The breadcrumb trail is a shared component with its own styles.
    const page = container.cloneNode(true) as HTMLElement;
    page.querySelector('nav[aria-label="Breadcrumb"]')?.remove();

    for (const name of ["X", "Telegram community", "homepage"])
      expect(screen.getByRole("link", { name }).hasAttribute("class")).toBe(false);
    expect(page.innerHTML).not.toMatch(
      /indigo-|purple-|gray-\d|base-content|base-200|base-300|font-bold|font-semibold/,
    );
  });

  it("renders the privacy page markup", () => {
    expect(renderMarkup(<PrivacyPage />)).toMatchSnapshot();
  });
});
