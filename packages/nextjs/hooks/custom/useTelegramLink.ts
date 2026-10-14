"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TELEGRAM_LINK_POLL_INTERVAL_MS, TELEGRAM_LINK_POLL_TIMEOUT_MS } from "~~/constants/notifications";
import { telegramClient } from "~~/services/telegram/telegramClient";
import { getErrorMessage } from "~~/utils/errors";
import { notification } from "~~/utils/scaffold-eth";

/**
 * Telegram link state plus the "Connect Telegram" handshake: create a link token, open the bot's deep link, then poll
 * the link endpoint until the user presses Start in Telegram. The link is per user (user_telegram_links), so callers
 * also hydrate it from the config API through `setLink`.
 */
export const useTelegramLink = (address: string | undefined) => {
  const [chatId, setChatId] = useState<string>();
  const [username, setUsername] = useState<string | null>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPollTimer = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Stop polling on unmount.
  useEffect(() => clearPollTimer, [clearPollTimer]);

  const setLink = useCallback((nextChatId: string | undefined, nextUsername: string | null | undefined) => {
    setChatId(nextChatId);
    setUsername(nextUsername);
  }, []);

  const stopPolling = useCallback(() => {
    clearPollTimer();
    setIsConnecting(false);
  }, [clearPollTimer]);

  const connect = useCallback(async () => {
    if (!address) {
      notification.error("Connect your wallet first");
      return;
    }
    setIsConnecting(true);
    try {
      const { deepLink } = await telegramClient.createLinkToken(address);
      // Opens the Telegram app on mobile.
      window.open(deepLink, "_blank", "noopener,noreferrer");

      const deadline = Date.now() + TELEGRAM_LINK_POLL_TIMEOUT_MS;
      clearPollTimer();
      pollTimer.current = setInterval(async () => {
        if (Date.now() > deadline) {
          stopPolling();
          notification.error("Telegram link timed out. Try again.");
          return;
        }
        try {
          const status = await telegramClient.getLinkStatus(address);
          if (status.linked && status.chatId) {
            setLink(status.chatId, status.username ?? null);
            stopPolling();
            notification.success(status.username ? `Telegram connected as @${status.username}` : "Telegram connected");
          }
        } catch {
          // Network blip: keep polling until the deadline.
        }
      }, TELEGRAM_LINK_POLL_INTERVAL_MS);
    } catch (e) {
      setIsConnecting(false);
      notification.error(getErrorMessage(e, "Failed to connect Telegram"));
    }
  }, [address, clearPollTimer, setLink, stopPolling]);

  const disconnect = useCallback(async () => {
    if (!address) return;
    setIsDisconnecting(true);
    try {
      await telegramClient.disconnect(address);
      setLink(undefined, undefined);
      notification.success("Telegram disconnected");
    } catch (e) {
      notification.error(getErrorMessage(e, "Failed to disconnect Telegram"));
    } finally {
      setIsDisconnecting(false);
    }
  }, [address, setLink]);

  return { chatId, username, setLink, isConnecting, isDisconnecting, connect, stopPolling, disconnect };
};
