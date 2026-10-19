import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/api/telegram/status/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});

const BASE_URL = "http://localhost/api/telegram/status";
const INVALID = { status: 400, text: JSON.stringify({ error: "Missing or invalid Telegram username" }) };

const chatQuery = (username: string) => `telegram_chats.select("chat_id").eq("username","${username}").maybeSingle()`;

const get = (query: string) => GET(new Request(`${BASE_URL}${query}`));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });
const LOOKUP_FAILED = json(500, { error: "Could not check the Telegram username" });

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fakeSupabase.reset();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/telegram/status", () => {
  it.each([
    ["missing", ""],
    ["empty", "?username="],
    ["blank", "?username=%20%20"],
    ["only an @", "?username=%40"],
    ["too short", "?username=abc"],
    ["too long once normalized", `?username=${"a".repeat(33)}`],
    ["starting with a digit", "?username=9lives"],
    ["ending with an underscore", "?username=alice_"],
    ["holding a dot", "?username=alice.42"],
    ["holding a hyphen", "?username=alice-eth"],
    ["holding a space", "?username=alice%20eth"],
    [
      "over 64 raw characters, though valid once trimmed",
      `?username=${encodeURIComponent(` ${" ".repeat(60)}alice `)}`,
    ],
    [
      "link over 64 raw characters, though valid once normalized",
      `?username=https://www.telegram.me/${"a".repeat(32)}/////////`,
    ],
    ["passed under another name", "?user=alice"],
  ])("returns 400 for a %s username without a lookup", async (_label, query) => {
    expect(await read(await get(query))).toEqual(INVALID);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("accepts a 64-character raw input that is valid once trimmed", async () => {
    const raw = `${" ".repeat(59)}alice`;
    expect(raw).toHaveLength(64);
    expect(await read(await get(`?username=${encodeURIComponent(raw)}`))).toEqual(json(200, { linked: false }));
    expect(fakeSupabase.log()).toEqual([chatQuery("alice")]);
  });

  it.each([
    ["@Alice_Eth", "alice_eth"],
    ["https://t.me/Alice_Eth", "alice_eth"],
    ["t.me/alice_eth/", "alice_eth"],
    [" alice_eth ", "alice_eth"],
    ["abcd", "abcd"],
    ["a".repeat(32), "a".repeat(32)],
  ])("looks up %j as %j", async (raw, normalized) => {
    expect(await read(await get(`?username=${encodeURIComponent(raw)}`))).toEqual(json(200, { linked: false }));
    expect(fakeSupabase.log()).toEqual([chatQuery(normalized)]);
  });

  it.each([
    [true, { data: { chat_id: "42" } }],
    [false, {}],
  ])("answers linked:%s, uncached", async (expected, result) => {
    fakeSupabase.respondByQuery({ [chatQuery("alice_eth")]: result });

    const res = await get("?username=alice_eth");

    expect(await read(res)).toEqual(json(200, { linked: expected }));
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("never returns the chat id", async () => {
    fakeSupabase.respondByQuery({ [chatQuery("alice_eth")]: { data: { chat_id: "987654321" } } });
    const { text } = await read(await get("?username=alice_eth"));
    expect(text).not.toContain("987654321");
  });

  // A failed lookup must not read as "not linked": the form treats any non-2xx as "status unknown".
  it("returns 500 when the lookup fails instead of reporting the username as not linked", async () => {
    fakeSupabase.respondByQuery({ [chatQuery("alice_eth")]: { error: { message: "boom" } } });
    expect(await read(await get("?username=alice_eth"))).toEqual(LOOKUP_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith(
      "GET /api/telegram/status: failed",
      new Error("Failed to read the Telegram chat: boom"),
    );
  });

  it("returns a generic 500 when something throws, logging the error", async () => {
    const thrown = new Error("db down");
    fakeSupabase.respond(() => {
      throw thrown;
    });
    expect(await read(await get("?username=alice_eth"))).toEqual(LOOKUP_FAILED);
    expect(consoleError).toHaveBeenCalledExactlyOnceWith("GET /api/telegram/status: failed", thrown);
  });
});
