import "server-only";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";

// The reminders before a Morpho Midnight loan matures, kept in notification_maturity_reminders (migration
// 20261025000000): one row per alert, kind and maturity, so each reminder goes out once however often the cron runs.
// The row is written before the send; a send that reaches no channel gives it back, so the next run tries again.

export type MaturityReminderKind = "7d" | "1d";

const remindersTable = () => getSupabaseServerClient().from("notification_maturity_reminders");

const maturityTime = (maturity: number) => new Date(maturity * 1000).toISOString();

/**
 * Takes the `kind` reminder of this alert's loan maturing at `maturity` (unix seconds). Returns its sent_at as the
 * database wrote it, or null when another run already took it. Throws when the database call fails, so a reminder is
 * never sent without its row.
 */
export async function claimMaturityReminder(configId: string, kind: MaturityReminderKind, maturity: number) {
  const { data, error } = await remindersTable()
    .upsert(
      { config_id: configId, kind, maturity: maturityTime(maturity) },
      { onConflict: "config_id,kind,maturity", ignoreDuplicates: true },
    )
    .select("sent_at");
  if (error) throw new Error(`Failed to claim the maturity reminder: ${error.message}`);
  return ((data ?? []) as { sent_at: string }[])[0]?.sent_at ?? null;
}

/** Gives back a reminder no channel delivered; only the row this claim wrote goes (matched by its sent_at). */
export async function releaseMaturityReminder(
  configId: string,
  kind: MaturityReminderKind,
  maturity: number,
  sentAt: string,
) {
  const { error } = await remindersTable()
    .delete()
    .eq("config_id", configId)
    .eq("kind", kind)
    .eq("maturity", maturityTime(maturity))
    .eq("sent_at", sentAt);
  return error;
}
