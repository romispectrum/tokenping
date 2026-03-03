/** Supported notification delivery channels */
export type NotificationService = "email";

export interface NotificationConfig {
  chainId: number;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
}

export interface NotificationConfigSaveContext {
  chainName?: string;
  currentHealthFactor?: string;
}
