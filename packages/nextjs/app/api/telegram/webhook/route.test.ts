import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "~~/app/api/telegram/webhook/route";
import { afterQueue } from "~~/services/api/server/testing/afterQueue";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/telegram/sendTelegram", () => ({ replyToTelegramChat: vi.fn() }));
vi.mock("next/server", async importOriginal => {
  const { afterQueue } = await import("~~/services/api/server/testing/afterQueue");
  return { ...(await importOriginal<typeof import("next/server")>()), after: afterQueue.after };
});

const SECRET = "webhook-secret-123";
const NOW = "2026-10-14T09:05:07.000Z";
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";
const LOWER = `0x${"1c".repeat(20)}`;
const CHECKSUMMED = `0x${"1C".repeat(20)}`;

// Verbatim reply texts.
const PRIVATE_ONLY = "Tokenping only supports private chats. Please DM the bot directly.";
const START_HELP =
  "Hi! To receive Aave health-factor alerts here, open Tokenping → " +
  "Notification settings → select Telegram → press 'Connect Telegram'.";
const INVALID_LINK = "❌ Invalid link. Please generate a new one in the Tokenping app.";
const EXPIRED_LINK = "❌ This link has expired or was already used. Please generate a new one in the Tokenping app.";
const SAVE_FAILED = "Something went wrong saving your link. Please try again.";
const CONNECTED =
  "✅ Connected. You'll receive Aave health-factor alerts here when your position drops below your threshold.\n\n" +
  "Send /stop at any time to unsubscribe.";
const UNSUBSCRIBED =
  "🔕 Unsubscribed. You won't receive any more Tokenping alerts here. " +
  "You can reconnect anytime from the Tokenping app.";
const HELP =
  "Tokenping notifies you when your Aave Health Factor drops below a threshold you set in the app.\n\n" +
  "Commands:\n" +
  "/start <token>: link via the Tokenping app\n" +
  "/stop: unsubscribe\n" +
  "/help: show this message";
const UNKNOWN = "I only respond to /start, /stop, and /help. Open the Tokenping app to manage your alerts.";
const UNSUBSCRIBE_FAILED = "Something went wrong while unsubscribing. Please send /stop again.";

const consumeQuery = (token: string) =>
  `telegram_link_tokens.update({"consumed_at":"${NOW}"}).eq("token","${token}").is("consumed_at",null).gt("expires_at","${NOW}").select("user_id").maybeSingle()`;
const clearOtherChatLinks = (chatId: string, uid: string) =>
  `user_telegram_links.delete().eq("chat_id","${chatId}").neq("user_id","${uid}")`;
const upsertQuery = (uid: string, chatId: string, username: string | null) =>
  `user_telegram_links.upsert(${JSON.stringify({ user_id: uid, chat_id: chatId, username, updated_at: NOW })},{"onConflict":"user_id"})`;
const deleteByChatQuery = (chatId: string) => `user_telegram_links.delete().eq("chat_id","${chatId}")`;

type MessageOverrides = Record<string, unknown>;
const update = (message: MessageOverrides | undefined) => ({
  update_id: 1,
  ...(message && {
    message: { message_id: 1, chat: { id: 42, type: "private" }, from: { id: 7, username: "alice" }, ...message },
  }),
});

const postWithoutFlush = (body: unknown, secret: string | null = SECRET) =>
  POST(
    new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: secret === null ? {} : { "x-telegram-bot-api-secret-token": secret },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
/** Posts, then runs the work the route deferred with after(), as Next does once the response is sent. */
const post = async (body: unknown, secret: string | null = SECRET) => {
  const res = await postWithoutFlush(body, secret);
  await afterQueue.flush();
  return res;
};
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const OK = { status: 200, text: '{"ok":true}' };

beforeEach(() => {
  fakeSupabase.reset();
  afterQueue.reset();
  vi.mocked(replyToTelegramChat).mockReset();
  vi.mocked(replyToTelegramChat).mockResolvedValue(undefined);
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", SECRET);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("POST /api/telegram/webhook: secret", () => {
  it.each([
    ["the secret env is unset", "", SECRET],
    ["the header is missing", SECRET, null],
    ["the header is empty", SECRET, ""],
    ["the lengths differ", SECRET, `${SECRET}x`],
    ["the value differs", SECRET, SECRET.replace("1", "9")],
  ])("returns a plain-text 403 when %s", async (_label, envSecret, header) => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", envSecret);

    const res = await post(update({ text: "/help" }), header);

    expect(res.headers.get("content-type")).toBe("text/plain;charset=UTF-8");
    expect(await read(res)).toEqual({ status: 403, text: "forbidden" });
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });

  it("compares multi-byte secrets by their UTF-8 bytes", async () => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "sécret");
    expect((await post(update({ text: "/help" }), "sécret")).status).toBe(200);
    expect((await post(update({ text: "/help" }), "secret")).status).toBe(403);
  });
});

describe("POST /api/telegram/webhook: updates", () => {
  it("acks a malformed body", async () => {
    expect(await read(await post("{"))).toEqual(OK);
  });

  it.each([
    ["a JSON null update", "null", "Cannot read properties of null (reading 'message')"],
    ["a non-string text", update({ text: 5 }), "trim is not a function"],
  ])("throws (unhandled, so Next answers 500) for %s", async (_label, body, message) => {
    await expect(post(body)).rejects.toThrow(message);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });

  it("acks a JSON primitive update", async () => {
    expect(await read(await post("5"))).toEqual(OK);
  });

  it.each([
    ["no message", update(undefined)],
    ["no text", update({ text: undefined })],
    ["empty text", update({ text: "" })],
    ["no chat", { update_id: 1, message: { message_id: 1, text: "/help" } }],
  ])("acks an update with %s without replying", async (_label, body) => {
    expect(await read(await post(body))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });

  it("tells group chats (even bots) that only private chats are supported", async () => {
    const res = await post(
      update({ chat: { id: -100123, type: "supergroup" }, from: { id: 1, is_bot: true }, text: "/stop" }),
    );
    expect(await read(res)).toEqual(OK);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("-100123", PRIVATE_ONLY);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("ignores private messages from bots", async () => {
    expect(await read(await post(update({ from: { id: 1, is_bot: true }, text: "/stop" })))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(["/start", "  /start  ", "/start@tokenping_bot"])(
    "replies with instructions for %j (no token)",
    async text => {
      expect(await read(await post(update({ text })))).toEqual(OK);
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", START_HELP);
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it.each(["short", "has space!".repeat(2), "x".repeat(65)])("rejects the malformed start param %j", async param => {
    await post(update({ text: `/start ${param}` }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", INVALID_LINK);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["was not found", {}],
    ["errored", { error: { message: "boom" } }],
  ])("replies 'expired' when the token %s", async (_label, result) => {
    fakeSupabase.respondByQuery({ [consumeQuery(TOKEN)]: result });
    await post(update({ text: `/start ${TOKEN}` }));
    expect(fakeSupabase.log()).toEqual([consumeQuery(TOKEN)]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", EXPIRED_LINK);
  });

  it("consumes the token, links the chat and confirms", async () => {
    fakeSupabase.respondByQuery({ [consumeQuery(TOKEN)]: { data: { user_id: CHECKSUMMED } } });

    const res = await post(update({ text: `/start   ${TOKEN}  trailing` }));

    expect(await read(res)).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([
      consumeQuery(TOKEN),
      clearOtherChatLinks("42", LOWER),
      upsertQuery(LOWER, "42", "alice"),
    ]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CONNECTED);
  });

  it.each([
    [
      "the chat username when the sender has none",
      { id: 7 },
      { id: 42, type: "private", username: "chatname" },
      "chatname",
    ],
    ["null when neither has a username", { id: 7 }, { id: 42, type: "private" }, null],
    ["the chat username when there is no sender", undefined, { id: 42, type: "private", username: "c" }, "c"],
  ])("stores %s", async (_label, from, chat, expected) => {
    fakeSupabase.respondByQuery({ [consumeQuery(TOKEN)]: { data: { user_id: LOWER } } });
    await post(update({ text: `/start ${TOKEN}`, from, chat }));
    expect(fakeSupabase.log().at(-1)).toBe(upsertQuery(LOWER, "42", expected));
  });

  it("apologizes when saving the link fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respond((_query, formatted) => {
      if (formatted === consumeQuery(TOKEN)) return { data: { user_id: LOWER } };
      if (formatted.includes(".upsert(")) return { error: { message: "unique violation" } };
    });

    expect(await read(await post(update({ text: `/start ${TOKEN}` })))).toEqual(OK);

    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", SAVE_FAILED);
    expect(consoleError).toHaveBeenCalledWith("upsertUserTelegramLink failed", { message: "unique violation" });
  });

  it.each(["/stop", "/stop now", "/stop@tokenping_bot"])("unlinks the chat and confirms on %j", async text => {
    expect(await read(await post(update({ text })))).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([deleteByChatQuery("42")]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNSUBSCRIBED);
  });

  it("logs and replies with a failure message instead of confirming when the /stop delete fails (B3.5)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respondByQuery({ [deleteByChatQuery("42")]: { error: { message: "delete failed" } } });

    expect(await read(await post(update({ text: "/stop" })))).toEqual(OK);

    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNSUBSCRIBE_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("telegram /stop: failed to delete the link", {
      message: "delete failed",
    });
  });

  it("replies with help for /help", async () => {
    await post(update({ text: " /help " }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", HELP);
  });

  it.each(["hello", "/START", "help", "/settings", "/stopwatch", "/helpme", "/startabc"])(
    "nudges on the unknown message %j without touching the DB",
    async text => {
      expect(await read(await post(update({ text })))).toEqual(OK);
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNKNOWN);
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it("acks and logs internal errors without replying", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failure = new Error("db down");
    fakeSupabase.respond(() => {
      throw failure;
    });

    expect(await read(await post(update({ text: "/stop" })))).toEqual(OK);

    expect(consoleWarn).toHaveBeenCalledExactlyOnceWith("telegram webhook handler error", failure);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });

  it.each([
    ["a command reply", update({ text: "/help" })],
    ["the group-chat notice", update({ chat: { id: -100123, type: "group" }, text: "/help" })],
    ["the /stop confirmation", update({ text: "/stop" })],
  ])("hands %s to after() so it is still sent once the 200 is out (B3.4)", async (_label, body) => {
    expect(await read(await postWithoutFlush(body))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(afterQueue.pending()).toBe(1);

    await afterQueue.flush();
    expect(replyToTelegramChat).toHaveBeenCalledOnce();
  });
});
