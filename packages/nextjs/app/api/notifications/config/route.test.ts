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

// The GET cache is module state shared by every test in this file, so each test uses its own wallet.
let walletCounter = 0;
const nextWallet = () => {
  walletCounter += 1;
  const suffix = walletCounter.toString().padStart(4, "0");
  return { lower: `0x${"ab".repeat(18)}${suffix}`, mixed: `0x${"AB".repeat(18)}${suffix}` };
};

const linkQuery = (uid: string) =>
  `user_telegram_links.select("user_id, chat_id, username, linked_at").eq("user_id","${uid}").maybeSingle()`;
const chainQuery = (uid: string, chainId: number) =>
  `notification_configs.select("*").eq("user_id","${uid}").eq("chain_id",${chainId}).single()`;
const allQuery = (uid: string) => `notification_configs.select("*").eq("user_id","${uid}")`;
const idLookup = (uid: string, chainId: number) =>
  `notification_configs.select("id").eq("user_id","${uid}").eq("chain_id",${chainId}).maybeSingle()`;
const deleteQuery = (uid: string, chainId: number) =>
  `notification_configs.delete().eq("user_id","${uid}").eq("chain_id",${chainId})`;

const NO_ROWS = { error: { message: "JSON object requested, multiple (or no) rows returned" } };

const get = (params: Record<string, string>) => GET(new Request(`${BASE_URL}?${new URLSearchParams(params)}`));
const bodyOf = (body: unknown) => (typeof body === "string" ? body : JSON.stringify(body));
const put = (body: unknown) => PUT(new Request(BASE_URL, { method: "PUT", body: bodyOf(body) }));
const del = (body: unknown) => DELETE(new Request(BASE_URL, { method: "DELETE", body: bodyOf(body) }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

const jsonParseMessage = (raw: string) => {
  try {
    JSON.parse(raw);
    return "";
  } catch (e) {
    return (e as Error).message;
  }
};

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

const telegramLink = (uid: string, overrides: Record<string, unknown> = {}) => ({
  data: { user_id: uid, chat_id: "123456789", username: "alice_tg", linked_at: "2026-02-01T00:00:00Z", ...overrides },
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

  it.each(["abc", "x1", "-", " "])("returns 400 for chainId %j (no leading digits)", async chainId => {
    const { lower } = nextWallet();
    const res = await get({ userId: lower, chainId });
    expect(await read(res)).toEqual(json(400, { error: "Invalid chainId" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  describe("single chain", () => {
    it("returns the lowercased user's row decorated with the user-level Telegram link", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({
        [linkQuery(lower)]: telegramLink(lower),
        [chainQuery(lower, 8453)]: { data: storedRow() },
      });

      const res = await get({ userId: mixed, chainId: "8453" });

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
          telegramChatId: "123456789",
          telegramUsername: "alice_tg",
        }),
      });
      // The Telegram lookup runs before the config query; no legacy fallback once the lowercased row is found.
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, 8453)]);
    });

    it("omits null optional fields, maps null services to [] and drops a null Telegram username", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({
        [linkQuery(lower)]: telegramLink(lower, { username: null }),
        [chainQuery(lower, 1)]: {
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

      const res = await get({ userId: lower, chainId: "1" });

      expect(await read(res)).toEqual({
        status: 200,
        text: '{"chainId":1,"enabled":false,"services":[],"healthFactorThreshold":2,"telegramChatId":"123456789"}',
      });
    });

    it("keeps an empty Telegram username (only null is dropped)", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({
        [linkQuery(lower)]: telegramLink(lower, { username: "" }),
        [chainQuery(lower, 1)]: { data: storedRow({ chain_id: 1 }) },
      });

      const res = await get({ userId: lower, chainId: "1" });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ telegramChatId: "123456789", telegramUsername: "" });
    });

    it("omits both Telegram fields when the user has no link", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({ [chainQuery(lower, 1)]: { data: storedRow({ chain_id: 1 }) } });

      const res = await get({ userId: lower, chainId: "1" });

      expect(JSON.parse((await read(res)).text)).not.toHaveProperty("telegramChatId");
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, 1)]);
    });

    it("falls back to the trimmed (legacy checksummed) user id when the lowercased lookup misses", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({
        [chainQuery(lower, 10)]: NO_ROWS,
        [chainQuery(mixed, 10)]: { data: storedRow({ chain_id: 10, services: ["signal"] }) },
      });

      const res = await get({ userId: `  ${mixed}  `, chainId: "10" });

      expect(JSON.parse((await read(res)).text)).toEqual({
        chainId: 10,
        enabled: true,
        services: ["signal"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
      });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, 10), chainQuery(mixed, 10)]);
    });

    it("also falls back when the lowercased lookup returns no data without an error", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({ [chainQuery(mixed, 10)]: { data: storedRow({ chain_id: 10 }) } });

      const res = await get({ userId: mixed, chainId: "10" });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: 10 });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, 10), chainQuery(mixed, 10)]);
    });

    it("returns null when the legacy fallback misses too", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({ [chainQuery(lower, 10)]: NO_ROWS, [chainQuery(mixed, 10)]: NO_ROWS });

      const res = await get({ userId: mixed, chainId: "10" });

      expect(await read(res)).toEqual({ status: 200, text: "null" });
    });

    it("does not fall back for an already-lowercase user id and caches the null result", async () => {
      const { lower } = nextWallet();
      // BUG(B3.2): a real query error is indistinguishable from "no row" and is cached as null for 15 minutes.
      fakeSupabase.respondByQuery({ [chainQuery(lower, 1)]: { error: { message: "connection refused" } } });

      expect(await read(await get({ userId: lower, chainId: "1" }))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, 1)]);

      fakeSupabase.respondByQuery({ [chainQuery(lower, 1)]: { data: storedRow({ chain_id: 1 }) } });
      expect(await read(await get({ userId: lower, chainId: "1" }))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.queries).toHaveLength(2);
    });

    it.each([
      ["1abc", 1],
      ["1.9", 1],
      ["0x10", 0],
      [" 42", 42],
      ["-5", -5],
    ])("parses chainId %j with parseInt as %d", async (chainId, parsed) => {
      // BUG(B3.15): parseInt accepts trailing garbage, so "1abc" is treated (and cached) as chain 1.
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({ [chainQuery(lower, parsed)]: { data: storedRow({ chain_id: parsed }) } });

      const res = await get({ userId: lower, chainId });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: parsed });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), chainQuery(lower, parsed)]);
    });

    it("serves the cached response for the parsed chain id without any DB call", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({ [chainQuery(lower, 1)]: { data: storedRow({ chain_id: 1 }) } });
      const first = await read(await get({ userId: lower, chainId: "1abc" }));

      fakeSupabase.reset();
      const second = await read(await get({ userId: mixed, chainId: "1" }));

      expect(second).toEqual(first);
      expect(fakeSupabase.queries).toHaveLength(0);
    });
  });

  describe("all chains", () => {
    it("returns configs keyed by chain id, each decorated with the Telegram link", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({
        [linkQuery(lower)]: telegramLink(lower),
        [allQuery(lower)]: {
          data: [
            storedRow({ chain_id: 8453, email: null }),
            storedRow({ chain_id: 1, services: ["signal"], health_factor_threshold: "1.10", signal_recipient: null }),
          ],
        },
      });

      const res = await get({ userId: lower });

      expect(await read(res)).toEqual({
        status: 200,
        text: JSON.stringify({
          1: {
            chainId: 1,
            enabled: true,
            services: ["signal"],
            healthFactorThreshold: 1.1,
            email: "a@b.co",
            telegramChatId: "123456789",
            telegramUsername: "alice_tg",
          },
          8453: {
            chainId: 8453,
            enabled: true,
            services: ["email", "telegram"],
            healthFactorThreshold: 1.8,
            signalRecipient: "alice.42",
            telegramChatId: "123456789",
            telegramUsername: "alice_tg",
          },
        }),
      });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower)]);
    });

    it("treats an empty chainId like a missing one", async () => {
      const { lower } = nextWallet();
      const res = await get({ userId: lower, chainId: "" });
      expect(await read(res)).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower)]);
    });

    it("keeps the last row when two rows share a chain id", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({
        [allQuery(lower)]: {
          data: [storedRow({ chain_id: 1, email: "first@x.io" }), storedRow({ chain_id: 1, email: "last@x.io" })],
        },
      });
      const res = await get({ userId: lower });
      expect(JSON.parse((await read(res)).text)[1].email).toBe("last@x.io");
    });

    it("uses the legacy rows when the lowercased query returns none", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({
        [allQuery(lower)]: { data: [] },
        [allQuery(mixed)]: { data: [storedRow({ chain_id: 137 })] },
      });

      const res = await get({ userId: mixed });

      expect(Object.keys(JSON.parse((await read(res)).text))).toEqual(["137"]);
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower), allQuery(mixed)]);
    });

    it("keeps the lowercased error result when the legacy query is empty, returning and caching {}", async () => {
      const { lower, mixed } = nextWallet();
      fakeSupabase.respondByQuery({
        [allQuery(lower)]: { error: { message: "timeout" } },
        [allQuery(mixed)]: { data: [] },
      });

      expect(await read(await get({ userId: mixed }))).toEqual({ status: 200, text: "{}" });

      fakeSupabase.reset();
      expect(await read(await get({ userId: mixed }))).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.queries).toHaveLength(0);
    });

    it("does not query the legacy form for an already-lowercase user id", async () => {
      const { lower } = nextWallet();
      fakeSupabase.respondByQuery({ [allQuery(lower)]: { error: { message: "timeout" } } });
      expect(await read(await get({ userId: lower }))).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower)]);
    });

    it("caches per chain key separately from the all-chains key", async () => {
      const { lower } = nextWallet();
      await get({ userId: lower });
      await get({ userId: lower, chainId: "1" });
      await get({ userId: lower });
      await get({ userId: lower, chainId: "1" });
      expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower), linkQuery(lower), chainQuery(lower, 1)]);
    });
  });

  it("returns 500 with the thrown error message", async () => {
    const { lower } = nextWallet();
    fakeSupabase.respond(() => {
      throw new Error("db down");
    });
    expect(await read(await get({ userId: lower }))).toEqual(json(500, { error: "db down" }));
  });

  it("returns 500 'Unknown error' for a non-Error throw", async () => {
    const { lower } = nextWallet();
    fakeSupabase.respond(() => {
      throw "nope";
    });
    expect(await read(await get({ userId: lower, chainId: "1" }))).toEqual(json(500, { error: "Unknown error" }));
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

  it("returns 500 with the JSON parser message for a malformed body", async () => {
    expect(await read(await put("{"))).toEqual(json(500, { error: jsonParseMessage("{") }));
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
    const { lower } = nextWallet();
    expect(await read(await put({ userId: lower, ...extra }))).toEqual(
      json(400, { error: "Missing or invalid chainId" }),
    );
  });

  it("returns 403 without touching the DB when access is inactive, checking the trimmed raw-case id", async () => {
    const { mixed } = nextWallet();
    vi.mocked(isAccessActive).mockResolvedValue(false);

    const res = await put({ userId: ` ${mixed} `, chainId: 1 });

    expect(await read(res)).toEqual(json(403, { error: "Active paid access required to update notification config" }));
    expect(isAccessActive).toHaveBeenCalledWith(mixed);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("updates the existing lowercased row in place, still looking up the legacy form", async () => {
    const { lower, mixed } = nextWallet();
    fakeSupabase.respondByQuery({ [idLookup(lower, 8453)]: { data: { id: "row-lower" } } });

    const res = await put({
      userId: mixed,
      chainId: 8453,
      enabled: true,
      services: ["email", "telegram"],
      healthFactorThreshold: 1.8,
      email: " a@b.co ",
      signalRecipient: "@alice.42",
    });

    expect(await read(res)).toEqual(json(200, { success: true }));
    const row = expectedRow(lower, {
      services: ["email", "telegram"],
      health_factor_threshold: 1.8,
      email: "a@b.co",
      signal_recipient: "alice.42",
    });
    expect(fakeSupabase.log()).toEqual([idLookup(lower, 8453), idLookup(mixed, 8453), updateQuery(row, "row-lower")]);
  });

  it("updates the legacy row (rewriting user_id to lowercase) when only it exists", async () => {
    const { lower, mixed } = nextWallet();
    fakeSupabase.respondByQuery({ [idLookup(mixed, 8453)]: { data: { id: "row-legacy" } } });

    await put({ userId: mixed, chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(lower), "row-legacy"));
  });

  it("prefers the lowercased row when both forms exist", async () => {
    const { lower, mixed } = nextWallet();
    fakeSupabase.respondByQuery({
      [idLookup(lower, 8453)]: { data: { id: "row-lower" } },
      [idLookup(mixed, 8453)]: { data: { id: "row-legacy" } },
    });

    await put({ userId: mixed, chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(lower), "row-lower"));
  });

  it("inserts when no row exists, with a single lookup for an already-lowercase id", async () => {
    const { lower } = nextWallet();

    const res = await put({ userId: lower, chainId: 8453 });

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([idLookup(lower, 8453), insertQuery(expectedRow(lower))]);
  });

  it("ignores lookup errors and inserts", async () => {
    const { lower } = nextWallet();
    fakeSupabase.respondByQuery({ [idLookup(lower, 8453)]: { error: { message: "boom" } } });
    await put({ userId: lower, chainId: 8453 });
    expect(fakeSupabase.log().at(-1)).toBe(insertQuery(expectedRow(lower)));
  });

  it("returns 502 with the Supabase message when the update fails", async () => {
    const { lower } = nextWallet();
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === idLookup(lower, 8453)) return { data: { id: "row-1" } };
      if (formatted.includes(".update(")) return { error: { message: "update failed" } };
    });
    expect(await read(await put({ userId: lower, chainId: 8453 }))).toEqual(json(502, { error: "update failed" }));
  });

  it("returns 502 with the Supabase message when the insert fails", async () => {
    const { lower } = nextWallet();
    fakeSupabase.respond((_query, formatted) =>
      formatted.includes(".insert(") ? { error: { message: "duplicate key" } } : undefined,
    );
    expect(await read(await put({ userId: lower, chainId: 8453 }))).toEqual(json(502, { error: "duplicate key" }));
  });

  it.each([
    ["enabled false is kept", { enabled: false }, { enabled: false }],
    ["non-array services become []", { services: "email" }, { services: [] }],
    ["threshold 0 is kept (?? not ||)", { healthFactorThreshold: 0 }, { health_factor_threshold: 0 }],
    ["string threshold is stored as is", { healthFactorThreshold: "2" }, { health_factor_threshold: "2" }],
    ["null threshold defaults", { healthFactorThreshold: null }, { health_factor_threshold: 1.5 }],
    ["unknown services pass through", { services: ["sms"] }, { services: ["sms"] }],
    ["blank email becomes null", { email: "   " }, { email: null }],
    ["null email stays null", { email: null }, { email: null }],
    ["numeric email is stringified", { email: 42 }, { email: "42" }],
    ["email 0 is stringified (null check, not falsy)", { email: 0 }, { email: "0" }],
    ["email false is stringified (null check, not falsy)", { email: false }, { email: "false" }],
    ["empty email becomes null", { email: "" }, { email: null }],
    ["signal 0 is stringified (null check, not falsy)", { signalRecipient: 0 }, { signal_recipient: "0" }],
    ["signal false is stringified", { signalRecipient: false }, { signal_recipient: "false" }],
    ["signal is normalized once", { signalRecipient: "@ @ alice.42" }, { signal_recipient: " @ alice.42" }],
    ["u:@ prefix is stripped", { signalRecipient: " u:@alice.42 " }, { signal_recipient: "alice.42" }],
    // BUG(B3.1): the character class strips any leading run of "u", ":" and "@".
    ["leading u is stripped too", { signalRecipient: "ursula.42" }, { signal_recipient: "rsula.42" }],
    ["prefix-only signal becomes null", { signalRecipient: "u:" }, { signal_recipient: null }],
    ["blank signal becomes null", { signalRecipient: "  " }, { signal_recipient: null }],
  ])("normalizes the stored row: %s", async (_label, extra, expected) => {
    const { lower } = nextWallet();
    await put({ userId: lower, chainId: 8453, ...extra });
    expect(fakeSupabase.log().at(-1)).toBe(insertQuery(expectedRow(lower, expected)));
  });

  it("invalidates every cached GET entry of the lowercased user", async () => {
    const { lower, mixed } = nextWallet();
    await get({ userId: lower });
    await get({ userId: lower, chainId: "1" });
    fakeSupabase.reset();

    await put({ userId: mixed, chainId: 1 });
    fakeSupabase.reset();
    await get({ userId: lower });
    await get({ userId: lower, chainId: "1" });

    expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower), linkQuery(lower), chainQuery(lower, 1)]);
  });

  it("does not invalidate the cache when the write fails", async () => {
    const { lower } = nextWallet();
    await get({ userId: lower });
    fakeSupabase.respond((_query, formatted) =>
      formatted.includes(".insert(") ? { error: { message: "x" } } : undefined,
    );
    await put({ userId: lower, chainId: 1 });
    fakeSupabase.reset();
    await get({ userId: lower });
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns 500 when the access check throws", async () => {
    const { lower } = nextWallet();
    vi.mocked(isAccessActive).mockRejectedValue(new Error("rpc down"));
    expect(await read(await put({ userId: lower, chainId: 1 }))).toEqual(json(500, { error: "rpc down" }));
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
    const { lower } = nextWallet();
    expect(await read(await del({ userId: lower, ...extra }))).toEqual(
      json(400, { error: "Missing or invalid chainId" }),
    );
  });

  it("returns 403 when access is inactive", async () => {
    const { mixed } = nextWallet();
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await del({ userId: mixed, chainId: 1 }))).toEqual(
      json(403, { error: "Active paid access required to delete notification config" }),
    );
    expect(isAccessActive).toHaveBeenCalledWith(mixed);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("deletes both the lowercased and the legacy row", async () => {
    const { lower, mixed } = nextWallet();
    expect(await read(await del({ userId: mixed, chainId: 10 }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(lower, 10), deleteQuery(mixed, 10)]);
  });

  it("deletes once for an already-lowercase id", async () => {
    const { lower } = nextWallet();
    await del({ userId: lower, chainId: 10 });
    expect(fakeSupabase.log()).toEqual([deleteQuery(lower, 10)]);
  });

  it("returns 502 on the first delete error without running the second", async () => {
    const { lower, mixed } = nextWallet();
    fakeSupabase.respondByQuery({ [deleteQuery(lower, 10)]: { error: { message: "first failed" } } });
    expect(await read(await del({ userId: mixed, chainId: 10 }))).toEqual(json(502, { error: "first failed" }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(lower, 10)]);
  });

  it("returns 502 when the legacy delete fails", async () => {
    const { mixed } = nextWallet();
    fakeSupabase.respondByQuery({ [deleteQuery(mixed, 10)]: { error: { message: "second failed" } } });
    expect(await read(await del({ userId: mixed, chainId: 10 }))).toEqual(json(502, { error: "second failed" }));
  });

  it("invalidates the user's cached GET entries", async () => {
    const { lower } = nextWallet();
    await get({ userId: lower });
    await del({ userId: lower, chainId: 1 });
    fakeSupabase.reset();
    await get({ userId: lower });
    expect(fakeSupabase.log()).toEqual([linkQuery(lower), allQuery(lower)]);
  });
});
