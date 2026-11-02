import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as it } from "./it";
import { MESSAGES as pt } from "./pt";
import type { BlogMessages } from "./shared";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The blog around the articles: /blog, a post's header, byline and end area, the article components (ShortAnswer,
// ScopeNote, Callout, AlertPrice, the table regions) and the liquidation price calculator. The articles themselves
// are content/blog/*.mdx, content/blog/cs/*.mdx and content/blog/es/*.mdx. Rich text is split into the words around
// the markup, so each language keeps its own word order.

export type { BlogMessages } from "./shared";

export const BLOG_MESSAGES: Localized<BlogMessages> = { en, cs, es, hi, de, vi, fr, pt, it };
