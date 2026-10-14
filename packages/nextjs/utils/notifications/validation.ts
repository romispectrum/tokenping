import { NOTIFICATION_SERVICES } from "~~/constants/notifications";
import type { NotificationService } from "~~/types/notifications";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RFC 5321's 256-octet forward path minus its angle brackets. */
export const MAX_EMAIL_LENGTH = 254;

/** Raw input cap, generous for a 30-character nickname, a dot, a discriminator and a "u:@" prefix. */
export const MAX_SIGNAL_RECIPIENT_LENGTH = 64;

/**
 * 1-30 letters, digits or underscores (not starting with "_"), then a dot and a 2+ digit discriminator, e.g. alice.42,
 * at most MAX_SIGNAL_RECIPIENT_LENGTH (64) characters in all. The cap lives in the regex so that callers testing an
 * already normalized value (the client form, sendSignal) agree with isValidSignalUsername on the server.
 */
export const SIGNAL_USERNAME_REGEX = /^(?=.{1,64}$)[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/;

/**
 * Strips an optional literal "u:" prefix (signal-cli's username form) and then an optional "@", e.g.
 * "u:@alice.42" -> "alice.42". Whitespace after a prefix is kept, so the result fails SIGNAL_USERNAME_REGEX.
 * Not idempotent ("@@alice.42" -> "@alice.42" -> "alice.42"): normalize the raw input once for storing or sending,
 * and validate that same raw input with isValidSignalUsername, which normalizes it the same way.
 */
export const normalizeSignalUsername = (raw: string) => raw.trim().replace(/^(?:u:)?@?/, "");

/**
 * Does not trim; callers pass the trimmed address. The length is checked first because EMAIL_REGEX backtracks
 * quadratically on long crafted input such as "a@a.a.a.…@".
 */
export const isValidEmail = (value: string) => value.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(value);

/**
 * Takes the raw input and normalizes it itself; passing an already normalized value would strip a second prefix.
 * The raw length is capped before any regex runs.
 */
export const isValidSignalUsername = (raw: string) =>
  raw.length <= MAX_SIGNAL_RECIPIENT_LENGTH && SIGNAL_USERNAME_REGEX.test(normalizeSignalUsername(raw));

export const isNotificationService = (value: unknown): value is NotificationService =>
  (NOTIFICATION_SERVICES as readonly unknown[]).includes(value);
