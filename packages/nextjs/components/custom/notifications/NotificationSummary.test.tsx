// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationSummary } from "~~/components/custom/notifications/NotificationSummary";
import type { NotificationService } from "~~/types/notifications";
import { jsonResponse } from "~~/utils/testing/helpers";
import { renderWithProviders } from "~~/utils/testing/providers";

/*
 * The summary's Send test buttons (the `testSends` prop), with the Telegram status API behind a mocked `fetch`.
 * The card's wiring (the hook, the toasts) is covered in NotificationConfig.test.tsx.
 */

const BOT = "tokenping_bot";
const LIMIT_NOTE = "A test sends this alert and your position as they are now. One per channel every 15 minutes.";

/** What the status API answers for a username; "pending" never answers, "error" fails. */
let telegramAnswer: "linked" | "notLinked" | "pending" | "error";

const fetchMock = vi.fn(async () => {
  if (telegramAnswer === "pending") return new Promise<Response>(() => undefined);
  if (telegramAnswer === "error") return jsonResponse({ error: "Database error" }, 500);
  return jsonResponse({ linked: telegramAnswer === "linked" });
});

type SummaryProps = ComponentProps<typeof NotificationSummary>;

const renderSummary = (props: Partial<SummaryProps> = {}) =>
  renderWithProviders(
    <NotificationSummary
      services={["email", "signal", "telegram"]}
      email="me@example.com"
      signalRecipient="alice.42"
      telegramUsername="alice_eth"
      threshold={1.5}
      currentHealthFactor="2.00"
      showBelowThresholdWarning={false}
      {...props}
    />,
  );

const testSends = ({
  waitFor = () => 0,
  sendingChannel,
}: { waitFor?: (channel: NotificationService) => number; sendingChannel?: NotificationService } = {}) => ({
  waitFor: vi.fn(waitFor),
  sendingChannel,
  onSend: vi.fn<(channel: NotificationService) => void>(),
});

const testButtons = () => screen.queryAllByRole<HTMLButtonElement>("button");
const states = () => testButtons().map(element => [element.textContent, element.disabled]);
const telegramStatusRequests = () => fetchMock.mock.calls.length;

beforeEach(() => {
  telegramAnswer = "linked";
  fetchMock.mockClear();
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("NotificationSummary: Send test", () => {
  it("shows no buttons and no note without testSends (no paid access)", async () => {
    renderSummary();
    await waitFor(() => expect(telegramStatusRequests()).toBe(1));
    expect(testButtons()).toEqual([]);
    expect(screen.queryByText(LIMIT_NOTE)).toBeNull();
  });

  it("puts one button on every channel row, asks each channel's wait, and sends that channel on click", async () => {
    const sends = testSends();
    renderSummary({ testSends: sends });
    await waitFor(() => expect(states()).toHaveLength(3));
    expect(states()).toEqual([
      ["Send test (Email)", false],
      ["Send test (Signal)", false],
      ["Send test (Telegram)", false],
    ]);
    expect(sends.waitFor.mock.calls.map(([channel]) => channel)).toEqual(
      expect.arrayContaining(["email", "signal", "telegram"]),
    );
    expect(screen.getByText(LIMIT_NOTE)).toBeDefined();

    for (const element of testButtons()) fireEvent.click(element);
    expect(sends.onSend.mock.calls).toEqual([["email"], ["signal"], ["telegram"]]);
  });

  it("shows a button only where a recipient is shown, and the note only with at least one", async () => {
    renderSummary({ services: ["email", "signal"], email: "", testSends: testSends() });
    expect(states()).toEqual([["Send test (Signal)", false]]);
    expect(screen.getByText(LIMIT_NOTE)).toBeDefined();
    expect(telegramStatusRequests()).toBe(0);
  });

  it("shows no note when the alert has no channel row to test", () => {
    renderSummary({ services: [], testSends: testSends() });
    expect(testButtons()).toEqual([]);
    expect(screen.queryByText(LIMIT_NOTE)).toBeNull();
  });

  it("turns a cooling-down channel's button off, rounding its wait up to whole minutes", async () => {
    renderSummary({
      testSends: testSends({ waitFor: channel => ({ email: 0, signal: 90_000, telegram: 15 * 60_000 })[channel] }),
    });
    await waitFor(() => expect(telegramStatusRequests()).toBe(1));
    expect(states()).toEqual([
      ["Send test (Email)", false],
      ["Again in 2 min (Signal)", true],
      ["Again in 15 min (Telegram)", true],
    ]);
  });

  it("keeps the sending channel's button busy and turns the others off", async () => {
    renderSummary({ testSends: testSends({ sendingChannel: "email" }) });
    await waitFor(() => expect(telegramStatusRequests()).toBe(1));
    const [email, signal, telegram] = testButtons();
    expect(email.getAttribute("aria-busy")).toBe("true");
    expect(email.disabled).toBe(false);
    expect([signal.disabled, telegram.disabled]).toEqual([true, true]);
  });

  it.each([
    ["has not pressed Start", "notLinked", true],
    ["has pressed Start", "linked", false],
    ["is still being checked", "pending", false],
    ["could not be checked", "error", false],
  ] as const)("turns Telegram's button off only while the username %s", async (_, answer, off) => {
    telegramAnswer = answer;
    const { queryClient } = renderSummary({ services: ["telegram"], testSends: testSends() });
    await waitFor(() => expect(telegramStatusRequests()).toBeGreaterThan(0));
    // Settled: answered, or failed after its one retry (a second apart).
    const settled = answer === "pending" ? "pending" : answer === "error" ? "error" : "success";
    await waitFor(
      () => expect(queryClient.getQueryState(["telegramUsernameStatus", "alice_eth"])?.status).toBe(settled),
      { timeout: 3000 },
    );
    expect(screen.queryByRole("note") !== null).toBe(answer === "notLinked");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Send test (Telegram)" }).disabled).toBe(off);
  });

  it("keeps Telegram's button off while not linked even without a bot to link to", async () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    telegramAnswer = "notLinked";
    renderSummary({ services: ["telegram"], testSends: testSends() });
    await waitFor(() =>
      expect(screen.getByRole<HTMLButtonElement>("button", { name: "Send test (Telegram)" }).disabled).toBe(true),
    );
    expect(screen.queryByRole("note")).toBeNull();
  });
});
