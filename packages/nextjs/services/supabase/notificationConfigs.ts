import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";

export interface NotificationConfigRow {
  id: string;
  user_id: string;
  chain_id: number;
  enabled: boolean;
  services: NotificationService[];
  health_factor_threshold: number;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const notificationConfigsService = {
  async getConfig(userId: string, chainId: number): Promise<NotificationConfig | null> {
    const base = getApiBase();
    const res = await fetch(`${base}/api/notifications/config?userId=${encodeURIComponent(userId)}&chainId=${chainId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data == null || typeof data !== "object") return null;
    return {
      chainId: data.chainId,
      enabled: data.enabled,
      services: data.services ?? [],
      healthFactorThreshold: parseFloat(String(data.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD)),
      email: data.email ?? undefined,
    };
  },

  async getAllConfigs(userId: string): Promise<Record<number, NotificationConfig>> {
    const base = getApiBase();
    const res = await fetch(`${base}/api/notifications/config?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return {};
    const data = await res.json();
    if (data == null || typeof data !== "object") return {};
    return data as Record<number, NotificationConfig>;
  },

  async upsertConfig(userId: string, config: NotificationConfig): Promise<void> {
    const base = getApiBase();
    const response = await fetch(`${base}/api/notifications/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        chainId: config.chainId,
        enabled: config.enabled,
        services: config.services,
        healthFactorThreshold: config.healthFactorThreshold,
        email: config.email ?? null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const raw = Array.isArray(error?.error) ? error.error[0] : error?.error;
      const message =
        raw && String(raw).trim() && String(raw) !== "undefined" ? String(raw) : "Failed to save notification config";
      throw new Error(message);
    }
  },

  async deleteConfig(userId: string, chainId: number): Promise<void> {
    const base = getApiBase();
    const response = await fetch(`${base}/api/notifications/config`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, chainId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to delete notification config" }));
      const message = Array.isArray(error?.error) ? error.error[0] : error?.error;
      throw new Error(message || "Failed to delete notification config");
    }
  },

  async hasConfig(userId: string, chainId: number): Promise<boolean> {
    const config = await this.getConfig(userId, chainId);
    return config !== null;
  },
};
