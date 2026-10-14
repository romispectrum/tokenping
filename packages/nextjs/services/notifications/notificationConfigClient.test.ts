import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notificationConfigClient as client } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig } from "~~/types/notifications";
import { jsonResponse } from "~~/utils/testing/helpers";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

const CONFIG: NotificationConfig = {
  chainId: 42161,
  enabled: true,
  services: ["email"],
  healthFactorThreshold: 1.8,
  email: "me@example.com",
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getAllConfigs", () => {
  it("sends the trimmed, URL-encoded raw address (not lowercased) to a relative URL in the browser", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(jsonResponse({ 42161: CONFIG }));
    await expect(client.getAllConfigs("  0xAbC+1 ")).resolves.toEqual({ 42161: CONFIG });
    expect(fetchMock.mock.calls).toEqual([["/api/notifications/config?userId=0xAbC%2B1"]]);
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({}));
    await client.getAllConfigs("0xabc");
    expect(fetchMock.mock.calls[0][0]).toBe("https://tokenping.example/api/notifications/config?userId=0xabc");
  });

  it("returns the body without normalizing it", async () => {
    vi.stubGlobal("window", {});
    const raw = { 1: { chainId: 1, services: null, healthFactorThreshold: "2.5" } };
    fetchMock.mockResolvedValue(jsonResponse(raw));
    await expect(client.getAllConfigs("0xabc")).resolves.toEqual(raw);
  });

  it("returns {} for a null or non-object body", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValueOnce(jsonResponse(null)).mockResolvedValueOnce(jsonResponse("nope"));
    await expect(client.getAllConfigs("0xabc")).resolves.toEqual({});
    await expect(client.getAllConfigs("0xabc")).resolves.toEqual({});
  });

  // BUG(B0.9): an HTTP error is reported as "no configs" instead of rejecting, so the UI shows the empty state.
  it("returns {} for an HTTP error", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(jsonResponse({ error: "Database error" }, 500));
    await expect(client.getAllConfigs("0xabc")).resolves.toEqual({});
  });

  it("rejects on network errors", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(client.getAllConfigs("0xabc")).rejects.toThrow("Failed to fetch");
  });
});

describe("upsertConfig", () => {
  beforeEach(() => vi.stubGlobal("window", {}));

  it("PUTs the trimmed raw address and the config, sending null for missing recipients", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await client.upsertConfig(" 0xAbC ", { ...CONFIG, telegramChatId: "1", telegramUsername: "bob" });
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/notifications/config",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: '{"userId":"0xAbC","chainId":42161,"enabled":true,"services":["email"],"healthFactorThreshold":1.8,"email":"me@example.com","signalRecipient":null}',
        },
      ],
    ]);
  });

  it("sends null for a missing email too, so the key stays in the body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await client.upsertConfig("0xabc", {
      ...CONFIG,
      services: ["signal"],
      email: undefined,
      signalRecipient: "alice.42",
    });
    expect(fetchMock.mock.calls[0][1]?.body).toBe(
      '{"userId":"0xabc","chainId":42161,"enabled":true,"services":["signal"],"healthFactorThreshold":1.8,"email":null,"signalRecipient":"alice.42"}',
    );
    await client.upsertConfig("0xabc", { ...CONFIG, email: undefined });
    expect(fetchMock.mock.calls[1][1]?.body).toContain('"email":null,"signalRecipient":null}');
  });

  it.each([
    ["the error string", jsonResponse({ error: "Active paid access required" }, 403), "Active paid access required"],
    ["the first array entry", jsonResponse({ error: ["first", "second"] }, 400), "first"],
    ["the fallback for a non-JSON body", new Response("<html>", { status: 500 }), "Failed to save notification config"],
    ["the fallback without an error field", jsonResponse({}, 500), "Failed to save notification config"],
    ["the fallback for a blank error", jsonResponse({ error: "  " }, 500), "Failed to save notification config"],
    [
      "the fallback for the string 'undefined'",
      jsonResponse({ error: "undefined" }, 500),
      "Failed to save notification config",
    ],
  ])("rejects with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(client.upsertConfig("0xabc", CONFIG)).rejects.toThrow(new Error(message));
  });
});

describe("deleteConfig", () => {
  beforeEach(() => vi.stubGlobal("window", {}));

  it("DELETEs with the trimmed raw address and chain id", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await client.deleteConfig(" 0xAbC ", 10);
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/notifications/config",
        { method: "DELETE", headers: { "Content-Type": "application/json" }, body: '{"userId":"0xAbC","chainId":10}' },
      ],
    ]);
  });

  it.each([
    ["the error string", jsonResponse({ error: "Active paid access required" }, 403), "Active paid access required"],
    ["the first array entry", jsonResponse({ error: ["first", "second"] }, 502), "first"],
    ["the fallback for a non-JSON body", new Response("oops", { status: 500 }), "Failed to delete notification config"],
    ["the fallback without an error field", jsonResponse({}, 500), "Failed to delete notification config"],
  ])("rejects with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(client.deleteConfig("0xabc", 1)).rejects.toThrow(new Error(message));
  });
});
