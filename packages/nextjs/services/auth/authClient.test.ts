import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { authClient } from "~~/services/auth/authClient";
import { jsonResponse } from "~~/utils/testing/helpers";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
const WALLET = `0x${"ab".repeat(20)}`;

beforeEach(() => {
  vi.stubGlobal("window", {});
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authClient", () => {
  it("reads the session uncached, as the wallet or null", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ address: WALLET })).mockResolvedValueOnce(jsonResponse({}));
    expect(await authClient.getSession()).toBe(WALLET);
    expect(await authClient.getSession()).toBeNull();
    expect(fetchMock.mock.calls[0]).toEqual(["/api/auth/session", { cache: "no-store" }]);
  });

  it("asks for a nonce and the server's time with a POST that has no body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ nonce: "abc", issuedAt: "2026-10-19T12:00:00.000Z" }));
    expect(await authClient.getNonce()).toEqual({ nonce: "abc", issuedAt: "2026-10-19T12:00:00.000Z" });
    expect(fetchMock.mock.calls).toEqual([["/api/auth/nonce", { method: "POST" }]]);
  });

  it("sends the signed message as JSON and resolves with the signed-in wallet", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ address: WALLET }));
    expect(await authClient.verify("message", "0x12")).toBe(WALLET);
    expect(fetchMock.mock.calls).toEqual([
      [
        "/api/auth/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"message":"message","signature":"0x12"}',
        },
      ],
    ]);
  });

  it("signs out with a POST", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await authClient.logout();
    expect(fetchMock.mock.calls).toEqual([["/api/auth/logout", { method: "POST" }]]);
  });

  it.each([
    ["getSession", () => authClient.getSession(), "Failed to read the sign-in"],
    ["getNonce", () => authClient.getNonce(), "Failed to start signing in"],
    ["verify", () => authClient.verify("m", "0x1"), "Failed to sign in"],
    ["logout", () => authClient.logout(), "Failed to sign out"],
  ])("%s rejects with the API's reason, or its fallback", async (_label, call, fallback) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Sign-in is not available on this server" }, 503));
    await expect(call()).rejects.toThrow("Sign-in is not available on this server");
    fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 500 }));
    await expect(call()).rejects.toThrow(fallback);
  });

  it("rejects a refused signature (401) with SignInRequiredError", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "The signature does not match this wallet" }, 401));
    await expect(authClient.verify("m", "0x1")).rejects.toBeInstanceOf(SignInRequiredError);
  });
});
