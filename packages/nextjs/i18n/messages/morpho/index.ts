import { MESSAGES as cs } from "./cs";
import { MESSAGES as da } from "./da";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as hr } from "./hr";
import { MESSAGES as hu } from "./hu";
import { MESSAGES as id } from "./id";
import { MESSAGES as it } from "./it";
import { MESSAGES as nb } from "./nb";
import { MESSAGES as nl } from "./nl";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import { MESSAGES as ro } from "./ro";
import type { MorphoMessages } from "./shared";
import { MESSAGES as sl } from "./sl";
import { MESSAGES as sr } from "./sr";
import { MESSAGES as sv } from "./sv";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The /morpho dashboard. Plain functional copy; the wording of the product pages around it is left to the SEO pass.
// Amounts in the dashboard keep the app's number format, as on /aave.

export type { MorphoMessages } from "./shared";

export const MORPHO_MESSAGES: Localized<MorphoMessages> = {
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
  hu,
  hr,
  sl,
  sr,
  sv,
  da,
  nb,
};
