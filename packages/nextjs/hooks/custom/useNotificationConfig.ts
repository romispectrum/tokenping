"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { normalizeWalletAddress, notificationConfigsService } from "~~/services/supabase/notificationConfigs";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";

export type { NotificationConfig, NotificationService };

export const useNotificationConfig = () => {
  const { address } = useAccount();
  const addressRef = useRef(address);
  addressRef.current = address;

  const [configs, setConfigs] = useState<Record<number, NotificationConfig>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch configs by normalized user_id; only apply if connected wallet still matches
  useEffect(() => {
    if (!address) {
      setConfigs({});
      setIsLoaded(true);
      return;
    }

    const requestedUid = normalizeWalletAddress(address);

    const loadConfigs = async () => {
      setIsLoading(true);
      try {
        const allConfigs = await notificationConfigsService.getAllConfigs(address);
        const currentUid = addressRef.current ? normalizeWalletAddress(addressRef.current) : "";
        if (currentUid === requestedUid) {
          setConfigs(allConfigs);
        }
      } catch (error) {
        console.error("Failed to load notification configs:", error);
        if (addressRef.current && normalizeWalletAddress(addressRef.current) === requestedUid) {
          setConfigs({});
        }
      } finally {
        if (addressRef.current && normalizeWalletAddress(addressRef.current) === requestedUid) {
          setIsLoaded(true);
        }
        setIsLoading(false);
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
        phone: config.phone ?? undefined,
      };
    },
    [configs],
  );

  const setConfig = useCallback(
    async (chainId: number, config: NotificationConfig) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        await notificationConfigsService.upsertConfig(address, config);
        setConfigs(prev => ({
          ...prev,
          [chainId]: config,
        }));
      } catch (error) {
        console.error("Failed to save notification config:", error);
        throw error;
      }
    },
    [address],
  );

  const updateConfig = useCallback(
    async (chainId: number, updates: Partial<NotificationConfig>) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      const currentConfig = configs[chainId] || {
        chainId,
        enabled: false,
        services: [],
        healthFactorThreshold: DEFAULT_HEALTH_FACTOR_THRESHOLD,
      };

      const updatedConfig: NotificationConfig = {
        ...currentConfig,
        ...updates,
        chainId, // always use position chain (Aave network), never wallet's connected chain
      };

      try {
        await notificationConfigsService.upsertConfig(address, updatedConfig);
        setConfigs(prev => ({
          ...prev,
          [chainId]: updatedConfig,
        }));
      } catch (error) {
        console.error("Failed to update notification config:", error);
        throw error;
      }
    },
    [address, configs],
  );

  const deleteConfig = useCallback(
    async (chainId: number) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        await notificationConfigsService.deleteConfig(address, chainId);
        setConfigs(prev => {
          const next = { ...prev };
          delete next[chainId];
          return next;
        });
      } catch (error) {
        console.error("Failed to delete notification config:", error);
        throw error;
      }
    },
    [address],
  );

  const hasConfig = useCallback(
    (chainId: number): boolean => {
      return chainId in configs;
    },
    [configs],
  );

  return {
    configs,
    isLoaded,
    isLoading,
    getConfig,
    setConfig,
    updateConfig,
    deleteConfig,
    hasConfig,
  };
};
