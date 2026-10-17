"use client";

import { useEffect, useRef } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { TELEGRAM_STATUS_POLL_INTERVAL_MS, TELEGRAM_STATUS_POLL_TIMEOUT_MS } from "~~/constants/notifications";
import { telegramClient } from "~~/services/telegram/telegramClient";
import { isValidTelegramUsername, normalizeTelegramUsername } from "~~/utils/notifications/validation";

/** How long typing has to pause before the username is checked. */
const TYPING_PAUSE_MS = 400;

export type TelegramUsernameLinkStatus =
  /** Nothing to check: empty or not a valid username (the form's own error says why on Save). */
  | "idle"
  | "checking"
  | "linked"
  /** Valid, but it has not pressed Start in the bot yet. */
  | "notLinked"
  /** The check failed: saving still works, the status is just not known. */
  | "unknown";

/**
 * Whether the Telegram username in `rawUsername` has pressed Start in the bot, checked once typing pauses. With
 * `poll`, a username that has not pressed Start is asked about again every few seconds for a few minutes, so the form
 * turns to "linked" while the person is in Telegram; every status is also re-read when the tab gets focus back.
 */
export const useTelegramUsernameStatus = (rawUsername: string, { poll = false }: { poll?: boolean } = {}) => {
  const username = isValidTelegramUsername(rawUsername) ? normalizeTelegramUsername(rawUsername) : null;
  const [checked] = useDebounceValue(username, TYPING_PAUSE_MS);

  // When the current username started being checked, so polling stops after a while instead of running forever.
  const checkingSince = useRef(Date.now());
  useEffect(() => {
    checkingSince.current = Date.now();
  }, [checked]);

  const query = useQuery({
    queryKey: ["telegramUsernameStatus", checked],
    queryFn: checked ? () => telegramClient.getUsernameStatus(checked) : skipToken,
    // Like plain fetch: fail at once while offline instead of pausing with the status stuck on "checking".
    networkMode: "always",
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: ({ state }) =>
      poll && state.data?.linked === false && Date.now() - checkingSince.current < TELEGRAM_STATUS_POLL_TIMEOUT_MS
        ? TELEGRAM_STATUS_POLL_INTERVAL_MS
        : false,
  });

  let status: TelegramUsernameLinkStatus;
  if (!username) status = "idle";
  // Still typing (the check is for an older value), or the first answer for this username is on its way.
  else if (username !== checked || query.isPending) status = "checking";
  else if (query.isError) status = "unknown";
  else status = query.data?.linked ? "linked" : "notLinked";

  return { username, status };
};
