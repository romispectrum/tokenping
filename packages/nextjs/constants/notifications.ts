import type { NotificationService, NotificationServiceOption } from "~~/types/notifications";

export const DEFAULT_HEALTH_FACTOR_THRESHOLD = 1.5;

/** Health factor boundaries for badge labels (Critical < 1.1, Risky < 1.5, Safe >= 1.5) */
export const HEALTH_FACTOR_CRITICAL = 1.1;
export const HEALTH_FACTOR_RISKY = 1.5;

export const NOTIFICATION_SERVICES: readonly NotificationService[] = ["email", "signal", "telegram"];

export const AVAILABLE_SERVICES: NotificationServiceOption[] = [
  { id: "email", name: "Email", icon: "📧" },
  { id: "signal", name: "Signal", icon: "🔒" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
];

/** The bot username is what makes Telegram linking work; without it the link-token route answers 503. */
export const isTelegramConfigured = () => Boolean(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);

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

export const TELEGRAM_LINK_POLL_INTERVAL_MS = 2000;
export const TELEGRAM_LINK_POLL_TIMEOUT_MS = 2 * 60 * 1000;
