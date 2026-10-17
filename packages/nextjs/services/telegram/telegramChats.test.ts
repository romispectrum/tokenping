import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, sliceByRange } from "~~/services/api/server/testing/fakeSupabase";
import {
  deleteTelegramChat,
  getChatIdByUsername,
  getChatIdsByUsername,
  isTelegramUsernameLinked,
  linkTelegramChat,
} from "~~/services/telegram/telegramChats";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const NOW = "2026-10-14T09:05:07.000Z";

const clearOtherChats = (username: string, chatId: string) =>
  `telegram_chats.delete().eq("username","${username}").neq("chat_id","${chatId}")`;
const upsertQuery = (chatId: string, username: string) =>
  `telegram_chats.upsert(${JSON.stringify({ chat_id: chatId, username, updated_at: NOW })},{"onConflict":"chat_id"})`;

beforeEach(() => {
  fakeSupabase.reset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("linkTelegramChat", () => {
  it("removes the username from any other chat, then upserts this chat on chat_id", async () => {
    expect(await linkTelegramChat({ chatId: "42", username: "alice_eth" })).toBeNull();
    expect(fakeSupabase.log()).toEqual([clearOtherChats("alice_eth", "42"), upsertQuery("42", "alice_eth")]);
  });

  it("passes the username through unchanged: the webhook normalizes it first", async () => {
    await linkTelegramChat({ chatId: "-100", username: "Alice" });
    expect(fakeSupabase.log()).toEqual([clearOtherChats("Alice", "-100"), upsertQuery("-100", "Alice")]);
  });

  it("returns the delete error without upserting", async () => {
    fakeSupabase.respondByQuery({ [clearOtherChats("alice_eth", "42")]: { error: { message: "delete failed" } } });
    expect(await linkTelegramChat({ chatId: "42", username: "alice_eth" })).toEqual({ message: "delete failed" });
    expect(fakeSupabase.log()).toEqual([clearOtherChats("alice_eth", "42")]);
  });

  it("returns the upsert error", async () => {
    fakeSupabase.respondByQuery({ [upsertQuery("42", "alice_eth")]: { error: { message: "unique violation" } } });
    expect(await linkTelegramChat({ chatId: "42", username: "alice_eth" })).toEqual({ message: "unique violation" });
    expect(fakeSupabase.log()).toEqual([clearOtherChats("alice_eth", "42"), upsertQuery("42", "alice_eth")]);
  });
});

describe("isTelegramUsernameLinked", () => {
  const lookupQuery = (username: string) =>
    `telegram_chats.select("chat_id").eq("username","${username}").maybeSingle()`;

  it("is true when a chat holds the username", async () => {
    fakeSupabase.respondByQuery({ [lookupQuery("alice_eth")]: { data: { chat_id: "42" } } });
    expect(await isTelegramUsernameLinked("alice_eth")).toBe(true);
    expect(fakeSupabase.log()).toEqual([lookupQuery("alice_eth")]);
  });

  it("is false when no chat holds it", async () => {
    expect(await isTelegramUsernameLinked("alice_eth")).toBe(false);
    expect(fakeSupabase.log()).toEqual([lookupQuery("alice_eth")]);
  });

  // An outage must not read as "not linked": the form would tell a linked user to press Start again.
  it("throws when the lookup fails, even if data came back", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" }, data: { chat_id: "42" } }));
    await expect(isTelegramUsernameLinked("alice_eth")).rejects.toThrow(
      new Error("Failed to read the Telegram chat: boom"),
    );
  });
});

describe("getChatIdByUsername", () => {
  const lookupQuery = (username: string) =>
    `telegram_chats.select("chat_id").eq("username","${username}").maybeSingle()`;

  it("returns the chat the username pressed Start in, as a string", async () => {
    fakeSupabase.respondByQuery({ [lookupQuery("alice_eth")]: { data: { chat_id: 123456789 } } });
    await expect(getChatIdByUsername("alice_eth")).resolves.toBe("123456789");
    expect(fakeSupabase.log()).toEqual([lookupQuery("alice_eth")]);
  });

  it("returns null when no chat holds the username", async () => {
    await expect(getChatIdByUsername("alice_eth")).resolves.toBeNull();
  });

  it("asks under the username exactly as given: callers pass it as stored", async () => {
    await getChatIdByUsername("Alice_Eth");
    expect(fakeSupabase.log()).toEqual([lookupQuery("Alice_Eth")]);
  });

  it("throws when the lookup fails, so an outage never reads as not linked", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" }, data: { chat_id: "42" } }));
    await expect(getChatIdByUsername("alice_eth")).rejects.toThrow(new Error("Failed to read the Telegram chat: boom"));
  });
});

describe("getChatIdsByUsername", () => {
  const pageQuery = (from: number, to: number) =>
    `telegram_chats.select("username, chat_id").order("chat_id").range(${from},${to})`;

  it("maps every username to its chat id as strings", async () => {
    const chats = [
      { username: "alice", chat_id: 1 },
      { username: "bob", chat_id: "2" },
    ];
    fakeSupabase.respond(query => ({ data: sliceByRange(query, chats) }));
    expect(await getChatIdsByUsername()).toStrictEqual({
      chatIdsByUsername: new Map([
        ["alice", "1"],
        ["bob", "2"],
      ]),
      error: null,
    });
    expect(fakeSupabase.log()).toEqual([pageQuery(0, 999), pageQuery(2, 1001)]);
  });

  it("returns an empty map when no chat is linked", async () => {
    expect(await getChatIdsByUsername()).toStrictEqual({ chatIdsByUsername: new Map(), error: null });
    expect(fakeSupabase.log()).toEqual([pageQuery(0, 999)]);
  });

  it("reads past the 1000-row page limit until an empty page", async () => {
    const chats = Array.from({ length: 2001 }, (_, i) => ({ username: `user_${i}`, chat_id: `${i}` }));
    fakeSupabase.respond(query => ({ data: sliceByRange(query, chats) }));

    const { chatIdsByUsername, error } = await getChatIdsByUsername();

    expect(error).toBeNull();
    expect(chatIdsByUsername.size).toBe(2001);
    expect(chatIdsByUsername.get("user_2000")).toBe("2000");
    expect(fakeSupabase.log()).toEqual([
      pageQuery(0, 999),
      pageQuery(1000, 1999),
      pageQuery(2000, 2999),
      pageQuery(2001, 3000),
    ]);
  });

  it("returns the query error with an empty map instead of hiding it (B3.7)", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect(await getChatIdsByUsername()).toStrictEqual({
      chatIdsByUsername: new Map(),
      error: { message: "boom" },
    });
  });

  it("drops the rows already read when a later page fails", async () => {
    const chats = Array.from({ length: 1000 }, (_, i) => ({ username: `user_${i}`, chat_id: `${i}` }));
    fakeSupabase.respond(query =>
      query.ops.some(([method, from]) => method === "range" && from === 1000)
        ? { error: { message: "page 2 failed" } }
        : { data: sliceByRange(query, chats) },
    );
    expect(await getChatIdsByUsername()).toStrictEqual({
      chatIdsByUsername: new Map(),
      error: { message: "page 2 failed" },
    });
  });
});

describe("deleteTelegramChat", () => {
  it("deletes by chat id and returns null on success", async () => {
    expect(await deleteTelegramChat("42")).toBeNull();
    expect(fakeSupabase.log()).toEqual([`telegram_chats.delete().eq("chat_id","42")`]);
  });

  it("returns the Supabase error when the delete fails (B3.5)", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect(await deleteTelegramChat("42")).toEqual({ message: "boom" });
  });
});
