// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useNotificationTests } from "~~/hooks/custom/useNotificationTests";
import { TestSendError } from "~~/services/notifications/notificationTestClient";
import { deferred } from "~~/utils/testing/helpers";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const mocks = vi.hoisted(() => ({
  address: undefined as string | undefined,
  getRetryTimes: vi.fn(),
  send: vi.fn(),
}));

vi.mock("wagmi", () => ({ useAccount: () => ({ address: mocks.address }) }));
vi.mock("~~/services/notifications/notificationTestClient", async importOriginal => ({
  ...(await importOriginal<typeof import("~~/services/notifications/notificationTestClient")>()),
  notificationTestClient: { getRetryTimes: mocks.getRetryTimes, send: mocks.send },
}));

const NOW = Date.parse("2026-10-14T12:00:00.000Z");
const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const OTHER_ADDRESS = "0x1234500000000000000000000000000000000002";
const MARKET = { chainId: 42161, market: "v3" };
const MINUTE = 60_000;
/** How often the hook's clock moves on while a channel cools down. */
const TICK_MS = 15_000;

const iso = (msFromNow: number) => new Date(NOW + msFromNow).toISOString();
const NONE = { email: null, signal: null, telegram: null };

const render = (queryClient = createTestQueryClient()) =>
  renderHookWithProviders(() => useNotificationTests(), { queryClient });

/** Advances the fake clock and lets settled requests reach React. */
const flush = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));

const waits = (result: { current: ReturnType<typeof useNotificationTests> }) =>
  (["email", "signal", "telegram"] as const).map(channel => result.current.waitFor(channel));

beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"], now: NOW });
  mocks.address = ADDRESS;
  mocks.getRetryTimes.mockReset().mockResolvedValue(NONE);
  mocks.send.mockReset().mockResolvedValue({ sentAt: iso(0), retryAt: iso(15 * MINUTE) });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useNotificationTests: the cooldowns", () => {
  it("reads the connected wallet's cooldowns once and caches them under the lowercased wallet", async () => {
    mocks.getRetryTimes.mockResolvedValue({ email: null, signal: iso(12 * MINUTE), telegram: null });
    const { result, queryClient } = render();
    // Nothing is known yet: every button is on until the server says otherwise.
    expect(waits(result)).toEqual([0, 0, 0]);
    await flush();

    expect(mocks.getRetryTimes.mock.calls).toEqual([[ADDRESS]]);
    expect(queryClient.getQueryData(["notificationTestRetryTimes", ADDRESS.toLowerCase()])).toEqual({
      email: null,
      signal: iso(12 * MINUTE),
      telegram: null,
    });
    expect(waits(result)).toEqual([0, 12 * MINUTE, 0]);
    expect(result.current.retryAtFor("signal")).toBe(NOW + 12 * MINUTE);
    expect(result.current.retryAtFor("email")).toBeNull();
    expect(result.current.sendingChannel).toBeUndefined();
  });

  it("treats a time already past, or one it cannot read, as no cooldown", async () => {
    mocks.getRetryTimes.mockResolvedValue({ email: iso(-1), signal: iso(0), telegram: "soon" });
    const { result } = render();
    await flush();
    expect(waits(result)).toEqual([0, 0, 0]);
    expect(["email", "signal", "telegram"].map(channel => result.current.retryAtFor(channel as "email"))).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("asks nothing without a connected wallet, and refuses to send", async () => {
    mocks.address = undefined;
    const { result } = render();
    await flush();
    expect(mocks.getRetryTimes).not.toHaveBeenCalled();
    expect(waits(result)).toEqual([0, 0, 0]);
    await act(() => expect(result.current.send(MARKET, "email")).rejects.toThrow(new Error("Wallet not connected")));
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("keeps every button on when the cooldowns cannot be read", async () => {
    mocks.getRetryTimes.mockRejectedValue(new Error("Database error"));
    const { result } = render();
    await flush();
    expect(waits(result)).toEqual([0, 0, 0]);
  });

  it("moves its clock on while a channel cools down, so the wait reaches 0 and the button comes back by itself", async () => {
    mocks.getRetryTimes.mockResolvedValue({ ...NONE, telegram: iso(20_000) });
    const { result } = render();
    await flush();
    expect(result.current.waitFor("telegram")).toBe(20_000);

    await flush(TICK_MS - 1);
    expect(result.current.waitFor("telegram")).toBe(20_000);
    await flush(1);
    expect(result.current.waitFor("telegram")).toBe(5_000);
    await flush(TICK_MS);
    expect(result.current.waitFor("telegram")).toBe(0);
    expect(result.current.retryAtFor("telegram")).toBeNull();
    // Nothing cools down any more, so the clock stops.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not tick while nothing cools down", async () => {
    const { result } = render();
    await flush();
    expect(vi.getTimerCount()).toBe(0);
    expect(waits(result)).toEqual([0, 0, 0]);
  });

  it("reads the new wallet's cooldowns after a wallet switch", async () => {
    mocks.getRetryTimes.mockImplementation(async (userId: string) =>
      userId === ADDRESS ? { ...NONE, email: iso(5 * MINUTE) } : NONE,
    );
    const { result, rerender } = render();
    await flush();
    expect(result.current.waitFor("email")).toBe(5 * MINUTE);

    mocks.address = OTHER_ADDRESS;
    rerender();
    await flush();
    expect(mocks.getRetryTimes.mock.calls).toEqual([[ADDRESS], [OTHER_ADDRESS]]);
    expect(result.current.waitFor("email")).toBe(0);
  });
});

describe("useNotificationTests: sending", () => {
  it("sends the market and channel for the connected wallet and stores the next allowed time for that channel only", async () => {
    mocks.getRetryTimes.mockResolvedValue({ ...NONE, signal: iso(3 * MINUTE) });
    const { result, queryClient } = render();
    await flush();

    let answer: unknown;
    await act(async () => {
      answer = await result.current.send(MARKET, "email");
    });

    expect(answer).toEqual({ sentAt: iso(0), retryAt: iso(15 * MINUTE) });
    expect(mocks.send.mock.calls).toEqual([[ADDRESS, MARKET, "email"]]);
    expect(queryClient.getQueryData(["notificationTestRetryTimes", ADDRESS.toLowerCase()])).toEqual({
      email: iso(15 * MINUTE),
      signal: iso(3 * MINUTE),
      telegram: null,
    });
    expect(waits(result)).toEqual([15 * MINUTE, 3 * MINUTE, 0]);
    // No second read: the answer is the new state.
    expect(mocks.getRetryTimes).toHaveBeenCalledTimes(1);
  });

  it("stores the time even before the cooldowns were read", async () => {
    mocks.getRetryTimes.mockReturnValue(new Promise(() => undefined));
    const { result, queryClient } = render();
    await flush();
    await act(async () => {
      await result.current.send(MARKET, "telegram");
    });
    expect(queryClient.getQueryData(["notificationTestRetryTimes", ADDRESS.toLowerCase()])).toEqual({
      ...NONE,
      telegram: iso(15 * MINUTE),
    });
    expect(result.current.waitFor("telegram")).toBe(15 * MINUTE);
  });

  it("stores the server's time from a refused send (429) and passes the refusal on", async () => {
    mocks.send.mockRejectedValue(new TestSendError("One test message per channel every 15 minutes", iso(9 * MINUTE)));
    const { result } = render();
    await flush();

    await act(() =>
      expect(result.current.send(MARKET, "signal")).rejects.toThrow("One test message per channel every 15 minutes"),
    );
    expect(waits(result)).toEqual([0, 9 * MINUTE, 0]);
  });

  it("stores nothing after any other failure, so the button stays on", async () => {
    const { result } = render();
    await flush();
    mocks.send.mockRejectedValueOnce(new TestSendError("Signal relay returned 503"));
    await act(() => expect(result.current.send(MARKET, "signal")).rejects.toThrow("Signal relay returned 503"));
    mocks.send.mockRejectedValueOnce(new Error("Failed to fetch"));
    await act(() => expect(result.current.send(MARKET, "email")).rejects.toThrow("Failed to fetch"));
    expect(waits(result)).toEqual([0, 0, 0]);
  });

  it("names the channel whose test is on its way, and none once it is done", async () => {
    const post = deferred<{ sentAt: string; retryAt: string }>();
    mocks.send.mockReturnValue(post.promise);
    const { result } = render();
    await flush();

    let sending: Promise<unknown> = Promise.resolve();
    act(() => {
      sending = result.current.send(MARKET, "telegram");
    });
    await flush();
    expect(result.current.sendingChannel).toBe("telegram");

    post.resolve({ sentAt: iso(0), retryAt: iso(15 * MINUTE) });
    await act(async () => {
      await sending;
    });
    expect(result.current.sendingChannel).toBeUndefined();
    expect(result.current.waitFor("telegram")).toBe(15 * MINUTE);
  });

  it("counts a send's cooldown from the moment it was answered", async () => {
    const { result } = render();
    await flush(10 * MINUTE);
    mocks.send.mockResolvedValue({ sentAt: iso(10 * MINUTE), retryAt: iso(25 * MINUTE) });
    await act(async () => {
      await result.current.send(MARKET, "email");
    });
    expect(result.current.waitFor("email")).toBe(15 * MINUTE);
    await flush(15 * MINUTE);
    expect(result.current.waitFor("email")).toBe(0);
  });

  /** Idle for 30 minutes with nothing cooling down (so no tick), then a click the server refuses until minute 39. */
  const refusedAfterIdle = async () => {
    const view = render();
    await flush(30 * MINUTE);
    mocks.send.mockRejectedValue(new TestSendError("One test message per channel every 15 minutes", iso(39 * MINUTE)));
    await act(() => expect(view.result.current.send(MARKET, "email")).rejects.toThrow());
    return view;
  };

  it("corrects a refused send's wait within one tick of its clock", async () => {
    const { result } = await refusedAfterIdle();
    await flush(TICK_MS);
    expect(result.current.waitFor("email")).toBe(9 * MINUTE - TICK_MS);
  });

  // onError catches the clock up before storing the server's time, so an idle spell does not inflate the wait.
  it("counts a refused send's cooldown from the moment it was answered", async () => {
    const { result } = await refusedAfterIdle();
    expect(result.current.waitFor("email")).toBe(9 * MINUTE);
  });
});
