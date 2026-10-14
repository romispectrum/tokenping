import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "~~/app/api/notifications/config/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));

const BASE_URL = "http://localhost/api/notifications/config";
const NOW = "2026-10-14T09:05:07.000Z";

const LOWER = `0x${"ab".repeat(20)}`;
const MIXED = `0x${"AB".repeat(20)}`;

const chainQuery = (uid: string, chainId: number) =>
  `notification_configs.select("*").eq("user_id","${uid}").eq("chain_id",${chainId}).maybeSingle()`;
const allQuery = (uid: string) => `notification_configs.select("*").eq("user_id","${uid}")`;
const idLookup = (uid: string, chainId: number) =>
  `notification_configs.select("id").eq("user_id","${uid}").eq("chain_id",${chainId}).maybeSingle()`;
const deleteQuery = (uid: string, chainId: number) =>
  `notification_configs.delete().eq("user_id","${uid}").eq("chain_id",${chainId})`;

const get = (params: Record<string, string>) => GET(new Request(`${BASE_URL}?${new URLSearchParams(params)}`));
const bodyOf = (body: unknown) => (typeof body === "string" ? body : JSON.stringify(body));
const put = (body: unknown) => PUT(new Request(BASE_URL, { method: "PUT", body: bodyOf(body) }));
const del = (body: unknown) => DELETE(new Request(BASE_URL, { method: "DELETE", body: bodyOf(body) }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

const storedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "row-1",
  user_id: "ignored",
  chain_id: 8453,
  enabled: true,
  services: ["email", "telegram"],
  health_factor_threshold: "1.80",
  email: "a@b.co",
  signal_recipient: "alice.42",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

beforeEach(() => {
  fakeSupabase.reset();
  vi.mocked(isAccessActive).mockReset();
  vi.mocked(isAccessActive).mockResolvedValue(true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/notifications/config", () => {
  it.each([
    ["missing", {}],
    ["empty", { userId: "" }],
    ["blank", { userId: "   " }],
  ])("returns 400 for a %s userId without touching the DB", async (_label, params) => {
    const res = await get(params as Record<string, string>);
    expect(await read(res)).toEqual(json(400, { error: "Missing or invalid userId" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(["abc", "x1", "-", " ", "1abc", "1.9", "0x10"])(
    "returns 400 for the non-integer chainId %j",
    async chainId => {
      const res = await get({ userId: LOWER, chainId });
      expect(await read(res)).toEqual(json(400, { error: "Invalid chainId" }));
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it("never reads the Telegram link (it has its own endpoint)", async () => {
    fakeSupabase.respond(({ table }) =>
      table === "user_telegram_links" ? { data: { user_id: LOWER, chat_id: "123456789" } } : undefined,
    );
    await get({ userId: LOWER, chainId: "1" });
    await get({ userId: LOWER });
    expect(fakeSupabase.queries.map(({ table }) => table)).toEqual(["notification_configs", "notification_configs"]);
  });

  it("reads the DB on every request (no in-memory cache)", async () => {
    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, email: "old@x.io" }) } });
    await get({ userId: LOWER, chainId: "1" });

    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, email: "new@x.io" }) } });
    const res = await get({ userId: LOWER, chainId: "1" });

    expect(JSON.parse((await read(res)).text).email).toBe("new@x.io");
    expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1), chainQuery(LOWER, 1)]);
  });

  describe("single chain", () => {
    it("returns the lowercased user's row", async () => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, 8453)]: { data: storedRow() } });

      const res = await get({ userId: MIXED, chainId: "8453" });

      expect(res.headers.get("content-type")).toBe("application/json");
      expect(await read(res)).toEqual({
        status: 200,
        text: JSON.stringify({
          chainId: 8453,
          enabled: true,
          services: ["email", "telegram"],
          healthFactorThreshold: 1.8,
          email: "a@b.co",
          signalRecipient: "alice.42",
        }),
      });
      // No legacy fallback once the lowercased row is found.
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 8453)]);
    });

    it("omits null optional fields and maps null services to []", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(LOWER, 1)]: {
          data: storedRow({
            chain_id: 1,
            enabled: false,
            services: null,
            health_factor_threshold: 2,
            email: null,
            signal_recipient: null,
          }),
        },
      });

      const res = await get({ userId: LOWER, chainId: "1" });

      expect(await read(res)).toEqual({
        status: 200,
        text: '{"chainId":1,"enabled":false,"services":[],"healthFactorThreshold":2}',
      });
    });

    it("falls back to the trimmed (legacy checksummed) user id when the lowercased lookup finds no row", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(MIXED, 10)]: { data: storedRow({ chain_id: 10, services: ["signal"] }) },
      });

      const res = await get({ userId: `  ${MIXED}  `, chainId: "10" });

      expect(JSON.parse((await read(res)).text)).toEqual({
        chainId: 10,
        enabled: true,
        services: ["signal"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
      });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 10), chainQuery(MIXED, 10)]);
    });

    it("returns null when neither user id form has a row", async () => {
      expect(await read(await get({ userId: MIXED, chainId: "10" }))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 10), chainQuery(MIXED, 10)]);
    });

    it("does not query the legacy form for an already-lowercase user id", async () => {
      expect(await read(await get({ userId: LOWER, chainId: "1" }))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1)]);
    });

    it("returns 500 with the Supabase message when the lookup fails, without falling back", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(LOWER, 1)]: { error: { message: "connection refused" } },
        [chainQuery(MIXED, 1)]: { data: storedRow({ chain_id: 1 }) },
      });

      expect(await read(await get({ userId: MIXED, chainId: "1" }))).toEqual(
        json(500, { error: "connection refused" }),
      );
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1)]);
    });

    it("returns 500 when the legacy lookup fails", async () => {
      fakeSupabase.respondByQuery({ [chainQuery(MIXED, 1)]: { error: { message: "timeout" } } });
      expect(await read(await get({ userId: MIXED, chainId: "1" }))).toEqual(json(500, { error: "timeout" }));
    });

    it.each([
      [" 42", 42],
      ["-5", -5],
      ["007", 7],
    ])("parses the integer chainId %j as %d", async (chainId, parsed) => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, parsed)]: { data: storedRow({ chain_id: parsed }) } });

      const res = await get({ userId: LOWER, chainId });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: parsed });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, parsed)]);
    });
  });

  describe("all chains", () => {
    it("returns configs keyed by chain id", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: {
          data: [
            storedRow({ chain_id: 8453, email: null }),
            storedRow({ chain_id: 1, services: ["signal"], health_factor_threshold: "1.10", signal_recipient: null }),
          ],
        },
      });

      const res = await get({ userId: LOWER });

      expect(await read(res)).toEqual({
        status: 200,
        text: JSON.stringify({
          1: { chainId: 1, enabled: true, services: ["signal"], healthFactorThreshold: 1.1, email: "a@b.co" },
          8453: {
            chainId: 8453,
            enabled: true,
            services: ["email", "telegram"],
            healthFactorThreshold: 1.8,
            signalRecipient: "alice.42",
          },
        }),
      });
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER)]);
    });

    it("treats an empty chainId like a missing one", async () => {
      const res = await get({ userId: LOWER, chainId: "" });
      expect(await read(res)).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER)]);
    });

    it("keeps the last row when two rows share a chain id", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: {
          data: [storedRow({ chain_id: 1, email: "first@x.io" }), storedRow({ chain_id: 1, email: "last@x.io" })],
        },
      });
      const res = await get({ userId: LOWER });
      expect(JSON.parse((await read(res)).text)[1].email).toBe("last@x.io");
    });

    it("uses the legacy rows when the lowercased query returns none", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: { data: [] },
        [allQuery(MIXED)]: { data: [storedRow({ chain_id: 137 })] },
      });

      const res = await get({ userId: MIXED });

      expect(Object.keys(JSON.parse((await read(res)).text))).toEqual(["137"]);
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER), allQuery(MIXED)]);
    });

    it("returns {} when neither user id form has rows", async () => {
      fakeSupabase.respondByQuery({ [allQuery(LOWER)]: { data: [] }, [allQuery(MIXED)]: { data: [] } });
      expect(await read(await get({ userId: MIXED }))).toEqual({ status: 200, text: "{}" });
    });

    it("returns 500 with the Supabase message when the query fails, without the legacy query", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: { error: { message: "timeout" } },
        [allQuery(MIXED)]: { data: [storedRow({ chain_id: 137 })] },
      });
      expect(await read(await get({ userId: MIXED }))).toEqual(json(500, { error: "timeout" }));
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER)]);
    });

    it("returns 500 when the legacy query fails", async () => {
      fakeSupabase.respondByQuery({ [allQuery(MIXED)]: { error: { message: "legacy timeout" } } });
      expect(await read(await get({ userId: MIXED }))).toEqual(json(500, { error: "legacy timeout" }));
    });
  });

  it("returns 500 with the thrown error message", async () => {
    fakeSupabase.respond(() => {
      throw new Error("db down");
    });
    expect(await read(await get({ userId: LOWER }))).toEqual(json(500, { error: "db down" }));
  });

  it("returns 500 'Unknown error' for a non-Error throw", async () => {
    fakeSupabase.respond(() => {
      throw "nope";
    });
    expect(await read(await get({ userId: LOWER, chainId: "1" }))).toEqual(json(500, { error: "Unknown error" }));
  });
});

describe("PUT /api/notifications/config", () => {
  const expectedRow = (uid: string, overrides: Record<string, unknown> = {}) => ({
    user_id: uid,
    chain_id: 8453,
    enabled: true,
    services: [],
    health_factor_threshold: 1.5,
    email: null,
    signal_recipient: null,
    updated_at: NOW,
    ...overrides,
  });
  const insertQuery = (row: unknown) => `notification_configs.insert(${JSON.stringify(row)})`;
  const updateQuery = (row: unknown, id: string) =>
    `notification_configs.update(${JSON.stringify(row)}).eq("id","${id}")`;

  it("returns 400 for a malformed body, like the other routes", async () => {
    expect(await read(await put("{"))).toEqual(json(400, { error: "Missing or invalid userId" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns 500 for a JSON null body", async () => {
    expect(await read(await put("null"))).toEqual(
      json(500, { error: "Cannot destructure property 'userId' of 'body' as it is null." }),
    );
  });

  it.each([
    ["missing", {}],
    ["non-string", { userId: 5, chainId: 1 }],
    ["blank", { userId: "  ", chainId: 1 }],
  ])("returns 400 for a %s userId", async (_label, body) => {
    expect(await read(await put(body))).toEqual(json(400, { error: "Missing or invalid userId" }));
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it.each([
    ["missing", {}],
    ["null", { chainId: null }],
    ["string", { chainId: "1" }],
  ])("returns 400 for a %s chainId", async (_label, extra) => {
    expect(await read(await put({ userId: LOWER, ...extra }))).toEqual(
      json(400, { error: "Missing or invalid chainId" }),
    );
  });

  it("returns 403 without touching the DB when access is inactive, checking the trimmed raw-case id", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);

    const res = await put({ userId: ` ${MIXED} `, chainId: 1 });

    expect(await read(res)).toEqual(json(403, { error: "Active paid access required to update notification config" }));
    expect(isAccessActive).toHaveBeenCalledWith(MIXED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("updates the existing lowercased row in place, still looking up the legacy form", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });

    const res = await put({
      userId: MIXED,
      chainId: 8453,
      enabled: true,
      services: ["email", "telegram"],
      healthFactorThreshold: 1.8,
      email: " a@b.co ",
      signalRecipient: "@alice.42",
    });

    expect(await read(res)).toEqual(json(200, { success: true }));
    const row = expectedRow(LOWER, {
      services: ["email", "telegram"],
      health_factor_threshold: 1.8,
      email: "a@b.co",
      signal_recipient: "alice.42",
    });
    expect(fakeSupabase.log()).toEqual([idLookup(LOWER, 8453), idLookup(MIXED, 8453), updateQuery(row, "row-lower")]);
  });

  it("updates the legacy row (rewriting user_id to lowercase) when only it exists", async () => {
    fakeSupabase.respondByQuery({ [idLookup(MIXED, 8453)]: { data: { id: "row-legacy" } } });

    await put({ userId: MIXED, chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(LOWER), "row-legacy"));
  });

  it("prefers the lowercased row when both forms exist", async () => {
    fakeSupabase.respondByQuery({
      [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } },
      [idLookup(MIXED, 8453)]: { data: { id: "row-legacy" } },
    });

    await put({ userId: MIXED, chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(LOWER), "row-lower"));
  });

  it("inserts when no row exists, with a single lookup for an already-lowercase id", async () => {
    const res = await put({ userId: LOWER, chainId: 8453 });

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([idLookup(LOWER, 8453), insertQuery(expectedRow(LOWER))]);
  });

  it("returns 502 with the lookup error instead of inserting a duplicate row", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { error: { message: "boom" } } });
    expect(await read(await put({ userId: LOWER, chainId: 8453 }))).toEqual(json(502, { error: "boom" }));
    expect(fakeSupabase.log()).toEqual([idLookup(LOWER, 8453)]);
  });

  it("returns 502 when the legacy-form lookup fails", async () => {
    fakeSupabase.respondByQuery({ [idLookup(MIXED, 8453)]: { error: { message: "legacy boom" } } });
    expect(await read(await put({ userId: MIXED, chainId: 8453 }))).toEqual(json(502, { error: "legacy boom" }));
    expect(fakeSupabase.log().some(query => query.includes(".insert("))).toBe(false);
  });

  it("returns 502 with the Supabase message when the update fails", async () => {
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === idLookup(LOWER, 8453)) return { data: { id: "row-1" } };
      if (formatted.includes(".update(")) return { error: { message: "update failed" } };
    });
    expect(await read(await put({ userId: LOWER, chainId: 8453 }))).toEqual(json(502, { error: "update failed" }));
  });

  it("returns 502 with the Supabase message when the insert fails", async () => {
    fakeSupabase.respond((_query, formatted) =>
      formatted.includes(".insert(") ? { error: { message: "duplicate key" } } : undefined,
    );
    expect(await read(await put({ userId: LOWER, chainId: 8453 }))).toEqual(json(502, { error: "duplicate key" }));
  });

  it.each([
    ["enabled false is kept", { enabled: false }, { enabled: false }],
    ["missing services become []", {}, { services: [] }],
    ["threshold 0 is clamped to the minimum", { healthFactorThreshold: 0 }, { health_factor_threshold: 1.1 }],
    ["threshold 15 is clamped to the maximum", { healthFactorThreshold: 15 }, { health_factor_threshold: 10 }],
    ["null threshold defaults", { healthFactorThreshold: null }, { health_factor_threshold: 1.5 }],
    [
      "a selected email is trimmed",
      { services: ["email"], email: " a@b.co " },
      { services: ["email"], email: "a@b.co" },
    ],
    [
      "a selected Signal username keeps a leading u (B3.1)",
      { services: ["signal"], signalRecipient: "ursula.42" },
      { services: ["signal"], signal_recipient: "ursula.42" },
    ],
    [
      "a selected Signal username loses its u:@ prefix",
      { services: ["signal"], signalRecipient: " u:@alice.42 " },
      { services: ["signal"], signal_recipient: "alice.42" },
    ],
    ["an unselected blank email becomes null", { email: "   " }, { email: null }],
    ["an unselected numeric email is stringified", { email: 42 }, { email: "42" }],
    [
      "an unselected Signal value is normalized once",
      { signalRecipient: "@ @ alice.42" },
      { signal_recipient: " @ alice.42" },
    ],
    ["an unselected prefix-only Signal value becomes null", { signalRecipient: "u:" }, { signal_recipient: null }],
  ])("stores the normalized row: %s", async (_label, extra, expected) => {
    expect(await read(await put({ userId: LOWER, chainId: 8453, ...extra }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log().at(-1)).toBe(insertQuery(expectedRow(LOWER, expected)));
  });

  it.each([
    ["a string services", { services: "email" }, "Invalid services: expected an array of email, signal, telegram"],
    ["an unknown service", { services: ["sms"] }, "Invalid services: expected an array of email, signal, telegram"],
    ["a string threshold", { healthFactorThreshold: "2" }, "Invalid healthFactorThreshold: expected a finite number"],
    [
      "a selected malformed email",
      { services: ["email"], email: "a@b" },
      "Invalid email address for email notifications",
    ],
    [
      "a selected malformed Signal username",
      { services: ["signal"], signalRecipient: "@ alice.42" },
      "Invalid Signal username for Signal notifications. Expected format: alice.42",
    ],
  ])("returns 400 for %s before the access check or any DB call", async (_label, extra, error) => {
    expect(await read(await put({ userId: LOWER, chainId: 8453, ...extra }))).toEqual(json(400, { error }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns 400 for a threshold that JSON parses as Infinity", async () => {
    const res = await put(`{"userId":"${LOWER}","chainId":8453,"healthFactorThreshold":1e400}`);
    expect(await read(res)).toEqual(json(400, { error: "Invalid healthFactorThreshold: expected a finite number" }));
  });

  it("returns 500 when the access check throws", async () => {
    vi.mocked(isAccessActive).mockRejectedValue(new Error("rpc down"));
    expect(await read(await put({ userId: LOWER, chainId: 1 }))).toEqual(json(500, { error: "rpc down" }));
  });
});

describe("DELETE /api/notifications/config", () => {
  it("treats a malformed body as empty", async () => {
    expect(await read(await del("{"))).toEqual(json(400, { error: "Missing or invalid userId" }));
  });

  it("returns 500 for a JSON null body", async () => {
    expect(await read(await del("null"))).toEqual(
      json(500, { error: "Cannot destructure property 'userId' of 'body' as it is null." }),
    );
  });

  it.each([
    ["missing", {}],
    ["string", { chainId: "1" }],
  ])("returns 400 for a %s chainId", async (_label, extra) => {
    expect(await read(await del({ userId: LOWER, ...extra }))).toEqual(
      json(400, { error: "Missing or invalid chainId" }),
    );
  });

  it("returns 403 when access is inactive", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await del({ userId: MIXED, chainId: 1 }))).toEqual(
      json(403, { error: "Active paid access required to delete notification config" }),
    );
    expect(isAccessActive).toHaveBeenCalledWith(MIXED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("deletes both the lowercased and the legacy row", async () => {
    expect(await read(await del({ userId: MIXED, chainId: 10 }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10), deleteQuery(MIXED, 10)]);
  });

  it("deletes once for an already-lowercase id", async () => {
    await del({ userId: LOWER, chainId: 10 });
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10)]);
  });

  it("returns 502 on the first delete error without running the second", async () => {
    fakeSupabase.respondByQuery({ [deleteQuery(LOWER, 10)]: { error: { message: "first failed" } } });
    expect(await read(await del({ userId: MIXED, chainId: 10 }))).toEqual(json(502, { error: "first failed" }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10)]);
  });

  it("returns 502 when the legacy delete fails", async () => {
    fakeSupabase.respondByQuery({ [deleteQuery(MIXED, 10)]: { error: { message: "second failed" } } });
    expect(await read(await del({ userId: MIXED, chainId: 10 }))).toEqual(json(502, { error: "second failed" }));
  });
});
