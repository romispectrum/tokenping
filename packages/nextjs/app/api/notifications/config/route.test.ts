import { getAddress } from "viem";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "~~/app/api/notifications/config/route";
import { getMorphoChain } from "~~/config/morpho";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";
import { MorphoApiError } from "~~/services/morpho/api";
import { readListedMarketParams, refreshMarketParams } from "~~/services/morpho/params";
import type { BlueMarketParams, MidnightMarketParams } from "~~/services/morpho/types";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));
vi.mock("~~/services/morpho/params", () => ({ readListedMarketParams: vi.fn(), refreshMarketParams: vi.fn() }));

const BASE_URL = "http://localhost/api/notifications/config";
const NOW = "2026-10-14T09:05:07.000Z";

// The signed-in wallet as the session holds it, and as legacy rows may store it (the EIP-55 form the old client sent).
const LOWER = `0x${"ab".repeat(20)}`;
const CHECKSUMMED = getAddress(LOWER);
// A wallet whose address has no letters, so its EIP-55 form is its lowercase form and there is no legacy lookup.
const DIGITS = `0x${"12".repeat(20)}`;
const OTHER_WALLET = `0x${"cd".repeat(20)}`;

// Aave V4 Spokes as market ids: Ethereum's Lido and Main Spokes, and an address that is no Spoke.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const MAIN_SPOKE = "0x94e7a5dcbe816e498b89ab752661904e2f56c485";
const NOT_A_SPOKE = `0x${"12".repeat(20)}`;
// Ethereum's Prime market: a V3 Pool beside the chain's main one, stored by its address like a Spoke.
const PRIME_POOL = "0x4e033931ad43597d96d6bcc25c280717730b58b1";
const INVALID_MARKET = "Invalid market: expected v3 or the lowercased address of an Aave V3 Pool or V4 Spoke";
const TELEGRAM_ERROR =
  "Invalid Telegram username for Telegram notifications. Expected 4 to 32 letters, digits or underscores, e.g. alice_eth";
const CHANNEL_LOCALES_ERROR = "Invalid channelLocales: expected an object of email, signal, telegram to one of en, cs";
const LOAD_FAILED = "Could not load your alerts. Please try again.";
const SAVE_FAILED = "Could not save the alert. Please try again.";
const DELETE_FAILED = "Could not delete the alert. Please try again.";
const LIMIT_REACHED = "A wallet can have up to 50 alerts. Delete one before adding another.";

const chainQuery = (uid: string, chainId: number, market = "v3") =>
  `notification_configs.select("*").eq("user_id","${uid}").eq("chain_id",${chainId}).eq("market","${market}").maybeSingle()`;
const allQuery = (uid: string) => `notification_configs.select("*").eq("user_id","${uid}")`;
const idLookup = (uid: string, chainId: number, market = "v3") =>
  `notification_configs.select("id").eq("user_id","${uid}").eq("chain_id",${chainId}).eq("market","${market}").maybeSingle()`;
const deleteQuery = (uid: string, chainId: number, market = "v3") =>
  `notification_configs.delete().eq("user_id","${uid}").eq("chain_id",${chainId}).eq("market","${market}")`;
// Runs before an insert only: how many alerts the wallet has under either user id form.
const countQuery = (...uids: string[]) =>
  `notification_configs.select("id",{"count":"exact","head":true}).in("user_id",${JSON.stringify(uids)})`;

// Each request comes from the site's own page with the session of `wallet` (LOWER unless a test says otherwise).
const get = (params: Record<string, string> = {}, wallet: string | null = LOWER) =>
  GET(siteRequest(`${BASE_URL}?${new URLSearchParams(params)}`, { wallet }));
const put = (body: unknown, wallet: string | null = LOWER) =>
  PUT(siteRequest(BASE_URL, { method: "PUT", body, wallet }));
const del = (body: unknown, wallet: string | null = LOWER) =>
  DELETE(siteRequest(BASE_URL, { method: "DELETE", body, wallet }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

// JSON that parses but is not an object; the routes read it as {}. The array holds an otherwise valid body.
const NON_OBJECT_BODIES = [
  ["null", "null"],
  ["an array", JSON.stringify([{ chainId: 1 }])],
  ["a number", "5"],
  ["a string", '"0xabc"'],
  ["a boolean", "true"],
];

const storedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "row-1",
  user_id: "ignored",
  chain_id: 8453,
  market: "v3",
  enabled: true,
  services: ["email", "telegram"],
  health_factor_threshold: "1.80",
  email: "a@b.co",
  signal_recipient: "alice.42",
  telegram_username: "alice_eth",
  locale: "en",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fakeSupabase.reset();
  vi.mocked(isAccessActive).mockReset();
  vi.mocked(isAccessActive).mockResolvedValue(true);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** The one error the route logged: [prefix, detail]. */
const loggedError = () => {
  expect(consoleError).toHaveBeenCalledOnce();
  return consoleError.mock.calls[0];
};

describe("GET /api/notifications/config", () => {
  it.each(["abc", "x1", "-", " ", "1abc", "1.9", "0x10"])(
    "returns 400 for the non-integer chainId %j",
    async chainId => {
      const res = await get({ chainId });
      expect(await read(res)).toEqual(json(400, { error: "Invalid chainId" }));
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it.each(["V3", "v4", "0x1234", MAIN_SPOKE.toUpperCase().replace("0X", "0x"), ` ${MAIN_SPOKE}`])(
    "returns 400 for the market %j without touching the DB",
    async market => {
      const res = await get({ chainId: "1", market });
      expect(await read(res)).toEqual(json(400, { error: INVALID_MARKET }));
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it("never reads the Telegram chats (whether a username pressed Start has its own endpoint)", async () => {
    fakeSupabase.respond(({ table }) =>
      table === "telegram_chats" ? { data: { username: "alice_eth", chat_id: "123456789" } } : undefined,
    );
    await get({ chainId: "1" });
    await get({});
    // Each read tries the lowercased and then the legacy user id form.
    expect(fakeSupabase.queries.map(({ table }) => table)).toEqual(Array(4).fill("notification_configs"));
  });

  it("reads the DB on every request (no in-memory cache)", async () => {
    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, email: "old@x.io" }) } });
    await get({ chainId: "1" });

    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, email: "new@x.io" }) } });
    const res = await get({ chainId: "1" });

    expect(JSON.parse((await read(res)).text).email).toBe("new@x.io");
    expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1), chainQuery(LOWER, 1)]);
  });

  describe("single market", () => {
    it("returns the lowercased user's row", async () => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, 8453)]: { data: storedRow() } });

      const res = await get({ chainId: "8453" });

      expect(res.headers.get("content-type")).toBe("application/json");
      expect(await read(res)).toEqual({
        status: 200,
        text: JSON.stringify({
          chainId: 8453,
          market: "v3",
          enabled: true,
          services: ["email", "telegram"],
          healthFactorThreshold: 1.8,
          email: "a@b.co",
          signalRecipient: "alice.42",
          telegramUsername: "alice_eth",
          locale: "en",
          channelLocales: { email: "en", telegram: "en" },
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
            telegram_username: null,
          }),
        },
      });

      const res = await get({ chainId: "1" });

      expect(await read(res)).toEqual({
        status: 200,
        text: '{"chainId":1,"market":"v3","enabled":false,"services":[],"healthFactorThreshold":2,"locale":"en","channelLocales":{}}',
      });
    });

    it.each([
      ["a Czech row", "cs", "cs"],
      ["an English row", "en", "en"],
      ["a row from before the locale column", undefined, "en"],
    ])("returns the alert language of %s", async (_label, locale, expected) => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, locale }) } });
      const res = await get({ chainId: "1" });
      expect(JSON.parse((await read(res)).text).locale).toBe(expected);
    });

    it.each([
      ["its own language", { signal_locale: "cs" }, "cs"],
      ["no language of its own: the row's", { signal_locale: null }, "en"],
      ["a row from before the channel language columns: the row's", {}, "en"],
    ])("returns a selected channel's language: %s", async (_label, columns, expected) => {
      fakeSupabase.respondByQuery({
        [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1, services: ["signal"], ...columns }) },
      });
      const res = await get({ chainId: "1" });
      expect(JSON.parse((await read(res)).text).channelLocales).toStrictEqual({ signal: expected });
    });

    it("falls back to the trimmed (legacy checksummed) user id when the lowercased lookup finds no row", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(CHECKSUMMED, 10)]: { data: storedRow({ chain_id: 10, services: ["signal"] }) },
      });

      const res = await get({ chainId: "10" });

      expect(JSON.parse((await read(res)).text)).toEqual({
        chainId: 10,
        market: "v3",
        enabled: true,
        services: ["signal"],
        healthFactorThreshold: 1.8,
        email: "a@b.co",
        signalRecipient: "alice.42",
        telegramUsername: "alice_eth",
        locale: "en",
        channelLocales: { signal: "en" },
      });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 10), chainQuery(CHECKSUMMED, 10)]);
    });

    it("returns null when neither user id form has a row", async () => {
      expect(await read(await get({ chainId: "10" }))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 10), chainQuery(CHECKSUMMED, 10)]);
    });

    it("does not query a legacy form for a wallet whose EIP-55 form is lowercase", async () => {
      expect(await read(await get({ chainId: "1" }, DIGITS))).toEqual({ status: 200, text: "null" });
      expect(fakeSupabase.log()).toEqual([chainQuery(DIGITS, 1)]);
    });

    it("returns a generic 500 when the lookup fails, logging the Supabase message, without falling back", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(LOWER, 1)]: { error: { message: "connection refused" } },
        [chainQuery(CHECKSUMMED, 1)]: { data: storedRow({ chain_id: 1 }) },
      });

      expect(await read(await get({ chainId: "1" }))).toEqual(json(500, { error: LOAD_FAILED }));
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1)]);
      expect(loggedError()).toEqual(["GET /api/notifications/config: failed", new Error("connection refused")]);
    });

    it("returns a generic 500 when the legacy lookup fails", async () => {
      fakeSupabase.respondByQuery({ [chainQuery(CHECKSUMMED, 1)]: { error: { message: "timeout" } } });
      expect(await read(await get({ chainId: "1" }))).toEqual(json(500, { error: LOAD_FAILED }));
      expect(loggedError()[1]).toEqual(new Error("timeout"));
    });

    it.each([
      [" 42", 42],
      ["-5", -5],
      ["007", 7],
    ])("parses the integer chainId %j as %d", async (chainId, parsed) => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, parsed)]: { data: storedRow({ chain_id: parsed }) } });

      const res = await get({ chainId });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: parsed });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, parsed)]);
    });

    it.each([
      ["a missing", {}],
      ["an empty", { market: "" }],
      ["the V3", { market: "v3" }],
    ])("reads the chain's V3 row for %s market", async (_label, params) => {
      fakeSupabase.respondByQuery({ [chainQuery(LOWER, 1)]: { data: storedRow({ chain_id: 1 }) } });

      const res = await get({ chainId: "1", ...params });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: 1, market: "v3" });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1)]);
    });

    it("reads a V4 Spoke's row by its market, falling back to the legacy user id form", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(CHECKSUMMED, 1, LIDO_SPOKE)]: { data: storedRow({ chain_id: 1, market: LIDO_SPOKE }) },
      });

      const res = await get({ chainId: "1", market: LIDO_SPOKE });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: 1, market: LIDO_SPOKE });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1, LIDO_SPOKE), chainQuery(CHECKSUMMED, 1, LIDO_SPOKE)]);
    });

    it("reads a further V3 market's row by its Pool address", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(LOWER, 1, PRIME_POOL)]: { data: storedRow({ chain_id: 1, market: PRIME_POOL }) },
      });

      const res = await get({ chainId: "1", market: PRIME_POOL });

      expect(JSON.parse((await read(res)).text)).toMatchObject({ chainId: 1, market: PRIME_POOL });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1, PRIME_POOL)]);
    });

    // Reads are not checked against the markets the app lists, like the rest of GET.
    it("looks up a well-formed market that is no Spoke", async () => {
      expect(await read(await get({ chainId: "1", market: NOT_A_SPOKE }))).toEqual({
        status: 200,
        text: "null",
      });
      expect(fakeSupabase.log()).toEqual([chainQuery(LOWER, 1, NOT_A_SPOKE), chainQuery(CHECKSUMMED, 1, NOT_A_SPOKE)]);
    });
  });

  describe("all markets", () => {
    it("returns configs keyed by chain id and market, in row order", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: {
          data: [
            storedRow({ chain_id: 8453, email: null }),
            storedRow({
              chain_id: 1,
              services: ["signal"],
              health_factor_threshold: "1.10",
              signal_recipient: null,
              telegram_username: null,
            }),
          ],
        },
      });

      const res = await get({});

      expect(await read(res)).toEqual({
        status: 200,
        text: JSON.stringify({
          "8453:v3": {
            chainId: 8453,
            market: "v3",
            enabled: true,
            services: ["email", "telegram"],
            healthFactorThreshold: 1.8,
            signalRecipient: "alice.42",
            telegramUsername: "alice_eth",
            locale: "en",
            channelLocales: { email: "en", telegram: "en" },
          },
          "1:v3": {
            chainId: 1,
            market: "v3",
            enabled: true,
            services: ["signal"],
            healthFactorThreshold: 1.1,
            email: "a@b.co",
            locale: "en",
            channelLocales: { signal: "en" },
          },
        }),
      });
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER)]);
    });

    it("returns a V4 row and a V3 row on the same chain under their own keys", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: {
          data: [
            storedRow({ chain_id: 1, email: "v3@x.io" }),
            storedRow({ chain_id: 1, market: LIDO_SPOKE, email: "lido@x.io" }),
            // A row from before the market column is a V3 row.
            storedRow({ chain_id: 10, market: undefined, email: "old@x.io" }),
          ],
        },
      });

      const configs = JSON.parse((await read(await get({}))).text);

      expect(Object.keys(configs)).toEqual(["1:v3", `1:${LIDO_SPOKE}`, "10:v3"]);
      expect(configs["1:v3"]).toMatchObject({ chainId: 1, market: "v3", email: "v3@x.io" });
      expect(configs[`1:${LIDO_SPOKE}`]).toMatchObject({ chainId: 1, market: LIDO_SPOKE, email: "lido@x.io" });
      expect(configs["10:v3"]).toMatchObject({ chainId: 10, market: "v3", email: "old@x.io" });
    });

    it("ignores the market without a chainId, still checking that it is well formed", async () => {
      expect(await read(await get({ market: LIDO_SPOKE }))).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER), allQuery(CHECKSUMMED)]);
      expect(await read(await get({ market: "nope" }))).toEqual(json(400, { error: INVALID_MARKET }));
    });

    it("treats an empty chainId like a missing one", async () => {
      const res = await get({ chainId: "" });
      expect(await read(res)).toEqual({ status: 200, text: "{}" });
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER), allQuery(CHECKSUMMED)]);
    });

    it("keeps the last row when two rows share a market", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: {
          data: [storedRow({ chain_id: 1, email: "first@x.io" }), storedRow({ chain_id: 1, email: "last@x.io" })],
        },
      });
      const res = await get({});
      expect(JSON.parse((await read(res)).text)["1:v3"].email).toBe("last@x.io");
    });

    it("uses the legacy rows when the lowercased query returns none", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: { data: [] },
        [allQuery(CHECKSUMMED)]: { data: [storedRow({ chain_id: 137 })] },
      });

      const res = await get({});

      expect(Object.keys(JSON.parse((await read(res)).text))).toEqual(["137:v3"]);
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER), allQuery(CHECKSUMMED)]);
    });

    it("returns {} when neither user id form has rows", async () => {
      fakeSupabase.respondByQuery({ [allQuery(LOWER)]: { data: [] }, [allQuery(CHECKSUMMED)]: { data: [] } });
      expect(await read(await get({}))).toEqual({ status: 200, text: "{}" });
    });

    it("returns a generic 500 when the query fails, logging the Supabase message, without the legacy query", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(LOWER)]: { error: { message: "timeout" } },
        [allQuery(CHECKSUMMED)]: { data: [storedRow({ chain_id: 137 })] },
      });
      expect(await read(await get({}))).toEqual(json(500, { error: LOAD_FAILED }));
      expect(fakeSupabase.log()).toEqual([allQuery(LOWER)]);
      expect(loggedError()[1]).toEqual(new Error("timeout"));
    });

    it("returns a generic 500 when the legacy query fails", async () => {
      fakeSupabase.respondByQuery({ [allQuery(CHECKSUMMED)]: { error: { message: "legacy timeout" } } });
      expect(await read(await get({}))).toEqual(json(500, { error: LOAD_FAILED }));
      expect(loggedError()[1]).toEqual(new Error("legacy timeout"));
    });
  });

  it("returns a generic 500 when something throws, logging what was thrown", async () => {
    const thrown = new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
    fakeSupabase.respond(() => {
      throw thrown;
    });
    expect(await read(await get({}))).toEqual(json(500, { error: LOAD_FAILED }));
    expect(loggedError()).toEqual(["GET /api/notifications/config: failed", thrown]);
  });

  it("returns a generic 500 for a non-Error throw", async () => {
    fakeSupabase.respond(() => {
      throw "nope";
    });
    expect(await read(await get({ chainId: "1" }))).toEqual(json(500, { error: LOAD_FAILED }));
    expect(loggedError()[1]).toBe("nope");
  });
});

describe("PUT /api/notifications/config", () => {
  const expectedRow = (uid: string, overrides: Record<string, unknown> = {}) => ({
    user_id: uid,
    chain_id: 8453,
    market: "v3",
    enabled: true,
    services: [],
    health_factor_threshold: 1.5,
    email: null,
    signal_recipient: null,
    telegram_username: null,
    locale: "en",
    email_locale: null,
    signal_locale: null,
    telegram_locale: null,
    updated_at: NOW,
    ...overrides,
  });
  const insertQuery = (row: unknown) => `notification_configs.insert(${JSON.stringify(row)})`;
  const updateQuery = (row: unknown, id: string) =>
    `notification_configs.update(${JSON.stringify(row)}).eq("id","${id}")`;

  it("reads a malformed body as empty, like the other routes", async () => {
    expect(await read(await put("{"))).toEqual(json(400, { error: "Missing or invalid chainId" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(NON_OBJECT_BODIES)("reads a body that is %s as empty, without the access check", async (_label, body) => {
    expect(await read(await put(body))).toEqual(json(400, { error: "Missing or invalid chainId" }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["missing", {}],
    ["null", { chainId: null }],
    ["string", { chainId: "1" }],
    ["fractional", { chainId: 8453.5 }],
    ["unsafe integer", { chainId: 2 ** 53 }],
  ])("returns 400 for a %s chainId before the access check or any DB call", async (_label, extra) => {
    expect(await read(await put({ ...extra }))).toEqual(json(400, { error: "Missing or invalid chainId" }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["an uppercase", "V3"],
    ["a checksummed Spoke", "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd"],
    ["a short", "0x1234"],
    ["a numeric", 3],
    ["an object", { spoke: LIDO_SPOKE }],
  ])("returns 400 for %s market before the access check or any DB call", async (_label, market) => {
    expect(await read(await put({ chainId: 1, market }))).toEqual(json(400, { error: INVALID_MARKET }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["an address that is no market", 1, NOT_A_SPOKE],
    ["a Spoke on another chain", 8453, LIDO_SPOKE],
    ["a V3 Pool on another chain", 8453, PRIME_POOL],
    ["the V3 market of a chain without Aave", 31337, "v3"],
    ["the V3 market of a chain id that is no chain", 0, "v3"],
    ["the V3 market of a negative chain id", -1, "v3"],
    // Arc has Aave V4 Spokes only.
    ["the V3 market of a V4-only chain", 5042, "v3"],
  ])("returns 400 for %s before the access check or any DB call", async (_label, chainId, market) => {
    expect(await read(await put({ chainId, market }))).toEqual(json(400, { error: "Unknown Aave market" }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("checks the chainId before the market", async () => {
    expect(await read(await put({ chainId: "1", market: "nope" }))).toEqual(
      json(400, { error: "Missing or invalid chainId" }),
    );
  });

  it("checks the market before the config values", async () => {
    expect(await read(await put({ chainId: 1, market: "nope", services: "email" }))).toEqual(
      json(400, { error: INVALID_MARKET }),
    );
  });

  it.each([
    ["a missing", {}],
    ["a null", { market: null }],
    ["an empty", { market: "" }],
    ["the V3", { market: "v3" }],
  ])("stores %s market as the chain's V3 market", async (_label, extra) => {
    expect(await read(await put({ chainId: 8453, ...extra }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([
      idLookup(LOWER, 8453),
      idLookup(CHECKSUMMED, 8453),
      countQuery(LOWER, CHECKSUMMED),
      insertQuery(expectedRow(LOWER)),
    ]);
  });

  it("stores the V3 config of every chain with an Aave V3 market", async () => {
    expect(await read(await put({ chainId: 56 }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log().at(-1)).toBe(insertQuery(expectedRow(LOWER, { chain_id: 56 })));
  });

  it("stores a V4 Spoke's config under its market, apart from the chain's V3 row", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 1)]: { data: { id: "row-v3" } } });

    const res = await put({ chainId: 1, market: LIDO_SPOKE, healthFactorThreshold: 1.3 });

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([
      idLookup(LOWER, 1, LIDO_SPOKE),
      idLookup(CHECKSUMMED, 1, LIDO_SPOKE),
      countQuery(LOWER, CHECKSUMMED),
      insertQuery(expectedRow(LOWER, { chain_id: 1, market: LIDO_SPOKE, health_factor_threshold: 1.3 })),
    ]);
  });

  it("stores a further V3 market's config under its Pool address, apart from the chain's v3 row", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 1)]: { data: { id: "row-v3" } } });

    const res = await put({ chainId: 1, market: PRIME_POOL, healthFactorThreshold: 2 });

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([
      idLookup(LOWER, 1, PRIME_POOL),
      idLookup(CHECKSUMMED, 1, PRIME_POOL),
      countQuery(LOWER, CHECKSUMMED),
      insertQuery(expectedRow(LOWER, { chain_id: 1, market: PRIME_POOL, health_factor_threshold: 2 })),
    ]);
  });

  it("updates a V4 Spoke's existing row in place", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 1, MAIN_SPOKE)]: { data: { id: "row-main" } } });

    await put({ chainId: 1, market: MAIN_SPOKE });

    expect(fakeSupabase.log()).toEqual([
      idLookup(LOWER, 1, MAIN_SPOKE),
      idLookup(CHECKSUMMED, 1, MAIN_SPOKE),
      updateQuery(expectedRow(LOWER, { chain_id: 1, market: MAIN_SPOKE }), "row-main"),
    ]);
  });

  it("returns 403 without touching the DB when access is inactive, checking the signed-in wallet", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);

    const res = await put({ chainId: 1 });

    expect(await read(res)).toEqual(json(403, { error: "Active paid access required to update notification config" }));
    expect(isAccessActive).toHaveBeenCalledWith(CHECKSUMMED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("updates the existing lowercased row in place, still looking up the legacy form", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });

    const res = await put({
      chainId: 8453,
      enabled: true,
      services: ["email", "telegram"],
      healthFactorThreshold: 1.8,
      email: " a@b.co ",
      signalRecipient: "@alice.42",
      telegramUsername: "@Alice_Eth",
    });

    expect(await read(res)).toEqual(json(200, { success: true }));
    const row = expectedRow(LOWER, {
      services: ["email", "telegram"],
      health_factor_threshold: 1.8,
      email: "a@b.co",
      signal_recipient: "alice.42",
      telegram_username: "alice_eth",
    });
    expect(fakeSupabase.log()).toEqual([
      idLookup(LOWER, 8453),
      idLookup(CHECKSUMMED, 8453),
      updateQuery(row, "row-lower"),
    ]);
  });

  it("updates the legacy row (rewriting user_id to lowercase) when only it exists", async () => {
    fakeSupabase.respondByQuery({ [idLookup(CHECKSUMMED, 8453)]: { data: { id: "row-legacy" } } });

    await put({ chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(LOWER), "row-legacy"));
  });

  it("prefers the lowercased row when both forms exist", async () => {
    fakeSupabase.respondByQuery({
      [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } },
      [idLookup(CHECKSUMMED, 8453)]: { data: { id: "row-legacy" } },
    });

    await put({ chainId: 8453 });

    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(expectedRow(LOWER), "row-lower"));
  });

  it("inserts when no row exists, with a single lookup for a wallet whose EIP-55 form is lowercase", async () => {
    const res = await put({ chainId: 8453 }, DIGITS);

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([idLookup(DIGITS, 8453), countQuery(DIGITS), insertQuery(expectedRow(DIGITS))]);
  });

  describe("the limit of 50 alerts per wallet", () => {
    it("inserts the wallet's 50th alert", async () => {
      fakeSupabase.respondByQuery({ [countQuery(LOWER, CHECKSUMMED)]: { count: 49 } });
      expect(await read(await put({ chainId: 8453 }))).toEqual(json(200, { success: true }));
      expect(fakeSupabase.log().at(-1)).toBe(insertQuery(expectedRow(LOWER)));
    });

    it.each([50, 51, 400])("returns 409 without inserting when the wallet already has %d alerts", async count => {
      fakeSupabase.respondByQuery({ [countQuery(LOWER, CHECKSUMMED)]: { count } });
      expect(await read(await put({ chainId: 8453 }))).toEqual(json(409, { error: LIMIT_REACHED }));
      expect(fakeSupabase.log()).toEqual([
        idLookup(LOWER, 8453),
        idLookup(CHECKSUMMED, 8453),
        countQuery(LOWER, CHECKSUMMED),
      ]);
    });

    it("counts the alerts stored under the legacy user id form too", async () => {
      fakeSupabase.respondByQuery({ [countQuery(LOWER, CHECKSUMMED)]: { count: 50 } });
      expect(await read(await put({ chainId: 8453 }))).toEqual(json(409, { error: LIMIT_REACHED }));
    });

    it("still updates an existing alert, without counting", async () => {
      fakeSupabase.respondByQuery({
        [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } },
        [countQuery(LOWER, CHECKSUMMED)]: { count: 50 },
      });
      expect(await read(await put({ chainId: 8453 }))).toEqual(json(200, { success: true }));
      expect(fakeSupabase.log()).toEqual([
        idLookup(LOWER, 8453),
        idLookup(CHECKSUMMED, 8453),
        updateQuery(expectedRow(LOWER), "row-lower"),
      ]);
    });

    it("returns a generic 502 without inserting when the count fails", async () => {
      fakeSupabase.respondByQuery({ [countQuery(LOWER, CHECKSUMMED)]: { error: { message: "timeout" } } });
      expect(await read(await put({ chainId: 8453 }))).toEqual(json(502, { error: SAVE_FAILED }));
      expect(fakeSupabase.log()).toEqual([
        idLookup(LOWER, 8453),
        idLookup(CHECKSUMMED, 8453),
        countQuery(LOWER, CHECKSUMMED),
      ]);
      expect(loggedError()).toEqual([
        "PUT /api/notifications/config: database error",
        { code: undefined, message: "timeout" },
      ]);
    });
  });

  it("returns a generic 502 on a failed lookup instead of inserting a duplicate row, logging the message", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { error: { message: "boom" } } });
    expect(await read(await put({ chainId: 8453 }))).toEqual(json(502, { error: SAVE_FAILED }));
    expect(fakeSupabase.log()).toEqual([idLookup(LOWER, 8453)]);
    expect(loggedError()).toEqual([
      "PUT /api/notifications/config: database error",
      { code: undefined, message: "boom" },
    ]);
  });

  it("returns a generic 502 when the legacy-form lookup fails", async () => {
    fakeSupabase.respondByQuery({ [idLookup(CHECKSUMMED, 8453)]: { error: { message: "legacy boom" } } });
    expect(await read(await put({ chainId: 8453 }))).toEqual(json(502, { error: SAVE_FAILED }));
    expect(fakeSupabase.log().some(query => query.includes(".insert("))).toBe(false);
  });

  it("returns a generic 502 when the update fails", async () => {
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === idLookup(LOWER, 8453)) return { data: { id: "row-1" } };
      if (formatted.includes(".update(")) return { error: { message: "update failed" } };
    });
    expect(await read(await put({ chainId: 8453 }))).toEqual(json(502, { error: SAVE_FAILED }));
  });

  it("returns a generic 502 when the insert fails, logging only the code and message", async () => {
    // A constraint violation as PostgREST returns it: `details` repeats the row, so it stays out of the log.
    const violation = {
      code: "23514",
      message:
        'new row for relation "notification_configs" violates check constraint "notification_configs_locale_check"',
      details: "Failing row contains (row-1, 0xabab..., 8453, t, {email}, 1.5, a@b.co, ...).",
    };
    fakeSupabase.respond((_query, formatted) => (formatted.includes(".insert(") ? { error: violation } : undefined));
    expect(await read(await put({ chainId: 8453 }))).toEqual(json(502, { error: SAVE_FAILED }));
    expect(loggedError()).toEqual([
      "PUT /api/notifications/config: database error",
      { code: violation.code, message: violation.message },
    ]);
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
    [
      "a selected Telegram username is lowercased without its @",
      { services: ["telegram"], telegramUsername: " @Alice_Eth " },
      { services: ["telegram"], telegram_username: "alice_eth" },
    ],
    [
      "a selected Telegram username loses its t.me link",
      { services: ["telegram"], telegramUsername: "https://t.me/Alice_Eth" },
      { services: ["telegram"], telegram_username: "alice_eth" },
    ],
    [
      "an unselected valid Telegram username is kept, normalized",
      { telegramUsername: "@Alice_Eth" },
      { telegram_username: "alice_eth" },
    ],
    ["an unselected invalid Telegram username becomes null", { telegramUsername: "abc" }, { telegram_username: null }],
    [
      "an unselected non-string Telegram username becomes null",
      { telegramUsername: 1234 },
      { telegram_username: null },
    ],
    ["a Czech locale is kept", { locale: "cs" }, { locale: "cs" }],
    ["an English locale is kept", { locale: "en" }, { locale: "en" }],
    ["a missing locale is English", {}, { locale: "en" }],
    ["a null locale is English", { locale: null }, { locale: "en" }],
    [
      "each channel's language",
      { channelLocales: { email: "cs", telegram: "en" } },
      { email_locale: "cs", telegram_locale: "en" },
    ],
    ["no channel languages", { channelLocales: {} }, {}],
  ])("stores the normalized row: %s", async (_label, extra, expected) => {
    expect(await read(await put({ chainId: 8453, ...extra }))).toEqual(json(200, { success: true }));
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
    ["a selected Telegram username that is missing", { services: ["telegram"] }, TELEGRAM_ERROR],
    ["a selected Telegram username that is null", { services: ["telegram"], telegramUsername: null }, TELEGRAM_ERROR],
    [
      "a selected Telegram username of 3 characters",
      { services: ["telegram"], telegramUsername: "abc" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username with a trailing underscore",
      { services: ["telegram"], telegramUsername: "alice_eth_" },
      TELEGRAM_ERROR,
    ],
    [
      "a selected Telegram username over 64 raw characters",
      { services: ["telegram"], telegramUsername: `${" ".repeat(60)}alice_eth` },
      TELEGRAM_ERROR,
    ],
    ["an unsupported locale", { locale: "de" }, "Invalid locale: expected one of en, cs"],
    ["a region-tagged locale", { locale: "cs-CZ" }, "Invalid locale: expected one of en, cs"],
    ["a non-string locale", { locale: 1 }, "Invalid locale: expected one of en, cs"],
    ["an unsupported channel language", { channelLocales: { signal: "de" } }, CHANNEL_LOCALES_ERROR],
    ["a language for an unknown channel", { channelLocales: { sms: "cs" } }, CHANNEL_LOCALES_ERROR],
  ])("returns 400 for %s before the access check or any DB call", async (_label, extra, error) => {
    expect(await read(await put({ chainId: 8453, ...extra }))).toEqual(json(400, { error }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns 400 for a 100k-character crafted email in under 50ms, before the access check", async () => {
    const start = performance.now();
    const res = await put({ chainId: 8453, services: ["email"], email: `a@${"a.".repeat(50_000)}@` });
    expect(performance.now() - start).toBeLessThan(50);
    expect(await read(res)).toEqual(json(400, { error: "Invalid email address for email notifications" }));
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it("returns 400 for a selected Signal username over 64 characters", async () => {
    const res = await put({
      chainId: 8453,
      services: ["signal"],
      signalRecipient: `a.${"1".repeat(63)}`,
    });
    expect(await read(res)).toEqual(
      json(400, { error: "Invalid Signal username for Signal notifications. Expected format: alice.42" }),
    );
  });

  it("returns 400 for a threshold that JSON parses as Infinity", async () => {
    const res = await put(`{"chainId":8453,"healthFactorThreshold":1e400}`);
    expect(await read(res)).toEqual(json(400, { error: "Invalid healthFactorThreshold: expected a finite number" }));
  });

  it("saves a Czech config in place and reads it back in Czech", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });

    const body = { chainId: 8453, services: ["email"], email: "a@b.co", locale: "cs" };
    expect(await read(await put(body))).toEqual(json(200, { success: true }));

    const row = expectedRow(LOWER, { services: ["email"], email: "a@b.co", locale: "cs" });
    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(row, "row-lower"));

    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 8453)]: { data: { ...storedRow(), ...row } } });
    expect(JSON.parse((await read(await get({ chainId: "8453" }))).text)).toMatchObject({
      services: ["email"],
      locale: "cs",
    });
  });

  // A new channel starts in the page's language, and a later edit can change it without touching the others.
  it("saves a channel's language, changes it later, and reads each one back", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });
    const body = {
      chainId: 8453,
      services: ["email", "signal"],
      email: "a@b.co",
      signalRecipient: "alice.42",
      locale: "en",
      channelLocales: { email: "en", signal: "en" },
    };
    expect(await read(await put(body))).toEqual(json(200, { success: true }));
    expect(await read(await put({ ...body, channelLocales: { email: "en", signal: "cs" } }))).toEqual(
      json(200, { success: true }),
    );

    const row = expectedRow(LOWER, {
      services: ["email", "signal"],
      email: "a@b.co",
      signal_recipient: "alice.42",
      email_locale: "en",
      signal_locale: "cs",
    });
    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(row, "row-lower"));

    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 8453)]: { data: { ...storedRow(), ...row } } });
    expect(JSON.parse((await read(await get({ chainId: "8453" }))).text).channelLocales).toStrictEqual({
      email: "en",
      signal: "cs",
    });
  });

  it("saves a Telegram username in place and reads it back as stored", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });

    const body = { chainId: 8453, services: ["telegram"], telegramUsername: "t.me/Alice_Eth" };
    expect(await read(await put(body))).toEqual(json(200, { success: true }));

    const row = expectedRow(LOWER, { services: ["telegram"], telegram_username: "alice_eth" });
    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(row, "row-lower"));

    fakeSupabase.respondByQuery({ [chainQuery(LOWER, 8453)]: { data: { ...storedRow(), ...row } } });
    expect(JSON.parse((await read(await get({ chainId: "8453" }))).text)).toMatchObject({
      services: ["telegram"],
      telegramUsername: "alice_eth",
    });
  });

  it("clears a stored Telegram username when Telegram is deselected and none is sent", async () => {
    fakeSupabase.respondByQuery({ [idLookup(LOWER, 8453)]: { data: { id: "row-lower" } } });

    await put({ chainId: 8453, services: ["email"], email: "a@b.co", telegramUsername: null });

    const row = expectedRow(LOWER, { services: ["email"], email: "a@b.co", telegram_username: null });
    expect(fakeSupabase.log().at(-1)).toBe(updateQuery(row, "row-lower"));
  });

  it("returns a generic 500 when the access check throws, logging the error", async () => {
    const thrown = new Error("rpc down");
    vi.mocked(isAccessActive).mockRejectedValue(thrown);
    expect(await read(await put({ chainId: 1 }))).toEqual(json(500, { error: SAVE_FAILED }));
    expect(loggedError()).toEqual(["PUT /api/notifications/config: failed", thrown]);
  });
});

describe("DELETE /api/notifications/config", () => {
  it("treats a malformed body as empty", async () => {
    expect(await read(await del("{"))).toEqual(json(400, { error: "Missing or invalid chainId" }));
  });

  it.each(NON_OBJECT_BODIES)("reads a body that is %s as empty, without the access check", async (_label, body) => {
    expect(await read(await del(body))).toEqual(json(400, { error: "Missing or invalid chainId" }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["missing", {}],
    ["string", { chainId: "1" }],
    ["fractional", { chainId: 1.5 }],
  ])("returns 400 for a %s chainId", async (_label, extra) => {
    expect(await read(await del({ ...extra }))).toEqual(json(400, { error: "Missing or invalid chainId" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns 403 when access is inactive", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await del({ chainId: 1 }))).toEqual(
      json(403, { error: "Active paid access required to delete notification config" }),
    );
    expect(isAccessActive).toHaveBeenCalledWith(CHECKSUMMED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("deletes both the lowercased and the legacy row", async () => {
    expect(await read(await del({ chainId: 10 }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10), deleteQuery(CHECKSUMMED, 10)]);
  });

  it("deletes once for a wallet whose EIP-55 form is lowercase", async () => {
    await del({ chainId: 10 }, DIGITS);
    expect(fakeSupabase.log()).toEqual([deleteQuery(DIGITS, 10)]);
  });

  it("returns a generic 502 on the first delete error without running the second, logging the message", async () => {
    fakeSupabase.respondByQuery({ [deleteQuery(LOWER, 10)]: { error: { message: "first failed" } } });
    expect(await read(await del({ chainId: 10 }))).toEqual(json(502, { error: DELETE_FAILED }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10)]);
    expect(loggedError()).toEqual([
      "DELETE /api/notifications/config: database error",
      { code: undefined, message: "first failed" },
    ]);
  });

  it.each([
    ["an uppercase", "V3"],
    ["a checksummed Spoke", "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd"],
    ["a numeric", 3],
  ])("returns 400 for %s market before the access check", async (_label, market) => {
    expect(await read(await del({ chainId: 1, market }))).toEqual(json(400, { error: INVALID_MARKET }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["a null", { market: null }],
    ["an empty", { market: "" }],
    ["the V3", { market: "v3" }],
  ])("deletes the chain's V3 row for %s market", async (_label, extra) => {
    await del({ chainId: 10, ...extra });
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 10), deleteQuery(CHECKSUMMED, 10)]);
  });

  it("deletes a V4 Spoke's row under both user id forms", async () => {
    expect(await read(await del({ chainId: 1, market: LIDO_SPOKE }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([deleteQuery(LOWER, 1, LIDO_SPOKE), deleteQuery(CHECKSUMMED, 1, LIDO_SPOKE)]);
  });

  // Unlike PUT, so a config for a Spoke the app no longer lists can still be removed.
  it.each([
    ["an address that is no Spoke", 1, NOT_A_SPOKE],
    ["a Spoke on another chain", 8453, LIDO_SPOKE],
  ])("deletes the row of %s", async (_label, chainId, market) => {
    expect(await read(await del({ chainId, market }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([
      deleteQuery(LOWER, chainId, market),
      deleteQuery(CHECKSUMMED, chainId, market),
    ]);
  });

  it("returns a generic 502 when the legacy delete fails", async () => {
    fakeSupabase.respondByQuery({ [deleteQuery(CHECKSUMMED, 10)]: { error: { message: "second failed" } } });
    expect(await read(await del({ chainId: 10 }))).toEqual(json(502, { error: DELETE_FAILED }));
  });

  it("returns a generic 500 when the access check throws, logging the error", async () => {
    const thrown = new Error("rpc down");
    vi.mocked(isAccessActive).mockRejectedValue(thrown);
    expect(await read(await del({ chainId: 1 }))).toEqual(json(500, { error: DELETE_FAILED }));
    expect(loggedError()).toEqual(["DELETE /api/notifications/config: failed", thrown]);
  });
});

describe("sign-in and cross-site checks", () => {
  type Init = { wallet?: string | null; userId?: unknown; headers?: Record<string, string | undefined> };
  const send: Record<"GET" | "PUT" | "DELETE", (init: Init) => Promise<Response>> = {
    GET: ({ wallet = LOWER, userId, headers }) =>
      GET(
        siteRequest(
          userId === undefined ? BASE_URL : `${BASE_URL}?${new URLSearchParams({ userId: String(userId) })}`,
          {
            wallet,
            headers,
          },
        ),
      ),
    PUT: ({ wallet = LOWER, userId, headers }) =>
      PUT(siteRequest(BASE_URL, { method: "PUT", body: { userId, chainId: 1 }, wallet, headers })),
    DELETE: ({ wallet = LOWER, userId, headers }) =>
      DELETE(siteRequest(BASE_URL, { method: "DELETE", body: { userId, chainId: 1 }, wallet, headers })),
  };
  const METHODS = ["GET", "PUT", "DELETE"] as const;
  const WRITES = ["PUT", "DELETE"] as const;
  const SIGN_IN_REQUIRED = json(401, { error: "Sign in with your wallet first" });

  it.each(METHODS)("%s answers 401 without a session, before reading the DB or the access", async method => {
    expect(await read(await send[method]({ wallet: null }))).toEqual(SIGN_IN_REQUIRED);
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it.each(METHODS)("%s answers 401 for a forged session cookie", async method => {
    const forged = `tokenping-session=v1.${Buffer.from(JSON.stringify({ sub: LOWER, iat: 0, exp: 9e9 })).toString("base64url")}.bad`;
    expect(await read(await send[method]({ wallet: null, headers: { cookie: forged } }))).toEqual(SIGN_IN_REQUIRED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(METHODS)("%s answers 403 when an older client's userId names another wallet", async method => {
    expect(await read(await send[method]({ userId: OTHER_WALLET }))).toEqual(
      json(403, { error: "userId does not match the signed-in wallet" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it.each(METHODS)("%s accepts a userId that names the signed-in wallet in any casing", async method => {
    expect((await send[method]({ userId: ` ${CHECKSUMMED} ` })).status).toBe(200);
  });

  it.each(METHODS)("%s acts for the signed-in wallet only", async method => {
    await send[method]({ wallet: OTHER_WALLET });
    const userIds = fakeSupabase.queries.flatMap(({ ops }) =>
      ops.filter(([op, column]) => op === "eq" && column === "user_id"),
    );
    expect(userIds.map(([, , value]) => value)).toEqual([OTHER_WALLET, getAddress(OTHER_WALLET)]);
  });

  it("checks paid access for the signed-in wallet", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    await send.PUT({ wallet: OTHER_WALLET });
    expect(isAccessActive).toHaveBeenCalledWith(getAddress(OTHER_WALLET));
  });

  it.each(WRITES)("%s answers 403 for a request from another site, before the session", async method => {
    expect(await read(await send[method]({ headers: { origin: "https://evil.example" } }))).toEqual(
      json(403, { error: "Cross-site request refused" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(WRITES)("%s answers 403 without Origin unless Sec-Fetch-Site says same-origin", async method => {
    expect((await send[method]({ headers: { origin: undefined } })).status).toBe(403);
    expect((await send[method]({ headers: { origin: undefined, "sec-fetch-site": "cross-site" } })).status).toBe(403);
    expect((await send[method]({ headers: { origin: undefined, "sec-fetch-site": "same-origin" } })).status).toBe(200);
  });

  it.each(WRITES)("%s answers 415 for a body that is not declared as JSON", async method => {
    for (const contentType of ["text/plain", "application/x-www-form-urlencoded", undefined]) {
      expect(await read(await send[method]({ headers: { "content-type": contentType } }))).toEqual(
        json(415, { error: "Content-Type must be application/json" }),
      );
    }
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(WRITES)("%s accepts JSON with a charset", async method => {
    expect((await send[method]({ headers: { "content-type": "application/json; charset=utf-8" } })).status).toBe(200);
  });

  it.each(METHODS)("%s answers 503 in production without SESSION_SECRET", async method => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(await read(await send[method]({ wallet: null }))).toEqual(
        json(503, { error: "Sign-in is not available on this server" }),
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("Morpho alerts", () => {
  const BLUE_ID = `0x${"3a".repeat(32)}`;
  const MIDNIGHT_ID = `0x${"5c".repeat(32)}`;
  const TOKEN = { address: "0x00000000000000000000000000000000000000b1", symbol: "USDC", decimals: 6 } as const;
  const COLLATERAL = { address: "0x00000000000000000000000000000000000000b2", symbol: "OETH", decimals: 18 } as const;
  const BLUE: BlueMarketParams = {
    kind: "blue",
    loanToken: TOKEN,
    collateralToken: COLLATERAL,
    oracle: "0x00000000000000000000000000000000000000e1",
    irm: "0x00000000000000000000000000000000000000c1",
    lltv: "860000000000000000",
    preLiquidations: [],
  };
  const REFRESHED: BlueMarketParams = {
    ...BLUE,
    preLiquidations: [
      {
        address: "0x00000000000000000000000000000000000000d1",
        preLltv: "832603694978499652",
        oracle: "0x00000000000000000000000000000000000000e2",
      },
    ],
  };
  const MIDNIGHT: MidnightMarketParams = {
    kind: "midnight",
    loanToken: TOKEN,
    collaterals: [
      { token: COLLATERAL, lltv: "915000000000000000", oracle: "0x00000000000000000000000000000000000000f1" },
    ],
    maturity: 1_793_372_400,
  };
  const UNKNOWN_MORPHO_MARKET = json(400, { error: "Unknown Morpho market" });
  const INVALID_MORPHO_MARKET = "Invalid market: expected a lowercased Morpho market id (0x and 64 hex characters)";
  const INVALID_PROTOCOL = "Invalid protocol: expected aave, morpho-blue or morpho-midnight";

  const blueBody = (extra: Record<string, unknown> = {}) => ({
    chainId: 8453,
    protocol: "morpho-blue",
    market: BLUE_ID,
    ...extra,
  });
  // DIGITS has no letters, so there is no legacy user id form and each lookup runs once.
  const morphoRow = (overrides: Record<string, unknown> = {}) =>
    storedRow({ protocol: "morpho-blue", market: BLUE_ID, market_params: BLUE, ...overrides });
  const insertQuery = (row: unknown) => `notification_configs.insert(${JSON.stringify(row)})`;
  const updateQuery = (row: unknown, id: string) =>
    `notification_configs.update(${JSON.stringify(row)}).eq("id","${id}")`;
  const writtenRow = (overrides: Record<string, unknown> = {}) => ({
    user_id: DIGITS,
    chain_id: 8453,
    market: BLUE_ID,
    enabled: true,
    services: [],
    health_factor_threshold: 1.5,
    email: null,
    signal_recipient: null,
    telegram_username: null,
    locale: "en",
    email_locale: null,
    signal_locale: null,
    telegram_locale: null,
    updated_at: NOW,
    protocol: "morpho-blue",
    market_params: BLUE,
    ...overrides,
  });

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "true");
    vi.mocked(readListedMarketParams).mockReset();
    vi.mocked(readListedMarketParams).mockResolvedValue(BLUE);
    vi.mocked(refreshMarketParams).mockReset();
    vi.mocked(refreshMarketParams).mockImplementation(async (_client, _chain, _id, stored) => stored);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("GET", () => {
    it("lists a Morpho alert under its protocol's key, naming the protocol after the market", async () => {
      fakeSupabase.respondByQuery({ [allQuery(DIGITS)]: { data: [storedRow(), morphoRow()] } });

      const body = JSON.parse((await read(await get({}, DIGITS))).text);

      expect(Object.keys(body)).toEqual(["8453:v3", `morpho-blue:8453:${BLUE_ID}`]);
      expect(Object.keys(body[`morpho-blue:8453:${BLUE_ID}`]).slice(0, 4)).toEqual([
        "chainId",
        "market",
        "protocol",
        "enabled",
      ]);
      expect(body[`morpho-blue:8453:${BLUE_ID}`]).toMatchObject({ market: BLUE_ID, protocol: "morpho-blue" });
      // The stored parameters stay on the server.
      expect(JSON.stringify(body)).not.toContain("market_params");
      expect("protocol" in body["8453:v3"]).toBe(false);
    });

    it("skips and logs a row whose market it cannot read, rather than showing it as an Aave alert", async () => {
      fakeSupabase.respondByQuery({
        [allQuery(DIGITS)]: {
          data: [
            storedRow(),
            morphoRow({ id: "bad-id", market: LIDO_SPOKE }),
            storedRow({ id: "future", protocol: "compound", market: BLUE_ID }),
          ],
        },
      });

      const body = JSON.parse((await read(await get({}, DIGITS))).text);

      expect(Object.keys(body)).toEqual(["8453:v3"]);
      expect(consoleError).toHaveBeenCalledTimes(2);
      expect((consoleError.mock.calls as unknown[][]).map(call => call[1])).toEqual([
        { id: "bad-id", protocol: "morpho-blue" },
        { id: "future", protocol: "compound" },
      ]);
    });

    it("reads one Morpho alert by protocol and market id", async () => {
      fakeSupabase.respondByQuery({ [chainQuery(DIGITS, 8453, BLUE_ID)]: { data: morphoRow() } });

      const res = await get({ chainId: "8453", protocol: "morpho-blue", market: BLUE_ID }, DIGITS);

      expect(JSON.parse((await read(res)).text)).toMatchObject({ protocol: "morpho-blue", market: BLUE_ID });
    });

    it.each([
      [{ protocol: "morpho" }, INVALID_PROTOCOL],
      [{ protocol: "morpho-blue" }, INVALID_MORPHO_MARKET],
      [{ protocol: "morpho-blue", market: LIDO_SPOKE }, INVALID_MORPHO_MARKET],
      [{ protocol: "morpho-blue", market: BLUE_ID.toUpperCase().replace("0X", "0x") }, INVALID_MORPHO_MARKET],
      [{ protocol: "aave", market: BLUE_ID }, INVALID_MARKET],
    ])("returns 400 for %j without touching the DB", async (params, error) => {
      expect(await read(await get({ chainId: "8453", ...params }))).toEqual(json(400, { error }));
      expect(await read(await get(params))).toEqual(json(400, { error }));
      expect(fakeSupabase.queries).toHaveLength(0);
    });
  });

  describe("PUT a new alert", () => {
    it("saves a listed market with the parameters read from the chain", async () => {
      expect(await read(await put(blueBody({ healthFactorThreshold: 1.05 }), DIGITS))).toEqual(
        json(200, { success: true }),
      );

      const chain = getMorphoChain(8453);
      expect(readListedMarketParams).toHaveBeenCalledWith(expect.anything(), chain, "morpho-blue", BLUE_ID);
      expect(fakeSupabase.log()).toEqual([
        chainQuery(DIGITS, 8453, BLUE_ID),
        idLookup(DIGITS, 8453, BLUE_ID),
        countQuery(DIGITS),
        insertQuery(writtenRow({ health_factor_threshold: 1.05 })),
      ]);
    });

    it("saves a listed Midnight market", async () => {
      vi.mocked(readListedMarketParams).mockResolvedValue(MIDNIGHT);
      const body = { chainId: 1, protocol: "morpho-midnight", market: MIDNIGHT_ID };

      expect(await read(await put(body, DIGITS))).toEqual(json(200, { success: true }));
      expect(fakeSupabase.log().at(-1)).toBe(
        insertQuery(
          writtenRow({ chain_id: 1, market: MIDNIGHT_ID, protocol: "morpho-midnight", market_params: MIDNIGHT }),
        ),
      );
    });

    it.each([
      [1.0, 1.02],
      [1.02, 1.02],
      [12, 10],
    ])("clamps the threshold %j to Morpho's range as %j", async (sent, stored) => {
      await put(blueBody({ healthFactorThreshold: sent }), DIGITS);
      expect(fakeSupabase.log().at(-1)).toBe(insertQuery(writtenRow({ health_factor_threshold: stored })));
    });

    it("keeps Aave's 1.1 minimum for an Aave alert", async () => {
      await put({ chainId: 8453, healthFactorThreshold: 1.02 }, DIGITS);
      expect(fakeSupabase.log().at(-1)).toContain('"health_factor_threshold":1.1,');
    });

    it("refuses a new alert while Morpho is not enabled, without asking Morpho's API", async () => {
      vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "");

      expect(await read(await put(blueBody(), DIGITS))).toEqual(
        json(404, { error: "Morpho alerts are not available" }),
      );
      expect(readListedMarketParams).not.toHaveBeenCalled();
      expect(fakeSupabase.log()).toEqual([chainQuery(DIGITS, 8453, BLUE_ID)]);
    });

    it("refuses a market whose parameters the cron could not read back", async () => {
      vi.mocked(readListedMarketParams).mockResolvedValue({ ...MIDNIGHT, collaterals: [] });
      const body = { chainId: 1, protocol: "morpho-midnight", market: MIDNIGHT_ID };

      expect(await read(await put(body, DIGITS))).toEqual(UNKNOWN_MORPHO_MARKET);
      expect(fakeSupabase.log().some(query => query.includes(".insert("))).toBe(false);
    });

    it("refuses a market Morpho's app does not list or the chain does not have", async () => {
      vi.mocked(readListedMarketParams).mockResolvedValue(null);

      expect(await read(await put(blueBody(), DIGITS))).toEqual(UNKNOWN_MORPHO_MARKET);
      expect(fakeSupabase.log()).toEqual([chainQuery(DIGITS, 8453, BLUE_ID)]);
    });

    it("answers 503 and saves nothing when Morpho's API cannot answer", async () => {
      vi.mocked(readListedMarketParams).mockRejectedValue(new MorphoApiError("Morpho API answered 502"));

      expect(await read(await put(blueBody(), DIGITS))).toEqual(
        json(503, { error: "Could not verify the Morpho market. Please try again later." }),
      );
      expect(fakeSupabase.log().some(query => query.includes(".insert("))).toBe(false);
      expect(loggedError()).toEqual([
        "PUT /api/notifications/config: Morpho API unavailable",
        "Morpho API answered 502",
      ]);
    });

    it("answers a generic 500 when the chain cannot be read", async () => {
      vi.mocked(readListedMarketParams).mockRejectedValue(
        new Error("HTTP request failed. URL: https://rpc.example/key"),
      );

      expect(await read(await put(blueBody(), DIGITS))).toEqual(json(500, { error: SAVE_FAILED }));
      expect(fakeSupabase.log().some(query => query.includes(".insert("))).toBe(false);
    });

    it.each([
      ["Blue on a chain Morpho's app does not cover", { chainId: 56 }],
      ["Midnight on a chain without Midnight", { chainId: 42161, protocol: "morpho-midnight" }],
    ])("refuses %s before the access check or any DB call", async (_label, extra) => {
      expect(await read(await put(blueBody(extra), DIGITS))).toEqual(UNKNOWN_MORPHO_MARKET);
      expect(isAccessActive).not.toHaveBeenCalled();
      expect(fakeSupabase.queries).toHaveLength(0);
    });

    it("refuses a new Midnight alert where Morpho's API cannot say which markets are listed", async () => {
      // Tempo has a Midnight contract, but no listing data.
      const body = { chainId: 4217, protocol: "morpho-midnight", market: MIDNIGHT_ID };
      expect(await read(await put(body, DIGITS))).toEqual(UNKNOWN_MORPHO_MARKET);
      expect(readListedMarketParams).not.toHaveBeenCalled();
    });

    it.each([
      [{ protocol: "morpho" }, INVALID_PROTOCOL],
      [{ protocol: "morpho-blue", market: undefined }, INVALID_MORPHO_MARKET],
      [{ protocol: "morpho-blue", market: "v3" }, INVALID_MORPHO_MARKET],
      [{ protocol: "aave", market: BLUE_ID }, INVALID_MARKET],
    ])("returns 400 for %j before the access check or any DB call", async (extra, error) => {
      expect(await read(await put(blueBody(extra), DIGITS))).toEqual(json(400, { error }));
      expect(isAccessActive).not.toHaveBeenCalled();
      expect(fakeSupabase.queries).toHaveLength(0);
    });

    it("checks paid access before asking Morpho's API", async () => {
      vi.mocked(isAccessActive).mockResolvedValue(false);

      expect((await put(blueBody(), DIGITS)).status).toBe(403);
      expect(readListedMarketParams).not.toHaveBeenCalled();
      expect(fakeSupabase.queries).toHaveLength(0);
    });
  });

  describe("PUT an existing alert", () => {
    beforeEach(() => {
      fakeSupabase.respondByQuery({
        [chainQuery(DIGITS, 8453, BLUE_ID)]: { data: morphoRow() },
        [idLookup(DIGITS, 8453, BLUE_ID)]: { data: { id: "row-1" } },
      });
    });

    it("updates it with the parameters brought up to date", async () => {
      vi.mocked(refreshMarketParams).mockResolvedValue(REFRESHED);

      expect(await read(await put(blueBody({ healthFactorThreshold: 1.2 }), DIGITS))).toEqual(
        json(200, { success: true }),
      );

      expect(refreshMarketParams).toHaveBeenCalledWith(expect.anything(), getMorphoChain(8453), BLUE_ID, BLUE);
      expect(readListedMarketParams).not.toHaveBeenCalled();
      expect(fakeSupabase.log()).toEqual([
        chainQuery(DIGITS, 8453, BLUE_ID),
        idLookup(DIGITS, 8453, BLUE_ID),
        updateQuery(writtenRow({ health_factor_threshold: 1.2, market_params: REFRESHED }), "row-1"),
      ]);
    });

    it("keeps working while Morpho is not enabled", async () => {
      vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "");
      expect(await read(await put(blueBody(), DIGITS))).toEqual(json(200, { success: true }));
    });

    it("treats a row with unreadable parameters as a new alert", async () => {
      fakeSupabase.respondByQuery({
        [chainQuery(DIGITS, 8453, BLUE_ID)]: { data: morphoRow({ market_params: { kind: "blue" } }) },
        [idLookup(DIGITS, 8453, BLUE_ID)]: { data: { id: "row-1" } },
      });

      expect(await read(await put(blueBody(), DIGITS))).toEqual(json(200, { success: true }));
      expect(refreshMarketParams).not.toHaveBeenCalled();
      expect(readListedMarketParams).toHaveBeenCalledOnce();
      expect(fakeSupabase.log().at(-1)).toBe(updateQuery(writtenRow(), "row-1"));
    });
  });

  describe("DELETE", () => {
    it("deletes a Morpho alert without Morpho's API, whether or not Morpho is enabled", async () => {
      vi.stubEnv("NEXT_PUBLIC_MORPHO_ENABLED", "");

      expect(await read(await del(blueBody(), DIGITS))).toEqual(json(200, { success: true }));
      expect(fakeSupabase.log()).toEqual([deleteQuery(DIGITS, 8453, BLUE_ID)]);
      expect(readListedMarketParams).not.toHaveBeenCalled();
      expect(refreshMarketParams).not.toHaveBeenCalled();
    });

    it("deletes an alert on a chain Morpho no longer covers", async () => {
      expect(await read(await del(blueBody({ chainId: 56 }), DIGITS))).toEqual(json(200, { success: true }));
    });

    it.each([
      [{ protocol: "morpho" }, INVALID_PROTOCOL],
      [{ market: LIDO_SPOKE }, INVALID_MORPHO_MARKET],
    ])("returns 400 for %j", async (extra, error) => {
      expect(await read(await del(blueBody(extra), DIGITS))).toEqual(json(400, { error }));
      expect(fakeSupabase.queries).toHaveLength(0);
    });
  });
});
