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

describe("getUsernameStatus", () => {
  it.each([true, false])("GETs the status without caching and returns linked:%s", async linked => {
    fetchMock.mockResolvedValue(jsonResponse({ linked }));
    await expect(telegramClient.getUsernameStatus("alice_eth")).resolves.toEqual({ linked });
    expect(fetchMock.mock.calls).toEqual([["/api/telegram/status?username=alice_eth", { cache: "no-store" }]]);
  });

  it("URL-encodes the username as given, without trimming or normalizing it", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ linked: false }));
    await telegramClient.getUsernameStatus(" @a+b&c=d ");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/telegram/status?username=%20%40a%2Bb%26c%3Dd%20");
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({ linked: false }));
    await telegramClient.getUsernameStatus("alice_eth");
    expect(fetchMock.mock.calls[0][0]).toBe("https://tokenping.example/api/telegram/status?username=alice_eth");
  });

  // A failed lookup means the status is unknown, not "not linked": a linked username must not look unlinked.
  it.each([
    [
      "the error string",
      jsonResponse({ error: "Missing or invalid Telegram username" }, 400),
      "Missing or invalid Telegram username",
    ],
    [
      "the server's message for a failed lookup",
      jsonResponse({ error: "Failed to read the Telegram chat: boom" }, 500),
      "Failed to read the Telegram chat: boom",
    ],
    [
      "the fallback for a non-JSON body",
      new Response("bad gateway", { status: 502 }),
      "Failed to check the Telegram username",
    ],
    ["the fallback without an error field", jsonResponse({}, 500), "Failed to check the Telegram username"],
  ])("rejects an HTTP error with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(telegramClient.getUsernameStatus("alice_eth")).rejects.toThrow(new Error(message));
  });

  it("rejects on network errors", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(telegramClient.getUsernameStatus("alice_eth")).rejects.toThrow("Failed to fetch");
  });
});
