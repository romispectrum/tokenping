import { DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import type { NotificationConfig, NotificationService } from "~~/types/notifications";
import { clampThreshold, formatThreshold, normalizeThreshold, roundThreshold } from "~~/utils/notifications/threshold";
import {
  SIGNAL_USERNAME_REGEX,
  isNotificationService,
  isValidEmail,
  stripLeadingAt,
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

/** Hydrates the form from a saved config whenever the user is not editing. */
export const configToFormState = (config: NotificationConfig): NotificationFormState => {
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

/**
 * Resets the form when editing is cancelled.
 * BUG(B0.8): unlike configToFormState, services are neither filtered nor given the email fallback and `enabled` is
 * taken as is. Cancel also ends editing, which re-runs the hydration effect, so today the difference only lasts
 * until that effect applies configToFormState.
 */
export const configToFormStateOnCancel = (config: NotificationConfig | null): NotificationFormState => {
  if (!config) return EMPTY_FORM_STATE;
  const threshold = normalizeThreshold(config.healthFactorThreshold);
  return {
    enabled: config.enabled,
    services: config.services ?? [],
    email: config.email ?? "",
    signalRecipient: config.signalRecipient ?? "",
    threshold,
    thresholdText: formatThreshold(threshold),
  };
};

export const toggleService = (services: NotificationService[], service: NotificationService) =>
  services.includes(service) ? services.filter(s => s !== service) : [...services, service];

/** Returns the first problem, in the order the user sees the fields, or null when the form can be saved. */
export const validateNotificationForm = ({ services, email, signalRecipient, telegramChatId }: SubmittableForm) => {
  if (services.length === 0) return "Please select at least one notification service";
  if (services.includes("email")) {
    const trimmed = email.trim();
    if (!trimmed) return "Please enter your email address";
    if (!isValidEmail(trimmed)) return "Please enter a valid email address";
  }
  if (services.includes("signal")) {
    // Client rule: only a leading "@" is stripped, so "u:alice.42" is rejected here (see isValidSignalUsername).
    const username = stripLeadingAt(signalRecipient);
    if (!username) return "Please enter your Signal username";
    if (!SIGNAL_USERNAME_REGEX.test(username)) {
      return "Invalid Signal username. Expected format: alice.42 (find yours in Signal → Settings → Profile)";
    }
  }
  if (services.includes("telegram") && !telegramChatId) {
    return "Please connect Telegram first using the 'Connect Telegram' button.";
  }
  return null;
};

/** Presence checks that enable the Save button; formats are only checked on click by validateNotificationForm. */
export const canSubmitNotificationForm = ({ services, email, signalRecipient, telegramChatId }: SubmittableForm) =>
  !(
    services.length === 0 ||
    (services.includes("email") && !email.trim()) ||
    (services.includes("signal") && !signalRecipient.trim()) ||
    (services.includes("telegram") && !telegramChatId)
  );

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
  signalRecipient: services.includes("signal") ? stripLeadingAt(signalRecipient) || undefined : undefined,
});
