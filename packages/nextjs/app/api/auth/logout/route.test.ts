import { describe, expect, it } from "vitest";
import { POST } from "~~/app/api/auth/logout/route";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";

const ROUTE_URL = "http://localhost/api/auth/logout";
const WALLET = `0x${"ab".repeat(20)}`;

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await POST(
      siteRequest(ROUTE_URL, { method: "POST", wallet: WALLET, headers: { "content-type": undefined } }),
    );
    expect([res.status, await res.json()]).toEqual([200, { success: true }]);
    expect(res.headers.get("set-cookie")).toBe("tokenping-session=; Path=/; Max-Age=0; HttpOnly; SameSite=lax");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses a request from another site, leaving the session alone", async () => {
    const res = await POST(
      siteRequest(ROUTE_URL, { method: "POST", wallet: WALLET, headers: { origin: "https://evil.example" } }),
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
