/** Supported notification delivery channels */
export type NotificationService = "email" | "signal" | "telegram";

export type NotificationServiceOption = {
  id: NotificationService;
  name: string;
};

export type NotificationConfig = {
  chainId: number;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** Signal username for notifications (e.g. alice.42, stored without @ prefix) */
  signalRecipient?: string;
};

/**
 * GET /api/telegram/link response. Telegram is linked per wallet (one chat across all chains), so it is not part of
 * the per-chain NotificationConfig.
 */
export type TelegramLinkStatus = {
  linked: boolean;
  chatId?: string;
  username?: string | null;
  linkedAt?: string;
};
