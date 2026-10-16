import { DEFAULT_HEALTH_FACTOR_THRESHOLD, NOTIFICATION_SERVICES } from "~~/constants/notifications";
import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from "~~/i18n/locales";
import type { NotificationService } from "~~/types/notifications";
import { clampThreshold } from "~~/utils/notifications/threshold";
import {
  isNotificationService,
  isValidEmail,
  isValidSignalUsername,
  normalizeSignalUsername,
} from "~~/utils/notifications/validation";

/** The PUT body fields that make up a stored config, as received: any JSON value can arrive in each. */
export type ConfigInput = {
  enabled?: unknown;
  services?: unknown;
  healthFactorThreshold?: unknown;
  email?: unknown;
  signalRecipient?: unknown;
  locale?: unknown;
};

export type ConfigValues = {
  /** Not validated: stored as sent (default true). */
  enabled: unknown;
  services: NotificationService[];
  healthFactorThreshold: number;
  email: string | null;
  signalRecipient: string | null;
  /** The language the alerts are sent in. */
  locale: Locale;
};

const SERVICES_ERROR = `Invalid services: expected an array of ${NOTIFICATION_SERVICES.join(", ")}`;
const THRESHOLD_ERROR = "Invalid healthFactorThreshold: expected a finite number";
const EMAIL_ERROR = "Invalid email address for email notifications";
const SIGNAL_ERROR = "Invalid Signal username for Signal notifications. Expected format: alice.42";
const LOCALE_ERROR = `Invalid locale: expected one of ${LOCALES.join(", ")}`;

/** Blank values become null; anything else is stringified. */
const optionalText = (raw: unknown, normalize: (value: string) => string) =>
  raw == null ? null : normalize(String(raw)) || null;

/**
 * Validates a config write and normalizes it for storage, or returns the first problem (services, threshold, email,
 * Signal, locale). A missing or null locale is English. Recipients are checked only for the selected services, with the shared length-capped helpers; the others
 * are stored without validation. isValidSignalUsername normalizes the raw Signal input exactly as it is stored.
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

  const locale = input.locale ?? DEFAULT_LOCALE;
  if (!isLocale(locale)) return { error: LOCALE_ERROR };

  return {
    value: {
      enabled: input.enabled ?? true,
      services,
      healthFactorThreshold: clampThreshold(threshold),
      email: optionalText(input.email, value => value.trim()),
      signalRecipient: optionalText(input.signalRecipient, normalizeSignalUsername),
      locale,
    },
  };
};
