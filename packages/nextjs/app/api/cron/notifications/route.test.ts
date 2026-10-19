import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/api/cron/notifications/route";
import { hasBearerSecret } from "~~/services/api/server/auth";
import { runNotificationCheck } from "~~/services/notifications/runNotificationCheck";

vi.mock("~~/services/notifications/runNotificationCheck", () => ({ runNotificationCheck: vi.fn() }));
vi.mock("~~/services/api/server/auth", async importOriginal => {
  const actual = await importOriginal<typeof import("~~/services/api/server/auth")>();
  return { ...actual, hasBearerSecret: vi.fn(actual.hasBearerSecret) };
});

const RESULT = {
  success: true as const,
  CRON_INTERVAL_MINUTES: 5,
  configsChecked: 2,
  emailsSent: 1,
  signalSent: 0,
  telegramSent: 1,
};

const get = (headers: Record<string, string> = {}) =>
  GET(new Request("http://localhost/api/cron/notifications", { headers }));
const read = async (res: Response) => ({ status: res.status, text: await res.text() });

// No `reason`: it revealed whether CRON_SECRET is configured (B3.10).
const UNAUTHORIZED = { status: 401, text: '{"error":"Unauthorized"}' };
const NO_SECRET_ERROR =
  "CRON_SECRET is not set: refused the cron run. Set CRON_SECRET in the Vercel project; Vercel then sends it as the bearer.";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(runNotificationCheck).mockReset();
  vi.mocked(runNotificationCheck).mockResolvedValue(RESULT);
  vi.mocked(hasBearerSecret).mockClear();
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/cron/notifications auth", () => {
  it.each([
    // [label, headers, authorized]
    ["matching bearer", { authorization: "Bearer s3cret" }, true],
    ["wrong bearer", { authorization: "Bearer nope" }, false],
    ["bearer with different casing", { authorization: "bearer s3cret" }, false],
    ["missing bearer", {}, false],
    ["Vercel cron headers without the bearer", { "x-vercel-cron": "1", "user-agent": "vercel-cron/1.0" }, false],
  ])("with CRON_SECRET set, %s → authorized: %s", async (_label, headers, authorized) => {
    vi.stubEnv("CRON_SECRET", "s3cret");

    const res = await get(headers);

    if (authorized) {
      expect(await read(res)).toEqual({ status: 200, text: JSON.stringify(RESULT) });
      expect(runNotificationCheck).toHaveBeenCalledOnce();
    } else {
      expect(await read(res)).toEqual(UNAUTHORIZED);
      expect(runNotificationCheck).not.toHaveBeenCalled();
    }
    // A wrong bearer is a caller's mistake, not a misconfiguration: nothing is logged.
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("checks the bearer with the constant-time hasBearerSecret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    await get({ authorization: "Bearer nope" });
    expect(hasBearerSecret).toHaveBeenCalledExactlyOnceWith(expect.any(Request), "s3cret");
  });

  // Any client can send the Vercel headers, so without the secret no request runs the check.
  it.each([
    ["x-vercel-cron: 1", undefined, { "x-vercel-cron": "1" }],
    ["a vercel-cron user agent", undefined, { "user-agent": "vercel-cron/1.0" }],
    ["both Vercel headers", undefined, { "x-vercel-cron": "1", "user-agent": "vercel-cron/1.0" }],
    ["a bearer token", undefined, { authorization: "Bearer anything" }],
    ["an empty bearer against an empty secret", "", { authorization: "Bearer " }],
    ["no headers", undefined, {}],
  ])("without CRON_SECRET, refuses %s and logs why every time", async (_label, secret, headers) => {
    vi.stubEnv("CRON_SECRET", secret);

    expect(await read(await get(headers))).toEqual(UNAUTHORIZED);
    expect(await read(await get(headers))).toEqual(UNAUTHORIZED);

    expect(runNotificationCheck).not.toHaveBeenCalled();
    expect(hasBearerSecret).not.toHaveBeenCalled();
    expect(consoleError.mock.calls).toEqual([[NO_SECRET_ERROR], [NO_SECRET_ERROR]]);
  });
});

describe("GET /api/cron/notifications result", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret");
  });

  it("returns the check result, errors included", async () => {
    const withErrors = { ...RESULT, errors: ["email:a***@b.co: Invalid email address"] };
    vi.mocked(runNotificationCheck).mockResolvedValue(withErrors);
    const res = await get({ authorization: "Bearer s3cret" });
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await read(res)).toEqual({ status: 200, text: JSON.stringify(withErrors) });
  });

  it("returns 502 with the error when the check fails", async () => {
    vi.mocked(runNotificationCheck).mockResolvedValue({ success: false, error: "relation does not exist" });
    expect(await read(await get({ authorization: "Bearer s3cret" }))).toEqual({
      status: 502,
      text: '{"error":"relation does not exist"}',
    });
  });
});
