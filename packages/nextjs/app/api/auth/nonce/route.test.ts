import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "~~/app/api/auth/nonce/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const ROUTE_URL = "http://localhost/api/auth/nonce";
const NOW = "2026-10-19T12:00:00.000Z";
const post = (headers?: Record<string, string | undefined>) =>
  POST(siteRequest(ROUTE_URL, { method: "POST", headers: { "content-type": undefined, ...headers } }));

let consoleErrors: unknown[][];

beforeEach(() => {
  fakeSupabase.reset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/auth/nonce", () => {
  it("answers a fresh nonce, stores it for five minutes and binds it to this browser with an HttpOnly cookie", async () => {
    const res = await post();
    const { nonce } = (await res.json()) as { nonce: string };

    expect(res.status).toBe(200);
    expect(nonce).toMatch(/^[0-9a-f]{32}$/);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("set-cookie")).toBe(
      `tokenping-sign-in-nonce=${nonce}; Path=/api/auth; Expires=Mon, 19 Oct 2026 12:05:00 GMT; Max-Age=300; HttpOnly; SameSite=strict`,
    );
    expect(fakeSupabase.log()).toEqual([
      `auth_nonces.delete().lt("expires_at","${NOW}")`,
      `auth_nonces.insert({"nonce":"${nonce}","expires_at":"2026-10-19T12:05:00.000Z"})`,
    ]);
  });

  it("gives every request its own nonce", async () => {
    const nonces = await Promise.all(
      [post(), post()].map(async res => ((await (await res).json()) as { nonce: string }).nonce),
    );
    expect(new Set(nonces).size).toBe(2);
  });

  it.each([
    ["another site's Origin", { origin: "https://evil.example" }],
    ["no Origin", { origin: undefined }],
  ])("refuses a request with %s, before writing anything", async (_label, headers) => {
    const res = await post(headers);
    expect([res.status, await res.json()]).toEqual([403, { error: "Cross-site request refused" }]);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("answers 503 and logs why when the nonce cannot be stored", async () => {
    fakeSupabase.respond(({ ops }) =>
      ops[0][0] === "insert" ? { error: { message: "permission denied" } } : undefined,
    );
    const res = await post();
    expect([res.status, await res.json()]).toEqual([503, { error: "Sign-in is not available right now" }]);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(consoleErrors).toEqual([
      ["POST /api/auth/nonce: storing the nonce failed", { message: "permission denied" }],
    ]);
  });

  it("answers 503 in production without SESSION_SECRET, without storing a nonce", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    const res = await post();
    expect([res.status, await res.json()]).toEqual([503, { error: "Sign-in is not available on this server" }]);
    expect(fakeSupabase.queries).toHaveLength(0);
  });
});
