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
 *   The @ prefix is stripped before storage and a "u:" prefix is added when
 *   calling the API, as required by signal-cli for username-addressed messages.
 *
 * Why a separate server is needed:
 *   signal-cli is a Java binary that maintains Signal session state (identity keys,
 *   registered phone number). Vercel serverless functions are stateless and cannot run
 *   native binaries or persist state between invocations, so the CLI must run as a
 *   persistent service. Vercel functions (including the cron job) call it via HTTP.
 */

/**
 * Signal usernames: 3–32 chars, letters/numbers/underscores, ending with a
 * 2-digit discriminator (e.g. alice.42, my_bot.01).
 */
const SIGNAL_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/;

export interface SendSignalOptions {
  /** Stored username without @ prefix, e.g. "alice.42" */
  to: string;
  message: string;
}

export function isSignalConfigured(): boolean {
  return Boolean(process.env.SIGNAL_API_URL && process.env.SIGNAL_SENDER_NUMBER);
}

/**
 * Strip leading @ or u: prefix and return the bare username.
 * "alice.42" → "alice.42"
 * "@alice.42" → "alice.42"
 * "u:alice.42" → "alice.42"
 * "u:@alice.42" → "alice.42"
 */
export function normalizeSignalUsername(raw: string): string {
  return raw.trim().replace(/^[u:@]+/, "");
}

/**
 * Returns true if the string (after stripping @) looks like a valid Signal username.
 */
export function isValidSignalUsername(raw: string): boolean {
  return SIGNAL_USERNAME_REGEX.test(normalizeSignalUsername(raw));
}

/**
 * Send a Signal message via signal-cli-rest-api.
 * Returns { success: true } or { success: false, error }.
 */
export async function sendSignalMessage(
  options: SendSignalOptions,
): Promise<{ success: true } | { success: false; error: string }> {
  const { to, message } = options;
  const username = normalizeSignalUsername(to);

  if (!username || !isValidSignalUsername(username)) {
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

  // signal-cli-rest-api requires "u:" prefix for username-addressed recipients
  const recipient = `u:${username}`;

  try {
    const response = await fetch(`${apiUrl}/v2/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        number: sender,
        recipients: [recipient],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Signal API responded with ${response.status}: ${body}` };
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error calling Signal API";
    return { success: false, error: msg };
  }
}
