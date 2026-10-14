import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import {
  consumeLinkToken,
  createLinkToken,
  deleteLinkByChatId,
  deleteLinkByUserId,
  getChatIdsByUser,
  getLinkByChatId,
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

  it("looks up by chat id and maps a missing username to null", async () => {
    fakeSupabase.respond(() => ({ data: { user_id: LOWER, chat_id: "42", linked_at: "t" } }));
    expect(await getLinkByChatId("42")).toStrictEqual({ userId: LOWER, chatId: "42", username: null, linkedAt: "t" });
    expect(fakeSupabase.log()).toEqual([
      `user_telegram_links.select(${LINK_COLUMNS}).eq("chat_id","42").maybeSingle()`,
    ]);
  });

  it.each([
    ["no row", {}],
    ["an error", { error: { message: "boom" }, data: { user_id: LOWER } }],
  ])("returns null for %s", async (_label, result) => {
    fakeSupabase.respond(() => result);
    expect(await getLinkByUserId(LOWER)).toBeNull();
    expect(await getLinkByChatId("42")).toBeNull();
  });
});

describe("getChatIdsByUser", () => {
  it("maps every link's stringified user_id to its stringified chat_id, later rows winning", async () => {
    fakeSupabase.respond(() => ({
      data: [
        { user_id: LOWER, chat_id: 1 },
        { user_id: MIXED, chat_id: "2" },
        { user_id: LOWER, chat_id: "3" },
      ],
    }));
    expect([...(await getChatIdsByUser())]).toEqual([
      [LOWER, "3"],
      [MIXED, "2"],
    ]);
    expect(fakeSupabase.log()).toEqual(['user_telegram_links.select("user_id, chat_id")']);
  });

  it("returns an empty map when the query fails", async () => {
    // BUG(B3.7): the error is ignored.
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    expect((await getChatIdsByUser()).size).toBe(0);
  });
});

describe("link deletes", () => {
  it("deletes by normalized user id, ignoring errors", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    await expect(deleteLinkByUserId(MIXED)).resolves.toBeUndefined();
    expect(fakeSupabase.log()).toEqual([`user_telegram_links.delete().eq("user_id","${LOWER}")`]);
  });

  it("deletes by chat id, ignoring errors", async () => {
    fakeSupabase.respond(() => ({ error: { message: "boom" } }));
    await expect(deleteLinkByChatId("42")).resolves.toBeUndefined();
    expect(fakeSupabase.log()).toEqual([`user_telegram_links.delete().eq("chat_id","42")`]);
  });
});
