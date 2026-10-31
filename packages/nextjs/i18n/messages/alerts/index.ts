import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as hi } from "./hi";
import type { AlertsMessages } from "./shared";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The alert settings card on the dashboard: signing in, the empty state, the form, the summary, the Telegram
// username's link status, the toasts and the attribution question. The alert message itself is in notifications.ts.

export type { AlertsMessages, NotificationFormErrorMessages } from "./shared";

export const ALERTS_MESSAGES: Localized<AlertsMessages> = { en, cs, es, hi, de, vi };
