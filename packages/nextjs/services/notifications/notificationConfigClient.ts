import { type MarketRef, V3_MARKET_ID } from "~~/config/aaveConfig";
import { isMorphoProtocol } from "~~/config/protocols";
import { apiError, apiUrl } from "~~/services/api/apiClient";
import type { NotificationConfig } from "~~/types/notifications";

const CONFIG_PATH = "/api/notifications/config";

/*
 * Browser client for /api/notifications/config. The API acts for the signed-in wallet (the session cookie), so no
 * wallet is sent; a request without a session fails with SignInRequiredError.
 */
export const notificationConfigClient = {
  /** Keyed by marketRefKey: "1:v3", "1:0x94e7...", "morpho-blue:8453:0x3a85...". */
  async getAllConfigs(): Promise<Record<string, NotificationConfig>> {
    const res = await fetch(apiUrl(CONFIG_PATH));
    if (!res.ok) throw await apiError(res, "Failed to load notification configs");
    const data = await res.json();
    if (data == null || typeof data !== "object") return {};
    return data as Record<string, NotificationConfig>;
  },

  /** config.chainId is the position's chain (the network the alert is for), not the wallet's connected chain. */
  async upsertConfig(config: NotificationConfig): Promise<void> {
    const res = await fetch(apiUrl(CONFIG_PATH), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId: config.chainId,
        market: config.market ?? V3_MARKET_ID,
        // Only Morpho names its protocol: the server reads an alert without one as Aave's, as it always did.
        ...(isMorphoProtocol(config.protocol) && { protocol: config.protocol }),
        enabled: config.enabled,
        services: config.services,
        healthFactorThreshold: config.healthFactorThreshold,
        email: config.email ?? null,
        signalRecipient: config.signalRecipient ?? null,
        telegramUsername: config.telegramUsername ?? null,
        // The page's language; the server stores "en" when this is missing. Each channel listed in channelLocales is
        // sent in its own language, the others in this one.
        locale: config.locale ?? "en",
        channelLocales: config.channelLocales ?? {},
      }),
    });
    if (!res.ok) throw await apiError(res, "Failed to save notification config");
  },

  async deleteConfig({ chainId, market, protocol }: MarketRef): Promise<void> {
    const res = await fetch(apiUrl(CONFIG_PATH), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chainId, market, ...(isMorphoProtocol(protocol) && { protocol }) }),
    });
    if (!res.ok) throw await apiError(res, "Failed to delete notification config");
  },
};
