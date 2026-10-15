import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  it("POSTs the trimmed raw address (not lowercased) and the answer as JSON to a relative URL in the browser", async () => {
    vi.stubGlobal("window", {});
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));

    await expect(submitAttributionAnswer("  0xAbC ", "A friend")).resolves.toBeUndefined();

    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/attribution",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"userId":"0xAbC","answer":"A friend"}',
        },
      ],
    ]);
  });

  it("uses NEXT_PUBLIC_APP_URL outside the browser", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await submitAttributionAnswer("0xabc", "X");
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
    await expect(submitAttributionAnswer("0xabc", "X")).rejects.toThrow(message);
  });
});
