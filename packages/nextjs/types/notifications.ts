import type { MarketId } from "~~/config/aaveConfig";
import type { Protocol } from "~~/config/protocols";
import type { Locale } from "~~/i18n/locales";
import type { MorphoMarketParams } from "~~/services/morpho/types";

/** Supported notification delivery channels */
export type NotificationService = "email" | "signal" | "telegram";

export type NotificationServiceOption = {
  id: NotificationService;
  name: string;
};

export type NotificationConfig = {
  chainId: number;
  /**
   * The market on the chain. Aave: "v3" (the chain's V3 Pool) or a V3 Pool's or V4 Spoke's lowercased address, "v3"
   * when absent. Morpho: the market id.
   */
  market?: MarketId;
  /** Absent for Aave, as every config was before Morpho. */
  protocol?: Protocol;
  enabled: boolean;
  services: NotificationService[];
  healthFactorThreshold: number;
  email?: string;
  /** Signal username for notifications (e.g. alice.42, stored without @ prefix) */
  signalRecipient?: string;
  /** Telegram username the alert goes to (e.g. alice_eth, lowercased, stored without @). */
  telegramUsername?: string;
  /** The site language the alert was last saved from. A channel without its own language is sent in this one. */
  locale?: Locale;
  /** The language each channel's alerts are sent in. Only set for the channels that have one. */
  channelLocales?: ChannelLocales;
  /**
   * Morpho only: the market's parameters as stored with the alert, so the dashboard can name a market it cannot read
   * right now. The server takes them from the chain, never from a request.
   */
  marketParams?: MorphoMarketParams;
};

export type ChannelLocales = Partial<Record<NotificationService, Locale>>;

/** GET /api/telegram/status response: whether the username has pressed Start in the bot. */
export type TelegramUsernameStatus = {
  linked: boolean;
};
