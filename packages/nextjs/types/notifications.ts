/** Supported notification delivery channels */
export type NotificationService = "email" | "signal";

export interface NotificationConfig {
  chainId: number;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** Signal username for notifications (e.g. alice.42, stored without @ prefix) */
  signalRecipient?: string;
}

export interface NotificationConfigSaveContext {
  chainName?: string;
  currentHealthFactor?: string;
}
