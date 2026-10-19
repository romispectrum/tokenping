import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { TestSendError, notificationTestClient as client } from "~~/services/notifications/notificationTestClient";
import { jsonResponse } from "~~/utils/testing/helpers";

// The Ethereum Lido Spoke, as a market id.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const RETRY_AT = "2026-10-14T09:20:07.000Z";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

/** The rejection of `promise`, to check its class and fields. */
const rejectionOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected a rejection");
};

beforeEach(() => {
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("getRetryTimes", () => {
  it("asks without naming a wallet (the session cookie says which), never from a cache", async () => {
    const times = { email: null, signal: RETRY_AT, telegram: null };
    fetchMock.mockResolvedValue(jsonResponse(times));
    await expect(client.getRetryTimes()).resolves.toEqual(times);
    expect(fetchMock.mock.calls).toEqual([["/api/notifications/test", { cache: "no-store" }]]);
  });

  it("rejects a 401 with SignInRequiredError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Sign in with your wallet first" }, 401));
    await expect(client.getRetryTimes()).rejects.toBeInstanceOf(SignInRequiredError);
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({ email: null, signal: null, telegram: null }));
    await client.getRetryTimes();
    expect(fetchMock.mock.calls[0][0]).toBe("https://tokenping.example/api/notifications/test");
  });

  it.each([
    ["the error string", jsonResponse({ error: "Database error" }, 500), "Database error"],
    [
      "the fallback for a non-JSON body",
      new Response("<html>", { status: 502 }),
      "Failed to read the test message limit",
    ],
    ["the fallback without an error field", jsonResponse({}, 400), "Failed to read the test message limit"],
  ])("rejects an HTTP error with %s", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);
    await expect(client.getRetryTimes()).rejects.toThrow(new Error(message));
  });

  it("rejects on network errors", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(client.getRetryTimes()).rejects.toThrow("Failed to fetch");
  });
});

describe("send", () => {
  it("POSTs the market and the channel, and nothing about the wallet or the recipient", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ sentAt: "2026-10-14T09:05:07.000Z", retryAt: RETRY_AT }));

    await expect(client.send({ chainId: 1, market: LIDO_SPOKE }, "telegram")).resolves.toEqual({
      sentAt: "2026-10-14T09:05:07.000Z",
      retryAt: RETRY_AT,
    });
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/notifications/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: `{"chainId":1,"market":"${LIDO_SPOKE}","channel":"telegram"}`,
        },
      ],
    ]);
  });

  it("rejects a 429 with a TestSendError carrying the server's message and when to try again", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "One test message per channel every 15 minutes", retryAt: RETRY_AT }, 429),
    );

    const error = await rejectionOf(client.send({ chainId: 8453, market: "v3" }, "email"));
    expect(error).toBeInstanceOf(TestSendError);
    expect(error).toMatchObject({
      name: "TestSendError",
      message: "One test message per channel every 15 minutes",
      retryAt: RETRY_AT,
    });
  });

  it("rejects a 429 without a JSON body with the limit's message and no time", async () => {
    fetchMock.mockResolvedValue(new Response("Too Many Requests", { status: 429 }));

    const error = await rejectionOf(client.send({ chainId: 8453, market: "v3" }, "email"));
    expect(error).toBeInstanceOf(TestSendError);
    expect(error).toMatchObject({ message: "One test message per channel every 15 minutes", retryAt: undefined });
  });

  it.each([
    [
      "a 409",
      jsonResponse({ error: "@alice_eth has not pressed Start in @tokenping_bot yet" }, 409),
      "@alice_eth has not pressed Start in @tokenping_bot yet",
    ],
    ["a 502", jsonResponse({ error: "Signal relay returned 503" }, 502), "Signal relay returned 503"],
    [
      "a 403",
      jsonResponse({ error: "Active paid access required to send a test message" }, 403),
      "Active paid access required to send a test message",
    ],
    ["a non-JSON 500", new Response("<html>", { status: 500 }), "Failed to send the test message"],
    // Only a 429 carries a time: any other refusal leaves the button on.
    ["a 400 that names a time", jsonResponse({ error: "Bad input", retryAt: RETRY_AT }, 400), "Bad input"],
  ])("rejects %s with a TestSendError without a time", async (_, response, message) => {
    fetchMock.mockResolvedValue(response);

    const error = await rejectionOf(client.send({ chainId: 8453, market: "v3" }, "signal"));
    expect(error).toBeInstanceOf(TestSendError);
    expect(error).toMatchObject({ message, retryAt: undefined });
  });

  it("rejects a 401 with SignInRequiredError, not a TestSendError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Sign in with your wallet first" }, 401));
    const error = await rejectionOf(client.send({ chainId: 8453, market: "v3" }, "email"));
    expect(error).toBeInstanceOf(SignInRequiredError);
    expect(error).toHaveProperty("message", "Sign in with your wallet first");
  });

  it("rejects on network errors with the original error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await rejectionOf(client.send({ chainId: 8453, market: "v3" }, "email"));
    expect(error).toBeInstanceOf(TypeError);
  });
});
