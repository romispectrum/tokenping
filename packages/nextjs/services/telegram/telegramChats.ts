/**
 * Server-side Supabase helpers for telegram_chats: which chat belongs to which Telegram username.
 *
 * An alert names a Telegram username (notification_configs.telegram_username). A bot cannot look a person up by
 * username or message someone who never wrote to it, so the chat id is learned when that person sends /start: the
 * webhook stores it under the username the message came from. Usernames are stored lowercased, without "@".
 */
import "server-only";
import { selectAllPages } from "~~/services/supabase/selectAllPages";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

const chatsTable = () => getSupabaseServerClient().from("telegram_chats");

/**
 * Remembers that `username` is in `chatId`. A username moves with its owner, so any other chat that held it is
 * dropped first; a chat whose owner changed their username gets the new one. Returns the Supabase error, if any.
 */
export async function linkTelegramChat({ chatId, username }: { chatId: string; username: string }) {
  const removed = await chatsTable().delete().eq("username", username).neq("chat_id", chatId);
  if (removed.error) return removed.error;

  const { error } = await chatsTable().upsert(
    { chat_id: chatId, username, updated_at: new Date().toISOString() },
    { onConflict: "chat_id" },
  );
  return error;
}

/** Whether `username` has pressed Start. Throws when the lookup fails, so an outage never reads as "not linked". */
export async function isTelegramUsernameLinked(username: string): Promise<boolean> {
  const { data, error } = await chatsTable().select("chat_id").eq("username", username).maybeSingle();
  if (error) throw new Error(`Failed to read the Telegram chat: ${error.message}`);
  return data !== null;
}

/** The chat `username` pressed Start in, or null. Throws when the lookup fails. */
export async function getChatIdByUsername(username: string): Promise<string | null> {
  const { data, error } = await chatsTable()
    .select("chat_id")
    .eq("username", username)
    .maybeSingle<{ chat_id: string }>();
  if (error) throw new Error(`Failed to read the Telegram chat: ${error.message}`);
  return data ? String(data.chat_id) : null;
}

/**
 * Every linked chat as username → chat id, read page by page. A failed query returns its error with an empty map,
 * so the caller can report that Telegram was skipped instead of silently sending nothing.
 */
export async function getChatIdsByUsername(): Promise<{
  chatIdsByUsername: Map<string, string>;
  error: { message: string } | null;
}> {
  const { data, error } = await selectAllPages<{ username: string; chat_id: string }>((from, to) =>
    chatsTable().select("username, chat_id").order("chat_id").range(from, to),
  );
  const entries = (data ?? []).map(row => [String(row.username), String(row.chat_id)] as const);
  return { chatIdsByUsername: new Map(entries), error };
}

/** Forgets a chat: /stop, or Telegram reporting it blocked or gone. Returns the Supabase error, if any. */
export async function deleteTelegramChat(chatId: string) {
  const { error } = await chatsTable().delete().eq("chat_id", chatId);
  return error;
}
