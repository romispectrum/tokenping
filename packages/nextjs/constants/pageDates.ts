import { isMorphoEnabled } from "~~/config/morpho";

/**
 * When each page's own content last changed (YYYY-MM-DD): the sitemap's lastmod, and the date the privacy page shows.
 * Move a date in the same commit as the change it dates, and only for a change a reader would notice: a date that
 * moves without one teaches search engines to ignore it. The blog's dates come from its posts.
 */
export const PAGE_UPDATED = {
  home: "2026-10-20",
  dashboard: "2026-10-19",
  morpho: "2026-10-25",
} as const;

/** The privacy page's date: its Morpho disclosures, added on 25 October 2026, show only while Morpho is enabled. */
export const privacyUpdated = () => (isMorphoEnabled() ? "2026-10-25" : "2026-10-19");
