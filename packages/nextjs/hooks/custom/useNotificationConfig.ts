"use client";

import { useCallback } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { type MarketRef, V3_MARKET_ID, marketKey } from "~~/config/aaveConfig";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { useLocale } from "~~/i18n/LocaleProvider";
import { notificationConfigClient } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

/** Keyed by marketKey(chainId, market), as GET /api/notifications/config returns them. */
type ConfigsByMarket = Record<string, NotificationConfig>;

const refKey = ({ chainId, market }: MarketRef) => marketKey(chainId, market);

const notificationConfigsQueryKey = (address: string) => ["notificationConfigs", normalizeAddress(address)] as const;

const requireAddress = (address: string | undefined) => {
  if (!address) throw new Error("Wallet not connected");
  return address;
};

// The API body is not validated; rows saved before these columns existed come back with null.
const withFieldDefaults = (configs: ConfigsByMarket): ConfigsByMarket =>
  Object.fromEntries(
    Object.entries(configs).map(([key, config]) => [
      key,
      {
        ...config,
        market: config.market ?? V3_MARKET_ID,
        services: config.services ?? [],
        signalRecipient: config.signalRecipient ?? undefined,
      },
    ]),
  );

// Like plain fetch: fail straight away while the browser reports offline instead of pausing (react-query's default),
// which would leave the card hidden or the Save button stuck in its saving state until the connection returns.
const NETWORK_MODE = "always";

const removeMarket = (configs: ConfigsByMarket | undefined, ref: MarketRef) => {
  if (!configs) return configs;
  const next = { ...configs };
  delete next[refKey(ref)];
  return next;
};

/**
 * The connected wallet's notification configs by market (a chain's V3 Pool or a V4 Spoke), in the react-query cache
 * so every component (the market list and each market's settings card) sees the same data. Writes go to the cache of
 * the wallet that made them.
 */
export const useNotificationConfig = () => {
  const { address } = useAccount();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationConfigsQueryKey(address ?? ""),
    queryFn: address ? () => notificationConfigClient.getAllConfigs(address) : skipToken,
    select: withFieldDefaults,
    networkMode: NETWORK_MODE,
  });
  const configs = query.data;

  /**
   * Applies a successful write to the wallet's cached configs. A load still in flight may have read the configs
   * before the write reached the server, and would overwrite this when it lands, so it is cancelled first (the
   * cache keeps the data it had before that load).
   */
  const applyWrite = async (
    userId: string,
    update: (prev: ConfigsByMarket | undefined) => ConfigsByMarket | undefined,
  ) => {
    const queryKey = notificationConfigsQueryKey(userId);
    await queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData<ConfigsByMarket>(queryKey, update);
  };

  // The server only trims, normalizes and clamps what the settings form already sends normalized, so a write goes
  // into the cache as sent rather than triggering a reload.
  const { mutateAsync: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: ({ userId, config }: { userId: string; config: NotificationConfig }) =>
      notificationConfigClient.upsertConfig(userId, config),
    networkMode: NETWORK_MODE,
    onSuccess: (_, { userId, config }) =>
      applyWrite(userId, prev => ({
        ...prev,
        [refKey({ chainId: config.chainId, market: config.market ?? V3_MARKET_ID })]: config,
      })),
  });

  const { mutateAsync: removeConfig, isPending: isDeleting } = useMutation({
    mutationFn: ({ userId, ref }: { userId: string; ref: MarketRef }) =>
      notificationConfigClient.deleteConfig(userId, ref),
    networkMode: NETWORK_MODE,
    onSuccess: (_, { userId, ref }) => applyWrite(userId, prev => removeMarket(prev, ref)),
  });

  const updateConfig = useCallback(
    async (ref: MarketRef, updates: Partial<NotificationConfig>) => {
      const userId = requireAddress(address);
      const saved = queryClient.getQueryData<ConfigsByMarket>(notificationConfigsQueryKey(userId))?.[refKey(ref)];
      const config: NotificationConfig = {
        ...(saved ?? { enabled: false, services: [], healthFactorThreshold: DEFAULT_HEALTH_FACTOR_THRESHOLD }),
        // Alerts are sent in the language of the page the config was last saved from.
        locale,
        ...updates,
        // Always the position's market, never the wallet's connected chain.
        chainId: ref.chainId,
        market: ref.market,
      };
      await saveConfig({ userId, config });
    },
    [address, locale, queryClient, saveConfig],
  );

  const deleteConfig = useCallback(
    async (ref: MarketRef) => {
      await removeConfig({ userId: requireAddress(address), ref });
    },
    [address, removeConfig],
  );

  const getConfig = useCallback((ref: MarketRef) => configs?.[refKey(ref)] ?? null, [configs]);
  const hasConfig = useCallback((ref: MarketRef) => !!configs && refKey(ref) in configs, [configs]);

  return {
    /**
     * False until the connected wallet's configs have been fetched once (or failed); true without a wallet. Unlike
     * `!isPending`, a retry after a failure does not make it false again.
     */
    isLoaded: !address || query.isFetched,
    // A retry puts a query without data back into "pending" (and clears its error), so count past errors to keep
    // reporting the failure, and the Retry UI on screen, until a load succeeds. A failed background refetch keeps
    // the last data instead.
    isError: !configs && query.errorUpdateCount > 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
    isSaving,
    isDeleting,
    getConfig,
    updateConfig,
    deleteConfig,
    hasConfig,
  };
};
