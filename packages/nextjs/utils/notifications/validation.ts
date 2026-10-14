import { NOTIFICATION_SERVICES } from "~~/constants/notifications";
import type { NotificationService } from "~~/types/notifications";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 1-30 letters, digits or underscores (not starting with "_"), then a dot and a 2+ digit discriminator, e.g. alice.42 */
export const SIGNAL_USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9_]{0,29}\.\d{2,}$/;

/**
 * Server-side Signal username normalization.
 * BUG(B3.1): the character class strips ANY leading run of "u", ":" and "@", not just the "@" / "u:" prefixes,
 * so "ursula.42" becomes "rsula.42".
 */
export const normalizeSignalUsername = (raw: string) => raw.trim().replace(/^[u:@]+/, "");

/** Client-side Signal username normalization: only a single leading "@" is removed. */
export const stripLeadingAt = (raw: string) => raw.trim().replace(/^@/, "");

/** Does not trim; callers pass the trimmed address. */
export const isValidEmail = (value: string) => EMAIL_REGEX.test(value);

/** Uses the server normalization (normalizeSignalUsername) before testing. */
export const isValidSignalUsername = (raw: string) => SIGNAL_USERNAME_REGEX.test(normalizeSignalUsername(raw));

export const isNotificationService = (value: unknown): value is NotificationService =>
  (NOTIFICATION_SERVICES as readonly unknown[]).includes(value);
