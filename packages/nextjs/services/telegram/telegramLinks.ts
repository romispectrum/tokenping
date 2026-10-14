/**
 * Server-side Supabase helpers for the Telegram link tables.
 *
 * Two tables:
 *   - user_telegram_links: user_id -> { chat_id, username, linked_at }
 *   - telegram_link_tokens: short-lived deep-link tokens for the handshake
 *
 * Server-only — uses the service role client. Never import this from a client
 * component (`"use server"` is implied by the import boundary, since these
 * functions are only called from API routes and the cron).
 */
import { randomBytes } from "crypto";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

/** How long a deep-link token is valid before the user must regenerate. */
export const LINK_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min

/** Telegram's start-parameter max length is 64 chars (charset A-Za-z0-9_-). */
const MAX_START_PARAM_LEN = 64;
const START_PARAM_REGEX = /^[A-Za-z0-9_-]{16,64}$/;

export interface UserTelegramLink {
  userId: string;
  chatId: string;
  username: string | null;
  linkedAt: string;
}

export function normalizeUserId(userId: string): string {
  return userId.trim().toLowerCase();
}

export function isValidStartParam(raw: string): boolean {
  return START_PARAM_REGEX.test(raw);
}

/**
 * Generate a cryptographically strong link token within Telegram's 64-char
 * start-parameter limit. 32 bytes base64url = 43 chars, well under the cap
 * and >>128 bits of entropy.
 */
export function generateLinkToken(): string {
  const token = randomBytes(32).toString("base64url");
  // base64url is already URL-safe & matches the allowed charset.
  return token.slice(0, MAX_START_PARAM_LEN);
}

/**
 * Create a fresh link token for the user, invalidating any of their previous
 * unconsumed tokens (so multi-click doesn't create dangling rows).
 */
export async function createLinkToken(userId: string): Promise<{ token: string; expiresAt: string }> {
  const supabase = getSupabaseServerClient();
  const uid = normalizeUserId(userId);

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
  const supabase = getSupabaseServerClient();

  const nowIso = new Date().toISOString();
  // Atomic: mark consumed iff currently unconsumed AND not expired.
  const { data, error } = await supabase
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
 * Upsert (link) a user's Telegram chat. Called from the webhook after a
 * successful token consumption. Uses chat_id-conflict semantics: if the same
 * chat tries to re-link to a different wallet, the latest one wins.
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
  const uid = normalizeUserId(params.userId);

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

/** Lookup link by wallet. */
export async function getLinkByUserId(userId: string): Promise<UserTelegramLink | null> {
  const supabase = getSupabaseServerClient();
  const uid = normalizeUserId(userId);
  const { data, error } = await supabase
    .from("user_telegram_links")
    .select("user_id, chat_id, username, linked_at")
    .eq("user_id", uid)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id as string,
    chatId: data.chat_id as string,
    username: (data.username as string | null) ?? null,
    linkedAt: data.linked_at as string,
  };
}

/** Lookup link by Telegram chat_id (used by /stop and bot-blocked cleanup). */
export async function getLinkByChatId(chatId: string): Promise<UserTelegramLink | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_telegram_links")
    .select("user_id, chat_id, username, linked_at")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id as string,
    chatId: data.chat_id as string,
    username: (data.username as string | null) ?? null,
    linkedAt: data.linked_at as string,
  };
}

/** Unlink by user_id (UI Disconnect button). */
export async function deleteLinkByUserId(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const uid = normalizeUserId(userId);
  await supabase.from("user_telegram_links").delete().eq("user_id", uid);
}

/** Unlink by chat_id (used by /stop command and bot-blocked cleanup in cron). */
export async function deleteLinkByChatId(chatId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from("user_telegram_links").delete().eq("chat_id", chatId);
}
