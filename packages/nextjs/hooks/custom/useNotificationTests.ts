"use client";

import { useCallback, useEffect, useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { MarketRef } from "~~/config/aaveConfig";
import {
  type TestRetryTimes,
  TestSendError,
  notificationTestClient,
} from "~~/services/notifications/notificationTestClient";
import type { NotificationService } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";

const queryKey = (address: string) => ["notificationTestRetryTimes", normalizeAddress(address)] as const;

/** How often the cooldown labels move on ("again in 12 min"). */
const TICK_MS = 15_000;

/**
 * The "Send test" buttons' state for the connected wallet: when each channel can be used again, read from the
 * server (which enforces the limit) and updated by every send, so a reload or another tab never shows a stale
 * button. The clock ticks while any channel is cooling down, so its button turns back on by itself.
 */
export const useNotificationTests = () => {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  const query = useQuery({
    queryKey: queryKey(address ?? ""),
    queryFn: address ? () => notificationTestClient.getRetryTimes(address) : skipToken,
    networkMode: "always",
  });

  const retryAtFor = useCallback(
    (channel: NotificationService) => {
      const iso = query.data?.[channel];
      const time = iso ? Date.parse(iso) : NaN;
      return Number.isFinite(time) && time > now ? time : null;
    },
    [query.data, now],
  );

  const coolingDown = (["email", "signal", "telegram"] as const).some(channel => retryAtFor(channel) !== null);
  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [coolingDown]);

  const setRetryAt = (userId: string, channel: NotificationService, retryAt: string) =>
    queryClient.setQueryData<TestRetryTimes>(queryKey(userId), prev => ({
      email: null,
      signal: null,
      telegram: null,
      ...prev,
      [channel]: retryAt,
    }));

  const mutation = useMutation({
    mutationFn: ({ userId, ref, channel }: { userId: string; ref: MarketRef; channel: NotificationService }) =>
      notificationTestClient.send(userId, ref, channel),
    networkMode: "always",
    onSuccess: ({ retryAt }, { userId, channel }) => {
      setNow(Date.now());
      setRetryAt(userId, channel, retryAt);
    },
    // A refused send still tells when the channel frees up: the button shows it instead of failing again.
    onError: (error, { userId, channel }) => {
      if (!(error instanceof TestSendError && error.retryAt)) return;
      // The clock only ticks while something cools down, so after an idle spell it is stale: catch it up first.
      setNow(Date.now());
      setRetryAt(userId, channel, error.retryAt);
    },
  });

  const send = useCallback(
    async (ref: MarketRef, channel: NotificationService) => {
      if (!address) throw new Error("Wallet not connected");
      return mutation.mutateAsync({ userId: address, ref, channel });
    },
    [address, mutation],
  );

  return {
    retryAtFor,
    /** Milliseconds until `channel` can send again, or 0. */
    waitFor: (channel: NotificationService) => Math.max(0, (retryAtFor(channel) ?? now) - now),
    sendingChannel: mutation.isPending ? mutation.variables?.channel : undefined,
    send,
  };
};
