import type { MarketRef } from "~~/config/aaveConfig";
import { SignInRequiredError, apiError, apiUrl, readApiError } from "~~/services/api/apiClient";
import type { NotificationService } from "~~/types/notifications";

const TEST_PATH = "/api/notifications/test";

/** When each channel's next test is allowed (ISO time), or null when it is allowed now. */
export type TestRetryTimes = Record<NotificationService, string | null>;

/** A refused send; `retryAt` is set when the 15-minute limit refused it (429). */
export class TestSendError extends Error {
  constructor(
    message: string,
    readonly retryAt?: string,
  ) {
    super(message);
    this.name = "TestSendError";
  }
}

/** Browser client for /api/notifications/test: the "Send test" buttons in an alert's summary, for the signed-in wallet. */
export const notificationTestClient = {
  async getRetryTimes(): Promise<TestRetryTimes> {
    const res = await fetch(apiUrl(TEST_PATH), { cache: "no-store" });
    if (!res.ok) throw await apiError(res, "Failed to read the test message limit");
    return res.json();
  },

  /**
   * Resolves with when the next test on `channel` is allowed; throws TestSendError when the server refuses, and
   * SignInRequiredError without a session.
   */
  async send({ chainId, market }: MarketRef, channel: NotificationService) {
    const res = await fetch(apiUrl(TEST_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chainId, market, channel }),
    });
    if (res.status === 401) throw new SignInRequiredError(await readApiError(res, "Sign in with your wallet first"));
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; retryAt?: string };
      throw new TestSendError(body.error ?? "One test message per channel every 15 minutes", body.retryAt);
    }
    if (!res.ok) throw new TestSendError(await readApiError(res, "Failed to send the test message"));
    return (await res.json()) as { sentAt: string; retryAt: string };
  },
};
