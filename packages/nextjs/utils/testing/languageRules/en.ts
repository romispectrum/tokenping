import type { LanguageRules } from "./types";

const DISCLAIMER = "Educational content, not financial advice. Alerts reduce risk; they do not prevent liquidation.";

const FETCHED_DATE = /\bfetched (?:on )?\d{1,2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b/i;

export const RULES: LanguageRules = {
  disclaimer: DISCLAIMER,
  sourcesHeading: "Sources",
  fetchedDate: FETCHED_DATE,
  fetchedFormat: "fetched <d Mon yyyy>",
  freeWords: /\bfree\b/i,
  bannedPatterns: [],
};
