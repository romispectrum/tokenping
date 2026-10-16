import "server-only";
import { DEFAULT_LOCALE, isLocale } from "~~/i18n/locales";
import type { ConfigValues } from "~~/services/notifications/configInput";
import { selectAllPages } from "~~/services/supabase/selectAllPages";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import type { NotificationConfig } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

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
  /** 'en' or 'cs' (checked by the database); absent before the locale migration is applied. */
  locale?: string | null;
  created_at: string;
  updated_at: string;
};

export type EnabledConfigRow = Pick<
  NotificationConfigRow,
  "user_id" | "chain_id" | "health_factor_threshold" | "email" | "signal_recipient" | "services" | "locale"
>;

/** Rows written before services were validated can hold ids outside NotificationService. */
export type NotificationConfigResponse = Omit<NotificationConfig, "services"> & { services: string[] };

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

/** The row's alert language: English for anything that is not a supported locale (a row from before the column). */
export const rowLocale = (row: Pick<NotificationConfigRow, "locale">) =>
  isLocale(row.locale) ? row.locale : DEFAULT_LOCALE;

/** Optional fields map null to undefined so they are omitted from the JSON response; locale is always present. */
export const rowToConfig = (row: NotificationConfigRow): NotificationConfigResponse => ({
  chainId: row.chain_id,
  enabled: row.enabled,
  services: row.services ?? [],
  healthFactorThreshold: parseFloat(String(row.health_factor_threshold)),
  email: row.email ?? undefined,
  signalRecipient: row.signal_recipient ?? undefined,
  locale: rowLocale(row),
});

export const toConfigRow = (uid: string, chainId: number, values: ConfigValues, now = new Date()) => ({
  user_id: uid,
  chain_id: chainId,
  enabled: values.enabled,
  services: values.services,
  health_factor_threshold: values.healthFactorThreshold,
  email: values.email,
  signal_recipient: values.signalRecipient,
  locale: values.locale,
  updated_at: now.toISOString(),
});

const configsTable = () => getSupabaseServerClient().from("notification_configs");

/** Read helpers throw on a Supabase error, so a failed query is never mistaken for "no config". */
const dataOrThrow = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

/** The legacy form is queried only when the lowercased one has no row for the chain. */
export async function findConfigForChain(
  { normalized, legacy }: UserIdForms,
  chainId: number,
): Promise<NotificationConfigRow | null> {
  const select = async (userId: string) =>
    dataOrThrow(
      await configsTable()
        .select("*")
        .eq("user_id", userId)
        .eq("chain_id", chainId)
        .maybeSingle<NotificationConfigRow>(),
    );

  const row = await select(normalized);
  return row || !legacy ? row : select(legacy);
}

/** The legacy rows are used only when the lowercased query returns none. */
export async function findConfigsForUser({ normalized, legacy }: UserIdForms): Promise<NotificationConfigRow[]> {
  const select = async (userId: string): Promise<NotificationConfigRow[]> =>
    dataOrThrow(await configsTable().select("*").eq("user_id", userId)) ?? [];

  const rows = await select(normalized);
  return rows.length > 0 || !legacy ? rows : select(legacy);
}

/**
 * Updates the chain's existing row in place (preferring the lowercased row; updating a legacy row rewrites its
 * user_id to lowercase) or inserts one. Both lookups run when the forms differ. Returns the first lookup or write
 * error, if any: a failed lookup must not be mistaken for "no row", which would insert a duplicate.
 */
export async function saveConfig({ normalized, legacy }: UserIdForms, row: ConfigWriteRow) {
  const findId = (userId: string) =>
    configsTable().select("id").eq("user_id", userId).eq("chain_id", row.chain_id).maybeSingle<{ id: string }>();

  const byNormalized = await findId(normalized);
  if (byNormalized.error) return byNormalized.error;
  const byLegacy = legacy ? await findId(legacy) : { data: null, error: null };
  if (byLegacy.error) return byLegacy.error;
  const existingId = byNormalized.data?.id ?? byLegacy.data?.id;

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

/** Every enabled config, read page by page so rows past the PostgREST max_rows cap are not skipped. */
export const findEnabledConfigs = () =>
  selectAllPages<EnabledConfigRow>((from, to) =>
    configsTable()
      .select("user_id, chain_id, health_factor_threshold, email, signal_recipient, services, locale")
      .eq("enabled", true)
      .order("id")
      .range(from, to),
  );
