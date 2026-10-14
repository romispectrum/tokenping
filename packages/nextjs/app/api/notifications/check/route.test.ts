import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "~~/app/api/notifications/check/route";
import { runNotificationCheck } from "~~/services/notifications/runNotificationCheck";

vi.mock("~~/services/notifications/runNotificationCheck", () => ({ runNotificationCheck: vi.fn() }));

const RESULT = {
  success: true as const,
  CRON_INTERVAL_MINUTES: 5,
  configsChecked: 0,
  emailsSent: 0,
  signalSent: 0,
  telegramSent: 0,
};

const read = async (res: Response) => ({ status: res.status, text: await res.text() });

beforeEach(() => {
  vi.mocked(runNotificationCheck).mockReset();
  vi.mocked(runNotificationCheck).mockResolvedValue(RESULT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/notifications/check", () => {
  it.each(["production", "test", ""])("returns 404 when NODE_ENV is %j", async nodeEnv => {
    vi.stubEnv("NODE_ENV", nodeEnv);
    expect(await read(await GET())).toEqual({
      status: 404,
      text: '{"error":"This endpoint is only available in development"}',
    });
    expect(runNotificationCheck).not.toHaveBeenCalled();
  });

  it("runs the check in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await read(await GET())).toEqual({ status: 200, text: JSON.stringify(RESULT) });
  });

  it("returns 502 with the error when the check fails", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(runNotificationCheck).mockResolvedValue({ success: false, error: "boom" });
    expect(await read(await GET())).toEqual({ status: 502, text: '{"error":"boom"}' });
  });
});
