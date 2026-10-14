import { NOTIFICATION_SERVICES } from "~~/constants/notifications";
import type { NotificationService } from "~~/types/notifications";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 1-30 letters, digits or underscores (not starting with "_"), then a dot and a 2+ digit discriminator, e.g. alice.42 */
export const SIGNAL_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/;

/**
 * Strips an optional literal "u:" prefix (signal-cli's username form) and then an optional "@", e.g.
 * "u:@alice.42" -> "alice.42". Whitespace after a prefix is kept, so the result fails SIGNAL_USERNAME_REGEX.
 * Not idempotent ("@@alice.42" -> "@alice.42" -> "alice.42"): normalize once and test the result with
 * SIGNAL_USERNAME_REGEX, so the value that is validated is the value that is stored or sent.
 */
export const normalizeSignalUsername = (raw: string) => raw.trim().replace(/^(?:u:)?@?/, "");

/** Does not trim; callers pass the trimmed address. */
export const isValidEmail = (value: string) => EMAIL_REGEX.test(value);

/** Takes the raw input and normalizes it itself; passing an already normalized value would strip a second prefix. */
export const isValidSignalUsername = (raw: string) => SIGNAL_USERNAME_REGEX.test(normalizeSignalUsername(raw));

export const isNotificationService = (value: unknown): value is NotificationService =>
  (NOTIFICATION_SERVICES as readonly unknown[]).includes(value);
