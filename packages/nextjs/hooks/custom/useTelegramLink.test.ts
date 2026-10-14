// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useTelegramLink } from "~~/hooks/custom/useTelegramLink";
import type { TelegramLinkStatus } from "~~/types/notifications";
import { deferred } from "~~/utils/testing/helpers";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({
  createLinkToken: vi.fn(),
  getLinkStatus: vi.fn(),
  disconnect: vi.fn(),
  toasts: [] as string[],
}));

vi.mock("~~/services/telegram/telegramClient", () => ({
  telegramClient: {
    createLinkToken: mocks.createLinkToken,
    getLinkStatus: mocks.getLinkStatus,
    disconnect: mocks.disconnect,
  },
}));
vi.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: (message: string) => mocks.toasts.push(`success: ${message}`),
    error: (message: string) => mocks.toasts.push(`error: ${message}`),
  },
}));

const ADDRESS = "0xAbC0000000000000000000000000000000000001";
const OTHER_ADDRESS = "0xDeF0000000000000000000000000000000000002";
const DEEP_LINK = "https://t.me/bot?start=tok";
const NOW = Date.parse("2026-10-14T12:00:00.000Z");
const TEN_MINUTES = 10 * 60 * 1000;

/** What telegramClient.createLinkToken resolves: the API body plus the lifetime measured on the server's clock. */
const linkToken = (expiresInMs: number | null, expiresAt = new Date(NOW + TEN_MINUTES).toISOString()) => ({
  token: "tok",
  botUsername: "bot",
  expiresAt,
  deepLink: DEEP_LINK,
  expiresInMs,
});
const LINK_TOKEN = linkToken(TEN_MINUTES);

const LINKED: TelegramLinkStatus = { linked: true, chatId: "777", username: "bob", linkedAt: "now" };

let popup: { opener: unknown; location: { href: string }; close: ReturnType<typeof vi.fn> };
let openSpy: ReturnType<typeof vi.spyOn>;

const render = (address: string | undefined, queryClient = createTestQueryClient()) =>
  renderHookWithProviders(({ address }: { address: string | undefined }) => useTelegramLink(address), {
    initialProps: { address },
    queryClient,
  });

/** Advances the fake clock and lets settled requests reach React. */
const flush = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));

const renderLoaded = async (address: string | undefined, queryClient?: ReturnType<typeof createTestQueryClient>) => {
  const view = render(address, queryClient);
  await flush();
  return view;
};

const startConnect = async (view: Awaited<ReturnType<typeof renderLoaded>>) => {
  act(() => view.result.current.connect());
  await flush();
};

// react-query notifies observers from a 0ms timeout, and a fake 0ms timeout set while the clock ticks is due 1ms later,
// so a poll answered during a tick would not reach React until the next one. Notify on a microtask instead.
beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  popup = { opener: window, location: { href: "" }, close: vi.fn() };
  openSpy = vi.spyOn(window, "open").mockImplementation(() => popup as unknown as Window);
  mocks.createLinkToken.mockReset().mockResolvedValue(LINK_TOKEN);
  mocks.getLinkStatus.mockReset().mockResolvedValue({ linked: false });
  mocks.disconnect.mockReset().mockResolvedValue(undefined);
  mocks.toasts = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useTelegramLink: link status", () => {
  it("makes no request and reports no link without a wallet", async () => {
    const { result } = await renderLoaded(undefined);
    expect(result.current).toMatchObject({ isLoaded: true, chatId: undefined, username: undefined });
    expect(mocks.getLinkStatus).not.toHaveBeenCalled();
  });

  it("reads the wallet's link from the link API, cached under the normalized address", async () => {
    mocks.getLinkStatus.mockResolvedValue(LINKED);
    const { result, queryClient } = render(ADDRESS);
    expect(result.current.isLoaded).toBe(false);
    await flush();
    expect(result.current).toMatchObject({ isLoaded: true, chatId: "777", username: "bob", isConnecting: false });
    expect(mocks.getLinkStatus.mock.calls).toEqual([[ADDRESS]]);
    expect(queryClient.getQueryData(["telegramLink", ADDRESS.toLowerCase()])).toEqual(LINKED);
  });

  it("treats a linked status without a chat id as not linked", async () => {
    mocks.getLinkStatus.mockResolvedValue({ linked: true });
    const { result } = await renderLoaded(ADDRESS);
    expect(result.current.chatId).toBeUndefined();
  });

  it("shares one request and one link between components", async () => {
    mocks.getLinkStatus.mockResolvedValue(LINKED);
    const queryClient = createTestQueryClient();
    const first = render(ADDRESS, queryClient);
    const second = render(ADDRESS, queryClient);
    await flush();
    expect([first.result.current.chatId, second.result.current.chatId]).toEqual(["777", "777"]);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(1);
  });

  it("stays loaded while the status is fetched again after a failed load", async () => {
    mocks.getLinkStatus
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockReturnValueOnce(new Promise(() => undefined));
    const queryClient = createTestQueryClient();
    const first = await renderLoaded(ADDRESS, queryClient);
    expect(first.result.current).toMatchObject({ isLoaded: true, chatId: undefined });

    // Another card mounting (after a chain switch, say) fetches the failed status again.
    render(ADDRESS, queryClient);
    await flush();
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(2);
    expect(first.result.current.isLoaded).toBe(true);
  });

  it("does not show the previous wallet's link after a wallet switch", async () => {
    mocks.getLinkStatus.mockResolvedValueOnce(LINKED).mockReturnValueOnce(new Promise(() => undefined));
    const { result, rerender } = await renderLoaded(ADDRESS);
    rerender({ address: OTHER_ADDRESS });
    expect(result.current).toMatchObject({ isLoaded: false, chatId: undefined });
    expect(mocks.getLinkStatus.mock.calls).toEqual([[ADDRESS], [OTHER_ADDRESS]]);
  });
});

describe("useTelegramLink: connect", () => {
  it("requires a wallet", async () => {
    const { result } = await renderLoaded(undefined);
    act(() => result.current.connect());
    expect(mocks.toasts).toEqual(["error: Connect your wallet first"]);
    expect(openSpy).not.toHaveBeenCalled();
    expect(mocks.createLinkToken).not.toHaveBeenCalled();
    expect(result.current.isConnecting).toBe(false);
  });

  it("opens the Telegram tab inside the click, then points it at the bot once the token arrives", async () => {
    const token = deferred<ReturnType<typeof linkToken>>();
    mocks.createLinkToken.mockReturnValue(token.promise);
    const { result } = await renderLoaded(ADDRESS);

    act(() => result.current.connect());
    expect(openSpy.mock.calls).toEqual([["", "_blank"]]);
    expect(popup.location.href).toBe("");
    await flush();
    expect(mocks.createLinkToken.mock.calls).toEqual([[ADDRESS]]);
    expect(result.current).toMatchObject({ isConnecting: true, deepLink: undefined });

    token.resolve(LINK_TOKEN);
    await flush();
    expect(popup.opener).toBeNull();
    expect(popup.location.href).toBe(DEEP_LINK);
    expect(result.current).toMatchObject({ isConnecting: true, deepLink: DEEP_LINK });
    expect(popup.close).not.toHaveBeenCalled();
  });

  it("still offers the deep link when the popup was blocked", async () => {
    openSpy.mockReturnValue(null);
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    expect(view.result.current).toMatchObject({ isConnecting: true, deepLink: DEEP_LINK });
  });

  it("polls every 2s until linked, with exactly one success toast, then stops", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(1);

    await flush(2000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(2);

    // A network blip keeps polling and keeps the last known status.
    mocks.getLinkStatus.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await flush(2000);
    expect(view.result.current).toMatchObject({ isConnecting: true, chatId: undefined });

    // A linked status without a chat id keeps polling.
    mocks.getLinkStatus.mockResolvedValueOnce({ linked: true });
    await flush(2000);
    expect(view.result.current.isConnecting).toBe(true);

    mocks.getLinkStatus.mockResolvedValue({ linked: true, chatId: "777", username: null });
    await flush(2000);
    expect(view.result.current).toMatchObject({
      chatId: "777",
      username: null,
      isConnecting: false,
      deepLink: undefined,
    });
    expect(mocks.toasts).toEqual(["success: Telegram connected"]);

    await flush(20_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(5);
    expect(mocks.toasts).toHaveLength(1);
  });

  it("mentions the Telegram username when the link has one", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    mocks.getLinkStatus.mockResolvedValue(LINKED);
    await flush(2000);
    expect(view.result.current).toMatchObject({ chatId: "777", username: "bob" });
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("never starts a poll while the previous one is still in flight", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    const slow = deferred<TelegramLinkStatus>();
    mocks.getLinkStatus.mockReturnValueOnce(slow.promise);
    await flush(2000);
    await flush(6000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(2);

    slow.resolve(LINKED);
    await flush();
    expect(view.result.current).toMatchObject({ chatId: "777", isConnecting: false });
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("keeps polling until the link token expires, not for a fixed two minutes", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    await flush(3 * 60 * 1000);
    expect(view.result.current.isConnecting).toBe(true);
    expect(mocks.toasts).toEqual([]);

    await flush(TEN_MINUTES - 3 * 60 * 1000);
    expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
    expect(view.result.current).toMatchObject({ isConnecting: false, deepLink: undefined });

    const calls = mocks.getLinkStatus.mock.calls.length;
    await flush(20_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(calls);
    expect(mocks.toasts).toHaveLength(1);
  });

  it("waits for the token's lifetime by the server's clock when the device clock runs ahead", async () => {
    // The device clock is 15 minutes ahead, so by its own clock the token expired 5 minutes ago.
    mocks.createLinkToken.mockResolvedValue(linkToken(TEN_MINUTES, new Date(NOW - 5 * 60 * 1000).toISOString()));
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    await flush(TEN_MINUTES - 1);
    expect(view.result.current.isConnecting).toBe(true);
    expect(mocks.getLinkStatus.mock.calls.length).toBeGreaterThan(1);
    await flush(1);
    expect(view.result.current.isConnecting).toBe(false);
    expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
  });

  it.each([null, 0])(
    "falls back to a two-minute window when the token's lifetime is unknown (%s)",
    async expiresInMs => {
      mocks.createLinkToken.mockResolvedValue(linkToken(expiresInMs));
      const view = await renderLoaded(ADDRESS);
      await startConnect(view);
      await flush(2 * 60 * 1000 - 1);
      expect(view.result.current.isConnecting).toBe(true);
      await flush(1);
      expect(view.result.current.isConnecting).toBe(false);
      expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
    },
  );

  it.each([
    [new Error("Telegram is not configured on this server"), "Telegram is not configured on this server"],
    ["not an Error", "Failed to connect Telegram"],
  ])("reports a failed link token request (%s) and closes the blank tab", async (rejection, message) => {
    mocks.createLinkToken.mockRejectedValue(rejection);
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    expect(mocks.toasts).toEqual([`error: ${message}`]);
    expect(popup.close).toHaveBeenCalledTimes(1);
    expect(view.result.current).toMatchObject({ isConnecting: false, deepLink: undefined });
  });

  it("cancelConnect stops polling; a late link still shows as linked but without a toast", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    const slow = deferred<TelegramLinkStatus>();
    mocks.getLinkStatus.mockReturnValueOnce(slow.promise);
    await flush(2000);

    act(() => view.result.current.cancelConnect());
    expect(view.result.current).toMatchObject({ isConnecting: false, deepLink: undefined });
    slow.resolve(LINKED);
    await flush(20_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(2);
    expect(view.result.current.chatId).toBe("777");
    expect(mocks.toasts).toEqual([]);
  });

  it("cancelConnect before the token arrives closes the blank tab and ignores the token", async () => {
    const token = deferred<ReturnType<typeof linkToken>>();
    mocks.createLinkToken.mockReturnValue(token.promise);
    const view = await renderLoaded(ADDRESS);
    act(() => view.result.current.connect());
    act(() => view.result.current.cancelConnect());
    expect(popup.close).toHaveBeenCalledTimes(1);

    token.resolve(LINK_TOKEN);
    await flush(20_000);
    expect(popup.location.href).toBe("");
    expect(view.result.current).toMatchObject({ isConnecting: false, deepLink: undefined });
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(1);
  });

  it("closes the blank tab when unmounted before the token arrives", async () => {
    const token = deferred<typeof LINK_TOKEN>();
    mocks.createLinkToken.mockReturnValue(token.promise);
    const view = await renderLoaded(ADDRESS);
    act(() => view.result.current.connect());
    view.unmount();
    expect(popup.close).toHaveBeenCalledTimes(1);
    token.resolve(LINK_TOKEN);
    await flush();
    expect(popup.location.href).toBe("");
  });

  it("leaves the Telegram tab open when unmounted after the token arrived", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    view.unmount();
    expect(popup.close).not.toHaveBeenCalled();
  });

  it("stops polling on unmount", async () => {
    const view = await renderLoaded(ADDRESS);
    await startConnect(view);
    view.unmount();
    await flush(20_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(1);
    expect(mocks.toasts).toEqual([]);
  });
});

describe("useTelegramLink: disconnect", () => {
  it("disconnects and marks the wallet unlinked for every component", async () => {
    mocks.getLinkStatus.mockResolvedValue(LINKED);
    const queryClient = createTestQueryClient();
    const view = await renderLoaded(ADDRESS, queryClient);
    const other = render(ADDRESS, queryClient);

    const request = deferred<void>();
    mocks.disconnect.mockReturnValue(request.promise);
    act(() => view.result.current.disconnect());
    await flush();
    expect(view.result.current.isDisconnecting).toBe(true);
    request.resolve();
    await flush();
    expect(mocks.disconnect.mock.calls).toEqual([[ADDRESS]]);
    expect(view.result.current).toMatchObject({ chatId: undefined, username: undefined, isDisconnecting: false });
    expect(other.result.current.chatId).toBeUndefined();
    expect(mocks.toasts).toEqual(["success: Telegram disconnected"]);
  });

  it("keeps the link and reports a failed disconnect", async () => {
    mocks.getLinkStatus.mockResolvedValue(LINKED);
    mocks.disconnect.mockRejectedValue(new Error("Active paid access required"));
    const view = await renderLoaded(ADDRESS);
    act(() => view.result.current.disconnect());
    await flush();
    expect(view.result.current).toMatchObject({ chatId: "777", username: "bob", isDisconnecting: false });
    expect(mocks.toasts).toEqual(["error: Active paid access required"]);
  });

  it("does nothing without a wallet", async () => {
    const view = await renderLoaded(undefined);
    act(() => view.result.current.disconnect());
    await flush();
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.toasts).toEqual([]);
  });
});
