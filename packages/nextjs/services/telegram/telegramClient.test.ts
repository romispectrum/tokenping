import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { telegramClient } from "~~/services/telegram/telegramClient";
import { jsonResponse } from "~~/utils/testing/helpers";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {});
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("createLinkToken", () => {
  it("POSTs the trimmed address and returns the response body", async () => {
    const body = { token: "t", botUsername: "bot", expiresAt: "2026-01-01", deepLink: "https://t.me/bot?start=t" };
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(telegramClient.createLinkToken(" 0xAbC ")).resolves.toEqual(body);
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/telegram/link-token",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"userId":"0xAbC"}' },
      ],
    ]);
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({}));
    await telegramClient.createLinkToken("0xabc");
    expect(fetchMock.mock.calls[0][0]).toBe("https://tokenping.example/api/telegram/link-token");
  });

  it.each([
    [
      "the error string",
      jsonResponse({ error: "Telegram is not configured on this server" }, 503),
      "Telegram is not configured on this server",
    ],
    [
      "the fallback for a non-JSON body",
      new Response("bad gateway", { status: 502 }),
      "Failed to create Telegram link token",
    ],
    ["the fallback without an error field", jsonResponse({}, 500), "Failed to create Telegram link token"],
  ])("rejects with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(telegramClient.createLinkToken("0xabc")).rejects.toThrow(new Error(message));
  });
});

describe("getLinkStatus", () => {
  it("GETs the URL-encoded trimmed address without caching", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ linked: true, chatId: "1", username: null, linkedAt: "now" }));
    await expect(telegramClient.getLinkStatus(" 0xA+b ")).resolves.toEqual({
      linked: true,
      chatId: "1",
      username: null,
      linkedAt: "now",
    });
    expect(fetchMock.mock.calls).toEqual([["/api/telegram/link?userId=0xA%2Bb", { cache: "no-store" }]]);
  });

  it("reports not linked for an HTTP error", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Missing or invalid userId" }, 400));
    await expect(telegramClient.getLinkStatus("0xabc")).resolves.toEqual({ linked: false });
  });

  it("rejects on network errors", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(telegramClient.getLinkStatus("0xabc")).rejects.toThrow("Failed to fetch");
  });
});

describe("disconnect", () => {
  it("DELETEs with the trimmed address", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await expect(telegramClient.disconnect(" 0xAbC ")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/telegram/link",
        { method: "DELETE", headers: { "Content-Type": "application/json" }, body: '{"userId":"0xAbC"}' },
      ],
    ]);
  });

  it.each([
    ["the error string", jsonResponse({ error: "Active paid access required" }, 403), "Active paid access required"],
    ["the fallback for a non-JSON body", new Response("oops", { status: 500 }), "Failed to disconnect Telegram"],
    ["the fallback without an error field", jsonResponse({}, 500), "Failed to disconnect Telegram"],
  ])("rejects with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(telegramClient.disconnect("0xabc")).rejects.toThrow(new Error(message));
  });
});
