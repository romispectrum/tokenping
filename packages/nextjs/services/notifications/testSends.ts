import "server-only";
import { NOTIFICATION_SERVICES, TEST_SEND_COOLDOWN_MINUTES } from "~~/constants/notifications";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import type { NotificationService } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

// The one-test-per-15-minutes limit, kept in notification_test_sends (migration 20261019000000). The claim is a single
// database statement, so two clicks or two tabs can never both send.

const COOLDOWN_SECONDS = TEST_SEND_COOLDOWN_MINUTES * 60;

export type TestSendClaim = {
  claimed: boolean;
  /** When this claim (or the one that blocked it) was taken, as the database returned it. */
  sentAt: string;
  /** When the next test on this channel is allowed. */
  retryAt: string;
};

type ClaimRow = { claimed: boolean; sent_at: string; retry_at: string };

/** Takes the wallet's test slot for `channel`, or reports when it frees up. Throws when the database call fails. */
export async function claimTestSend(userId: string, channel: NotificationService): Promise<TestSendClaim> {
  const { data, error } = await getSupabaseServerClient()
    .rpc("claim_notification_test_send", {
      p_user_id: normalizeAddress(userId),
      p_channel: channel,
      p_cooldown_seconds: COOLDOWN_SECONDS,
    })
    .single<ClaimRow>();
  if (error || !data) throw new Error(`Failed to check the test message limit: ${error?.message ?? "no result"}`);
  return { claimed: data.claimed, sentAt: data.sent_at, retryAt: data.retry_at };
}

/**
 * Gives back a slot whose send failed, so a broken channel can be tried again at once. Only the row this claim wrote
 * is deleted (matched by its sent_at). Returns the Supabase error, if any.
 */
export async function releaseTestSend(userId: string, channel: NotificationService, sentAt: string) {
  const { error } = await getSupabaseServerClient()
    .from("notification_test_sends")
    .delete()
    .eq("user_id", normalizeAddress(userId))
    .eq("channel", channel)
    .eq("sent_at", sentAt);
  return error;
}

/** When each channel's next test is allowed, as an ISO time, or null when it is allowed now. Throws on a failed read. */
export async function getTestSendRetryTimes(userId: string, now = new Date()) {
  const { data, error } = await getSupabaseServerClient()
    .from("notification_test_sends")
    .select("channel, sent_at")
    .eq("user_id", normalizeAddress(userId));
  if (error) throw new Error(`Failed to read the test message limit: ${error.message}`);

  const retryTimes = Object.fromEntries(NOTIFICATION_SERVICES.map(channel => [channel, null])) as Record<
    NotificationService,
    string | null
  >;
  for (const row of (data ?? []) as { channel: string; sent_at: string }[]) {
    const retryAt = Date.parse(row.sent_at) + COOLDOWN_SECONDS * 1000;
    if (Object.hasOwn(retryTimes, row.channel) && retryAt > now.getTime()) {
      retryTimes[row.channel as NotificationService] = new Date(retryAt).toISOString();
    }
  }
  return retryTimes;
}
