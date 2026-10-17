// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TELEGRAM_STATUS_POLL_INTERVAL_MS, TELEGRAM_STATUS_POLL_TIMEOUT_MS } from "~~/constants/notifications";
import { useTelegramUsernameStatus } from "~~/hooks/custom/useTelegramUsernameStatus";
import { deferred } from "~~/utils/testing/helpers";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({ getUsernameStatus: vi.fn() }));

vi.mock("~~/services/telegram/telegramClient", () => ({
  telegramClient: { getUsernameStatus: mocks.getUsernameStatus },
}));

const NOW = Date.parse("2026-10-14T12:00:00.000Z");
/** How long typing has to pause before a username is checked. */
const TYPING_PAUSE_MS = 400;
const INTERVAL = TELEGRAM_STATUS_POLL_INTERVAL_MS;
const TIMEOUT = TELEGRAM_STATUS_POLL_TIMEOUT_MS;

/** The usernames that have pressed Start in the bot, as the status API knows them. */
let linked: Set<string>;

const render = (username: string, options?: { poll?: boolean }, queryClient = createTestQueryClient()) =>
  renderHookWithProviders(({ username }: { username: string }) => useTelegramUsernameStatus(username, options), {
    initialProps: { username },
    queryClient,
  });

/** Advances the fake clock and lets settled requests reach React. */
const flush = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));

const checkedNames = () => mocks.getUsernameStatus.mock.calls.map(([username]) => username);

// react-query notifies observers from a 0ms timeout, which fake timers push 1ms past a tick; notify on a microtask.
beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  linked = new Set();
  mocks.getUsernameStatus
    .mockReset()
    .mockImplementation(async (username: string) => ({ linked: linked.has(username) }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useTelegramUsernameStatus: what is checked", () => {
  it.each(["", "   ", "@", "https://t.me/", "rom", "alice-eth", "1alice", "alice_", "a".repeat(33)])(
    "is idle and asks nothing for %j",
    async raw => {
      const { result } = render(raw);
      expect(result.current).toEqual({ username: null, status: "idle" });
      await flush(TYPING_PAUSE_MS + 5000);
      expect(result.current).toEqual({ username: null, status: "idle" });
      expect(mocks.getUsernameStatus).not.toHaveBeenCalled();
    },
  );

  it.each([" @Alice_Eth ", "https://t.me/Alice_Eth", "t.me/alice_eth/", "ALICE_ETH"])(
    "normalizes %j to alice_eth before asking, and caches the answer under that name",
    async raw => {
      const { result, queryClient } = render(raw);
      expect(result.current).toEqual({ username: "alice_eth", status: "checking" });
      await flush();
      expect(checkedNames()).toEqual(["alice_eth"]);
      expect(result.current).toEqual({ username: "alice_eth", status: "notLinked" });
      expect(queryClient.getQueryData(["telegramUsernameStatus", "alice_eth"])).toEqual({ linked: false });
    },
  );

  it("shares one answer between every component checking the same username", async () => {
    const queryClient = createTestQueryClient();
    const form = render("@alice_eth", {}, queryClient);
    const summary = render("alice_eth", {}, queryClient);
    await flush();
    expect([form.result.current.status, summary.result.current.status]).toEqual(["notLinked", "notLinked"]);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(1);
  });
});

describe("useTelegramUsernameStatus: the answers", () => {
  it("is checking until the first answer arrives", async () => {
    const answer = deferred<{ linked: boolean }>();
    mocks.getUsernameStatus.mockReturnValue(answer.promise);
    const { result } = render("alice_eth");
    await flush(10_000);
    expect(result.current.status).toBe("checking");
    answer.resolve({ linked: true });
    await flush();
    expect(result.current.status).toBe("linked");
  });

  it("reports linked for a username that pressed Start and notLinked for one that did not", async () => {
    linked.add("alice_eth");
    const linkedView = render("alice_eth");
    const otherView = render("someone_else");
    await flush();
    expect(linkedView.result.current).toEqual({ username: "alice_eth", status: "linked" });
    expect(otherView.result.current).toEqual({ username: "someone_else", status: "notLinked" });
  });

  it("asks once more after a failure, then reports the status as unknown instead of not linked", async () => {
    mocks.getUsernameStatus.mockRejectedValue(new Error("Failed to check the Telegram username"));
    const { result } = render("alice_eth");
    await flush();
    // The retry is on its way: still checking.
    expect(result.current.status).toBe("checking");
    await flush(1000);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ username: "alice_eth", status: "unknown" });
  });

  it("asks again when the tab gets focus back, so a Start pressed in Telegram shows up", async () => {
    mocks.getUsernameStatus.mockRejectedValueOnce(new Error("down")).mockRejectedValueOnce(new Error("down"));
    const { result } = render("alice_eth");
    await flush(1000);
    expect(result.current.status).toBe("unknown");

    linked.add("alice_eth");
    await act(async () => {
      window.dispatchEvent(new Event("visibilitychange"));
    });
    await flush();
    expect(result.current.status).toBe("linked");
  });
});

describe("useTelegramUsernameStatus: while typing", () => {
  it("is checking while typing and asks only for the name typing paused on", async () => {
    linked.add("other_name");
    const { result, rerender } = render("alice_eth");
    await flush();
    expect(result.current.status).toBe("notLinked");

    rerender({ username: "other_n" });
    expect(result.current).toEqual({ username: "other_n", status: "checking" });
    await flush(TYPING_PAUSE_MS - 100);
    rerender({ username: "Other_Name" });
    await flush(TYPING_PAUSE_MS - 1);
    expect(result.current).toEqual({ username: "other_name", status: "checking" });
    expect(checkedNames()).toEqual(["alice_eth"]);

    await flush(1);
    expect(checkedNames()).toEqual(["alice_eth", "other_name"]);
    expect(result.current).toEqual({ username: "other_name", status: "linked" });
  });

  it("turns idle at once when the text stops being a valid username", async () => {
    const { result, rerender } = render("alice_eth");
    await flush();
    rerender({ username: "alice eth" });
    expect(result.current).toEqual({ username: null, status: "idle" });
    await flush(TYPING_PAUSE_MS);
    expect(result.current.status).toBe("idle");
    expect(checkedNames()).toEqual(["alice_eth"]);
  });
});

describe("useTelegramUsernameStatus: polling", () => {
  it("does not ask again without poll", async () => {
    const { result } = render("alice_eth");
    await flush();
    linked.add("alice_eth");
    await flush(10 * INTERVAL);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("notLinked");
  });

  it("with poll, asks again every few seconds while not linked, and stops once linked", async () => {
    const { result } = render("alice_eth", { poll: true });
    await flush();
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(1);
    await flush(INTERVAL - 1);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(1);
    await flush(1);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(2);
    await flush(INTERVAL);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("notLinked");

    linked.add("alice_eth");
    await flush(INTERVAL);
    expect(result.current.status).toBe("linked");
    const calls = mocks.getUsernameStatus.mock.calls.length;
    await flush(20 * INTERVAL);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(calls);
  });

  it("with poll, gives up after the timeout instead of asking forever", async () => {
    const { result } = render("alice_eth", { poll: true });
    await flush(TIMEOUT - INTERVAL);
    const beforeTimeout = mocks.getUsernameStatus.mock.calls.length;
    expect(beforeTimeout).toBeGreaterThan(TIMEOUT / INTERVAL / 2);
    // Still asking right up to the timeout.
    await flush(INTERVAL);
    expect(mocks.getUsernameStatus.mock.calls.length).toBeGreaterThan(beforeTimeout);

    await flush(INTERVAL);
    const afterTimeout = mocks.getUsernameStatus.mock.calls.length;
    await flush(10 * 60 * 1000);
    expect(mocks.getUsernameStatus).toHaveBeenCalledTimes(afterTimeout);
    expect(result.current.status).toBe("notLinked");
  });

  it("with poll, measures the timeout from the latest username typed", async () => {
    const { rerender } = render("alice_eth", { poll: true });
    await flush(TIMEOUT + 2 * INTERVAL);
    rerender({ username: "other_name" });
    await flush(TYPING_PAUSE_MS);
    const before = checkedNames().filter(name => name === "other_name").length;
    expect(before).toBe(1);
    await flush(3 * INTERVAL);
    expect(checkedNames().filter(name => name === "other_name")).toHaveLength(4);
  });
});
