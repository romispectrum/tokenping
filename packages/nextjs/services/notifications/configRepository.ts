import type { PostgrestError } from "@supabase/supabase-js";
import "server-only";
import { type MarketId, type MarketRef, V3_MARKET_ID, isMarketId } from "~~/config/aaveConfig";
import { type MorphoProtocol, type Protocol, isMorphoMarketId, isProtocol, marketRefKey } from "~~/config/protocols";
import { DEFAULT_LOCALE, type Locale, isLocale } from "~~/i18n/locales";
import type { MorphoMarketParams } from "~~/services/morpho/types";
import type { ConfigValues } from "~~/services/notifications/configInput";
import { selectAllPages } from "~~/services/supabase/selectAllPages";
import { getSupabaseServerClient } from "~~/services/supabase/supabaseServer";
import type { ChannelLocales, NotificationConfig, NotificationService } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";
import { isNotificationService } from "~~/utils/notifications/validation";

export type NotificationConfigRow = {
  id: string;
  user_id: string;
  chain_id: number;
  /** 'aave', 'morpho-blue' or 'morpho-midnight' (checked by the database); absent before the protocol migration. */
  protocol?: string | null;
  /**
   * Aave: 'v3' or a V3 Pool's or V4 Spoke's lowercased address. Morpho: the lowercased market id (bytes32). Checked by
   * the database per protocol.
   */
  market?: string | null;
  /** Morpho only: the market's fixed parameters as JSON (services/morpho/storedParams.ts checks them). Null for Aave. */
  market_params?: unknown;
  enabled: boolean;
  services: string[] | null;
  /** numeric column: PostgREST may return it as a string */
  health_factor_threshold: number | string;
  email: string | null;
  signal_recipient: string | null;
  /** Lowercased, without "@" (checked by the database); absent before the telegram_usernames migration. */
  telegram_username?: string | null;
  /** 'en' or 'cs' (checked by the database); absent before the locale migration is applied. */
  locale?: string | null;
  /** Each channel's own language, 'en' or 'cs'; null (or absent before that migration) means `locale`. */
  email_locale?: string | null;
  signal_locale?: string | null;
  telegram_locale?: string | null;
  created_at: string;
  updated_at: string;
};

export type EnabledConfigRow = Pick<
  NotificationConfigRow,
  | "id"
  | "user_id"
  | "chain_id"
  | "protocol"
  | "market"
  | "market_params"
  | "health_factor_threshold"
  | "email"
  | "signal_recipient"
  | "telegram_username"
  | "services"
  | "locale"
  | "email_locale"
  | "signal_locale"
  | "telegram_locale"
>;

/** Rows written before services were validated can hold ids outside NotificationService. */
export type NotificationConfigResponse = Omit<NotificationConfig, "services"> & { services: string[] };

/** An Aave alert writes the columns it always has (protocol defaults to 'aave'); a Morpho one adds its own two. */
export type ConfigWriteRow = ReturnType<typeof toConfigRow> & {
  protocol?: MorphoProtocol;
  market_params?: MorphoMarketParams;
};

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

type ChannelLocaleColumns = Pick<
  NotificationConfigRow,
  "locale" | "email_locale" | "signal_locale" | "telegram_locale"
>;

const CHANNEL_LOCALE_COLUMNS = {
  email: "email_locale",
  signal: "signal_locale",
  telegram: "telegram_locale",
} as const satisfies Record<NotificationService, keyof ChannelLocaleColumns>;

/** The language `channel`'s alerts are sent in: its own, else the row's (English for rows from before both). */
export const rowChannelLocale = (row: ChannelLocaleColumns, channel: NotificationService): Locale => {
  const own = row[CHANNEL_LOCALE_COLUMNS[channel]];
  return isLocale(own) ? own : rowLocale(row);
};

/** The language each selected channel is sent in, so the form and the summary show what actually goes out. */
const rowChannelLocales = (row: ChannelLocaleColumns & Pick<NotificationConfigRow, "services">): ChannelLocales =>
  Object.fromEntries(
    (row.services ?? []).filter(isNotificationService).map(channel => [channel, rowChannelLocale(row, channel)]),
  );

/** The row's protocol: Aave for a row without one (every row before Morpho), null for one this code does not know. */
export const rowProtocol = (row: Pick<NotificationConfigRow, "protocol">): Protocol | null => {
  if (row.protocol == null) return "aave";
  return isProtocol(row.protocol) ? row.protocol : null;
};

/** An Aave row's market: V3 for anything that is not a market id (a row from before the column). */
export const rowMarket = (row: Pick<NotificationConfigRow, "market">): MarketId =>
  isMarketId(row.market) ? row.market : V3_MARKET_ID;

/**
 * The market a row's alert watches. An Aave ref carries no protocol, as before Morpho. Null for a Morpho row whose id
 * is not a Morpho market id and for a protocol this code does not know: read as Aave, it would watch another position.
 */
export const rowMarketRef = (
  row: Pick<NotificationConfigRow, "chain_id" | "protocol" | "market">,
): MarketRef | null => {
  const protocol = rowProtocol(row);
  if (protocol === "aave") return { chainId: row.chain_id, market: rowMarket(row) };
  return protocol && isMorphoMarketId(row.market) ? { protocol, chainId: row.chain_id, market: row.market } : null;
};

/** The key GET /api/notifications/config lists a row under (marketRefKey), or null for a row it cannot read. */
export const rowMarketKey = (row: Pick<NotificationConfigRow, "chain_id" | "protocol" | "market">) => {
  const ref = rowMarketRef(row);
  return ref && marketRefKey(ref);
};

/**
 * Optional fields map null to undefined so they are omitted from the JSON response; market, locale and
 * channelLocales are always present. `protocol` is present for Morpho only, so an Aave config reads as it always did.
 */
export const rowToConfig = (row: NotificationConfigRow): NotificationConfigResponse => {
  const protocol = rowProtocol(row);
  const morpho = protocol !== null && protocol !== "aave" ? protocol : undefined;
  return {
    chainId: row.chain_id,
    market: morpho ? String(row.market) : rowMarket(row),
    ...(morpho ? { protocol: morpho } : {}),
    enabled: row.enabled,
    services: row.services ?? [],
    healthFactorThreshold: parseFloat(String(row.health_factor_threshold)),
    email: row.email ?? undefined,
    signalRecipient: row.signal_recipient ?? undefined,
    telegramUsername: row.telegram_username ?? undefined,
    locale: rowLocale(row),
    channelLocales: rowChannelLocales(row),
  };
};

/** The columns every alert writes; a Morpho alert adds `protocol` and `market_params` (toMorphoConfigRow). */
export const toConfigRow = (uid: string, { chainId, market }: MarketRef, values: ConfigValues, now = new Date()) => ({
  user_id: uid,
  chain_id: chainId,
  market,
  enabled: values.enabled,
  services: values.services,
  health_factor_threshold: values.healthFactorThreshold,
  email: values.email,
  signal_recipient: values.signalRecipient,
  telegram_username: values.telegramUsername,
  locale: values.locale,
  email_locale: values.channelLocales.email,
  signal_locale: values.channelLocales.signal,
  telegram_locale: values.channelLocales.telegram,
  updated_at: now.toISOString(),
});

/**
 * A Morpho alert's row. `marketParams` is left out when undefined, so an update keeps the stored parameters; the
 * protocol is written every time, so the row can never pass for another protocol's.
 */
export const toMorphoConfigRow = (
  uid: string,
  ref: MarketRef & { protocol: MorphoProtocol },
  values: ConfigValues,
  marketParams: MorphoMarketParams | undefined,
  now = new Date(),
): ConfigWriteRow => ({
  ...toConfigRow(uid, ref, values, now),
  protocol: ref.protocol,
  ...(marketParams ? { market_params: marketParams } : {}),
});

const configsTable = () => getSupabaseServerClient().from("notification_configs");

/** Read helpers throw on a Supabase error, so a failed query is never mistaken for "no config". */
const dataOrThrow = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data;
};

/**
 * The legacy form is queried only when the lowercased one has no row for the market. Lookups by market alone are
 * exact: an Aave id ('v3' or 40 hex characters) never equals a Morpho one (64), and the unique key is (user, chain,
 * market).
 */
export async function findConfigForMarket(
  { normalized, legacy }: UserIdForms,
  { chainId, market }: MarketRef,
): Promise<NotificationConfigRow | null> {
  const select = async (userId: string) =>
    dataOrThrow(
      await configsTable()
        .select("*")
        .eq("user_id", userId)
        .eq("chain_id", chainId)
        .eq("market", market)
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
 * How many alerts one wallet can have, Aave and Morpho together. PUT already keeps a wallet to one alert per market
 * the app reads (44 Aave markets in October 2026, and the listed Morpho markets it borrows in), so this is a backstop:
 * rows nobody needs would only slow the cron for everyone.
 */
export const MAX_CONFIGS_PER_WALLET = 50;

export type SaveConfigResult = { status: "saved" } | { status: "limit" } | { status: "failed"; error: PostgrestError };

/**
 * Updates the market's existing row in place (preferring the lowercased row; updating a legacy row rewrites its
 * user_id to lowercase) or inserts one while the wallet has fewer than MAX_CONFIGS_PER_WALLET rows under either form.
 * Both lookups run when the forms differ. Stops at the first lookup, count or write error: a failed lookup must not
 * be mistaken for "no row", which would insert a duplicate. Two inserts at once can both pass the count, so the cap
 * can be passed by a few rows, never by more than the concurrent requests.
 */
export async function saveConfig({ normalized, legacy }: UserIdForms, row: ConfigWriteRow): Promise<SaveConfigResult> {
  const findId = (userId: string) =>
    configsTable()
      .select("id")
      .eq("user_id", userId)
      .eq("chain_id", row.chain_id)
      .eq("market", row.market)
      .maybeSingle<{ id: string }>();
  const done = ({ error }: { error: PostgrestError | null }): SaveConfigResult =>
    error ? { status: "failed", error } : { status: "saved" };

  const byNormalized = await findId(normalized);
  if (byNormalized.error) return { status: "failed", error: byNormalized.error };
  const byLegacy = legacy ? await findId(legacy) : { data: null, error: null };
  if (byLegacy.error) return { status: "failed", error: byLegacy.error };
  const existingId = byNormalized.data?.id ?? byLegacy.data?.id;
  if (existingId) return done(await configsTable().update(row).eq("id", existingId));

  const { count, error } = await configsTable()
    .select("id", { count: "exact", head: true })
    .in("user_id", legacy ? [normalized, legacy] : [normalized]);
  if (error) return { status: "failed", error };
  if ((count ?? 0) >= MAX_CONFIGS_PER_WALLET) return { status: "limit" };
  return done(await configsTable().insert(row));
}

/** Deletes the market's row under both user id forms, stopping at the first error. Returns that error, if any. */
export async function deleteConfigs({ normalized, legacy }: UserIdForms, { chainId, market }: MarketRef) {
  const remove = (userId: string) =>
    configsTable().delete().eq("user_id", userId).eq("chain_id", chainId).eq("market", market);

  const { error } = await remove(normalized);
  if (error || !legacy) return error;
  return (await remove(legacy)).error;
}

/** What the cron reads of each enabled config. One literal, so supabase-js can type the rows. */
const ENABLED_CONFIG_COLUMNS =
  "id, user_id, chain_id, protocol, market, market_params, health_factor_threshold, email, signal_recipient, telegram_username, services, locale, email_locale, signal_locale, telegram_locale";

/** Every enabled config, read page by page so rows past the PostgREST max_rows cap are not skipped. */
export const findEnabledConfigs = () =>
  selectAllPages<EnabledConfigRow>((from, to) =>
    configsTable().select(ENABLED_CONFIG_COLUMNS).eq("enabled", true).order("id").range(from, to),
  );
