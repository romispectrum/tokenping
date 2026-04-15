/** Supported notification delivery channels */
export type NotificationService = "email" | "signal";

export interface NotificationConfig {
  chainId: number;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** E.164 phone number for Signal notifications (e.g. +14155551234) */
  phone?: string;
}

export interface NotificationConfigSaveContext {
  chainName?: string;
  currentHealthFactor?: string;
}
