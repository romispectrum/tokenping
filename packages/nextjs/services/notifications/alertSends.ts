import "server-only";
import { ALERT_REPEAT_MINUTES } from "~~/constants/notifications";
import { selectAllPages } from "~~/services/supabase/selectAllPages";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import type { NotificationService } from "~~/types/notifications";

// When each alert last reached each channel (notification_alert_sends, migration 20261106000000), so a position that
// stays below its threshold gets a message every ALERT_REPEAT_MINUTES instead of on every check. These are safety
// alerts, so a failure here never holds one back: without the times, the run sends as it would without a limit.

type AlertSendRow = { config_id: string; channel: NotificationService; sent_at: string };

/** Each alert's last send per channel, in epoch ms. */
export type LastAlertSends = Map<string, Map<NotificationService, number>>;

/** One minute short of the limit: cron runs start a few seconds apart, and a send must not wait for the next check. */
const REPEAT_AFTER_MS = (ALERT_REPEAT_MINUTES - 1) * 60_000;

const sendsTable = () => getSupabaseServerClient().from("notification_alert_sends");

export async function getLastAlertSends(): Promise<{ lastSends: LastAlertSends; error: { message: string } | null }> {
  const { data, error } = await selectAllPages<AlertSendRow>((from, to) =>
    sendsTable().select("config_id, channel, sent_at").order("config_id").order("channel").range(from, to),
  );
  const lastSends: LastAlertSends = new Map();
  for (const { config_id: configId, channel, sent_at: sentAt } of data ?? []) {
    lastSends.set(configId, (lastSends.get(configId) ?? new Map()).set(channel, new Date(sentAt).getTime()));
  }
  return { lastSends, error };
}

/** Whether `channel` of this alert may get another message at `now`. */
export const isAlertDue = (lastSends: LastAlertSends, configId: string, channel: NotificationService, now: number) => {
  const last = lastSends.get(configId)?.get(channel);
  return last === undefined || now - last >= REPEAT_AFTER_MS;
};

/** Remembers the channels this alert just reached. Returns the Supabase error, if any. */
export async function recordAlertSends(configId: string, channels: readonly NotificationService[], sentAt: Date) {
  const { error } = await sendsTable().upsert(
    channels.map(channel => ({ config_id: configId, channel, sent_at: sentAt.toISOString() })),
    { onConflict: "config_id,channel" },
  );
  return error;
}

/** The position recovered: its next dip alerts at once. Returns the Supabase error, if any. */
export async function clearAlertSends(configId: string) {
  const { error } = await sendsTable().delete().eq("config_id", configId);
  return error;
}
