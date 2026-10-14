/**
 * Server-side Supabase helpers for the Telegram link tables.
 *
 * Two tables:
 *   - user_telegram_links: user_id -> { chat_id, username, linked_at }
 *   - telegram_link_tokens: short-lived deep-link tokens for the handshake
 *
 * Needs the service role client: anon/authenticated access to telegram_link_tokens is revoked.
 */
import { randomBytes } from "crypto";
import "server-only";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import { normalizeAddress } from "~~/utils/address";

/** How long a deep-link token is valid before the user must regenerate. */
const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

/** Telegram's start-parameter max length is 64 chars (charset A-Za-z0-9_-). */
const MAX_START_PARAM_LEN = 64;
const START_PARAM_REGEX = /^[A-Za-z0-9_-]{16,64}$/;

const LINK_COLUMNS = "user_id, chat_id, username, linked_at";

export type UserTelegramLink = {
  userId: string;
  chatId: string;
  username: string | null;
  linkedAt: string;
};

type UserTelegramLinkRow = {
  user_id: string;
  chat_id: string;
  username?: string | null;
  linked_at: string;
};

const rowToLink = (row: UserTelegramLinkRow): UserTelegramLink => ({
  userId: row.user_id,
  chatId: row.chat_id,
  username: row.username ?? null,
  linkedAt: row.linked_at,
});

export function isValidStartParam(raw: string): boolean {
  return START_PARAM_REGEX.test(raw);
}

/**
 * Generate a cryptographically strong link token within Telegram's 64-char
 * start-parameter limit. 32 bytes base64url = 43 chars, well under the cap
 * and >>128 bits of entropy.
 */
function generateLinkToken(): string {
  // base64url is already URL-safe & matches the allowed charset.
  return randomBytes(32).toString("base64url").slice(0, MAX_START_PARAM_LEN);
}

/**
 * Create a fresh link token for the user, invalidating any of their previous
 * unconsumed tokens (so multi-click doesn't create dangling rows).
 */
export async function createLinkToken(userId: string): Promise<{ token: string; expiresAt: string }> {
  const supabase = getSupabaseServerClient();
  const uid = normalizeAddress(userId);

  // Best-effort cleanup of stale unconsumed tokens for this user.
  await supabase.from("telegram_link_tokens").delete().eq("user_id", uid).is("consumed_at", null);

  const token = generateLinkToken();
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString();

  const { error } = await supabase.from("telegram_link_tokens").insert({
    token,
    user_id: uid,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Failed to create link token: ${error.message}`);
  return { token, expiresAt };
}

/**
 * Atomically consume a link token. Returns the associated user_id, or null
 * if the token doesn't exist, is already consumed, or has expired.
 *
 * IMPORTANT: this MUST be a single UPDATE ... RETURNING statement to avoid a
 * select-then-update race where two webhook deliveries (Telegram retries) both
 * succeed.
 */
export async function consumeLinkToken(token: string): Promise<{ userId: string } | null> {
  if (!isValidStartParam(token)) return null;

  const nowIso = new Date().toISOString();
  // Atomic: mark consumed iff currently unconsumed AND not expired.
  const { data, error } = await getSupabaseServerClient()
    .from("telegram_link_tokens")
    .update({ consumed_at: nowIso })
    .eq("token", token)
    .is("consumed_at", null)
    .gt("expires_at", nowIso)
    .select("user_id")
    .maybeSingle();

  if (error || !data) return null;
  return { userId: data.user_id as string };
}

/**
 * Links a user's Telegram chat: upserts on user_id after deleting any other wallet's link for this chat, so a chat
 * re-linked to a new wallet keeps only the latest link.
 *
 * Returns true on success, false on error (caller decides whether to reply
 * to Telegram with an apology).
 */
export async function upsertUserTelegramLink(params: {
  userId: string;
  chatId: string;
  username: string | null;
}): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const uid = normalizeAddress(params.userId);

  // If this chat_id was previously linked to a DIFFERENT user_id, that link is
  // stale (user re-linked from a different wallet). Remove it first to avoid
  // violating the chat_id unique constraint.
  await supabase.from("user_telegram_links").delete().eq("chat_id", params.chatId).neq("user_id", uid);

  const { error } = await supabase.from("user_telegram_links").upsert(
    {
      user_id: uid,
      chat_id: params.chatId,
      username: params.username,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("upsertUserTelegramLink failed", error);
    return false;
  }
  return true;
}

/** Lookup errors are reported as "no link". */
async function findLink(column: "user_id" | "chat_id", value: string): Promise<UserTelegramLink | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("user_telegram_links")
    .select(LINK_COLUMNS)
    .eq(column, value)
    .maybeSingle<UserTelegramLinkRow>();
  return error || !data ? null : rowToLink(data);
}

export function getLinkByUserId(userId: string): Promise<UserTelegramLink | null> {
  return findLink("user_id", normalizeAddress(userId));
}

export function getLinkByChatId(chatId: string): Promise<UserTelegramLink | null> {
  return findLink("chat_id", chatId);
}

/**
 * Every link as user_id → chat_id, in a single query.
 * BUG(B3.7): unpaginated (capped at PostgREST max_rows) and a failed query silently yields an empty map.
 */
export async function getChatIdsByUser(): Promise<Map<string, string>> {
  const { data } = await getSupabaseServerClient().from("user_telegram_links").select("user_id, chat_id");
  return new Map((data ?? []).map(row => [String(row.user_id), String(row.chat_id)]));
}

// BUG(B3.5): both deletes ignore the Supabase error, so callers report success even when nothing was removed.

export async function deleteLinkByUserId(userId: string): Promise<void> {
  await getSupabaseServerClient().from("user_telegram_links").delete().eq("user_id", normalizeAddress(userId));
}

export async function deleteLinkByChatId(chatId: string): Promise<void> {
  await getSupabaseServerClient().from("user_telegram_links").delete().eq("chat_id", chatId);
}
