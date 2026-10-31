import type { Locale } from "~~/i18n/locales";
import { SignInRequiredError } from "~~/services/api/apiClient";
import { getErrorMessage } from "~~/utils/errors";

/**
 * A failed request's message for a toast. The API answers in English, so English shows the server's reason and every
 * other language shows its own fallback. An ended session says so in every language (`signInExpired`).
 */
export const requestErrorMessage = (locale: Locale, error: unknown, fallback: string, signInExpired: string) => {
  if (error instanceof SignInRequiredError) return signInExpired;
  return locale === "en" ? getErrorMessage(error, fallback) : fallback;
};
