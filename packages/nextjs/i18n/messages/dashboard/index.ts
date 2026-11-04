import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as id } from "./id";
import { MESSAGES as it } from "./it";
import { MESSAGES as nl } from "./nl";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import { MESSAGES as ro } from "./ro";
import type { DashboardMessages } from "./shared";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The dashboard (/aave): the server-rendered page around the wallet island, the positions, the paywall and its payment
// flow. Amounts and health factors arrive already formatted: the dashboard keeps the app's number format in every
// language, so only the words change.

export type { DashboardMessages, GateMessages } from "./shared";

export const DASHBOARD_MESSAGES: Localized<DashboardMessages> = {
  en,
  cs,
  es,
  hi,
  de,
  vi,
  fr,
  pt,
  it,
  pl,
  tr,
  id,
  nl,
  ro,
};
