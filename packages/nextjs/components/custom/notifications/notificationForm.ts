import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";
import { clampThreshold, formatThreshold, normalizeThreshold, roundThreshold } from "~~/utils/notifications/threshold";
import {
  SIGNAL_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  normalizeSignalUsername,
} from "~~/utils/notifications/validation";

export type NotificationFormState = {
  enabled: boolean;
  services: NotificationService[];
  email: string;
  signalRecipient: string;
  threshold: number;
  /** What the manual threshold input shows; may be incomplete while typing (e.g. "1."). */
  thresholdText: string;
};

/** The Telegram link is per user and lives outside the form, but Save depends on it. */
type SubmittableForm = Pick<NotificationFormState, "services" | "email" | "signalRecipient"> & {
  telegramChatId?: string;
  /** The link status could not be read, so whether the wallet is linked is not known. */
  telegramStatusUnknown?: boolean;
};

const DEFAULT_THRESHOLD = clampThreshold(DEFAULT_HEALTH_FACTOR_THRESHOLD);

export const EMPTY_FORM_STATE: NotificationFormState = {
  enabled: false,
  services: [],
  email: "",
  signalRecipient: "",
  threshold: DEFAULT_THRESHOLD,
  thresholdText: formatThreshold(DEFAULT_THRESHOLD),
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
    threshold,
    thresholdText: formatThreshold(threshold),
  };
};

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

/** Each message says what to do to fix the field. */
export const NOTIFICATION_FORM_ERRORS = {
  noService: "Select at least one notification service.",
  noEmail: "Enter your email address.",
  invalidEmail: "Enter an email address like name@example.com.",
  noSignal: "Enter your Signal username.",
  invalidSignal: "Enter a Signal username like alice.42. Find yours in Signal under Settings, then Profile.",
  telegramUnknown: "Select Try again to check your Telegram link, then save.",
  telegramNotLinked: "Connect Telegram before you save.",
} as const;

/** Every problem in the form, by field; empty when the form can be saved. */
export const getNotificationFormErrors = ({
  services,
  email,
  signalRecipient,
  telegramChatId,
  telegramStatusUnknown,
}: SubmittableForm): NotificationFormErrors => {
  const errors: NotificationFormErrors = {};
  if (services.length === 0) errors.services = NOTIFICATION_FORM_ERRORS.noService;
  if (services.includes("email")) {
    const trimmed = email.trim();
    if (!trimmed) errors.email = NOTIFICATION_FORM_ERRORS.noEmail;
    else if (!isValidEmail(trimmed)) errors.email = NOTIFICATION_FORM_ERRORS.invalidEmail;
  }
  if (services.includes("signal")) {
    // Normalized exactly as buildConfigUpdate stores it, so the value checked here is the value saved.
    const username = normalizeSignalUsername(signalRecipient);
    if (!username) errors.signalRecipient = NOTIFICATION_FORM_ERRORS.noSignal;
    else if (!SIGNAL_USERNAME_REGEX.test(username)) errors.signalRecipient = NOTIFICATION_FORM_ERRORS.invalidSignal;
  }
  if (services.includes("telegram") && !telegramChatId) {
    errors.telegram = telegramStatusUnknown
      ? NOTIFICATION_FORM_ERRORS.telegramUnknown
      : NOTIFICATION_FORM_ERRORS.telegramNotLinked;
  }
  return errors;
};

/** The first problem in display order, or null when the form can be saved. */
export const validateNotificationForm = (form: SubmittableForm) => {
  const errors = getNotificationFormErrors(form);
  const first = NOTIFICATION_FORM_FIELDS.find(field => errors[field] !== undefined);
  return first ? (errors[first] ?? null) : null;
};

/** The updateConfig payload for Save. */
export const buildConfigUpdate = ({
  services,
  email,
  signalRecipient,
  threshold,
}: Pick<NotificationFormState, "services" | "email" | "signalRecipient" | "threshold">) => ({
  enabled: true,
  services,
  healthFactorThreshold: clampThreshold(roundThreshold(threshold)),
  // The keys stay present when undefined so the merge in updateConfig clears a deselected service's recipient.
  email: services.includes("email") ? email.trim() || undefined : undefined,
  signalRecipient: services.includes("signal") ? normalizeSignalUsername(signalRecipient) || undefined : undefined,
});
