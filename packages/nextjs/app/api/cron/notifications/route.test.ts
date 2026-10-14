import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/api/cron/notifications/route";
import { runNotificationCheck } from "~~/services/notifications/runNotificationCheck";

vi.mock("~~/services/notifications/runNotificationCheck", () => ({ runNotificationCheck: vi.fn() }));

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

const INVALID_BEARER = { error: "Unauthorized", reason: "Invalid bearer token for CRON_SECRET" };
const NO_TRUSTED_HEADERS = { error: "Unauthorized", reason: "Missing CRON_SECRET and no trusted Vercel cron headers" };

beforeEach(() => {
  vi.mocked(runNotificationCheck).mockReset();
  vi.mocked(runNotificationCheck).mockResolvedValue(RESULT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/cron/notifications auth", () => {
  it.each([
    // [label, CRON_SECRET, headers, expected 401 body or null for authorized]
    ["matching bearer", "s3cret", { authorization: "Bearer s3cret" }, null],
    ["wrong bearer", "s3cret", { authorization: "Bearer nope" }, INVALID_BEARER],
    ["bearer with different casing", "s3cret", { authorization: "bearer s3cret" }, INVALID_BEARER],
    ["missing bearer", "s3cret", {}, INVALID_BEARER],
    [
      "Vercel headers while a secret is set",
      "s3cret",
      { "x-vercel-cron": "1", "user-agent": "vercel-cron/1.0" },
      INVALID_BEARER,
    ],
    ["x-vercel-cron: 1 without a secret", undefined, { "x-vercel-cron": "1" }, null],
    [
      "vercel-cron user agent (any case) without a secret",
      undefined,
      { "user-agent": "Mozilla Vercel-Cron/1.0" },
      null,
    ],
    ["empty secret behaves as unset", "", { "x-vercel-cron": "1" }, null],
    ["x-vercel-cron other than 1", undefined, { "x-vercel-cron": "true" }, NO_TRUSTED_HEADERS],
    ["a bearer token without a secret", undefined, { authorization: "Bearer anything" }, NO_TRUSTED_HEADERS],
    ["no headers and no secret", undefined, {}, NO_TRUSTED_HEADERS],
  ])("%s", async (_label, secret, headers, unauthorizedBody) => {
    vi.stubEnv("CRON_SECRET", secret);

    const res = await get(headers);

    if (unauthorizedBody) {
      expect(await read(res)).toEqual({ status: 401, text: JSON.stringify(unauthorizedBody) });
      expect(runNotificationCheck).not.toHaveBeenCalled();
    } else {
      expect(await read(res)).toEqual({ status: 200, text: JSON.stringify(RESULT) });
      expect(runNotificationCheck).toHaveBeenCalledOnce();
    }
  });
});

describe("GET /api/cron/notifications result", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "s3cret");
  });

  it("returns the check result, errors included", async () => {
    const withErrors = { ...RESULT, errors: ["email:a@b.co: Invalid email address"] };
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
