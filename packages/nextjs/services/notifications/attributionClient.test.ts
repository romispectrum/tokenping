import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { submitAttributionAnswer } from "~~/services/notifications/attributionClient";
import { jsonResponse } from "~~/utils/testing/helpers";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("submitAttributionAnswer", () => {
  it("POSTs only the answer as JSON to a relative URL in the browser (the session cookie names the wallet)", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(submitAttributionAnswer("A friend")).resolves.toBeUndefined();

    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/attribution",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"answer":"A friend"}',
        },
      ],
    ]);
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await submitAttributionAnswer("X");
    expect(fetchMock.mock.calls[0][0]).toBe("https://tokenping.example/api/attribution");
  });

  it.each([
    [
      "the server's error",
      jsonResponse({ error: "Active paid access required to send an answer" }, 403),
      "Active paid access required to send an answer",
    ],
    ["the fallback for a non-JSON body", new Response("<html>", { status: 502 }), "Failed to send your answer"],
  ])("throws %s on failure", async (_label, response, message) => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(response);
    await expect(submitAttributionAnswer("X")).rejects.toThrow(message);
  });

  it("throws SignInRequiredError for a 401", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(jsonResponse({ error: "Sign in with your wallet first" }, 401));
    await expect(submitAttributionAnswer("X")).rejects.toBeInstanceOf(SignInRequiredError);
  });
});
