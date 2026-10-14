/**
 * Telegram notification service.
 *
 * Uses the official Bot API (https://core.telegram.org/bots/api). Unlike Signal,
 * there's no daemon — the Bot API is a plain HTTPS endpoint, perfect for
 * Vercel serverless.
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN — from @BotFather
 *
 * Why plain text instead of parse_mode: "HTML" / "MarkdownV2":
 *   Both modes have reserved characters that must be escaped per Telegram's rules.
 *   Forgetting to escape a single `<` or `_` aborts the entire send with
 *   400 "can't parse entities". For our short alert body, plain text is bulletproof.
 */

export interface SendTelegramOptions {
  /** Telegram chat_id as a string (may exceed JS safe int range for groups). */
  chatId: string;
  /** Plain-text message body. No HTML / Markdown parsing applied. */
  message: string;
}

/**
 * Error reasons the caller may want to act on (e.g. null out the chat_id when
 * the bot has been blocked or the chat no longer exists).
 */
export type TelegramSendErrorCode =
  | "bot_blocked" // user blocked the bot; chat_id is dead
  | "chat_not_found" // chat_id stale or never existed
  | "rate_limited" // 429; retry_after is set
  | "misconfigured" // missing TELEGRAM_BOT_TOKEN
  | "network" // fetch failure / timeout
  | "api_error"; // any other Telegram API error

export type SendTelegramResult =
  | { success: true }
  | { success: false; error: string; code: TelegramSendErrorCode; retryAfter?: number };

const TELEGRAM_FETCH_TIMEOUT_MS = 8_000;

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/**
 * Scrub the bot token from any error string so we never leak it via logs or
 * the cron response body (NotificationCheckResult.errors[]).
 */
function scrubToken(input: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return input;
  return input.split(token).join("<redacted>");
}

/**
 * Classify a Telegram error response into an actionable code.
 * Reference: https://core.telegram.org/api/errors
 */
function classifyError(status: number, description: string): TelegramSendErrorCode {
  const d = description.toLowerCase();
  if (status === 403 && d.includes("bot was blocked")) return "bot_blocked";
  if (status === 403 && d.includes("user is deactivated")) return "bot_blocked";
  if (status === 400 && d.includes("chat not found")) return "chat_not_found";
  if (status === 400 && d.includes("peer_id_invalid")) return "chat_not_found";
  if (status === 429) return "rate_limited";
  return "api_error";
}

/**
 * Send a plain-text message to a Telegram chat.
 *
 * Returns a structured result so the caller can:
 *   - increment a counter on success
 *   - null out a stored chat_id when code === "bot_blocked" or "chat_not_found"
 *   - back off / log on other errors
 */
export async function sendTelegramMessage(options: SendTelegramOptions): Promise<SendTelegramResult> {
  const { chatId, message } = options;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN missing", code: "misconfigured" };
  }
  if (!chatId || !chatId.trim()) {
    return { success: false, error: "chatId is required", code: "api_error" };
  }
  if (!message || !message.trim()) {
    return { success: false, error: "message is required", code: "api_error" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        // Intentionally no parse_mode — plain text avoids escaping bugs.
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(TELEGRAM_FETCH_TIMEOUT_MS),
    });

    let json: { ok?: boolean; description?: string; error_code?: number; parameters?: { retry_after?: number } } = {};
    try {
      json = await response.json();
    } catch {
      // Fall through; we'll use response.status alone.
    }

    if (response.ok && json.ok) {
      return { success: true };
    }

    const description = json.description || `Telegram API ${response.status}`;
    const code = classifyError(response.status, description);
    const retryAfter = json.parameters?.retry_after;

    return {
      success: false,
      error: scrubToken(description),
      code,
      ...(retryAfter !== undefined ? { retryAfter } : {}),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error calling Telegram API";
    return { success: false, error: scrubToken(message), code: "network" };
  }
}

/**
 * Convenience: tell Telegram who we are. Used by the webhook to reply to the
 * user after a successful /start handshake. We deliberately keep this in the
 * same file so the bot-token usage is centralized.
 */
export async function replyToTelegramChat(chatId: string, message: string): Promise<void> {
  // Fire-and-forget — webhook should reply fast even if this fails.
  await sendTelegramMessage({ chatId, message }).catch(() => {});
}
