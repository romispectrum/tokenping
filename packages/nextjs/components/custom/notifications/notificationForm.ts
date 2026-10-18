import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { DEFAULT_LOCALE, type Locale, isLocale } from "~~/i18n/locales";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import type { ChannelLocales, NotificationConfig, NotificationService } from "~~/types/notifications";
import { clampThreshold, formatThreshold, normalizeThreshold, roundThreshold } from "~~/utils/notifications/threshold";
import {
  SIGNAL_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  isValidTelegramUsername,
  normalizeSignalUsername,
  normalizeTelegramUsername,
} from "~~/utils/notifications/validation";

export type NotificationFormState = {
  enabled: boolean;
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  /** As typed: "@Alice_Eth" is fine, it is normalized on Save. */
  telegramUsername: string;
  threshold: number;
  /** What the manual threshold input shows; may be incomplete while typing (e.g. "1."). */
  thresholdText: string;
  /**
   * The language picked for each channel. A channel without one shows and saves the page's language, so a new
   * channel starts in the language the person is reading.
   */
  channelLocales: ChannelLocales;
};

type SubmittableForm = Pick<NotificationFormState, "services" | "email" | "signalRecipient" | "telegramUsername">;

const DEFAULT_THRESHOLD = clampThreshold(DEFAULT_HEALTH_FACTOR_THRESHOLD);

export const EMPTY_FORM_STATE: NotificationFormState = {
  enabled: false,
  services: [],
  email: "",
  signalRecipient: "",
  telegramUsername: "",
  threshold: DEFAULT_THRESHOLD,
  thresholdText: formatThreshold(DEFAULT_THRESHOLD),
  channelLocales: {},
};

/*
 * The config comes from the API body unvalidated (notificationConfigClient.getAllConfigs casts it), so the
 * fallbacks below also cover fields that are missing at runtime despite the types.
 */

/** The form for a saved config (or the empty form without one): what the summary shows and what editing starts from. */
export const configToFormState = (config: NotificationConfig | null): NotificationFormState => {
  if (!config) return EMPTY_FORM_STATE;
  const services = (config.services ?? []).filter(isNotificationService);
  const threshold = normalizeThreshold(config.healthFactorThreshold);
  return {
    enabled: config.enabled ?? false,
    // Legacy enabled configs without a valid service fall back to email.
    services: services.length > 0 ? services : config.enabled ? ["email"] : [],
    email: config.email ?? "",
    signalRecipient: config.signalRecipient ?? "",
    telegramUsername: config.telegramUsername ?? "",
    threshold,
    thresholdText: formatThreshold(threshold),
    channelLocales: Object.fromEntries(
      Object.entries(config.channelLocales ?? {}).filter(
        ([channel, locale]) => isNotificationService(channel) && isLocale(locale),
      ),
    ),
  };
};

/** The language `channel` is sent in: the one picked for it, else `pageLocale`. */
export const channelLocaleOf = (
  form: Pick<NotificationFormState, "channelLocales">,
  channel: NotificationService,
  pageLocale: Locale,
) => form.channelLocales[channel] ?? pageLocale;

export const toggleService = (services: NotificationService[], service: NotificationService) =>
  services.includes(service) ? services.filter(s => s !== service) : [...services, service];

/** The parts of the form that can be wrong, in the order the form shows them. */
export type NotificationFormField = "services" | "email" | "signalRecipient" | "telegram";

export type NotificationFormErrors = Partial<Record<NotificationFormField, string>>;

/** Display order: errors are listed and the first one is focused in this order. */
export const NOTIFICATION_FORM_FIELDS: readonly NotificationFormField[] = [
  "services",
  "email",
  "signalRecipient",
  "telegram",
];

/** The services group and the threshold, plus one field for each selected service. */
export const countFormFields = (services: readonly NotificationService[]) => 2 + services.length;

/** A failed Save lists the errors at the top of the form once it shows more than 3 fields. */
export const needsErrorSummary = (services: readonly NotificationService[]) => countFormFields(services) > 3;

/** The English messages; each says what to do to fix the field. The Czech ones are in i18n/messages/alerts. */
export const NOTIFICATION_FORM_ERRORS = ALERTS_MESSAGES.en.formErrors;

/** Every problem in the form, by field, in the page's language; empty when the form can be saved. */
export const getNotificationFormErrors = (
  { services, email, signalRecipient, telegramUsername }: SubmittableForm,
  locale: Locale = DEFAULT_LOCALE,
): NotificationFormErrors => {
  const messages = ALERTS_MESSAGES[locale].formErrors;
  const errors: NotificationFormErrors = {};
  if (services.length === 0) errors.services = messages.noService;
  if (services.includes("email")) {
    const trimmed = email.trim();
    if (!trimmed) errors.email = messages.noEmail;
    else if (!isValidEmail(trimmed)) errors.email = messages.invalidEmail;
  }
  if (services.includes("signal")) {
    // Normalized exactly as buildConfigUpdate stores it, so the value checked here is the value saved.
    const username = normalizeSignalUsername(signalRecipient);
    if (!username) errors.signalRecipient = messages.noSignal;
    else if (!SIGNAL_USERNAME_REGEX.test(username)) errors.signalRecipient = messages.invalidSignal;
  }
  // Not having pressed Start in the bot yet does not block Save: the form says so, and alerts start once they do.
  if (services.includes("telegram")) {
    if (!normalizeTelegramUsername(telegramUsername)) errors.telegram = messages.noTelegram;
    else if (!isValidTelegramUsername(telegramUsername)) errors.telegram = messages.invalidTelegram;
  }
  return errors;
};

/** The first problem in display order, or null when the form can be saved. */
export const validateNotificationForm = (form: SubmittableForm, locale: Locale = DEFAULT_LOCALE) => {
  const errors = getNotificationFormErrors(form, locale);
  const first = NOTIFICATION_FORM_FIELDS.find(field => errors[field] !== undefined);
  return first ? (errors[first] ?? null) : null;
};

/** The updateConfig payload for Save. Every selected channel gets a language: the picked one, else `pageLocale`. */
export const buildConfigUpdate = (
  {
    services,
    email,
    signalRecipient,
    telegramUsername,
    threshold,
    channelLocales = {},
  }: Pick<NotificationFormState, "services" | "email" | "signalRecipient" | "telegramUsername" | "threshold"> &
    Partial<Pick<NotificationFormState, "channelLocales">>,
  pageLocale: Locale = DEFAULT_LOCALE,
) => ({
  enabled: true,
  services,
  healthFactorThreshold: clampThreshold(roundThreshold(threshold)),
  // The keys stay present when undefined so the merge in updateConfig clears a deselected service's recipient.
  email: services.includes("email") ? email.trim() || undefined : undefined,
  signalRecipient: services.includes("signal") ? normalizeSignalUsername(signalRecipient) || undefined : undefined,
  telegramUsername: services.includes("telegram")
    ? normalizeTelegramUsername(telegramUsername) || undefined
    : undefined,
  channelLocales: Object.fromEntries(
    services.map(channel => [channel, channelLocaleOf({ channelLocales }, channel, pageLocale)]),
  ) as ChannelLocales,
});
