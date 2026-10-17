import type { MarketId } from "~~/config/aaveConfig";
import type { Locale } from "~~/i18n/locales";

/** Supported notification delivery channels */
export type NotificationService = "email" | "signal" | "telegram";

export type NotificationServiceOption = {
  id: NotificationService;
  name: string;
};

export type NotificationConfig = {
  chainId: number;
  /** The market on the chain: "v3" (the chain's V3 Pool) or a V4 Spoke's lowercased address. "v3" when absent. */
  market?: MarketId;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** Signal username for notifications (e.g. alice.42, stored without @ prefix) */
  signalRecipient?: string;
  /** Telegram username the alert goes to (e.g. alice_eth, lowercased, stored without @). */
  telegramUsername?: string;
  /** The language the alert is sent in: the site language it was saved from. English when absent (older rows). */
  locale?: Locale;
};

/** GET /api/telegram/status response: whether the username has pressed Start in the bot. */
export type TelegramUsernameStatus = {
  linked: boolean;
};
