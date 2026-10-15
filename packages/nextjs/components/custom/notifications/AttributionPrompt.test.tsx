// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttributionPrompt } from "~~/components/custom/notifications/AttributionPrompt";
import { deferred, jsonResponse } from "~~/utils/testing/helpers";

const mocks = vi.hoisted(() => ({ toasts: [] as string[] }));

vi.mock("~~/utils/scaffold-eth", () => ({
  notification: {
    success: (message: string) => mocks.toasts.push(`success: ${message}`),
    error: (message: string) => mocks.toasts.push(`error: ${message}`),
  },
}));

const ADDRESS = "0xAbCdEf0000000000000000000000000000000001";
const LABEL = "How did you hear about Tokenping? (optional)";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
let consoleErrors: unknown[][];

const renderPrompt = ({ autoFocus }: { autoFocus?: boolean } = {}) => {
  const onClose = vi.fn();
  render(<AttributionPrompt address={ADDRESS} autoFocus={autoFocus} onClose={onClose} />);
  return onClose;
};

const input = () => screen.getByRole<HTMLInputElement>("textbox", { name: LABEL });
const sendButton = () => screen.getByRole<HTMLButtonElement>("button", { name: /^Send/ });
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const submit = async () => {
  await act(async () => {
    fireEvent.click(sendButton());
  });
};

beforeEach(() => {
  mocks.toasts = [];
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse({ success: true }));
  vi.stubGlobal("fetch", fetchMock);
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  expect(consoleErrors.filter(([message]) => !String(message).startsWith("Failed to send attribution"))).toEqual([]);
});

describe("AttributionPrompt", () => {
  it("asks an optional free-text question, labelled and described, capped at 500 characters", () => {
    renderPrompt();
    expect(input().type).toBe("text");
    expect(input().maxLength).toBe(500);
    expect(input().value).toBe("");
    const hint = document.getElementById(input().getAttribute("aria-describedby") ?? "");
    expect(hint?.textContent).toBe("Helps us learn which channels work. Saved with your wallet address.");
    // Free text, not a list of channels.
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByRole("button", { name: "Skip" })).toBeDefined();
  });

  it("is a form named by the question, so screen readers announce it when it takes focus", () => {
    renderPrompt({ autoFocus: true });
    const form = screen.getByRole("form", { name: LABEL });
    expect(document.activeElement).toBe(form);
    // Focusable by script only, not an extra Tab stop.
    expect(form.tabIndex).toBe(-1);
  });

  it("leaves focus alone without autoFocus", () => {
    renderPrompt();
    expect(document.activeElement).toBe(document.body);
  });

  it("enables Send only for a non-blank answer", () => {
    renderPrompt();
    expect(sendButton().disabled).toBe(true);
    type("   ");
    expect(sendButton().disabled).toBe(true);
    type(" Reddit ");
    expect(sendButton().disabled).toBe(false);
  });

  it("sends the trimmed answer for the wallet, thanks the user and closes", async () => {
    const onClose = renderPrompt();
    type("  A friend on X ");
    await submit();

    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/attribution",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: ADDRESS, answer: "A friend on X" }),
        },
      ],
    ]);
    expect(mocks.toasts).toEqual(["success: Thanks for telling us."]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("submits with Enter", async () => {
    const onClose = renderPrompt();
    type("Search");
    await act(async () => {
      fireEvent.submit(input().form as HTMLFormElement);
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows Sending... and blocks a second submit while the request is in flight", async () => {
    const response = deferred<Response>();
    fetchMock.mockReturnValue(response.promise);
    const onClose = renderPrompt();
    type("Telegram");
    await submit();
    expect(sendButton().textContent).toBe("Sending...");
    expect(sendButton().disabled).toBe(true);
    await act(async () => {
      fireEvent.submit(input().form as HTMLFormElement);
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => response.resolve(jsonResponse({ success: true })));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the answer and offers a retry when sending fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Active paid access required to send an answer" }, 403));
    const onClose = renderPrompt();
    type("Farcaster");
    await submit();

    expect(screen.getByRole("alert").textContent).toBe("Couldn't send your answer. Try again or skip.");
    expect(input().value).toBe("Farcaster");
    expect(sendButton().textContent).toBe("Send");
    expect(sendButton().disabled).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.toasts).toEqual([]);
    expect(String(consoleErrors[0][1])).toContain("Active paid access required to send an answer");

    await submit();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("explains a rejected answer without sending it, and clears the message once it is fixed", async () => {
    const onClose = renderPrompt();
    // A right-to-left override pasted along with the text.
    type("Reddit\u202e");
    await submit();
    expect(screen.getByRole("alert").textContent).toBe(
      "Answer contains hidden control characters. Retype it and try again.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    type("Reddit");
    await submit();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Skip without sending anything", () => {
    const onClose = renderPrompt();
    type("half-typed");
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
