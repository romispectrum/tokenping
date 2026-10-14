/** Supported notification delivery channels */
export type NotificationService = "email" | "signal" | "telegram";

export interface NotificationConfig {
  chainId: number;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** Signal username for notifications (e.g. alice.42, stored without @ prefix) */
  signalRecipient?: string;
  /**
   * Telegram link status for this user.
   * NOTE: Telegram is linked at the USER level (one chat per wallet across all chains),
   * so these fields are returned read-only from the API by joining `user_telegram_links`.
   * They are not stored per-chain in `notification_configs`.
   */
  telegramChatId?: string;
  telegramUsername?: string;
}

export interface NotificationConfigSaveContext {
  chainName?: string;
  currentHealthFactor?: string;
}
