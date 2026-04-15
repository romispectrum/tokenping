/**
 * Signal notification service via signal-cli-rest-api.
 *
 * Signal does not offer an official API. This service calls a self-hosted
 * signal-cli-rest-api container (https://github.com/bbernhard/signal-cli-rest-api)
 * which wraps the Java-based signal-cli over HTTP.
 *
 * Required environment variables:
 *   SIGNAL_API_URL      – Base URL of the signal-cli-rest-api container, e.g. https://signal.example.com
 *   SIGNAL_SENDER_NUMBER – Registered sender phone number in E.164 format, e.g. +14155550123
 *
 * Why a separate server is needed:
 *   signal-cli is a Java binary that maintains Signal session state (identity keys,
 *   registered phone number). Vercel serverless functions are stateless and cannot run
 *   native binaries or persist state between invocations, so the CLI must run as a
 *   persistent service. Vercel functions (including the cron job) call it via HTTP.
 *
 * Note on Edge Functions:
 *   Vercel Edge Functions run on V8 isolates and can technically make fetch() calls,
 *   but the cron route (/api/cron/notifications) is a standard Node.js serverless
 *   function — not an edge function — so HTTP calls to the Signal server work fine.
 */

/** E.164 phone number format: starts with +, followed by digits only */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export interface SendSignalOptions {
  to: string;
  message: string;
}

export function isSignalConfigured(): boolean {
  return Boolean(process.env.SIGNAL_API_URL && process.env.SIGNAL_SENDER_NUMBER);
}

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone.trim());
}

/**
 * Send a Signal message via signal-cli-rest-api.
 * Returns { success: true } or { success: false, error }.
 */
export async function sendSignalMessage(
  options: SendSignalOptions,
): Promise<{ success: true } | { success: false; error: string }> {
  const { to, message } = options;
  const trimmedTo = to.trim();

  if (!trimmedTo || !isValidE164(trimmedTo)) {
    return { success: false, error: "Invalid phone number – must be E.164 format (e.g. +14155550123)" };
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
        recipients: [trimmedTo],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Signal API responded with ${response.status}: ${body}` };
    }

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error calling Signal API";
    return { success: false, error: message };
  }
}
