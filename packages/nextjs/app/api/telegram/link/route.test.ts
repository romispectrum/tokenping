import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET } from "~~/app/api/telegram/link/route";
import { afterQueue } from "~~/services/api/server/testing/afterQueue";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { isAccessActive } from "~~/services/payments/checkAccess";
import { replyToTelegramChat } from "~~/services/telegram/sendTelegram";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));
vi.mock("~~/services/telegram/sendTelegram", () => ({ replyToTelegramChat: vi.fn() }));
vi.mock("next/server", async importOriginal => {
  const { afterQueue } = await import("~~/services/api/server/testing/afterQueue");
  return { ...(await importOriginal<typeof import("next/server")>()), after: afterQueue.after };
});

const BASE_URL = "http://localhost/api/telegram/link";
const LOWER = `0x${"cd".repeat(20)}`;
const MIXED = `0x${"CD".repeat(20)}`;

const linkQuery = (column: string, value: string) =>
  `user_telegram_links.select("user_id, chat_id, username, linked_at").eq("${column}","${value}").maybeSingle()`;
const deleteQuery = (uid: string) => `user_telegram_links.delete().eq("user_id","${uid}")`;

const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });
const del = (body: unknown) =>
  DELETE(new Request(BASE_URL, { method: "DELETE", body: typeof body === "string" ? body : JSON.stringify(body) }));

const FAREWELL =
  "🔕 Tokenping disconnected from this chat. You won't receive Aave alerts here anymore. " +
  "You can reconnect anytime from the Tokenping app.";

beforeEach(() => {
  fakeSupabase.reset();
  afterQueue.reset();
  vi.mocked(isAccessActive).mockReset();
  vi.mocked(isAccessActive).mockResolvedValue(true);
  vi.mocked(replyToTelegramChat).mockReset();
  vi.mocked(replyToTelegramChat).mockResolvedValue(undefined);
});

describe("GET /api/telegram/link", () => {
  it.each([
    ["missing", ""],
    ["empty", "?userId="],
    ["blank", "?userId=%20%20"],
  ])("returns 400 for a %s userId", async (_label, query) => {
    expect(await read(await GET(new Request(`${BASE_URL}${query}`)))).toEqual(
      json(400, { error: "Missing or invalid userId" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns linked:false when there is no link, looking up the normalized id", async () => {
    const res = await GET(new Request(`${BASE_URL}?userId=%20${MIXED}%20`));
    expect(await read(res)).toEqual(json(200, { linked: false }));
    expect(fakeSupabase.log()).toEqual([linkQuery("user_id", LOWER)]);
  });

  it("returns the link details (no access check, uncached)", async () => {
    fakeSupabase.respondByQuery({
      [linkQuery("user_id", LOWER)]: {
        data: { user_id: LOWER, chat_id: "987", username: null, linked_at: "2026-03-01T10:00:00Z" },
      },
    });

    const res = await GET(new Request(`${BASE_URL}?userId=${MIXED}`));
    await GET(new Request(`${BASE_URL}?userId=${MIXED}`));

    expect(await read(res)).toEqual(
      json(200, { linked: true, chatId: "987", username: null, linkedAt: "2026-03-01T10:00:00Z" }),
    );
    expect(fakeSupabase.queries).toHaveLength(2);
    expect(isAccessActive).not.toHaveBeenCalled();
  });

  it("treats a lookup error as not linked", async () => {
    fakeSupabase.respondByQuery({ [linkQuery("user_id", LOWER)]: { error: { message: "boom" } } });
    expect(await read(await GET(new Request(`${BASE_URL}?userId=${LOWER}`)))).toEqual(json(200, { linked: false }));
  });

  it("returns 500 with the thrown message", async () => {
    fakeSupabase.respond(() => {
      throw new Error("db down");
    });
    expect(await read(await GET(new Request(`${BASE_URL}?userId=${LOWER}`)))).toEqual(json(500, { error: "db down" }));
  });
});

describe("DELETE /api/telegram/link", () => {
  it.each([
    ["malformed body", "{"],
    ["missing userId", {}],
    ["blank userId", { userId: "  " }],
  ])("returns 400 for a %s", async (_label, body) => {
    expect(await read(await del(body))).toEqual(json(400, { error: "Missing or invalid userId" }));
  });

  it("returns 500 for a JSON null body", async () => {
    expect(await read(await del("null"))).toEqual(
      json(500, { error: "Cannot destructure property 'userId' of 'body' as it is null." }),
    );
  });

  it("returns 500 for a truthy non-string userId", async () => {
    // BUG(S3.3): unlike the other routes there is no typeof check, so `userId.trim()` throws a TypeError.
    expect(await read(await del({ userId: 5 }))).toEqual(json(500, { error: "userId.trim is not a function" }));
  });

  it("returns 403 when access is inactive, checking the trimmed raw-case id", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await del({ userId: ` ${MIXED} ` }))).toEqual(
      json(403, { error: "Active paid access required" }),
    );
    expect(isAccessActive).toHaveBeenCalledWith(MIXED);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("looks the link up before deleting it and sends a farewell after the response (B3.4)", async () => {
    fakeSupabase.respondByQuery({
      [linkQuery("user_id", LOWER)]: {
        data: { user_id: LOWER, chat_id: "987", username: "bob", linked_at: "2026-03-01T10:00:00Z" },
      },
    });

    const res = await del({ userId: MIXED });

    expect(await read(res)).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([linkQuery("user_id", LOWER), deleteQuery(LOWER)]);
    expect(replyToTelegramChat).not.toHaveBeenCalled();
    expect(afterQueue.pending()).toBe(1);

    await afterQueue.flush();
    expect(replyToTelegramChat).toHaveBeenCalledExactlyOnceWith("987", FAREWELL);
  });

  it("skips the farewell when nothing was linked", async () => {
    expect(await read(await del({ userId: LOWER }))).toEqual(json(200, { success: true }));
    expect(fakeSupabase.log()).toEqual([linkQuery("user_id", LOWER), deleteQuery(LOWER)]);
    expect(afterQueue.pending()).toBe(0);
  });

  it("returns 502 with the Supabase message and sends no farewell when the delete fails (B3.5)", async () => {
    fakeSupabase.respondByQuery({
      [linkQuery("user_id", LOWER)]: { data: { user_id: LOWER, chat_id: "987", username: null, linked_at: "x" } },
      [deleteQuery(LOWER)]: { error: { message: "delete failed" } },
    });

    expect(await read(await del({ userId: LOWER }))).toEqual(json(502, { error: "delete failed" }));

    await afterQueue.flush();
    expect(replyToTelegramChat).not.toHaveBeenCalled();
  });
});
