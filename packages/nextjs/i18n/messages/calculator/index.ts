import { MESSAGES as cs } from "./cs";
import { MESSAGES as de } from "./de";
import { MESSAGES as en } from "./en";
import { MESSAGES as es } from "./es";
import { MESSAGES as fr } from "./fr";
import { MESSAGES as hi } from "./hi";
import { MESSAGES as it } from "./it";
import { MESSAGES as pl } from "./pl";
import { MESSAGES as pt } from "./pt";
import type { CalculatorMessages } from "./shared";
import { MESSAGES as tr } from "./tr";
import { MESSAGES as vi } from "./vi";
import type { Localized } from "~~/i18n/locales";

// The calculator keeps the app's number format in every language ("$1,445.78", "1.66", "39.8%"), like the
// dashboard, and its inputs take a dot for decimals; only the words change.

export type { CalculatorMessages } from "./shared";

export const CALCULATOR_MESSAGES: Localized<CalculatorMessages> = { en, cs, es, hi, de, vi, fr, pt, it, pl, tr };
