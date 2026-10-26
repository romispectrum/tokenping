/**
 * When each page's own content last changed (YYYY-MM-DD): the sitemap's lastmod, and the date the privacy page shows.
 * Move a date in the same commit as the change it dates, and only for a change a reader would notice: a date that
 * moves without one teaches search engines to ignore it. The blog's dates come from its posts.
 */
export const PAGE_UPDATED = {
  home: "2026-10-20",
  dashboard: "2026-10-19",
  morpho: "2026-10-25",
  /** The Morpho disclosures were added on 25 October 2026. */
  privacy: "2026-10-25",
} as const;
