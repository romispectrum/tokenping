import { apiUrl, readApiError } from "~~/services/api/apiClient";

export type TelegramLinkStatus = {
  linked: boolean;
  chatId?: string;
  username?: string | null;
  linkedAt?: string;
};

export type CreateLinkTokenResponse = {
  token: string;
  botUsername: string;
  expiresAt: string;
  deepLink: string;
};

/** Browser client for the Telegram link API behind the "Connect Telegram" handshake. */
export const telegramClient = {
  async createLinkToken(userId: string): Promise<CreateLinkTokenResponse> {
    const res = await fetch(apiUrl("/api/telegram/link-token"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to create Telegram link token"));
    return res.json();
  },

  async getLinkStatus(userId: string): Promise<TelegramLinkStatus> {
    const res = await fetch(apiUrl(`/api/telegram/link?userId=${encodeURIComponent(userId.trim())}`), {
      cache: "no-store",
    });
    if (!res.ok) return { linked: false };
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
