"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { notificationConfigClient } from "~~/services/notifications/notificationConfigClient";
import type { NotificationConfig } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

const requireAddress = (address: string | undefined) => {
  if (!address) throw new Error("Wallet not connected");
  return address;
};

export const useNotificationConfig = () => {
  const { address } = useAccount();
  const addressRef = useRef(address);
  addressRef.current = address;

  const [configs, setConfigs] = useState<Record<number, NotificationConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Ignore the response if the connected wallet changed while the request was in flight.
  useEffect(() => {
    if (!address) {
      setConfigs({});
      setIsLoaded(true);
      return;
    }

    const requestedUid = normalizeAddress(address);
    const isRequestedWallet = () => !!addressRef.current && normalizeAddress(addressRef.current) === requestedUid;

    const loadConfigs = async () => {
      try {
        const allConfigs = await notificationConfigClient.getAllConfigs(address);
        if (isRequestedWallet()) setConfigs(allConfigs);
      } catch (error) {
        console.error("Failed to load notification configs:", error);
        if (isRequestedWallet()) setConfigs({});
      } finally {
        if (isRequestedWallet()) setIsLoaded(true);
      }
    };

    loadConfigs();
  }, [address]);

  const getConfig = useCallback(
    (chainId: number): NotificationConfig | null => {
      const config = configs[chainId];
      if (!config) return null;
      // Ensure services field exists (migration safety)
      return {
        ...config,
        services: config.services ?? [],
        signalRecipient: config.signalRecipient ?? undefined,
      };
    },
    [configs],
  );

  const updateConfig = useCallback(
    async (chainId: number, updates: Partial<NotificationConfig>) => {
      const userId = requireAddress(address);
      const updatedConfig: NotificationConfig = {
        ...(configs[chainId] || {
          chainId,
          enabled: false,
          services: [],
          healthFactorThreshold: DEFAULT_HEALTH_FACTOR_THRESHOLD,
        }),
        ...updates,
        chainId, // always use position chain (Aave network), never wallet's connected chain
      };

      await notificationConfigClient.upsertConfig(userId, updatedConfig);
      setConfigs(prev => ({ ...prev, [chainId]: updatedConfig }));
    },
    [address, configs],
  );

  const deleteConfig = useCallback(
    async (chainId: number) => {
      await notificationConfigClient.deleteConfig(requireAddress(address), chainId);
      setConfigs(prev => {
        const next = { ...prev };
        delete next[chainId];
        return next;
      });
    },
    [address],
  );

  const hasConfig = useCallback((chainId: number) => chainId in configs, [configs]);

  return { isLoaded, getConfig, updateConfig, deleteConfig, hasConfig };
};
