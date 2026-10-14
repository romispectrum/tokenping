"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TELEGRAM_LINK_POLL_INTERVAL_MS, TELEGRAM_LINK_POLL_TIMEOUT_MS } from "~~/constants/notifications";
import { telegramClient } from "~~/services/telegram/telegramClient";
import type { TelegramLinkStatus } from "~~/types/notifications";
import { normalizeAddress } from "~~/utils/address";
import { getErrorMessage } from "~~/utils/errors";
import { notification } from "~~/utils/scaffold-eth";

// Like plain fetch: fail straight away while the browser reports offline instead of pausing (react-query's default),
// which would leave Connect with a blank tab open until the connection returns.
const NETWORK_MODE = "always";

type PendingLink = {
  deepLink: string;
  /** When to stop waiting, by this device's clock: once the bot no longer accepts the link token. */
  deadline: number;
};

const telegramLinkQueryKey = (address: string) => ["telegramLink", normalizeAddress(address)] as const;

/** The link token's lifetime, or the fallback window when the server's clock could not be read. */
const handshakeTimeout = (expiresInMs: number | null) =>
  expiresInMs !== null && expiresInMs > 0 ? expiresInMs : TELEGRAM_LINK_POLL_TIMEOUT_MS;

const closeBlankTab = (tab: RefObject<Window | null>) => {
  tab.current?.close();
  tab.current = null;
};

/**
 * The wallet's Telegram link (one chat per wallet, shared by every chain's config) plus the "Connect Telegram"
 * handshake: create a link token, open the bot's deep link, then poll the link endpoint until the user presses Start
 * in Telegram or the token expires.
 */
export const useTelegramLink = (address: string | undefined) => {
  const queryClient = useQueryClient();
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  // A tab opened during the click and not yet pointed at the bot.
  const blankTab = useRef<Window | null>(null);

  const linkQuery = useQuery({
    queryKey: telegramLinkQueryKey(address ?? ""),
    queryFn: address ? () => telegramClient.getLinkStatus(address) : skipToken,
    refetchInterval: pendingLink ? TELEGRAM_LINK_POLL_INTERVAL_MS : false,
    // The user is in Telegram while we wait, so this tab is usually in the background.
    refetchIntervalInBackground: true,
    networkMode: NETWORK_MODE,
  });
  const link = linkQuery.data?.linked && linkQuery.data.chatId ? linkQuery.data : undefined;
  const isLinked = !!link;

  const linkToken = useMutation({
    mutationFn: (userId: string) => telegramClient.createLinkToken(userId),
    networkMode: NETWORK_MODE,
  });

  const disconnectMutation = useMutation({
    mutationFn: (userId: string) => telegramClient.disconnect(userId),
    networkMode: NETWORK_MODE,
    onSuccess: (_, userId) => {
      queryClient.setQueryData<TelegramLinkStatus>(telegramLinkQueryKey(userId), { linked: false });
      notification.success("Telegram disconnected");
    },
    onError: error => notification.error(getErrorMessage(error, "Failed to disconnect Telegram")),
  });

  // A token that arrives after unmount is never applied to the tab, so do not leave it blank.
  useEffect(() => () => closeBlankTab(blankTab), []);

  useEffect(() => {
    if (!pendingLink || !isLinked) return;
    setPendingLink(null);
    notification.success(link.username ? `Telegram connected as @${link.username}` : "Telegram connected");
  }, [pendingLink, isLinked, link?.username]);

  useEffect(() => {
    if (!pendingLink) return;
    const timer = setTimeout(
      () => {
        setPendingLink(null);
        notification.error("Telegram link timed out. Try again.");
      },
      Math.max(0, pendingLink.deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [pendingLink]);

  const connect = () => {
    if (!address) {
      notification.error("Connect your wallet first");
      return;
    }
    // Popup blockers only allow window.open during the click, so open the tab now and navigate it once the token
    // arrives. If it is blocked anyway, the deep link is also rendered as a link.
    blankTab.current = window.open("", "_blank");
    linkToken.mutate(address, {
      onSuccess: ({ deepLink, expiresInMs }) => {
        const tab = blankTab.current;
        blankTab.current = null;
        if (tab) {
          tab.opener = null;
          tab.location.href = deepLink;
        }
        setPendingLink({ deepLink, deadline: Date.now() + handshakeTimeout(expiresInMs) });
      },
      onError: error => {
        closeBlankTab(blankTab);
        notification.error(getErrorMessage(error, "Failed to connect Telegram"));
      },
    });
  };

  const cancelConnect = () => {
    // Detaches this component from a token request still in flight, so its callbacks above never run.
    linkToken.reset();
    closeBlankTab(blankTab);
    setPendingLink(null);
  };

  const disconnect = () => {
    if (address) disconnectMutation.mutate(address);
  };

  return {
    /**
     * False until the wallet's link status has been fetched once (or failed); true without a wallet. Unlike
     * `!isPending`, a refetch after a failure does not make it false again.
     */
    isLoaded: !address || linkQuery.isFetched,
    chatId: link?.chatId,
    username: link?.username,
    /** The bot link while waiting for the user to press Start, for when the tab could not be opened. */
    deepLink: pendingLink?.deepLink,
    isConnecting: linkToken.isPending || pendingLink !== null,
    isDisconnecting: disconnectMutation.isPending,
    connect,
    cancelConnect,
    disconnect,
  };
};
