import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTelegramLink } from "~~/hooks/custom/useTelegramLink";
import { renderHook } from "~~/utils/testing/hookHarness";

const mocks = vi.hoisted(() => ({
  createLinkToken: vi.fn(),
  getLinkStatus: vi.fn(),
  disconnect: vi.fn(),
  toasts: [] as string[],
  opened: [] as unknown[][],
}));

vi.mock("react", async importOriginal =>
  (await import("~~/utils/testing/hookHarness")).withFakeHooks(await importOriginal()),
);
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
const DEEP_LINK = "https://t.me/bot?start=tok";

const render = (address: string | undefined) => renderHook(() => useTelegramLink(address));

/** Advances to the next poll and lets its request settle. */
const tick = async (view: ReturnType<typeof render>, ms = 2000) => {
  await vi.advanceTimersByTimeAsync(ms);
  await view.act();
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
  vi.stubGlobal("window", { open: (...args: unknown[]) => mocks.opened.push(args) });
  mocks.createLinkToken.mockReset().mockResolvedValue({ deepLink: DEEP_LINK });
  mocks.getLinkStatus.mockReset().mockResolvedValue({ linked: false });
  mocks.disconnect.mockReset().mockResolvedValue(undefined);
  mocks.toasts = [];
  mocks.opened = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useTelegramLink", () => {
  it("starts unlinked and idle, with a stable setLink", () => {
    const view = render(ADDRESS);
    const { setLink } = view.current;
    expect(view.current).toMatchObject({
      chatId: undefined,
      username: undefined,
      isConnecting: false,
      isDisconnecting: false,
    });
    view.flush();
    expect(view.current.setLink).toBe(setLink);
  });

  it("setLink hydrates the link from the config API", async () => {
    const view = render(ADDRESS);
    await view.act(() => view.current.setLink("555", undefined));
    expect([view.current.chatId, view.current.username]).toEqual(["555", undefined]);
  });

  it("requires a wallet to connect", async () => {
    const view = render(undefined);
    await view.act(() => view.current.connect());
    expect(mocks.toasts).toEqual(["error: Connect your wallet first"]);
    expect(mocks.createLinkToken).not.toHaveBeenCalled();
    expect(view.current.isConnecting).toBe(false);
  });

  it("opens the deep link and polls every 2s until linked, then stops", async () => {
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    expect(mocks.createLinkToken).toHaveBeenCalledWith(ADDRESS);
    expect(mocks.opened).toEqual([[DEEP_LINK, "_blank", "noopener,noreferrer"]]);
    expect(view.current.isConnecting).toBe(true);
    expect(mocks.getLinkStatus).not.toHaveBeenCalled();

    await tick(view);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(1);
    expect(mocks.getLinkStatus).toHaveBeenCalledWith(ADDRESS);

    mocks.getLinkStatus.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await tick(view);
    expect(view.current.isConnecting).toBe(true);
    expect(mocks.toasts).toEqual([]);

    // A linked status without a chat id keeps polling.
    mocks.getLinkStatus.mockResolvedValueOnce({ linked: true });
    await tick(view);
    expect(view.current.isConnecting).toBe(true);

    mocks.getLinkStatus.mockResolvedValueOnce({ linked: true, chatId: "777" });
    await tick(view);
    expect(view.current).toMatchObject({ chatId: "777", username: null, isConnecting: false });
    expect(mocks.toasts).toEqual(["success: Telegram connected"]);

    await tick(view, 10_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(4);
  });

  it("mentions the Telegram username when the link has one", async () => {
    mocks.getLinkStatus.mockResolvedValue({ linked: true, chatId: "777", username: "bob" });
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    await tick(view);
    expect(view.current).toMatchObject({ chatId: "777", username: "bob" });
    expect(mocks.toasts).toEqual(["success: Telegram connected as @bob"]);
  });

  it("times out after the first poll past two minutes", async () => {
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    await tick(view, 120_000);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(60);
    expect(view.current.isConnecting).toBe(true);

    await tick(view);
    expect(mocks.getLinkStatus).toHaveBeenCalledTimes(60);
    expect(mocks.toasts).toEqual(["error: Telegram link timed out. Try again."]);
    expect(view.current.isConnecting).toBe(false);

    await tick(view, 10_000);
    expect(mocks.toasts).toHaveLength(1);
  });

  it.each([
    [new Error("Telegram is not configured on this server"), "Telegram is not configured on this server"],
    ["not an Error", "Failed to connect Telegram"],
  ])("reports a failed link token request (%s)", async (rejection, message) => {
    mocks.createLinkToken.mockRejectedValue(rejection);
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    expect(mocks.toasts).toEqual([`error: ${message}`]);
    expect(view.current.isConnecting).toBe(false);
    expect(mocks.opened).toEqual([]);
  });

  it("stopPolling clears the timer and the connecting state", async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    await view.act(() => view.current.stopPolling());
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(view.current.isConnecting).toBe(false);
    await tick(view, 10_000);
    expect(mocks.getLinkStatus).not.toHaveBeenCalled();
    // A second stop has no timer left to clear.
    await view.act(() => view.current.stopPolling());
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("stops polling on unmount", async () => {
    const view = render(ADDRESS);
    await view.act(() => view.current.connect());
    view.unmount();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(mocks.getLinkStatus).not.toHaveBeenCalled();
  });

  it("disconnects and clears the link", async () => {
    const view = render(ADDRESS);
    await view.act(() => view.current.setLink("555", "bob"));
    await view.act(() => view.current.disconnect());
    expect(mocks.disconnect).toHaveBeenCalledWith(ADDRESS);
    expect(view.current).toMatchObject({ chatId: undefined, username: undefined, isDisconnecting: false });
    expect(mocks.toasts).toEqual(["success: Telegram disconnected"]);
  });

  it("keeps the link and reports a failed disconnect", async () => {
    mocks.disconnect.mockRejectedValue(new Error("Active paid access required"));
    const view = render(ADDRESS);
    await view.act(() => view.current.setLink("555", "bob"));
    await view.act(() => view.current.disconnect());
    expect(view.current).toMatchObject({ chatId: "555", username: "bob", isDisconnecting: false });
    expect(mocks.toasts).toEqual(["error: Active paid access required"]);
  });

  it("does nothing on disconnect without a wallet", async () => {
    const view = render(undefined);
    await view.act(() => view.current.disconnect());
    expect(mocks.disconnect).not.toHaveBeenCalled();
    expect(mocks.toasts).toEqual([]);
  });
});
