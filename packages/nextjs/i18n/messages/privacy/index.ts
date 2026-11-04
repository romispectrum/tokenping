import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as hr } from "./hr";
import { MESSAGES as hu } from "./hu";
import { MESSAGES as id } from "./id";
import { MESSAGES as it } from "./it";
import { MESSAGES as nl } from "./nl";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import { MESSAGES as ro } from "./ro";
import type { PrivacyMessages } from "./shared";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The privacy page (components/pages/PrivacyPage.tsx). Every fact, processor and caveat appears in every language;
// the Czech and the Spanish are translations, never summaries. Rich text is split into the words around each link.

export type { PrivacyMessages, PrivacyProcessor } from "./shared";

export const PRIVACY_MESSAGES: Localized<PrivacyMessages> = {
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
};
