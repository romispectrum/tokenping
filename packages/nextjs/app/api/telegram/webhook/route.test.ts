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
// What an old t.me/<bot>?start=<token> deep link sends after /start.
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";

// Verbatim reply texts.
const PRIVATE_ONLY = "Tokenping only supports private chats. Please message the bot directly.";
const NO_USERNAME =
  "Your Telegram account has no username yet. Set one in Telegram (Settings, then Username), type it into " +
  "your alert on Tokenping, then send /start here again.";
const SAVE_FAILED = "Something went wrong linking this chat. Please send /start again.";
const linked = (username: string) =>
  `Linked @${username}. Tokenping alerts that name @${username} will arrive in this chat.\n\n` +
  "Send /stop at any time to stop them.";
const UNSUBSCRIBED = "Stopped. No more Tokenping alerts will arrive here. Send /start to receive them again.";
const HELP =
  "Tokenping messages you when your Aave health factor drops below a threshold you set in the app.\n\n" +
  "Type your Telegram username into your alert on Tokenping, then send /start here once.\n\n" +
  "Commands:\n" +
  "/start: link this chat to your username\n" +
  "/stop: stop all Tokenping alerts here\n" +
  "/help: show this message";
const UNKNOWN = "I only respond to /start, /stop and /help. Manage your alerts in the Tokenping app.";
const UNSUBSCRIBE_FAILED = "Something went wrong while stopping alerts. Please send /stop again.";

// The Czech replies, verbatim, for senders whose Telegram app is Czech or Slovak.
const CS = {
  privateOnly: "Tokenping funguje jen v soukromých chatech. Napište prosím botovi přímo.",
  noUsername:
    "Váš účet na Telegramu zatím nemá uživatelské jméno. Nastavte si ho v Telegramu (Nastavení, Uživatelské " +
    "jméno), zadejte ho do upozornění na Tokenpingu a potom sem znovu pošlete /start.",
  saveFailed: "Při propojování chatu se něco pokazilo. Pošlete prosím /start znovu.",
  linked: (username: string) =>
    `Propojeno: @${username}. Upozornění z Tokenpingu, která uvádějí @${username}, budou chodit sem.\n\n` +
    "Kdykoli je zastavíte příkazem /stop.",
  unsubscribed: "Zastaveno. Další upozornění od Tokenpingu sem nepřijdou. Příkazem /start je znovu zapnete.",
  unsubscribeFailed: "Při zastavování upozornění se něco pokazilo. Pošlete prosím /stop znovu.",
  help:
    "Tokenping vám napíše, když váš health factor na Aave klesne pod práh, který si nastavíte v aplikaci.\n\n" +
    "Zadejte své uživatelské jméno na Telegramu do upozornění na Tokenpingu a potom sem jednou pošlete /start.\n\n" +
    "Příkazy:\n" +
    "/start: propojit tento chat s vaším uživatelským jménem\n" +
    "/stop: zastavit všechna upozornění od Tokenpingu\n" +
    "/help: zobrazit tuto zprávu",
  unknown: "Reaguji jen na /start, /stop a /help. Svá upozornění spravujte v aplikaci Tokenping.",
};

/** linkTelegramChat: drop the username from any other chat, then upsert this chat under it. */
const linkQueries = (chatId: string, username: string) => [
  `telegram_chats.delete().eq("username","${username}").neq("chat_id","${chatId}")`,
  `telegram_chats.upsert(${JSON.stringify({ chat_id: chatId, username, updated_at: NOW })},{"onConflict":"chat_id"})`,
];
const deleteByChatQuery = (chatId: string) => `telegram_chats.delete().eq("chat_id","${chatId}")`;

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

    const res = await post(update({ text: "/start" }), header);

    expect(res.headers.get("content-type")).toBe("text/plain;charset=UTF-8");
    expect(await read(res)).toEqual({ status: 403, text: "forbidden" });
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
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
    ["no chat", { update_id: 1, message: { message_id: 1, text: "/start" } }],
  ])("acks an update with %s without replying", async (_label, body) => {
    expect(await read(await post(body))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("tells group chats (even bots) that only private chats are supported", async () => {
    const res = await post(
      update({ chat: { id: -100123, type: "supergroup" }, from: { id: 1, is_bot: true }, text: "/stop" }),
    );
    expect(await read(res)).toEqual(OK);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("-100123", PRIVATE_ONLY);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("does not link a group chat on /start", async () => {
    await post(update({ chat: { id: -100123, type: "group", username: "somegroup" }, text: "/start" }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("-100123", PRIVATE_ONLY);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(["/start", "/stop"])("ignores %j from a bot in a private chat", async text => {
    expect(await read(await post(update({ from: { id: 1, is_bot: true, username: "some_bot" }, text })))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });
});

describe("POST /api/telegram/webhook: /start", () => {
  it.each(["/start", "  /start  ", "/start@tokenping_bot"])(
    "links the chat to the sender's username and confirms on %j",
    async text => {
      expect(await read(await post(update({ text })))).toEqual(OK);
      expect(fakeSupabase.log()).toEqual(linkQueries("42", "alice"));
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked("alice"));
    },
  );

  // Old deep links from the wallet handshake still arrive as "/start <token>": the token is ignored.
  it.each([`/start ${TOKEN}`, `/start   ${TOKEN}  trailing`, `/start@tokenping_bot ${TOKEN}`, "/start short"])(
    "links by username and ignores the deep-link token in %j",
    async text => {
      expect(await read(await post(update({ text })))).toEqual(OK);
      expect(fakeSupabase.log()).toEqual(linkQueries("42", "alice"));
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked("alice"));
    },
  );

  it.each([
    ["Alice_Eth", "alice_eth"],
    ["ALICE", "alice"],
    ["@alice", "alice"],
    [" alice ", "alice"],
    ["abcd", "abcd"],
    ["a".repeat(32), "a".repeat(32)],
  ])("stores the sender username %j as %j", async (username, stored) => {
    await post(update({ from: { id: 7, username }, text: "/start" }));
    expect(fakeSupabase.log()).toEqual(linkQueries("42", stored));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked(stored));
  });

  it.each([
    [
      "the sender's over the chat's",
      { id: 7, username: "alice" },
      { id: 42, type: "private", username: "chat_name" },
      "alice",
    ],
    ["the chat's when the sender has none", { id: 7 }, { id: 42, type: "private", username: "Chat_Name" }, "chat_name"],
    ["the chat's when there is no sender", undefined, { id: 42, type: "private", username: "chat_name" }, "chat_name"],
  ])("uses %s username", async (_label, from, chat, stored) => {
    await post(update({ from, chat, text: "/start" }));
    expect(fakeSupabase.log()).toEqual(linkQueries("42", stored));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked(stored));
  });

  it("stores the chat id as a string, whatever its size", async () => {
    await post(update({ chat: { id: 9007199254740991, type: "private" }, text: "/start" }));
    expect(fakeSupabase.log()).toEqual(linkQueries("9007199254740991", "alice"));
  });

  it.each([
    ["neither the sender nor the chat has a username", { id: 7 }, { id: 42, type: "private" }],
    ["the username is empty", { id: 7, username: "" }, { id: 42, type: "private" }],
    ["the username is 3 characters", { id: 7, username: "abc" }, { id: 42, type: "private" }],
    ["the username is 33 characters", { id: 7, username: "a".repeat(33) }, { id: 42, type: "private" }],
    ["the username starts with a digit", { id: 7, username: "9lives" }, { id: 42, type: "private" }],
    ["the username ends with an underscore", { id: 7, username: "alice_" }, { id: 42, type: "private" }],
    ["the username has a dot", { id: 7, username: "alice.42" }, { id: 42, type: "private" }],
  ])("tells the sender to set a username and stores nothing when %s", async (_label, from, chat) => {
    expect(await read(await post(update({ from, chat, text: "/start" })))).toEqual(OK);
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", NO_USERNAME);
  });

  // Only the account that owns a username can link it: text after /start never names the username.
  it.each(["/start bob_the_owner", "/start @bob_the_owner", "/start https://t.me/bob_the_owner"])(
    "links the sender's username, not the one in %j",
    async text => {
      await post(update({ text }));
      expect(fakeSupabase.log()).toEqual(linkQueries("42", "alice"));
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked("alice"));
    },
  );

  it("does not take the username from the text when the sender has none", async () => {
    await post(update({ from: { id: 7 }, text: "/start bob_the_owner" }));
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", NO_USERNAME);
  });

  it("logs and apologizes without upserting when removing the username from another chat fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const [clearOther] = linkQueries("42", "alice");
    fakeSupabase.respondByQuery({ [clearOther]: { error: { message: "delete failed" } } });

    expect(await read(await post(update({ text: "/start" })))).toEqual(OK);

    expect(fakeSupabase.log()).toEqual([clearOther]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", SAVE_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("telegram /start: failed to link the chat", {
      message: "delete failed",
    });
  });

  it("logs and apologizes when the upsert fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const [, upsert] = linkQueries("42", "alice");
    fakeSupabase.respondByQuery({ [upsert]: { error: { message: "unique violation" } } });

    expect(await read(await post(update({ text: "/start" })))).toEqual(OK);

    expect(fakeSupabase.log()).toEqual(linkQueries("42", "alice"));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", SAVE_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("telegram /start: failed to link the chat", {
      message: "unique violation",
    });
  });
});

describe("POST /api/telegram/webhook: other commands", () => {
  it.each(["/stop", "/stop now", "/stop@tokenping_bot"])("deletes the chat and confirms on %j", async text => {
    expect(await read(await post(update({ text })))).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([deleteByChatQuery("42")]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNSUBSCRIBED);
  });

  it("deletes the chat on /stop even when the sender has no username", async () => {
    await post(update({ from: { id: 7 }, text: "/stop" }));
    expect(fakeSupabase.log()).toEqual([deleteByChatQuery("42")]);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNSUBSCRIBED);
  });

  it("logs and replies with a failure message instead of confirming when the /stop delete fails (B3.5)", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respondByQuery({ [deleteByChatQuery("42")]: { error: { message: "delete failed" } } });

    expect(await read(await post(update({ text: "/stop" })))).toEqual(OK);

    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNSUBSCRIBE_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("telegram /stop: failed to delete the chat", {
      message: "delete failed",
    });
  });

  it("replies with help for /help without touching the DB", async () => {
    await post(update({ text: " /help " }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", HELP);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each(["hello", "/START", "help", "/settings", "/stopwatch", "/helpme", "/startabc", "alice"])(
    "nudges on the unknown message %j without touching the DB",
    async text => {
      expect(await read(await post(update({ text })))).toEqual(OK);
      expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", UNKNOWN);
      expect(fakeSupabase.queries).toHaveLength(0);
    },
  );

  it.each(["/start", "/stop"])("acks and logs internal errors on %j without replying", async text => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failure = new Error("db down");
    fakeSupabase.respond(() => {
      throw failure;
    });

    expect(await read(await post(update({ text })))).toEqual(OK);

    expect(consoleWarn).toHaveBeenCalledExactlyOnceWith("telegram webhook handler error", failure);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });

  it.each([
    ["a command reply", update({ text: "/help" })],
    ["the group-chat notice", update({ chat: { id: -100123, type: "group" }, text: "/help" })],
    ["the /start confirmation", update({ text: "/start" })],
    ["the /stop confirmation", update({ text: "/stop" })],
  ])("hands %s to after() so it is still sent once the 200 is out (B3.4)", async (_label, body) => {
    expect(await read(await postWithoutFlush(body))).toEqual(OK);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(afterQueue.pending()).toBe(1);

    await afterQueue.flush();
    expect(replyToTelegramChat).toHaveBeenCalledOnce();
  });
});

describe("POST /api/telegram/webhook: Czech replies", () => {
  const czech = (message: MessageOverrides, language_code = "cs") =>
    update({ from: { id: 7, username: "alice", language_code }, ...message });

  it.each([
    ["/help", CS.help],
    ["hello", CS.unknown],
    ["/stop", CS.unsubscribed],
  ])("answers %j in Czech for language_code cs", async (text, expected) => {
    expect(await read(await post(czech({ text })))).toEqual(OK);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", expected);
  });

  it.each(["cs", "sk", "cs-CZ"])("links the chat and confirms in Czech for language_code %j", async language_code => {
    await post(czech({ from: { id: 7, username: "Alice_Eth", language_code }, text: "/start" }));
    expect(fakeSupabase.log()).toEqual(linkQueries("42", "alice_eth"));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CS.linked("alice_eth"));
  });

  it.each(["sk", "cs-CZ"])("answers in Czech for language_code %j", async language_code => {
    await post(update({ from: { id: 7, language_code }, text: "/help" }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CS.help);
  });

  it.each(["en", "en-US", "de", undefined])("answers in English for language_code %j", async language_code => {
    await post(update({ from: { id: 7, username: "alice", language_code }, text: "/start" }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", linked("alice"));
  });

  it("tells a Czech group member in Czech that only private chats are supported", async () => {
    await post(czech({ chat: { id: -100123, type: "group" }, text: "/help" }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("-100123", CS.privateOnly);
  });

  it("asks a Czech sender without a username to set one, in Czech", async () => {
    await post(czech({ from: { id: 7, language_code: "sk" }, text: "/start" }));
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CS.noUsername);
  });

  it("apologizes in Czech when linking the chat fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respond((_query, formatted) => {
      if (formatted.includes(".upsert(")) return { error: { message: "unique violation" } };
    });
    await post(czech({ text: `/start ${TOKEN}` }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CS.saveFailed);
  });

  it("replies with the Czech failure message when the /stop delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respondByQuery({ [deleteByChatQuery("42")]: { error: { message: "delete failed" } } });
    await post(czech({ text: "/stop" }));
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("42", CS.unsubscribeFailed);
  });
});
