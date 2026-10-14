"use client";

import { type RefObject, useEffect, useRef } from "react";
import { type QueryClient, skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { getAccount } from "wagmi/actions";
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

const HANDSHAKE_QUERY_KEY = "telegramLinkHandshake";

/**
 * The wallet's pending handshake: null (or no data) when there is none. It is kept in the query cache, never fetched,
 * rather than in the card, because a chain switch or a positions refresh remounts the card and the new one must keep
 * waiting for the link.
 */
const handshakeQueryKey = (address: string) => [HANDSHAKE_QUERY_KEY, normalizeAddress(address)] as const;

/** Ends the wallet's handshake if it is still `expected`. True only for the one caller that ended it. */
const endHandshake = (queryClient: QueryClient, address: string, expected: PendingLink) => {
  const queryKey = handshakeQueryKey(address);
  if (queryClient.getQueryData(queryKey) !== expected) return false;
  queryClient.setQueryData(queryKey, null);
  return true;
};

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
 * in Telegram or the token expires. Every card of the wallet shares the handshake, and exactly one of them announces
 * how it ended. It ends silently once the wallet disconnects or another one connects.
 */
export const useTelegramLink = (address: string | undefined) => {
  const queryClient = useQueryClient();
  const wagmiConfig = useConfig();
  const owner = address ? normalizeAddress(address) : null;
  // A tab opened during the click and not yet pointed at the bot.
  const blankTab = useRef<Window | null>(null);

  const { data: pendingLink = null } = useQuery<PendingLink | null>({
    queryKey: handshakeQueryKey(address ?? ""),
    queryFn: skipToken,
    staleTime: Infinity,
  });

  const linkQuery = useQuery({
    queryKey: telegramLinkQueryKey(address ?? ""),
    queryFn: address ? () => telegramClient.getLinkStatus(address) : skipToken,
    refetchInterval: pendingLink ? TELEGRAM_LINK_POLL_INTERVAL_MS : false,
    // The user is in Telegram while we wait, so this tab is usually in the background.
    refetchIntervalInBackground: true,
    networkMode: NETWORK_MODE,
    // The card stays hidden until the first read settles, so a failure must show Retry at once instead of after
    // react-query's default retries with backoff (seconds, as on every Retry). Polls repeat on their own anyway.
    retry: false,
  });
  const link = linkQuery.data?.linked && linkQuery.data.chatId ? linkQuery.data : undefined;
  const isLinked = !!link;

  const linkToken = useMutation({
    mutationFn: (userId: string) => telegramClient.createLinkToken(userId),
    networkMode: NETWORK_MODE,
  });
  const resetLinkToken = linkToken.reset;

  const disconnectMutation = useMutation({
    mutationFn: (userId: string) => telegramClient.disconnect(userId),
    networkMode: NETWORK_MODE,
    onSuccess: (_, userId) => {
      queryClient.setQueryData<TelegramLinkStatus>(telegramLinkQueryKey(userId), { linked: false });
      notification.success("Telegram disconnected");
    },
    onError: error => notification.error(getErrorMessage(error, "Failed to disconnect Telegram")),
  });

  useEffect(() => {
    // A handshake belongs to the wallet that started it: once another wallet (or none) is connected it is over, and
    // it must not resume if that wallet comes back.
    queryClient.setQueriesData<PendingLink | null>(
      { queryKey: [HANDSHAKE_QUERY_KEY], predicate: ({ queryKey, state }) => queryKey[1] !== owner && !!state.data },
      null,
    );
    // On a wallet change or unmount, detach a token request still in flight so its callbacks never run, and close the
    // tab it would have used rather than leave it blank.
    return () => {
      resetLinkToken();
      closeBlankTab(blankTab);
      // The page drops every card when the wallet disconnects (and while a new wallet's positions load or fail to), so
      // no card may mount to end the handshake above. Read the live account instead: a remount for the same wallet,
      // such as a chain switch, keeps it.
      const connected = getAccount(wagmiConfig).address;
      if (owner && (!connected || normalizeAddress(connected) !== owner)) {
        queryClient.setQueryData(handshakeQueryKey(owner), null);
      }
    };
  }, [owner, queryClient, resetLinkToken, wagmiConfig]);

  const username = link?.username;
  useEffect(() => {
    // Every card of the wallet sees the link at once; only the one that ends the handshake announces it.
    if (!address || !pendingLink || !isLinked || !endHandshake(queryClient, address, pendingLink)) return;
    notification.success(username ? `Telegram connected as @${username}` : "Telegram connected");
  }, [address, pendingLink, isLinked, username, queryClient]);

  useEffect(() => {
    if (!address || !pendingLink) return;
    const timer = setTimeout(
      () => {
        if (endHandshake(queryClient, address, pendingLink)) notification.error("Telegram link timed out. Try again.");
      },
      Math.max(0, pendingLink.deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [address, pendingLink, queryClient]);

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
        queryClient.setQueryData<PendingLink | null>(handshakeQueryKey(address), {
          deepLink,
          deadline: Date.now() + handshakeTimeout(expiresInMs),
        });
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
    if (address) queryClient.setQueryData(handshakeQueryKey(address), null);
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
    /**
     * The status could not be read and nothing is known about it, so the wallet must not be shown as unlinked. A retry
     * puts a query without data back into "pending" (and clears its error), so past errors are counted to keep
     * reporting it, and the Retry UI on screen, until a read succeeds. A failed poll keeps the last status instead.
     */
    isStatusUnknown: !linkQuery.data && linkQuery.errorUpdateCount > 0,
    isCheckingStatus: linkQuery.isFetching,
    retryStatus: () => void linkQuery.refetch(),
    chatId: link?.chatId,
    username,
    /** The bot link while waiting for the user to press Start, for when the tab could not be opened. */
    deepLink: pendingLink?.deepLink,
    isConnecting: linkToken.isPending || pendingLink !== null,
    isDisconnecting: disconnectMutation.isPending,
    connect,
    cancelConnect,
    disconnect,
  };
};
