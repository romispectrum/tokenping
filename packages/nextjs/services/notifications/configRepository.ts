import "server-only";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import type { UserTelegramLink } from "~~/services/telegram/telegramLinks";
import type { NotificationConfig } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";
import { normalizeSignalUsername } from "~~/utils/notifications/validation";

export type NotificationConfigRow = {
  id: string;
  user_id: string;
  chain_id: number;
  enabled: boolean;
  services: string[] | null;
  /** numeric column: PostgREST may return it as a string */
  health_factor_threshold: number | string;
  email: string | null;
  signal_recipient: string | null;
  created_at: string;
  updated_at: string;
};

export type EnabledConfigRow = Pick<
  NotificationConfigRow,
  "user_id" | "chain_id" | "health_factor_threshold" | "email" | "signal_recipient" | "services"
>;

/** Services are not validated on write, so stored rows can hold ids outside NotificationService. */
export type NotificationConfigResponse = Omit<NotificationConfig, "services"> & { services: string[] };

/** The PUT body fields that make up a stored config. Unvalidated: any JSON value can arrive in each. */
export type ConfigInput = {
  enabled?: unknown;
  services?: unknown;
  healthFactorThreshold?: unknown;
  email?: unknown;
  signalRecipient?: unknown;
};

type ConfigWriteRow = ReturnType<typeof toConfigRow>;

/**
 * New rows store the lowercased address, but legacy rows may still hold the trimmed, often checksummed form, so
 * lookups try `normalized` first and then `legacy` (set only when the two differ).
 */
export const userIdForms = (userId: string) => {
  const trimmed = userId.trim();
  const normalized = normalizeAddress(userId);
  return { normalized, legacy: trimmed === normalized ? undefined : trimmed };
};

export type UserIdForms = ReturnType<typeof userIdForms>;

/** Optional fields map null to undefined so they are omitted from the JSON response. */
export const rowToConfig = (
  row: NotificationConfigRow,
  telegramLink: UserTelegramLink | null,
): NotificationConfigResponse => ({
  chainId: row.chain_id,
  enabled: row.enabled,
  services: row.services ?? [],
  healthFactorThreshold: parseFloat(String(row.health_factor_threshold)),
  email: row.email ?? undefined,
  signalRecipient: row.signal_recipient ?? undefined,
  telegramChatId: telegramLink?.chatId,
  telegramUsername: telegramLink?.username ?? undefined,
});

/**
 * Defaults: enabled, no services, the default threshold; blank email / Signal username are stored as null.
 * Other values are stored as sent (a string threshold stays a string), and email / Signal username are stringified.
 */
export const toConfigRow = (uid: string, chainId: number, input: ConfigInput, now = new Date()) => ({
  user_id: uid,
  chain_id: chainId,
  enabled: input.enabled ?? true,
  services: Array.isArray(input.services) ? input.services : [],
  health_factor_threshold: input.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD,
  email: input.email == null ? null : String(input.email).trim() || null,
  signal_recipient:
    input.signalRecipient == null ? null : normalizeSignalUsername(String(input.signalRecipient)) || null,
  updated_at: now.toISOString(),
});

const configsTable = () => getSupabaseServerClient().from("notification_configs");

/** BUG(B3.2): `.single()` also errors on zero rows, so a failed query is indistinguishable from "no config". */
export async function findConfigForChain(
  { normalized, legacy }: UserIdForms,
  chainId: number,
): Promise<NotificationConfigRow | null> {
  const select = (userId: string) =>
    configsTable().select("*").eq("user_id", userId).eq("chain_id", chainId).single<NotificationConfigRow>();

  let result = await select(normalized);
  if ((result.error || !result.data) && legacy) result = await select(legacy);
  return result.error || !result.data ? null : result.data;
}

/**
 * The legacy rows are used only when the lowercased query returns none and the legacy query returns some.
 * A failed query yields no rows.
 */
export async function findConfigsForUser({ normalized, legacy }: UserIdForms): Promise<NotificationConfigRow[]> {
  let result = await configsTable().select("*").eq("user_id", normalized);
  if ((result.error || !result.data?.length) && legacy) {
    const fallback = await configsTable().select("*").eq("user_id", legacy);
    if (fallback.data?.length) result = fallback;
  }
  return result.error || !result.data ? [] : result.data;
}

/**
 * Updates the chain's existing row in place (preferring the lowercased row; updating a legacy row rewrites its
 * user_id to lowercase) or inserts one. Both lookups run when the forms differ and their errors are ignored.
 * Returns the write error, if any.
 */
export async function saveConfig({ normalized, legacy }: UserIdForms, row: ConfigWriteRow) {
  const findId = (userId: string) =>
    configsTable().select("id").eq("user_id", userId).eq("chain_id", row.chain_id).maybeSingle<{ id: string }>();

  const { data: byNormalized } = await findId(normalized);
  const { data: byLegacy } = legacy ? await findId(legacy) : { data: null };
  const existingId = byNormalized?.id ?? byLegacy?.id;

  const { error } = existingId
    ? await configsTable().update(row).eq("id", existingId)
    : await configsTable().insert(row);
  return error;
}

/** Deletes the chain's row under both user id forms, stopping at the first error. Returns that error, if any. */
export async function deleteConfigs({ normalized, legacy }: UserIdForms, chainId: number) {
  const remove = (userId: string) => configsTable().delete().eq("user_id", userId).eq("chain_id", chainId);

  const { error } = await remove(normalized);
  if (error || !legacy) return error;
  return (await remove(legacy)).error;
}

/** BUG(B3.7): unpaginated, so rows beyond PostgREST max_rows are silently skipped. */
export async function findEnabledConfigs(): Promise<{
  data: EnabledConfigRow[] | null;
  error: { message: string } | null;
}> {
  return configsTable()
    .select("user_id, chain_id, health_factor_threshold, email, signal_recipient, services")
    .eq("enabled", true);
}
