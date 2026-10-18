import { DEFAULT_HEALTH_FACTOR_THRESHOLD, NOTIFICATION_SERVICES } from "~~/constants/notifications";
import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from "~~/i18n/locales";
import type { NotificationService } from "~~/types/notifications";
import { clampThreshold } from "~~/utils/notifications/threshold";
import {
  isNotificationService,
  isValidEmail,
  isValidSignalUsername,
  isValidTelegramUsername,
  normalizeSignalUsername,
  normalizeTelegramUsername,
} from "~~/utils/notifications/validation";

/** The PUT body fields that make up a stored config, as received: any JSON value can arrive in each. */
export type ConfigInput = {
  enabled?: unknown;
  services?: unknown;
  healthFactorThreshold?: unknown;
  email?: unknown;
  signalRecipient?: unknown;
  telegramUsername?: unknown;
  locale?: unknown;
  channelLocales?: unknown;
};

export type ConfigValues = {
  /** Not validated: stored as sent (default true). */
  enabled: unknown;
  services: NotificationService[];
  healthFactorThreshold: number;
  email: string | null;
  signalRecipient: string | null;
  /** Lowercased, without "@"; null unless it is a valid username (the database checks the format). */
  telegramUsername: string | null;
  /** The page language the alert was saved from: the language of every channel without its own. */
  locale: Locale;
  /** Each channel's own language; null falls back to `locale`. */
  channelLocales: Record<NotificationService, Locale | null>;
};

const SERVICES_ERROR = `Invalid services: expected an array of ${NOTIFICATION_SERVICES.join(", ")}`;
const THRESHOLD_ERROR = "Invalid healthFactorThreshold: expected a finite number";
const EMAIL_ERROR = "Invalid email address for email notifications";
const SIGNAL_ERROR = "Invalid Signal username for Signal notifications. Expected format: alice.42";
const TELEGRAM_ERROR =
  "Invalid Telegram username for Telegram notifications. Expected 4 to 32 letters, digits or underscores, e.g. alice_eth";
const LOCALE_ERROR = `Invalid locale: expected one of ${LOCALES.join(", ")}`;
const CHANNEL_LOCALES_ERROR = `Invalid channelLocales: expected an object of ${NOTIFICATION_SERVICES.join(", ")} to one of ${LOCALES.join(", ")}`;

/** Blank values become null; anything else is stringified. */
const optionalText = (raw: unknown, normalize: (value: string) => string) =>
  raw == null ? null : normalize(String(raw)) || null;

/** Missing or null is no language for any channel, as is a null value; any other key or value is an error (null). */
const parseChannelLocales = (raw: unknown): Record<NotificationService, Locale | null> | null => {
  const locales: Record<NotificationService, Locale | null> = { email: null, signal: null, telegram: null };
  if (raw == null) return locales;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;
  for (const [channel, locale] of Object.entries(raw)) {
    if (!isNotificationService(channel) || !(locale === null || isLocale(locale))) return null;
    locales[channel] = locale;
  }
  return locales;
};

/**
 * Validates a config write and normalizes it for storage, or returns the first problem (services, threshold, email,
 * Signal, Telegram, locale, channel languages). A missing or null locale is English; a channel without a language
 * of its own is sent in `locale`. Recipients are checked only for the selected
 * services, with the shared length-capped helpers; the others are stored without validation, except a Telegram
 * username, which is stored only when valid because the database checks its format. isValidSignalUsername and
 * isValidTelegramUsername normalize the raw input exactly as it is stored.
 */
export const parseConfigInput = (input: ConfigInput): { error: string } | { value: ConfigValues } => {
  const services = input.services ?? [];
  if (!Array.isArray(services) || !services.every(isNotificationService)) return { error: SERVICES_ERROR };

  const threshold = input.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD;
  if (typeof threshold !== "number" || !Number.isFinite(threshold)) return { error: THRESHOLD_ERROR };

  if (services.includes("email") && !(typeof input.email === "string" && isValidEmail(input.email.trim()))) {
    return { error: EMAIL_ERROR };
  }

  if (
    services.includes("signal") &&
    !(typeof input.signalRecipient === "string" && isValidSignalUsername(input.signalRecipient))
  ) {
    return { error: SIGNAL_ERROR };
  }

  const rawTelegram = typeof input.telegramUsername === "string" ? input.telegramUsername : "";
  const telegramUsername = isValidTelegramUsername(rawTelegram) ? normalizeTelegramUsername(rawTelegram) : null;
  if (services.includes("telegram") && !telegramUsername) return { error: TELEGRAM_ERROR };

  const locale = input.locale ?? DEFAULT_LOCALE;
  if (!isLocale(locale)) return { error: LOCALE_ERROR };

  const channelLocales = parseChannelLocales(input.channelLocales);
  if (!channelLocales) return { error: CHANNEL_LOCALES_ERROR };

  return {
    value: {
      enabled: input.enabled ?? true,
      services,
      healthFactorThreshold: clampThreshold(threshold),
      email: optionalText(input.email, value => value.trim()),
      signalRecipient: optionalText(input.signalRecipient, normalizeSignalUsername),
      telegramUsername,
      locale,
      channelLocales,
    },
  };
};
