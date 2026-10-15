// @vitest-environment jsdom
import { notifyManager } from "@tanstack/react-query";
import { act } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  markAttributionPrompted,
  useAttributionPrompt,
  wasAttributionPrompted,
} from "~~/components/custom/notifications/attributionPromptState";
import { createTestQueryClient, renderHookWithProviders } from "~~/utils/testing/providers";

const WALLET = "0xAbCdEf0000000000000000000000000000000001";
const OTHER_WALLET = "0x1234500000000000000000000000000000000002";

/** One QueryClient is one page load; several hooks on one client are cards on the same page. */
const renderPrompt = (address: string | undefined, queryClient = createTestQueryClient()) =>
  renderHookWithProviders(() => useAttributionPrompt(address), { queryClient });

/** Runs an action and lets the query cache notify the hooks. */
const run = (action: () => void) => act(async () => action());

// react-query notifies observers from a 0ms timeout; a microtask lets one awaited act() deliver it.
beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(callback => setTimeout(callback, 0)));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAttributionPrompt", () => {
  it("opens on the first offer and closes on close", async () => {
    const { result } = renderPrompt(WALLET);
    expect(result.current.isOpen).toBe(false);
    await run(() => result.current.offer());
    expect(result.current.isOpen).toBe(true);
    await run(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("offers at most once per browser: not again on this page, after a reload, or for another wallet", async () => {
    const first = renderPrompt(WALLET);
    await run(() => first.result.current.offer());
    await run(() => first.result.current.close());
    await run(() => first.result.current.offer());
    expect(first.result.current.isOpen).toBe(false);

    // The page after a reload, for the same wallet and for another one.
    expect(wasAttributionPrompted()).toBe(true);
    const reloaded = renderPrompt(WALLET.toLowerCase());
    await run(() => reloaded.result.current.offer());
    expect(reloaded.result.current.isOpen).toBe(false);
    const other = renderPrompt(OTHER_WALLET);
    await run(() => other.result.current.offer());
    expect(other.result.current.isOpen).toBe(false);
  });

  it("stays open when the card remounts (a positions refresh or a chain switch) until Send or Skip", async () => {
    const first = renderPrompt(WALLET);
    await run(() => first.result.current.offer());
    first.unmount();

    const remounted = renderPrompt(WALLET, first.queryClient);
    expect(remounted.result.current.isOpen).toBe(true);
    await run(() => remounted.result.current.close());
    expect(remounted.result.current.isOpen).toBe(false);
  });

  it("shows only in the cards of the wallet that saved", async () => {
    const first = renderPrompt(WALLET);
    await run(() => first.result.current.offer());
    const other = renderPrompt(OTHER_WALLET, first.queryClient);
    expect(other.result.current.isOpen).toBe(false);
    await run(() => other.result.current.offer());
    expect(other.result.current.isOpen).toBe(false);
    expect(first.result.current.isOpen).toBe(true);
  });

  it("never opens without a wallet", async () => {
    const { result } = renderPrompt(undefined);
    await run(() => result.current.offer());
    expect(result.current.isOpen).toBe(false);
    expect(wasAttributionPrompted()).toBe(false);
  });

  it("counts the prompt as shown as soon as it opens, before any answer", async () => {
    const { result } = renderPrompt(WALLET);
    expect(wasAttributionPrompted()).toBe(false);
    await run(() => result.current.offer());
    expect(wasAttributionPrompted()).toBe(true);
  });

  it("asks for focus only in the card that saved, and again on a later save there while open", async () => {
    const first = renderPrompt(WALLET);
    expect(first.result.current.focusOnShow).toBe(false);
    await run(() => first.result.current.offer());
    expect(first.result.current.focusOnShow).toBe(true);

    // A remount by a refresh must not steal focus, but a save in that card while the prompt is open moves it there.
    const remounted = renderPrompt(WALLET, first.queryClient);
    expect(remounted.result.current.focusOnShow).toBe(false);
    await run(() => remounted.result.current.offer());
    expect(remounted.result.current.focusOnShow).toBe(true);

    await run(() => remounted.result.current.close());
    expect(remounted.result.current.focusOnShow).toBe(false);
  });

  it("moves focus to the return target on close", async () => {
    const { result } = renderPrompt(WALLET);
    const editButton = document.createElement("button");
    document.body.append(editButton);
    result.current.returnFocusRef.current = editButton;
    await run(() => result.current.offer());
    await run(() => result.current.close());
    expect(document.activeElement).toBe(editButton);
    editButton.remove();
  });
});

describe("asked flag storage", () => {
  it("persists one flag that names no wallet", async () => {
    const { result } = renderPrompt(WALLET);
    await run(() => result.current.offer());
    expect(Object.entries(window.localStorage)).toEqual([["tokenping:attribution-asked", "1"]]);
  });

  it("is read by wasAttributionPrompted and set by markAttributionPrompted", () => {
    expect(wasAttributionPrompted()).toBe(false);
    markAttributionPrompted();
    expect(wasAttributionPrompted()).toBe(true);
  });

  it("falls back to once per page load when storage is blocked, without throwing", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });
    const first = renderPrompt(WALLET);
    await run(() => first.result.current.offer());
    expect(first.result.current.isOpen).toBe(true);
    await run(() => first.result.current.close());
    await run(() => first.result.current.offer());
    expect(first.result.current.isOpen).toBe(false);
    // Another card on the same page does not ask again either.
    const other = renderPrompt(OTHER_WALLET, first.queryClient);
    await run(() => other.result.current.offer());
    expect(other.result.current.isOpen).toBe(false);
  });
});
