import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as attributionRoute from "~~/app/api/attribution/route";
import { POST } from "~~/app/api/attribution/route";
import { GET as getConfig } from "~~/app/api/notifications/config/route";
import { fakeSupabase } from "~~/services/api/server/testing/fakeSupabase";
import { siteRequest } from "~~/services/api/server/testing/siteRequest";
import { isAccessActive } from "~~/services/payments/checkAccess";

vi.mock("~~/services/supabase/supabaseServer", async () => {
  const { fakeSupabase } = await import("~~/services/api/server/testing/fakeSupabase");
  return { getSupabaseServerClient: () => fakeSupabase.client };
});
vi.mock("~~/services/payments/checkAccess", () => ({ isAccessActive: vi.fn() }));

const ATTRIBUTION_URL = "http://localhost/api/attribution";
const CONFIG_URL = "http://localhost/api/notifications/config";
// The signed-in wallet (vitalik.eth) in its EIP-55 and lowercase forms, and another wallet.
const CHECKSUMMED = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const LOWER = CHECKSUMMED.toLowerCase();
const OTHER_WALLET = `0x${"cd".repeat(20)}`;

const insertQuery = (userId: string, answer: string) =>
  `user_attribution.upsert(${JSON.stringify({ user_id: userId, answer })},{"onConflict":"user_id","ignoreDuplicates":true})`;

// From the site's own page, signed in as `wallet` (LOWER unless a test says otherwise).
const post = (body: unknown, wallet: string | null = LOWER, headers?: Record<string, string | undefined>) =>
  POST(siteRequest(ATTRIBUTION_URL, { method: "POST", body, wallet, headers }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });
const json = (status: number, body: unknown) => ({ status, text: JSON.stringify(body) });

const OK = json(200, { success: true });
const INVALID_ANSWER = json(400, { error: "Invalid answer: expected a string" });
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
    const res = await post({ answer: "  A friend on Telegram \n" });

    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await read(res)).toEqual(OK);
    // The access check gets the signed-in wallet in its EIP-55 form, like the config routes.
    expect(isAccessActive).toHaveBeenCalledExactlyOnceWith(CHECKSUMMED);
    // ignoreDuplicates = INSERT ... ON CONFLICT (user_id) DO NOTHING: the first answer per wallet is kept.
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, "A friend on Telegram")]);
  });

  it("answers a repeat submission exactly like the first, without updating the stored answer", async () => {
    expect(await read(await post({ answer: "Reddit" }))).toEqual(OK);
    expect(await read(await post({ answer: "Actually a search" }))).toEqual(OK);
    // Never an update or a plain upsert: the second insert is dropped by ON CONFLICT DO NOTHING.
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, "Reddit"), insertQuery(LOWER, "Actually a search")]);
  });

  it("returns 401 without a session, before reading the answer, the access or the DB", async () => {
    expect(await read(await post({ answer: "X" }, null))).toEqual(
      json(401, { error: "Sign in with your wallet first" }),
    );
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["another wallet", OTHER_WALLET],
    ["not an address", "alice.eth"],
  ])("returns 403 when an older client's userId names %s", async (_label, userId) => {
    expect(await read(await post({ userId, answer: "X" }))).toEqual(
      json(403, { error: "userId does not match the signed-in wallet" }),
    );
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("stores the answer for the signed-in wallet only", async () => {
    expect(await read(await post({ userId: ` ${CHECKSUMMED} `, answer: "X" }, LOWER))).toEqual(OK);
    expect(await read(await post({ answer: "Y" }, OTHER_WALLET))).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, "X"), insertQuery(OTHER_WALLET, "Y")]);
  });

  it.each([
    ["another site's Origin", { origin: "https://evil.example" }, 403, "Cross-site request refused"],
    ["no Origin", { origin: undefined }, 403, "Cross-site request refused"],
    ["a text/plain body", { "content-type": "text/plain" }, 415, "Content-Type must be application/json"],
  ])("refuses a request with %s, before the session and the DB", async (_label, headers, status, error) => {
    expect(await read(await post({ answer: "X" }, LOWER, headers))).toEqual(json(status, { error }));
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it.each([
    ["an empty body", ""],
    ["malformed JSON", "{"],
    ["JSON null", "null"],
    ["an array", JSON.stringify([{ answer: "X" }])],
  ])("reads %s as an empty body", async (_label, body) => {
    expect(await read(await post(body))).toEqual(INVALID_ANSWER);
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
    expect(await read(await post({ answer }))).toEqual(json(400, { error }));
    expect(isAccessActive).not.toHaveBeenCalled();
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("accepts exactly 500 characters, counting an emoji once", async () => {
    const answer = "🔔".repeat(500);
    expect(await read(await post({ answer }))).toEqual(OK);
    expect(fakeSupabase.log()).toEqual([insertQuery(LOWER, answer)]);
  });

  it("returns 403 without active paid access, before touching the DB", async () => {
    vi.mocked(isAccessActive).mockResolvedValue(false);
    expect(await read(await post({ answer: "X" }))).toEqual(
      json(403, { error: "Active paid access required to send an answer" }),
    );
    expect(fakeSupabase.queries).toHaveLength(0);
  });

  it("sends a lone surrogate escape in the JSON body to 400, not to the database", async () => {
    const body = `{"answer":"ok\\ud800"}`;
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
    expect(await read(await post({ answer: "X" }))).toEqual(json(502, { error: SAVE_FAILED }));
    expect(consoleErrors).toEqual([
      ["POST /api/attribution: insert failed", { code: checkViolation.code, message: checkViolation.message }],
    ]);
  });

  it("returns a generic 500 when something throws, logging the error", async () => {
    const thrown = new Error("rpc down");
    vi.mocked(isAccessActive).mockRejectedValue(thrown);
    expect(await read(await post({ answer: "X" }))).toEqual(json(500, { error: SAVE_FAILED }));
    expect(fakeSupabase.queries).toHaveLength(0);
    expect(consoleErrors).toEqual([["POST /api/attribution: failed", thrown]]);
  });
});

describe("attribution answers are never read back", () => {
  it("exports POST only, so GET and every other method answer 405", () => {
    expect(Object.keys(attributionRoute)).toEqual(["POST"]);
  });

  it("are not read by the config GET, even for the signed-in wallet", async () => {
    await getConfig(siteRequest(CONFIG_URL, { wallet: LOWER }));
    await getConfig(siteRequest(`${CONFIG_URL}?chainId=1`, { wallet: LOWER }));
    expect(new Set(fakeSupabase.queries.map(({ table }) => table))).toEqual(new Set(["notification_configs"]));
  });
});
