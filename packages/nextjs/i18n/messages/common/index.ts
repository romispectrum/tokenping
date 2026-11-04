import { MESSAGES as bg } from "./bg";
import { MESSAGES as cs } from "./cs";
import { MESSAGES as da } from "./da";
import { MESSAGES as de } from "./de";
import { MESSAGES as el } from "./el";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fil } from "./fil";
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
import { MESSAGES as ru } from "./ru";
import type { CommonMessages } from "./shared";
import { MESSAGES as sl } from "./sl";
import { MESSAGES as sr } from "./sr";
import { MESSAGES as sv } from "./sv";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as uk } from "./uk";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The site chrome in every language: the beta strip and skip link, the header, the footer, the shared UI primitives,
// the wallet button, the developer faucet and the 404. Rich text is split into the words around the markup, so each
// language keeps its own word order.

export type { CommonMessages } from "./shared";

export const COMMON_MESSAGES: Localized<CommonMessages> = {
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
  fil,
  bg,
  ru,
  uk,
  el,
};
