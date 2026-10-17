import { apiUrl, readApiError } from "~~/services/api/apiClient";
import type { TelegramUsernameStatus } from "~~/types/notifications";

/** Browser client for /api/telegram/status: whether a Telegram username has pressed Start in the bot. */
export const telegramClient = {
  /** `username` is already normalized (lowercased, no "@"). Any non-2xx throws: the status is unknown, not "no". */
  async getUsernameStatus(username: string): Promise<TelegramUsernameStatus> {
    const res = await fetch(apiUrl(`/api/telegram/status?username=${encodeURIComponent(username)}`), {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to check the Telegram username"));
    return res.json();
  },
};
