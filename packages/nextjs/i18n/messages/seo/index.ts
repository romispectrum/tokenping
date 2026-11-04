import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as hu } from "./hu";
import { MESSAGES as id } from "./id";
import { MESSAGES as it } from "./it";
import { MESSAGES as nl } from "./nl";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import { MESSAGES as ro } from "./ro";
import type { SeoMessages } from "./shared";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// Site-wide metadata strings: the default title and description, the social card's alt text, the RSS title.

export type { SeoMessages } from "./shared";

export const SEO_MESSAGES: Localized<SeoMessages> = { en, cs, es, hi, de, vi, fr, pt, it, pl, tr, id, nl, ro, hu };
