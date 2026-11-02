import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as it } from "./it";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import type { NotificationMessages } from "./shared";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The alert itself, sent by email, Signal and Telegram in the language the alert was saved in. The numbers arrive
// formatted for that language (i18n/format formatDecimal); the timestamp too.

export type {
  MaturityFields,
  MorphoAlertFields,
  MorphoMarketName,
  NotificationMessages,
  TestFields,
  TestPosition,
} from "./shared";

export const NOTIFICATION_MESSAGES: Localized<NotificationMessages> = { en, cs, es, hi, de, vi, fr, pt, it, pl };
