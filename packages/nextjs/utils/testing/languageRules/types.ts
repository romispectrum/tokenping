// The copy rules of each language, for the tests: the content lint (content/blog/content.test.ts) and the page tests
// (FREE_WORDS in utils/testing/copyRules.ts). One file per language; docs/i18n.md has the voice they enforce.

export type BannedPattern = {
  pattern: RegExp;
  reason: string;
  /** Stale claims may be quoted to correct them ('aave.com still says "close factor is 0.5"'); claims about us not. */
  allowQuoted?: boolean;
};

export type LanguageRules = {
  /** The last line of every post, in italics. */
  disclaimer: string;
  sourcesHeading: string;
  /** How a source says when it was read: "(fetched 14 Oct 2026)", "(načteno 14. října 2026)". */
  fetchedDate: RegExp;
  /** How the fetched date reads, for the report. */
  fetchedFormat: string;
  /** The language's words for "free": never in content or on a page. */
  freeWords: RegExp;
  /** Phrases this language must not use, on top of the English list every language gets. */
  bannedPatterns: readonly BannedPattern[];
  /**
   * How readingMinutes is checked: words per minute (230 when left out), and whether words are found with
   * Intl.Segmenter instead of spaces, for a language written without spaces between words (Thai, Chinese, Japanese).
   */
  reading?: { wordsPerMinute?: number; segmentWords?: boolean };
};
