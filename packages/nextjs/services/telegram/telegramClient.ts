/**
 * Client-side wrappers for the Telegram link API.
 * Used by the NotificationConfig UI for the "Connect Telegram" handshake.
 */

export interface TelegramLinkStatus {
  linked: boolean;
  chatId?: string;
  username?: string | null;
  linkedAt?: string;
}

export interface CreateLinkTokenResponse {
  token: string;
  botUsername: string;
  expiresAt: string;
  deepLink: string;
}

function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const telegramClient = {
  async createLinkToken(userId: string): Promise<CreateLinkTokenResponse> {
    const res = await fetch(`${getApiBase()}/api/telegram/link-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to create Telegram link token");
    }
    return res.json();
  },

  async getLinkStatus(userId: string): Promise<TelegramLinkStatus> {
    const res = await fetch(`${getApiBase()}/api/telegram/link?userId=${encodeURIComponent(userId.trim())}`, {
      cache: "no-store",
    });
    if (!res.ok) return { linked: false };
    return res.json();
  },

  async disconnect(userId: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/telegram/link`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Failed to disconnect Telegram");
    }
  },
};
