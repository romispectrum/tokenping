import { type MarketRef, V3_MARKET_ID } from "~~/config/aaveConfig";
import { apiUrl, readApiError } from "~~/services/api/apiClient";
import type { NotificationConfig } from "~~/types/notifications";

const CONFIG_PATH = "/api/notifications/config";

/*
 * Browser client for /api/notifications/config. The raw (trimmed, not lowercased) wallet address is sent so the API
 * can also match rows stored with checksummed casing and update them in place.
 */
export const notificationConfigClient = {
  /** Keyed by marketKey(chainId, market): "1:v3", "1:0x94e7...". */
  async getAllConfigs(userId: string): Promise<Record<string, NotificationConfig>> {
    const res = await fetch(apiUrl(`${CONFIG_PATH}?userId=${encodeURIComponent(userId.trim())}`));
    if (!res.ok) throw new Error(await readApiError(res, "Failed to load notification configs"));
    const data = await res.json();
    if (data == null || typeof data !== "object") return {};
    return data as Record<string, NotificationConfig>;
  },

  /** config.chainId is the Aave position's chain (the network the alert is for), not the wallet's connected chain. */
  async upsertConfig(userId: string, config: NotificationConfig): Promise<void> {
    const res = await fetch(apiUrl(CONFIG_PATH), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId.trim(),
        chainId: config.chainId,
        market: config.market ?? V3_MARKET_ID,
        enabled: config.enabled,
        services: config.services,
        healthFactorThreshold: config.healthFactorThreshold,
        email: config.email ?? null,
        signalRecipient: config.signalRecipient ?? null,
        // The language the alert is sent in; the server stores "en" when this is missing.
        locale: config.locale ?? "en",
      }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to save notification config"));
  },

  async deleteConfig(userId: string, { chainId, market }: MarketRef): Promise<void> {
    const res = await fetch(apiUrl(CONFIG_PATH), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId.trim(), chainId, market }),
    });
    if (!res.ok) throw new Error(await readApiError(res, "Failed to delete notification config"));
  },
};
