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
    expect(
      screen.getByText(
        "When you last sent a test message on each channel, to allow one test per channel every 15 minutes.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("A log of the alerts we sent.")).toBeTruthy();
    // The session cookie after signing in with the wallet, and the nonce cookie while signing in: nothing else.
    expect(screen.getByText(/the site uses none/).textContent).toContain(
      "When you sign in with your wallet, Tokenping sets one cookie that only says which wallet signed in; it lasts 7 days or until you disconnect the wallet on this site. While you sign in, a second cookie holds the sign-in request for five minutes.",
    );
    // Everything the app itself keeps in the browser: next-themes, wagmi/RainbowKit, the wallets that signed in (so a
    // lapsed one is offered a sign-in) and the attribution prompt flag.
    expect(screen.getByText(/the site uses none/).textContent).toContain(
      'Your browser keeps your theme choice, your wallet connection, which wallets have signed in on it and whether it has already shown you the "How did you hear about Tokenping?" question in its own local storage.',
    );
    expect(screen.getByText(/How did you hear about Tokenping\?.*we store your answer/)).toBeTruthy();
  });

  it("names every service that handles data, without Telegram while the bot is not configured", () => {
    renderPage();

    expect(processorNames()).toEqual([
      "Vercel",
      "Vercel Web Analytics",
      "Supabase",
      "Resend",
      "Fly.io (our Signal relay)",
      "RPC providers (PublicNode, Alchemy and the networks' public endpoints)",
      "WalletConnect",
    ]);
    expect(screen.queryByText(/Telegram username you type/)).toBeNull();
  });

  it("adds Telegram's data, processor and /stop once the bot is configured", () => {
    cleanup();
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "tokenping_bot");
    renderPage();

    expect(processorNames()).toContain("Telegram");
    // The username typed into the alert, then the chat once that account presses Start; no wallet-bound code any more.
    expect(screen.getByText(/^If you choose Telegram/).textContent).toBe(
      "If you choose Telegram, we store the Telegram username you type into the alert. When that account presses Start in the Tokenping bot, we also store its chat ID and when it pressed Start, so alerts can reach it. Anyone can check whether a Telegram username has pressed Start in the bot.",
    );
    expect(screen.queryByText(/one-time code/)).toBeNull();
    expect(screen.getByText(/Sending \/stop to the Tokenping bot/)).toBeTruthy();
    expect(screen.getByText(/^Only someone who can sign with your wallet/).textContent).toContain(
      "can see the email address, Signal username and Telegram username saved for it",
    );
  });

  it("says that seeing or changing alert settings takes a wallet signature, and never calls them private or secure", () => {
    const { container } = renderPage();

    expect(screen.getByText(/^Alert settings are tied to a wallet address/).textContent).toBe(
      "Alert settings are tied to a wallet address, not to an account with a password. To see or change them, you sign a message with that wallet, which proves the address is yours. It is not a transaction and costs no gas, and one signature lasts 7 days on that browser.",
    );
    expect(container.textContent).not.toMatch(/\bprivate\b|\bsecure\b|only you can see/i);
  });

  // The alert API acts only for the wallet of the session cookie, which Sign-in with Ethereum sets.
  it("says only the wallet's signer can read and change its alert settings, while payments stay public", () => {
    renderPage();

    expect(screen.getByText(/^Only someone who can sign with your wallet/).textContent).toBe(
      "Only someone who can sign with your wallet can see the email address and Signal username saved for it, or change or delete its alerts. The public payment records described below still show which wallets have paid.",
    );
    expect(screen.queryByText(/anyone who knows your wallet address/)).toBeNull();
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

    expect(screen.getByText("19 October 2026").getAttribute("dateTime")).toBe("2026-10-19T00:00:00Z");
  });

  it("styles inline links with the base link style and uses no legacy palette", () => {
    const { container } = renderPage();
    // The breadcrumb trail is a shared component with its own styles.
    const page = container.cloneNode(true) as HTMLElement;
    page.querySelector('nav[aria-label="Breadcrumb"]')?.remove();

    for (const name of ["X", "Telegram", "Signal", "homepage"])
      expect(screen.getByRole("link", { name }).hasAttribute("class")).toBe(false);
    expect(page.innerHTML).not.toMatch(
      /indigo-|purple-|gray-\d|base-content|base-200|base-300|font-bold|font-semibold/,
    );
  });

  it("renders the privacy page markup", () => {
    expect(renderMarkup(<PrivacyPage />)).toMatchSnapshot();
  });
});
