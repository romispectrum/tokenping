import { afterEach, describe, expect, it, vi } from "vitest";
import { apiUrl, readApiError } from "~~/services/api/apiClient";

const FALLBACK = "Failed to do the thing";

const jsonResponse = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("apiUrl", () => {
  it("uses a relative URL in the browser, ignoring NEXT_PUBLIC_APP_URL", () => {
    vi.stubGlobal("window", {});
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    expect(apiUrl("/api/telegram/link")).toBe("/api/telegram/link");
  });

  it("uses NEXT_PUBLIC_APP_URL on the server", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://tokenping.example");
    expect(apiUrl("/api/notifications/config?userId=0xabc")).toBe(
      "https://tokenping.example/api/notifications/config?userId=0xabc",
    );
  });

  it("falls back to localhost:3000 when NEXT_PUBLIC_APP_URL is unset or empty", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", undefined);
    expect(apiUrl("/api/x")).toBe("http://localhost:3000/api/x");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(apiUrl("/api/x")).toBe("http://localhost:3000/api/x");
  });

  it("concatenates verbatim (no slash handling) and reads the env on every call", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://a.example/");
    expect(apiUrl("/api/x")).toBe("https://a.example//api/x");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://b.example");
    expect(apiUrl("api/x")).toBe("https://b.exampleapi/x");
  });
});

describe("readApiError", () => {
  it("returns a string error", async () => {
    expect(await readApiError(jsonResponse({ error: "Missing or invalid userId" }), FALLBACK)).toBe(
      "Missing or invalid userId",
    );
  });

  it("returns the first entry of an array error", async () => {
    expect(await readApiError(jsonResponse({ error: ["first", "second"] }), FALLBACK)).toBe("first");
  });

  it("returns the error untrimmed when it has non-blank content", async () => {
    expect(await readApiError(jsonResponse({ error: "  padded  " }), FALLBACK)).toBe("  padded  ");
  });

  it("stringifies non-string truthy errors", async () => {
    expect(await readApiError(jsonResponse({ error: 42 }), FALLBACK)).toBe("42");
    expect(await readApiError(jsonResponse({ error: true }), FALLBACK)).toBe("true");
    expect(await readApiError(jsonResponse({ error: { code: 1 } }), FALLBACK)).toBe("[object Object]");
  });

  it.each([
    ["missing error field", {}],
    ["empty string", { error: "" }],
    ["blank string", { error: "   " }],
    ["the string 'undefined'", { error: "undefined" }],
    ["null", { error: null }],
    ["zero", { error: 0 }],
    ["false", { error: false }],
    ["empty array", { error: [] }],
    ["array with empty first entry", { error: ["", "second"] }],
    ["array with null first entry", { error: [null] }],
    ["JSON null body", null],
    ["JSON string body", "plain"],
    ["JSON array body", ["x"]],
  ])("falls back for %s", async (_label, body) => {
    expect(await readApiError(jsonResponse(body), FALLBACK)).toBe(FALLBACK);
  });

  it("keeps ' undefined ' because only the exact string is rejected", async () => {
    expect(await readApiError(jsonResponse({ error: " undefined " }), FALLBACK)).toBe(" undefined ");
  });

  it("falls back when the body is not JSON", async () => {
    expect(await readApiError(new Response("<html>502</html>", { status: 502 }), FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the body is empty", async () => {
    expect(await readApiError(new Response(null, { status: 500 }), FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the body was already consumed", async () => {
    const res = jsonResponse({ error: "consumed" });
    await res.text();
    expect(await readApiError(res, FALLBACK)).toBe(FALLBACK);
  });

  it("does not look at the status code", async () => {
    expect(await readApiError(jsonResponse({ error: "ok but error" }, 200), FALLBACK)).toBe("ok but error");
  });
});
