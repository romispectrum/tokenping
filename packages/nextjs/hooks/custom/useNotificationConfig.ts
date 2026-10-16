"use client";

import { useCallback } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { useLocale } from "~~/i18n/LocaleProvider";
import { notificationConfigClient } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

type ConfigsByChain = Record<number, NotificationConfig>;

const notificationConfigsQueryKey = (address: string) => ["notificationConfigs", normalizeAddress(address)] as const;

const requireAddress = (address: string | undefined) => {
  if (!address) throw new Error("Wallet not connected");
  return address;
};

// The API body is not validated; rows saved before these columns existed come back with null.
const withFieldDefaults = (configs: ConfigsByChain): ConfigsByChain =>
  Object.fromEntries(
    Object.entries(configs).map(([chainId, config]) => [
      chainId,
      { ...config, services: config.services ?? [], signalRecipient: config.signalRecipient ?? undefined },
    ]),
  );

// Like plain fetch: fail straight away while the browser reports offline instead of pausing (react-query's default),
// which would leave the card hidden or the Save button stuck in its saving state until the connection returns.
const NETWORK_MODE = "always";

const removeChain = (configs: ConfigsByChain | undefined, chainId: number) => {
  if (!configs) return configs;
  const next = { ...configs };
  delete next[chainId];
  return next;
};

/**
 * The connected wallet's notification configs by chain, in the react-query cache so every component (the positions
 * list and each chain's settings card) sees the same data. Writes go to the cache of the wallet that made them.
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
    update: (prev: ConfigsByChain | undefined) => ConfigsByChain | undefined,
  ) => {
    const queryKey = notificationConfigsQueryKey(userId);
    await queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData<ConfigsByChain>(queryKey, update);
  };

  // The server only trims, normalizes and clamps what the settings form already sends normalized, so a write goes
  // into the cache as sent rather than triggering a reload.
  const { mutateAsync: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: ({ userId, config }: { userId: string; config: NotificationConfig }) =>
      notificationConfigClient.upsertConfig(userId, config),
    networkMode: NETWORK_MODE,
    onSuccess: (_, { userId, config }) => applyWrite(userId, prev => ({ ...prev, [config.chainId]: config })),
  });

  const { mutateAsync: removeConfig, isPending: isDeleting } = useMutation({
    mutationFn: ({ userId, chainId }: { userId: string; chainId: number }) =>
      notificationConfigClient.deleteConfig(userId, chainId),
    networkMode: NETWORK_MODE,
    onSuccess: (_, { userId, chainId }) => applyWrite(userId, prev => removeChain(prev, chainId)),
  });

  const updateConfig = useCallback(
    async (chainId: number, updates: Partial<NotificationConfig>) => {
      const userId = requireAddress(address);
      const saved = queryClient.getQueryData<ConfigsByChain>(notificationConfigsQueryKey(userId))?.[chainId];
      const config: NotificationConfig = {
        ...(saved ?? { chainId, enabled: false, services: [], healthFactorThreshold: DEFAULT_HEALTH_FACTOR_THRESHOLD }),
        // Alerts are sent in the language of the page the config was last saved from.
        locale,
        ...updates,
        chainId, // always the position's chain (Aave network), never the wallet's connected chain
      };
      await saveConfig({ userId, config });
    },
    [address, locale, queryClient, saveConfig],
  );

  const deleteConfig = useCallback(
    async (chainId: number) => {
      await removeConfig({ userId: requireAddress(address), chainId });
    },
    [address, removeConfig],
  );

  const getConfig = useCallback((chainId: number) => configs?.[chainId] ?? null, [configs]);
  const hasConfig = useCallback((chainId: number) => !!configs && chainId in configs, [configs]);

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
