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
const FALLBACK_WARNING = "CRON_SECRET is not set: authorized the cron run by its Vercel headers, which can be spoofed";

let consoleWarn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.mocked(runNotificationCheck).mockReset();
  vi.mocked(runNotificationCheck).mockResolvedValue(RESULT);
  vi.mocked(hasBearerSecret).mockClear();
  consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /api/cron/notifications auth", () => {
  it.each([
    // [label, CRON_SECRET, headers, authorized]
    ["matching bearer", "s3cret", { authorization: "Bearer s3cret" }, true],
    ["wrong bearer", "s3cret", { authorization: "Bearer nope" }, false],
    ["bearer with different casing", "s3cret", { authorization: "bearer s3cret" }, false],
    ["missing bearer", "s3cret", {}, false],
    [
      "Vercel headers while a secret is set",
      "s3cret",
      { "x-vercel-cron": "1", "user-agent": "vercel-cron/1.0" },
      false,
    ],
    ["x-vercel-cron other than 1", undefined, { "x-vercel-cron": "true" }, false],
    ["a bearer token without a secret", undefined, { authorization: "Bearer anything" }, false],
    ["no headers and no secret", undefined, {}, false],
  ])("%s → authorized: %s", async (_label, secret, headers, authorized) => {
    vi.stubEnv("CRON_SECRET", secret);

    const res = await get(headers);

    if (authorized) {
      expect(await read(res)).toEqual({ status: 200, text: JSON.stringify(RESULT) });
      expect(runNotificationCheck).toHaveBeenCalledOnce();
    } else {
      expect(await read(res)).toEqual(UNAUTHORIZED);
      expect(runNotificationCheck).not.toHaveBeenCalled();
    }
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it("checks the bearer with the constant-time hasBearerSecret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    await get({ authorization: "Bearer nope" });
    expect(hasBearerSecret).toHaveBeenCalledExactlyOnceWith(expect.any(Request), "s3cret");
  });

  it.each([
    ["x-vercel-cron: 1", undefined, { "x-vercel-cron": "1" }],
    ["a vercel-cron user agent (any case)", undefined, { "user-agent": "Mozilla Vercel-Cron/1.0" }],
    ["x-vercel-cron: 1 (an empty secret counts as none)", "", { "x-vercel-cron": "1" }],
  ])("still accepts %s without a secret, warning every time", async (_label, secret, headers) => {
    vi.stubEnv("CRON_SECRET", secret);

    expect(await read(await get(headers))).toEqual({ status: 200, text: JSON.stringify(RESULT) });
    expect(await read(await get(headers))).toEqual({ status: 200, text: JSON.stringify(RESULT) });

    expect(consoleWarn.mock.calls).toEqual([[FALLBACK_WARNING], [FALLBACK_WARNING]]);
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
