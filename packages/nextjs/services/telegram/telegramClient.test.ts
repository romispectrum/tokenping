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
  const BODY = {
    token: "t",
    botUsername: "bot",
    expiresAt: "2026-10-14T12:10:00.000Z",
    deepLink: "https://t.me/bot?start=t",
  };
  const issuedAt = (serverDate: string | undefined, body: unknown = BODY) =>
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", ...(serverDate ? { Date: serverDate } : {}) },
    });

  it("POSTs the trimmed address and returns the body plus the token's lifetime by the server's clock", async () => {
    fetchMock.mockResolvedValue(issuedAt("Wed, 14 Oct 2026 12:00:00 GMT"));
    await expect(telegramClient.createLinkToken(" 0xAbC ")).resolves.toEqual({ ...BODY, expiresInMs: 10 * 60 * 1000 });
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/telegram/link-token",
        { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"userId":"0xAbC"}' },
      ],
    ]);
  });

  it("does not let the device clock change the token's lifetime", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: Date.parse("2026-10-14T12:15:00.000Z") });
    try {
      fetchMock.mockResolvedValue(issuedAt("Wed, 14 Oct 2026 12:00:00 GMT"));
      const { expiresInMs } = await telegramClient.createLinkToken("0xabc");
      expect(expiresInMs).toBe(10 * 60 * 1000);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ["without a Date header", issuedAt(undefined)],
    ["with an unreadable Date header", issuedAt("yesterday")],
    ["with an unreadable expiresAt", issuedAt("Wed, 14 Oct 2026 12:00:00 GMT", { ...BODY, expiresAt: "soon" })],
  ])("reports an unknown lifetime %s", async (_, response) => {
    fetchMock.mockResolvedValue(response);
    const { expiresInMs } = await telegramClient.createLinkToken("0xabc");
    expect(expiresInMs).toBeNull();
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(issuedAt(undefined));
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
