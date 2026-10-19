import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/api/auth/session/route";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";

const ROUTE_URL = "http://localhost/api/auth/session";
const WALLET = `0x${"ab".repeat(20)}`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/auth/session", () => {
  it("answers the signed-in wallet, lowercased, never cached", async () => {
    const res = await GET(siteRequest(ROUTE_URL, { wallet: WALLET }));
    expect([res.status, await res.json()]).toEqual([200, { address: WALLET }]);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it.each([
    ["no cookie", {}],
    ["a forged cookie", { cookie: "tokenping-session=v1.e30.AAAA" }],
  ])("answers null with %s", async (_label, headers) => {
    const res = await GET(siteRequest(ROUTE_URL, { headers }));
    expect(await res.json()).toEqual({ address: null });
  });

  it("answers null in production without SESSION_SECRET, whatever the cookie", async () => {
    const request = siteRequest(ROUTE_URL, { wallet: WALLET });
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(await (await GET(request)).json()).toEqual({ address: null });
  });
});
