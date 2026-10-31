import type { ClientMessages } from "~~/i18n/client/messages";
import type { Locale } from "~~/i18n/locales";
import { ALERTS_MESSAGES } from "~~/i18n/messages/alerts";
import { BLOG_MESSAGES } from "~~/i18n/messages/blog";
import { CALCULATOR_MESSAGES } from "~~/i18n/messages/calculator";
import { COMMON_MESSAGES } from "~~/i18n/messages/common";
import { DASHBOARD_MESSAGES } from "~~/i18n/messages/dashboard";
import { MORPHO_MESSAGES } from "~~/i18n/messages/morpho";

// Tests only (vitest.config.ts points i18n/client/fallback here): every language, so a component renders in the
// locale of the nearest <LocaleProvider locale> (English without one), as it would inside that language's layout.
export const fallbackMessages = (locale: Locale): ClientMessages => ({
  alerts: ALERTS_MESSAGES[locale],
  blog: BLOG_MESSAGES[locale],
  calculator: CALCULATOR_MESSAGES[locale],
  common: COMMON_MESSAGES[locale],
  dashboard: DASHBOARD_MESSAGES[locale],
  morpho: MORPHO_MESSAGES[locale],
});
