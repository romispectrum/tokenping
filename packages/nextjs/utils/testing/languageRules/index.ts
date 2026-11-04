import { RULES as cs } from "./cs";
import { RULES as da } from "./da";
import { RULES as de } from "./de";
import { RULES as en } from "./en";
import { RULES as es } from "./es";
import { RULES as fr } from "./fr";
import { RULES as hi } from "./hi";
import { RULES as hr } from "./hr";
import { RULES as hu } from "./hu";
import { RULES as id } from "./id";
import { RULES as it } from "./it";
import { RULES as nl } from "./nl";
import { RULES as pl } from "./pl";
import { RULES as pt } from "./pt";
import { RULES as ro } from "./ro";
import { RULES as sl } from "./sl";
import { RULES as sr } from "./sr";
import { RULES as sv } from "./sv";
import { RULES as tr } from "./tr";
import type { LanguageRules } from "./types";
import { RULES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

export type { BannedPattern, LanguageRules } from "./types";

/** Every language's copy rules; a new language is a type error here until it has its file. */
export const LANGUAGE_RULES: Localized<LanguageRules> = {
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
};
