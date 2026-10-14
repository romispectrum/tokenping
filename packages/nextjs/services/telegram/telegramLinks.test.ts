import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, sliceByRange } from "~~/services/api/server/testing/fakeSupabase";
import {
  consumeLinkToken,
  createLinkToken,
  deleteLinkByChatId,
  deleteLinkByUserId,
  getChatIdsByUser,
  getLinkByUserId,
  isValidStartParam,
  upsertUserTelegramLink,
} from "~~/services/telegram/telegramLinks";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const NOW = "2026-10-14T09:05:07.000Z";
const LOWER = `0x${"9f".repeat(20)}`;
const MIXED = `0x${"9F".repeat(20)}`;
const OTHER_LOWER = `0x${"5e".repeat(20)}`;
const OTHER_MIXED = `0x${"5E".repeat(20)}`;
const VALID_TOKEN = "a".repeat(16);

const LINK_COLUMNS = '"user_id, chat_id, username, linked_at"';

beforeEach(() => {
  fakeSupabase.reset();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("isValidStartParam", () => {
  it.each([
    ["a".repeat(16), true],
    ["a".repeat(64), true],
    ["Az09_-Az09_-Az09", true],
    ["a".repeat(15), false],
    ["a".repeat(65), false],
    [`${"a".repeat(16)}=`, false],
    [`${"a".repeat(16)} `, false],
    ["", false],
  ])("%j → %s", (param, expected) => {
    expect(isValidStartParam(param)).toBe(expected);
  });
});

describe("createLinkToken", () => {
  it("returns a 43-char base64url token that is a valid start param, expiring in 10 minutes", async () => {
    const { token, expiresAt } = await createLinkToken(` ${MIXED} `);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isValidStartParam(token)).toBe(true);
    expect(expiresAt).toBe("2026-10-14T09:15:07.000Z");
    expect(fakeSupabase.log()[0]).toBe(`telegram_link_tokens.delete().eq("user_id","${LOWER}").is("consumed_at",null)`);
  });
});

describe("consumeLinkToken", () => {
  it("returns null for a malformed token without querying", async () => {
    expect(await consumeLinkToken("short")).toBeNull();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("consumes atomically and returns the stored user id as is", async () => {
    fakeSupabase.respond(() => ({ data: { user_id: MIXED } }));
    expect(await consumeLinkToken(VALID_TOKEN)).toEqual({ userId: MIXED });
    expect(fakeSupabase.log()).toEqual([
      `telegram_link_tokens.update({"consumed_at":"${NOW}"}).eq("token","${VALID_TOKEN}").is("consumed_at",null).gt("expires_at","${NOW}").select("user_id").maybeSingle()`,
    ]);
  });

  it.each([
    ["no row matched", {}],
    ["the update errored", { error: { message: "boom" } }],
  ])("returns null when %s", async (_label, result) => {
    fakeSupabase.respond(() => result);
    expect(await consumeLinkToken(VALID_TOKEN)).toBeNull();
  });
});

describe("upsertUserTelegramLink", () => {
  it("removes the chat's link to other wallets, then upserts on user_id", async () => {
    expect(await upsertUserTelegramLink({ userId: MIXED, chatId: "42", username: null })).toBe(true);
    expect(fakeSupabase.log()).toEqual([
      `user_telegram_links.delete().eq("chat_id","42").neq("user_id","${LOWER}")`,
      `user_telegram_links.upsert(${JSON.stringify({ user_id: LOWER, chat_id: "42", username: null, updated_at: NOW })},{"onConflict":"user_id"})`,
    ]);
  });

  it("logs and returns false when the upsert fails, ignoring a failed cleanup", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    fakeSupabase.respond(() => ({ error: { message: "nope" } }));
    expect(await upsertUserTelegramLink({ userId: LOWER, chatId: "42", username: "a" })).toBe(false);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("upsertUserTelegramLink failed", { message: "nope" });
  });
});

describe("link lookups", () => {
  it("looks up by normalized user id and maps the row", async () => {
    fakeSupabase.respond(() => ({ data: { user_id: LOWER, chat_id: "42", username: "alice", linked_at: "t" } }));
    expect(await getLinkByUserId(` ${MIXED} `)).toStrictEqual({
      userId: LOWER,
      chatId: "42",
      username: "alice",
      linkedAt: "t",
    });
    expect(fakeSupabase.log()).toEqual([
      `user_telegram_links.select(${LINK_COLUMNS}).eq("user_id","${LOWER}").maybeSingle()`,
    ]);
  });

  it("maps a missing username to null", async () => {
    fakeSupabase.respond(() => ({ data: { user_id: LOWER, chat_id: "42", linked_at: "t" } }));
    expect(await getLinkByUserId(LOWER)).toStrictEqual({ userId: LOWER, chatId: "42", username: null, linkedAt: "t" });
  });

  it("returns null when there is no row", async () => {
    fakeSupabase.respond(() => ({}));
    expect(await getLinkByUserId(LOWER)).toBeNull();
  });

  // Reporting a failed lookup as "no link" made the UI show a linked user as disconnected.
  it("throws when the lookup fails, even if data came back", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" }, data: { user_id: LOWER } }));
    await expect(getLinkByUserId(LOWER)).rejects.toThrow(new Error("Failed to read the Telegram link: boom"));
  });
});

describe("getChatIdsByUser", () => {
  const pageQuery = (from: number, to: number) =>
    `user_telegram_links.select("user_id, chat_id").order("user_id").range(${from},${to})`;

  it("keys every link by the normalized user id (later rows winning), with stringified chat ids", async () => {
    const links = [
      { user_id: LOWER, chat_id: 1 },
      { user_id: MIXED, chat_id: "2" },
      { user_id: ` ${OTHER_MIXED} `, chat_id: "3" },
    ];
    fakeSupabase.respond(query => ({ data: sliceByRange(query, links) }));
    expect(await getChatIdsByUser()).toStrictEqual({
      chatIdsByUser: new Map([
        [LOWER, "2"],
        [OTHER_LOWER, "3"],
      ]),
      error: null,
    });
    expect(fakeSupabase.log()).toEqual([pageQuery(0, 999), pageQuery(3, 1002)]);
  });

  it("reads past the 1000-row page limit until an empty page", async () => {
    const wallet = (i: number) => `0x${i.toString(16).padStart(40, "0")}`;
    const links = Array.from({ length: 2001 }, (_, i) => ({ user_id: wallet(i), chat_id: `${i}` }));
    fakeSupabase.respond(query => ({ data: sliceByRange(query, links) }));

    const { chatIdsByUser, error } = await getChatIdsByUser();

    expect(error).toBeNull();
    expect(chatIdsByUser.size).toBe(2001);
    expect(chatIdsByUser.get(wallet(2000))).toBe("2000");
    expect(fakeSupabase.log()).toEqual([
      pageQuery(0, 999),
      pageQuery(1000, 1999),
      pageQuery(2000, 2999),
      pageQuery(2001, 3000),
    ]);
  });

  it("returns the query error with an empty map instead of hiding it (B3.7)", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect(await getChatIdsByUser()).toStrictEqual({ chatIdsByUser: new Map(), error: { message: "boom" } });
  });
});

describe("link deletes", () => {
  it.each([
    ["by normalized user id", () => deleteLinkByUserId(MIXED), `user_telegram_links.delete().eq("user_id","${LOWER}")`],
    ["by chat id", () => deleteLinkByChatId("42"), `user_telegram_links.delete().eq("chat_id","42")`],
  ])("deletes %s and returns null on success", async (_label, remove, query) => {
    expect(await remove()).toBeNull();
    expect(fakeSupabase.log()).toEqual([query]);
  });

  it.each([
    ["by user id", () => deleteLinkByUserId(MIXED)],
    ["by chat id", () => deleteLinkByChatId("42")],
  ])("returns the Supabase error when deleting %s fails (B3.5)", async (_label, remove) => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect(await remove()).toEqual({ message: "boom" });
  });
});
