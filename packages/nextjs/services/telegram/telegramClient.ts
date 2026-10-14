import { apiUrl, readApiError } from "~~/services/api/apiClient";
import type { TelegramLinkStatus } from "~~/types/notifications";

export type CreateLinkTokenResponse = {
  token: string;
  botUsername: string;
  expiresAt: string;
  deepLink: string;
};

/**
 * How long the token stays valid, measured against the server's clock (its Date header) because `expiresAt` comes
 * from that clock and the device's may be off. Null when either time is unreadable.
 */
const lifetimeMs = (expiresAt: string, serverDate: string | null) => {
  const ms = Date.parse(expiresAt) - Date.parse(serverDate ?? "");
  return Number.isFinite(ms) ? ms : null;
};

/** Browser client for the Telegram link API behind the "Connect Telegram" handshake. */
export const telegramClient = {
  async createLinkToken(userId: string) {
    const res = await fetch(apiUrl("/api/telegram/link-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to create Telegram link token"));
    const body: CreateLinkTokenResponse = await res.json();
    return { ...body, expiresInMs: lifetimeMs(body.expiresAt, res.headers.get("Date")) };
  },

  async getLinkStatus(userId: string): Promise<TelegramLinkStatus> {
    const res = await fetch(apiUrl(`/api/telegram/link?userId=${encodeURIComponent(userId.trim())}`), {
      cache: "no-store",
    });
    // Any non-2xx means the status is unknown (the lookup failed), never "not linked".
    if (!res.ok) throw new Error(await readApiError(res, "Failed to check the Telegram link"));
    return res.json();
  },

  async disconnect(userId: string): Promise<void> {
    const res = await fetch(apiUrl("/api/telegram/link"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to disconnect Telegram"));
  },
};
