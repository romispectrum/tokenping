import type { NotificationService, NotificationServiceOption } from "~~/types/notifications";

export const DEFAULT_HEALTH_FACTOR_THRESHOLD = 1.5;

/** Health factor boundaries for badge labels (Critical < 1.1, Risky < 1.5, Safe >= 1.5) */
export const HEALTH_FACTOR_CRITICAL = 1.1;
export const HEALTH_FACTOR_RISKY = 1.5;

export const NOTIFICATION_SERVICES: readonly NotificationService[] = ["email", "signal", "telegram"];

export const AVAILABLE_SERVICES: NotificationServiceOption[] = [
  { id: "email", name: "Email" },
  { id: "signal", name: "Signal" },
  { id: "telegram", name: "Telegram" },
];

/** The bot's username, without "@": people press Start there once. Undefined while no bot is configured. */
export const getTelegramBotUsername = () =>
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || undefined;

/** The bot username is what the site needs to offer Telegram: the form sends people to the bot to press Start. */
export const isTelegramConfigured = () => Boolean(getTelegramBotUsername());

/** Channels to offer: Telegram only when the bot is configured, or when it is already selected so it can be turned off. */
export const getSelectableServices = (selected: readonly NotificationService[]) =>
  AVAILABLE_SERVICES.filter(
    service => service.id !== "telegram" || isTelegramConfigured() || selected.includes("telegram"),
  );

/** Bounds for a stored alert threshold (typed input and saved value). */
export const HEALTH_FACTOR_THRESHOLD_MIN = 1.1;
export const HEALTH_FACTOR_THRESHOLD_MAX = 10;

/** The slider covers a narrower range than the typed input allows. */
export const THRESHOLD_SLIDER_MIN = 1.1;
export const THRESHOLD_SLIDER_MAX = 3;
export const THRESHOLD_SLIDER_STEP = 0.1;

/** Must match the cron schedule in vercel.json. */
export const NOTIFICATION_CHECK_INTERVAL_MINUTES = 5;

/** One test message per wallet and channel this often; the database enforces it (claim_notification_test_send). */
export const TEST_SEND_COOLDOWN_MINUTES = 15;

/** While a typed Telegram username has not pressed Start, the form asks again this often, for this long. */
export const TELEGRAM_STATUS_POLL_INTERVAL_MS = 3000;
export const TELEGRAM_STATUS_POLL_TIMEOUT_MS = 5 * 60 * 1000;
