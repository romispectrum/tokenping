/**
 * Signal notification service via signal-cli-rest-api.
 *
 * Signal does not offer an official API. This service calls a self-hosted
 * signal-cli-rest-api container (https://github.com/bbernhard/signal-cli-rest-api)
 * which wraps the Java-based signal-cli over HTTP.
 *
 * Required environment variables:
 *   SIGNAL_API_URL       – Base URL of the signal-cli-rest-api container, e.g. https://signal.example.com
 *   SIGNAL_SENDER_NUMBER – Registered sender phone number in E.164 format, e.g. +14155550123
 *
 * Recipient format:
 *   Users provide their Signal username (e.g. "alice.42" or "@alice.42").
 *   The @ and u: prefixes are stripped before storage. We send the BARE username
 *   to signal-cli-rest-api — the API auto-detects usernames and adds the "u:" prefix
 *   internally before passing to signal-cli (see client.go getRecipientType).
 *
 * Why a separate server is needed:
 *   signal-cli is a Java binary that maintains Signal session state (identity keys,
 *   registered phone number). Vercel serverless functions are stateless and cannot run
 *   native binaries or persist state between invocations, so the CLI must run as a
 *   persistent service. Vercel functions (including the cron job) call it via HTTP.
 */
import "server-only";
import { getErrorMessage } from "~~/utils/errors";
import { isValidSignalUsername, normalizeSignalUsername } from "~~/utils/notifications/validation";

export type SendSignalOptions = {
  /** Stored username without @ prefix, e.g. "alice.42" */
  to: string;
  message: string;
};

export async function sendSignalMessage({
  to,
  message,
}: SendSignalOptions): Promise<{ success: true } | { success: false; error: string }> {
  const username = normalizeSignalUsername(to);

  // BUG(unlisted): isValidSignalUsername normalizes (and trims) again, so "@ alice.42" passes but " alice.42" is sent.
  if (!isValidSignalUsername(username)) {
    return {
      success: false,
      error: `Invalid Signal username "${username}". Expected format: alice.42 (find yours in Signal → Settings → Profile)`,
    };
  }

  const apiUrl = process.env.SIGNAL_API_URL?.replace(/\/$/, "");
  const sender = process.env.SIGNAL_SENDER_NUMBER?.trim();

  if (!apiUrl || !sender) {
    return { success: false, error: "Signal service not configured (SIGNAL_API_URL or SIGNAL_SENDER_NUMBER missing)" };
  }

  try {
    const response = await fetch(`${apiUrl}/v2/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        number: sender,
        recipients: [username],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Signal API responded with ${response.status}: ${body}` };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: getErrorMessage(e, "Unknown error calling Signal API") };
  }
}
