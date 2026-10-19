import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as attributionRoute from "~~/app/api/attribution/route";
import { POST } from "~~/app/api/attribution/route";
import { GET as getConfig } from "~~/app/api/notifications/config/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));

const ATTRIBUTION_URL = "http://localhost/api/attribution";
const CONFIG_URL = "http://localhost/api/notifications/config";
// A valid EIP-55 checksum (vitalik.eth), its lowercase form, and the same address with one letter's case flipped.
const CHECKSUMMED = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const LOWER = CHECKSUMMED.toLowerCase();
const BAD_CHECKSUM = "0xd8da6BF26964aF9D7eEd9e03E53415D37aA96045";

const insertQuery = (userId: string, answer: string) =>
  `user_attribution.upsert(${JSON.stringify({ user_id: userId, answer })},{"onConflict":"user_id","ignoreDuplicates":true})`;

const post = (body: unknown) =>
  POST(new Request(ATTRIBUTION_URL, { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

const OK = json(200, { success: true });
const INVALID_USER = json(400, { error: "Missing or invalid userId" });
const SAVE_FAILED = "Could not save your answer";

let consoleErrors: unknown[][];

beforeEach(() => {
  fakeSupabase.reset();
  vi.mocked(isAccessActive).mockReset();
  vi.mocked(isAccessActive).mockResolvedValue(true);
  consoleErrors = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => void consoleErrors.push(args));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/attribution", () => {
  it("stores the trimmed answer for the lowercased wallet, keeping an existing answer, after the access check", async () => {
    const res = await post({ userId: `  ${CHECKSUMMED} `, answer: "  A friend on Telegram \n" });

    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await read(res)).toEqual(OK);
    // The access check gets the trimmed id as sent, like the config routes.
    expect(isAccessActive).toHaveBeenCalledExactlyOnceWith(CHECKSUMMED);
    // ignoreDuplicates = INSERT ... ON CONFLICT (user_id) DO NOTHING: the first answer per wallet is kept.
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, "A friend on Telegram")]);
  });

  it("answers a repeat submission exactly like the first, without updating the stored answer", async () => {
    expect(await read(await post({ userId: LOWER, answer: "Reddit" }))).toEqual(OK);
    expect(await read(await post({ userId: CHECKSUMMED, answer: "Actually a search" }))).toEqual(OK);
    // Never an update or a plain upsert: the second insert is dropped by ON CONFLICT DO NOTHING.
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, "Reddit"), insertQuery(LOWER, "Actually a search")]);
  });

  it.each([
    ["missing", {}],
    ["empty", { userId: "" }],
    ["blank", { userId: "   " }],
    ["a number", { userId: 5 }],
    ["an array", { userId: [LOWER] }],
    ["not an address", { userId: "alice.eth" }],
    ["too short", { userId: LOWER.slice(0, -1) }],
    ["without 0x", { userId: LOWER.slice(2) }],
    ["a wrong EIP-55 checksum", { userId: BAD_CHECKSUM }],
  ])("returns 400 for a %s userId without the access check or the DB", async (_label, body) => {
    expect(await read(await post({ answer: "X", ...body }))).toEqual(INVALID_USER);
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["an empty body", ""],
    ["malformed JSON", "{"],
    ["JSON null", "null"],
    ["an array", JSON.stringify([{ userId: LOWER, answer: "X" }])],
  ])("returns 400 for %s", async (_label, body) => {
    expect(await read(await post(body))).toEqual(INVALID_USER);
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["missing", undefined, "Invalid answer: expected a string"],
    ["null", null, "Invalid answer: expected a string"],
    ["a number", 42, "Invalid answer: expected a string"],
    ["an array", ["X"], "Invalid answer: expected a string"],
    ["empty", "", "Answer is empty"],
    ["only whitespace", " \n\t ", "Answer is empty"],
    ["501 characters", "a".repeat(501), "Answer is longer than 500 characters"],
    ["a NUL character", "Reddit\u0000", "Answer contains hidden control characters. Retype it and try again."],
    ["a C1 control", "Reddit\u0085", "Answer contains hidden control characters. Retype it and try again."],
    ["a bidi override", "Reddit\u202e", "Answer contains hidden control characters. Retype it and try again."],
    ["a lone surrogate", "Reddit\ud800", "Answer contains invalid characters"],
  ])("returns 400 for a %s answer without the access check or the DB", async (_label, answer, error) => {
    expect(await read(await post({ userId: LOWER, answer }))).toEqual(json(400, { error }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("accepts exactly 500 characters, counting an emoji once", async () => {
    const answer = "🔔".repeat(500);
    expect(await read(await post({ userId: LOWER, answer }))).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, answer)]);
  });

  it("returns 403 without active paid access, before touching the DB", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await post({ userId: CHECKSUMMED, answer: "X" }))).toEqual(
      json(403, { error: "Active paid access required to send an answer" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("sends a lone surrogate escape in the JSON body to 400, not to the database", async () => {
    const body = `{"userId":"${LOWER}","answer":"ok\\ud800"}`;
    expect(await read(await post(body))).toEqual(json(400, { error: "Answer contains invalid characters" }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("returns a generic 502 when the insert fails, logging only the code and message", async () => {
    // A Postgres error as PostgREST returns it; `details` repeats the row, so it must stay out of the log.
    const checkViolation = {
      code: "23514",
      message: 'new row for relation "user_attribution" violates check constraint "user_attribution_answer_check"',
      details: `Failing row contains (${LOWER}, X, 2026-10-15).`,
    };
    fakeSupabase.respond(() => ({ error: checkViolation }));
    expect(await read(await post({ userId: LOWER, answer: "X" }))).toEqual(json(502, { error: SAVE_FAILED }));
    expect(consoleErrors).toEqual([
      ["POST /api/attribution: insert failed", { code: checkViolation.code, message: checkViolation.message }],
    ]);
  });

  it("returns a generic 500 when something throws, logging the error", async () => {
    const thrown = new Error("rpc down");
    vi.mocked(isAccessActive).mockRejectedValue(thrown);
    expect(await read(await post({ userId: LOWER, answer: "X" }))).toEqual(json(500, { error: SAVE_FAILED }));
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(consoleErrors).toEqual([["POST /api/attribution: failed", thrown]]);
  });
});

describe("attribution answers are never read back", () => {
  it("exports POST only, so GET and every other method answer 405", () => {
    expect(Object.keys(attributionRoute)).toEqual(["POST"]);
  });

  it("are not read by the unauthenticated config GET", async () => {
    await getConfig(new Request(`${CONFIG_URL}?userId=${LOWER}`));
    await getConfig(new Request(`${CONFIG_URL}?userId=${LOWER}&chainId=1`));
    expect(fakeSupabase.queries.map(({ table }) => table)).toEqual(["notification_configs", "notification_configs"]);
  });
});
