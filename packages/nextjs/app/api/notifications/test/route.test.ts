import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "~~/app/api/notifications/test/route";
import type { MarketSnapshot } from "~~/services/aave/getHealthFactor";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { isAccessActive } from "~~/services/payments/checkAccess";

/*
 * The route against the real config lookup, Telegram chat lookup, test-send limit and message builder, with the
 * database behind the fake Supabase client (plus the claim rpc), and the position read and the senders mocked.
 * `mocks.events` records the order of the steps that cost something: database calls, the claim, the read, the send.
 */

const mocks = vi.hoisted(() => ({
  events: [] as string[],
  claim: { data: null as unknown, error: null as { message: string } | null },
  rpcCalls: [] as { fn: string; args: unknown }[],
  getMarketSnapshot: vi.fn(),
  send: { email: vi.fn(), signal: vi.fn(), telegram: vi.fn() },
}));

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  const client = {
    from: (table: string) => {
      mocks.events.push(table);
      return fakeSupabase.client.from(table);
    },
    rpc: (fn: string, args: unknown) => {
      mocks.events.push(fn);
      mocks.rpcCalls.push({ fn, args });
      return { single: () => Promise.resolve(mocks.claim) };
    },
  };
  return { getSupabaseServerClient: () => client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));
vi.mock("~~/services/aave/getHealthFactor", () => ({ getMarketSnapshot: mocks.getMarketSnapshot }));
vi.mock("~~/services/notifications/runNotificationCheck", () => ({ ALERT_SENDERS: mocks.send }));

const BASE_URL = "http://localhost/api/notifications/test";
const NOW = "2026-10-14T09:05:07.000Z";
const NOW_TEXT = "Oct 14, 2026, 9:05:07 AM Coordinated Universal Time";
const RETRY_AT = "2026-10-14T09:20:07.000Z";
const BOT = "tokenping_bot";

const LOWER = `0x${"ab".repeat(20)}`;
const MIXED = `0x${"AB".repeat(20)}`;
// Ethereum's Lido Spoke as a market id.
const LIDO_SPOKE = "0xe1900480ac69f0b296841cd01cc37546d92f35cd";
const INVALID_MARKET = "Invalid market: expected v3 or the lowercased address of an Aave V3 Pool or V4 Spoke";
const INVALID_CHANNEL = "Invalid channel: expected email, signal or telegram";
const NO_ACCESS = "Active paid access required to send a test message";
const SEND_FAILED = "Could not send the test message. Please try again.";

const configQuery = (uid: string, chainId = 8453, market = "v3") =>
  `notification_configs.select("*").eq("user_id","${uid}").eq("chain_id",${chainId}).eq("market","${market}").maybeSingle()`;
const chatQuery = (username: string) => `telegram_chats.select("chat_id").eq("username","${username}").maybeSingle()`;
const releaseQuery = (uid: string, channel: string, sentAt: string) =>
  `notification_test_sends.delete().eq("user_id","${uid}").eq("channel","${channel}").eq("sent_at","${sentAt}")`;
const retryTimesQuery = (uid: string) => `notification_test_sends.select("channel, sent_at").eq("user_id","${uid}")`;

const storedRow = (overrides: Record<string, unknown> = {}) => ({
  id: "row-1",
  user_id: LOWER,
  chain_id: 8453,
  market: "v3",
  enabled: true,
  services: ["email", "signal", "telegram"],
  health_factor_threshold: "1.80",
  email: "saved@example.com",
  signal_recipient: "alice.42",
  telegram_username: "alice_eth",
  locale: "en",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

/** Base, health factor 1.4237 (shown 1.42), below the saved 1.8. */
const SNAPSHOT: MarketSnapshot = {
  chainName: "Base",
  healthFactor: "1.42",
  healthFactorValue: 1.4237,
  collateralUSD: 12345.67,
  debtUSD: 6789.01,
  hasPosition: true,
};

const EXPECTED_TEXT =
  "Test message from Tokenping: alerts on this channel work.\n\n" +
  "Your alert: Base, when the health factor drops below 1.8.\n" +
  "Right now: health factor 1.42 (Risky), collateral $12.35K, debt $6.79K.\n" +
  "That is below your threshold, so the next check sends a real alert.\n\n" +
  `Checked every 5 minutes. Sent at: ${NOW_TEXT}`;

const VALID_BODY = { userId: LOWER, chainId: 8453, market: "v3", channel: "email" };

const get = (query: string) => GET(new Request(`${BASE_URL}${query}`));
const post = (body: unknown) =>
  POST(new Request(BASE_URL, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
const read = async (res: Response) => ({ status: res.status, body: await res.json() });

/** Answers the config lookup with `row` (none when null), and the Telegram chat lookup with `chatId`. */
const savedAlert = (row: Record<string, unknown> | null = storedRow(), chatId: string | number | null = "123456789") =>
  fakeSupabase.respondByQuery({
    ...(row ? { [configQuery(String(row.user_id), Number(row.chain_id), String(row.market))]: { data: row } } : {}),
    ...(chatId === null ? {} : { [chatQuery("alice_eth")]: { data: { chat_id: chatId } } }),
  });

const claimed = (claimedSlot = true, sentAt = NOW, retryAt = RETRY_AT) => {
  mocks.claim = { data: { claimed: claimedSlot, sent_at: sentAt, retry_at: retryAt }, error: null };
};

let consoleError: ReturnType<typeof vi.spyOn>;

/** The one error the route logged: [prefix, detail]. */
const loggedError = () => {
  expect(consoleError).toHaveBeenCalledOnce();
  return consoleError.mock.calls[0];
};

const allSenders = () => Object.values(mocks.send);
const nothingSent = () => allSenders().every(sender => sender.mock.calls.length === 0);

beforeEach(() => {
  fakeSupabase.reset();
  mocks.events = [];
  mocks.rpcCalls = [];
  claimed();
  mocks.getMarketSnapshot.mockReset().mockImplementation(async () => {
    mocks.events.push("read position");
    return SNAPSHOT;
  });
  for (const [channel, sender] of Object.entries(mocks.send)) {
    sender.mockReset().mockImplementation(async () => {
      mocks.events.push(`send ${channel}`);
      return { success: true };
    });
  }
  vi.mocked(isAccessActive).mockReset().mockResolvedValue(true);
  vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", BOT);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/notifications/test", () => {
  it.each([
    ["missing", ""],
    ["empty", "?userId="],
    ["blank", "?userId=%20%20"],
  ])("returns 400 for a %s userId without touching the database", async (_, query) => {
    expect(await read(await get(query))).toEqual({ status: 400, body: { error: "Missing or invalid userId" } });
    expect(mocks.events).toEqual([]);
  });

  it("returns when each channel can send again, for the lowercased wallet, never cached and without an access check", async () => {
    fakeSupabase.respondByQuery({
      [retryTimesQuery(LOWER)]: { data: [{ channel: "signal", sent_at: "2026-10-14T09:00:00.000Z" }] },
    });

    const res = await get(`?userId=${MIXED}`);

    expect(await read(res)).toEqual({
      status: 200,
      body: { email: null, signal: "2026-10-14T09:15:00.000Z", telegram: null },
    });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(fakeSupabase.log()).toEqual([retryTimesQuery(LOWER)]);
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when the limit cannot be read, logging the reason", async () => {
    fakeSupabase.respondByQuery({ [retryTimesQuery(LOWER)]: { error: { message: "connection refused" } } });
    expect(await read(await get(`?userId=${LOWER}`))).toEqual({
      status: 500,
      body: { error: "Could not read the test message limit" },
    });
    expect(loggedError()).toEqual([
      "GET /api/notifications/test: failed",
      new Error("Failed to read the test message limit: connection refused"),
    ]);
  });
});

describe("POST /api/notifications/test: input", () => {
  it.each([
    ["no userId", { ...VALID_BODY, userId: undefined }, "Missing or invalid userId"],
    ["a blank userId", { ...VALID_BODY, userId: "  " }, "Missing or invalid userId"],
    ["a numeric userId", { ...VALID_BODY, userId: 42 }, "Missing or invalid userId"],
    ["no chainId", { ...VALID_BODY, chainId: undefined }, "Missing or invalid chainId"],
    ["a string chainId", { ...VALID_BODY, chainId: "8453" }, "Missing or invalid chainId"],
    ["a null chainId", { ...VALID_BODY, chainId: null }, "Missing or invalid chainId"],
    ["an uppercase market", { ...VALID_BODY, market: "V3" }, INVALID_MARKET],
    ["an address that is no market", { ...VALID_BODY, market: "0x1234" }, INVALID_MARKET],
    ["a checksummed Spoke", { ...VALID_BODY, market: "0xe1900480ac69f0B296841Cd01cC37546d92F35Cd" }, INVALID_MARKET],
    ["no channel", { ...VALID_BODY, channel: undefined }, INVALID_CHANNEL],
    ["an unknown channel", { ...VALID_BODY, channel: "sms" }, INVALID_CHANNEL],
    ["an uppercase channel", { ...VALID_BODY, channel: "Email" }, INVALID_CHANNEL],
    ["a list of channels", { ...VALID_BODY, channel: ["email"] }, INVALID_CHANNEL],
  ])("returns 400 for %s without checking access or touching the database", async (_, body, error) => {
    expect(await read(await post(body))).toEqual({ status: 400, body: { error } });
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(mocks.events).toEqual([]);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["null", "null"],
    ["an array", JSON.stringify([VALID_BODY])],
  ])("reads %s as an empty body", async (_, body) => {
    expect(await read(await post(body))).toEqual({ status: 400, body: { error: "Missing or invalid userId" } });
    expect(mocks.events).toEqual([]);
  });

  it("checks the fields in order: userId, chainId, market, channel", async () => {
    expect((await read(await post({ chainId: "x", market: "V3", channel: "sms" }))).body.error).toBe(
      "Missing or invalid userId",
    );
    expect((await read(await post({ userId: LOWER, chainId: "x", market: "V3", channel: "sms" }))).body.error).toBe(
      "Missing or invalid chainId",
    );
    expect((await read(await post({ userId: LOWER, chainId: 1, market: "V3", channel: "sms" }))).body.error).toBe(
      INVALID_MARKET,
    );
  });

  it("reads the V3 market when the body has none", async () => {
    savedAlert();
    expect((await post({ ...VALID_BODY, market: undefined })).status).toBe(200);
    expect(fakeSupabase.log()[0]).toBe(configQuery(LOWER, 8453, "v3"));
  });
});

describe("POST /api/notifications/test: access and the saved alert", () => {
  it("returns 403 without active access, checking the trimmed wallet as sent, before any database call", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    savedAlert();

    expect(await read(await post({ ...VALID_BODY, userId: `  ${MIXED} ` }))).toEqual({
      status: 403,
      body: { error: NO_ACCESS },
    });
    expect(vi.mocked(isAccessActive).mock.calls).toEqual([[MIXED]]);
    expect(mocks.events).toEqual([]);
    expect(nothingSent()).toBe(true);
  });

  it("returns 404 when the wallet has no saved alert for the market, under either form of its id", async () => {
    expect(await read(await post({ ...VALID_BODY, userId: MIXED }))).toEqual({
      status: 404,
      body: { error: "No saved alert for this market" },
    });
    expect(fakeSupabase.log()).toEqual([configQuery(LOWER), configQuery(MIXED)]);
    expect(mocks.rpcCalls).toEqual([]);
  });

  it("returns 404 for another market's alert on the same chain", async () => {
    savedAlert(storedRow({ chain_id: 1, market: "v3" }));
    expect((await post({ ...VALID_BODY, chainId: 1, market: LIDO_SPOKE })).status).toBe(404);
    expect(fakeSupabase.log()).toEqual([configQuery(LOWER, 1, LIDO_SPOKE)]);
  });

  it("returns a generic 500 when the alert cannot be read, logging the reason", async () => {
    fakeSupabase.respondByQuery({ [configQuery(LOWER)]: { error: { message: "timeout" } } });
    expect(await read(await post(VALID_BODY))).toEqual({ status: 500, body: { error: SEND_FAILED } });
    expect(mocks.rpcCalls).toEqual([]);
    expect(loggedError()).toEqual(["POST /api/notifications/test: failed", new Error("timeout")]);
  });

  it.each([
    ["signal", ["email", "telegram"]],
    ["telegram", ["email"]],
    ["email", []],
    ["email", null],
  ])("returns 400 for %s when the alert sends by %j only", async (channel, services) => {
    savedAlert(storedRow({ services }));
    expect(await read(await post({ ...VALID_BODY, channel }))).toEqual({
      status: 400,
      body: { error: `This alert does not send by ${channel}` },
    });
    expect(mocks.rpcCalls).toEqual([]);
    expect(nothingSent()).toBe(true);
  });

  it.each([
    ["email", { email: null }, "This alert has no email address saved"],
    ["email", { email: "   " }, "This alert has no email address saved"],
    ["signal", { signal_recipient: null }, "This alert has no Signal username saved"],
    ["signal", { signal_recipient: "" }, "This alert has no Signal username saved"],
    ["telegram", { telegram_username: null }, "This alert has no Telegram username saved"],
    ["telegram", { telegram_username: undefined }, "This alert has no Telegram username saved"],
  ])("returns 400 for %s when the saved alert has no recipient for it (%j)", async (channel, overrides, error) => {
    savedAlert(storedRow(overrides));
    expect(await read(await post({ ...VALID_BODY, channel }))).toEqual({ status: 400, body: { error } });
    expect(mocks.rpcCalls).toEqual([]);
    expect(mocks.getMarketSnapshot).not.toHaveBeenCalled();
  });

  it("returns 409, naming the bot, while the saved Telegram username has not pressed Start, without claiming", async () => {
    savedAlert(storedRow(), null);
    expect(await read(await post({ ...VALID_BODY, channel: "telegram" }))).toEqual({
      status: 409,
      body: { error: `@alice_eth has not pressed Start in @${BOT} yet` },
    });
    expect(fakeSupabase.log()).toEqual([configQuery(LOWER), chatQuery("alice_eth")]);
    expect(mocks.rpcCalls).toEqual([]);
    expect(nothingSent()).toBe(true);
  });

  it("names the bot without its '@' setting prefix, or generically while no bot is configured", async () => {
    savedAlert(storedRow(), null);
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", `@${BOT}`);
    expect((await read(await post({ ...VALID_BODY, channel: "telegram" }))).body.error).toBe(
      `@alice_eth has not pressed Start in @${BOT} yet`,
    );
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", "");
    expect(await read(await post({ ...VALID_BODY, channel: "telegram" }))).toEqual({
      status: 409,
      body: { error: "@alice_eth has not pressed Start in the Tokenping bot yet" },
    });
  });

  it("returns a generic 500 when the Telegram chat cannot be read, without claiming", async () => {
    fakeSupabase.respondByQuery({
      [configQuery(LOWER)]: { data: storedRow() },
      [chatQuery("alice_eth")]: { error: { message: "connection reset" } },
    });
    expect(await read(await post({ ...VALID_BODY, channel: "telegram" }))).toEqual({
      status: 500,
      body: { error: SEND_FAILED },
    });
    expect(mocks.rpcCalls).toEqual([]);
    expect(loggedError()[1]).toEqual(new Error("Failed to read the Telegram chat: connection reset"));
  });
});

describe("POST /api/notifications/test: the limit", () => {
  it("claims the lowercased wallet's slot for the channel, with the 15-minute cooldown, after the recipient checks", async () => {
    fakeSupabase.respondByQuery({
      [configQuery(MIXED)]: { data: storedRow({ user_id: MIXED }) },
      [chatQuery("alice_eth")]: { data: { chat_id: "123456789" } },
    });

    expect((await post({ ...VALID_BODY, userId: ` ${MIXED} `, channel: "telegram" })).status).toBe(200);
    expect(mocks.rpcCalls).toEqual([
      {
        fn: "claim_notification_test_send",
        args: { p_user_id: LOWER, p_channel: "telegram", p_cooldown_seconds: 900 },
      },
    ]);
    // A legacy row is found under the checksummed id; the claim is always under the lowercased one.
    expect(mocks.events).toEqual([
      "notification_configs",
      "notification_configs",
      "telegram_chats",
      "claim_notification_test_send",
      "read position",
      "send telegram",
    ]);
  });

  it("returns 429 with when the channel frees up, and neither reads the position nor sends", async () => {
    savedAlert();
    claimed(false, "2026-10-14T09:01:00.000Z", "2026-10-14T09:16:00.000Z");

    expect(await read(await post(VALID_BODY))).toEqual({
      status: 429,
      body: { error: "One test message per channel every 15 minutes", retryAt: "2026-10-14T09:16:00.000Z" },
    });
    expect(mocks.getMarketSnapshot).not.toHaveBeenCalled();
    expect(nothingSent()).toBe(true);
    // The slot belongs to the earlier send: nothing is given back.
    expect(mocks.events).toEqual(["notification_configs", "claim_notification_test_send"]);
  });

  it("returns a generic 500 when the limit cannot be checked, and neither reads the position nor sends", async () => {
    savedAlert();
    mocks.claim = { data: null, error: { message: "permission denied for function" } };

    expect(await read(await post(VALID_BODY))).toEqual({ status: 500, body: { error: SEND_FAILED } });
    expect(loggedError()[1]).toEqual(
      new Error("Failed to check the test message limit: permission denied for function"),
    );
    expect(mocks.getMarketSnapshot).not.toHaveBeenCalled();
    expect(nothingSent()).toBe(true);
  });
});

describe("POST /api/notifications/test: sending", () => {
  it("sends the saved alert and the position now to the saved email, and answers with the claim's times", async () => {
    savedAlert();

    const res = await post(VALID_BODY);

    expect(await read(res)).toEqual({ status: 200, body: { sentAt: NOW, retryAt: RETRY_AT } });
    expect(mocks.events).toEqual([
      "notification_configs",
      "claim_notification_test_send",
      "read position",
      "send email",
    ]);
    expect(mocks.getMarketSnapshot.mock.calls).toEqual([[LOWER, 8453, "v3"]]);
    expect(mocks.send.email.mock.calls).toEqual([
      [
        "saved@example.com",
        {
          text: EXPECTED_TEXT,
          subject: "Tokenping test message - Base",
          html: expect.stringMatching(
            /^<p><strong>Test message from Tokenping: alerts on this channel work\.<\/strong><\/p>/,
          ),
        },
      ],
    ]);
    expect(mocks.send.signal).not.toHaveBeenCalled();
    expect(mocks.send.telegram).not.toHaveBeenCalled();
    // Nothing is given back after a successful send.
    expect(fakeSupabase.log().some(query => query.includes(".delete()"))).toBe(false);
  });

  it("sends to the saved Signal username, trimmed", async () => {
    savedAlert(storedRow({ signal_recipient: "  alice.42 " }));
    expect((await post({ ...VALID_BODY, channel: "signal" })).status).toBe(200);
    expect(mocks.send.signal.mock.calls).toEqual([["alice.42", expect.objectContaining({ text: EXPECTED_TEXT })]]);
  });

  it("sends Telegram to the chat the saved username pressed Start in, not to the username", async () => {
    savedAlert(storedRow({ telegram_username: " alice_eth " }), 123456789);
    expect((await post({ ...VALID_BODY, channel: "telegram" })).status).toBe(200);
    expect(fakeSupabase.log()).toEqual([configQuery(LOWER), chatQuery("alice_eth")]);
    expect(mocks.send.telegram.mock.calls).toEqual([["123456789", expect.objectContaining({ text: EXPECTED_TEXT })]]);
  });

  it("never takes the recipient from the request", async () => {
    savedAlert();
    const injected = {
      email: "attacker@example.com",
      signalRecipient: "mallory.01",
      telegramUsername: "mallory",
      chatId: "666",
      recipient: "attacker@example.com",
      to: "attacker@example.com",
    };

    for (const channel of ["email", "signal", "telegram"]) {
      expect((await post({ ...VALID_BODY, ...injected, channel })).status).toBe(200);
    }
    expect(allSenders().map(sender => sender.mock.calls.map(([recipient]) => recipient))).toEqual([
      ["saved@example.com"],
      ["alice.42"],
      ["123456789"],
    ]);
    expect(fakeSupabase.log()).not.toContain(chatQuery("mallory"));
  });

  it("writes the message in the alert's saved language, not the request's", async () => {
    savedAlert(storedRow({ locale: "cs", health_factor_threshold: "1.85" }));

    await post({ ...VALID_BODY, locale: "en" });

    const [, message] = mocks.send.email.mock.calls[0];
    expect(message.subject).toBe("Testovací zpráva Tokenpingu - Base");
    expect(message.text).toContain("Vaše upozornění: Base, když health factor klesne pod 1,85.");
    expect(message.text).toContain("Teď: health factor 1,42 (rizikový)");
  });

  it("writes the message in the channel's own language when it has one", async () => {
    savedAlert(storedRow({ locale: "en", email_locale: "cs", health_factor_threshold: "1.85" }));
    await post(VALID_BODY);
    expect(mocks.send.email.mock.calls[0][1].subject).toBe("Testovací zpráva Tokenpingu - Base");

    vi.clearAllMocks();
    savedAlert(storedRow({ locale: "cs", email_locale: "en" }));
    await post(VALID_BODY);
    expect(mocks.send.email.mock.calls[0][1].text).toBe(EXPECTED_TEXT);
  });

  it("writes English for a row saved before the language column", async () => {
    savedAlert(storedRow({ locale: undefined }));
    await post(VALID_BODY);
    expect(mocks.send.email.mock.calls[0][1].text).toBe(EXPECTED_TEXT);
  });

  it("uses the saved threshold, normalized like the cron's", async () => {
    savedAlert(storedRow({ health_factor_threshold: "25" }));
    await post(VALID_BODY);
    expect(mocks.send.email.mock.calls[0][1].text).toContain("drops below 10.\nRight now");
    expect(mocks.send.email.mock.calls[0][1].text).toContain("That is below your threshold");
  });

  it("reads a V4 Spoke's position and names the Spoke when the read fails", async () => {
    savedAlert(storedRow({ chain_id: 1, market: LIDO_SPOKE }));
    mocks.getMarketSnapshot.mockResolvedValue(null);

    expect((await post({ ...VALID_BODY, chainId: 1, market: LIDO_SPOKE })).status).toBe(200);
    expect(mocks.getMarketSnapshot.mock.calls).toEqual([[LOWER, 1, LIDO_SPOKE]]);
    const [, message] = mocks.send.email.mock.calls[0];
    expect(message.subject).toBe("Tokenping test message - Ethereum (V4 Lido)");
    expect(message.text).toContain("Right now: your position could not be read.");
  });

  it("names a market the app does not read by its chain id", async () => {
    savedAlert(storedRow({ chain_id: 999 }));
    mocks.getMarketSnapshot.mockResolvedValue(null);
    expect((await post({ ...VALID_BODY, chainId: 999 })).status).toBe(200);
    expect(mocks.send.email.mock.calls[0][1].subject).toBe("Tokenping test message - chain 999");
  });

  it("reads the position as the wallet id the alert is saved under", async () => {
    fakeSupabase.respondByQuery({ [configQuery(MIXED)]: { data: storedRow({ user_id: MIXED }) } });
    expect((await post({ ...VALID_BODY, userId: MIXED })).status).toBe(200);
    expect(mocks.getMarketSnapshot.mock.calls).toEqual([[MIXED, 8453, "v3"]]);
  });
});

describe("POST /api/notifications/test: giving the slot back", () => {
  it("returns a generic 502 when the send fails, logs the provider's reason, and gives back exactly the slot it claimed", async () => {
    savedAlert();
    claimed(true, "2026-10-14 09:05:07.123456+00");
    mocks.send.signal.mockResolvedValue({ success: false, error: "Signal relay returned 503" });

    expect(await read(await post({ ...VALID_BODY, userId: MIXED, channel: "signal" }))).toEqual({
      status: 502,
      body: { error: "Could not send the test message by Signal. Please try again later." },
    });
    expect(loggedError()).toEqual([
      "POST /api/notifications/test: the signal provider refused the message",
      "Signal relay returned 503",
    ]);
    expect(fakeSupabase.log()).toEqual([
      configQuery(LOWER),
      releaseQuery(LOWER, "signal", "2026-10-14 09:05:07.123456+00"),
    ]);
  });

  it("still answers 502 when giving the slot back fails", async () => {
    savedAlert();
    fakeSupabase.respond(({ table }, formatted) =>
      table === "notification_test_sends"
        ? { error: { message: "timeout" } }
        : formatted === configQuery(LOWER)
          ? { data: storedRow() }
          : undefined,
    );
    mocks.send.email.mockResolvedValue({ success: false, error: "Resend: domain not verified" });

    expect(await read(await post(VALID_BODY))).toEqual({
      status: 502,
      body: { error: "Could not send the test message by email. Please try again later." },
    });
    expect(fakeSupabase.log().at(-1)).toBe(releaseQuery(LOWER, "email", NOW));
  });

  it("returns a generic 500 and gives the slot back when sending throws", async () => {
    savedAlert();
    mocks.send.telegram.mockRejectedValue(new Error("fetch failed"));

    expect(await read(await post({ ...VALID_BODY, channel: "telegram" }))).toEqual({
      status: 500,
      body: { error: SEND_FAILED },
    });
    expect(loggedError()).toEqual(["POST /api/notifications/test: failed", new Error("fetch failed")]);
    expect(fakeSupabase.log().at(-1)).toBe(releaseQuery(LOWER, "telegram", NOW));
  });

  it("returns a generic 500 and gives the slot back when reading the position throws", async () => {
    savedAlert();
    mocks.getMarketSnapshot.mockRejectedValue(new Error("RPC exploded"));

    expect(await read(await post(VALID_BODY))).toEqual({ status: 500, body: { error: SEND_FAILED } });
    expect(fakeSupabase.log().at(-1)).toBe(releaseQuery(LOWER, "email", NOW));
    expect(nothingSent()).toBe(true);
  });
});
