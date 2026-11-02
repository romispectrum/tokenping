import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as pt } from "./pt";
import type { HomeMessages } from "./shared";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The homepage's copy (components/home), every language. Numbers and names that depend on the deployment (networks,
// channels, price, payment network) arrive as arguments, so the visible text, the metadata and the JSON-LD agree.
// Paragraphs with links take a function per link and place it in their own word order. The page is short on
// purpose: each section says one thing next to its visual; the guides and the privacy page carry the detail. It
// says what alerts cost and leaves it there: nothing on the page is described by what it does not cost.

export type { HomeMessages } from "./shared";

export const HOME_MESSAGES: Localized<HomeMessages> = { en, cs, es, hi, de, vi, fr, pt };
