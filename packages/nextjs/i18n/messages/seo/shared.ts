import { SUPPORTED_NETWORKS } from "~~/config/networks";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";

export type SeoMessages = {
  defaultTitle: string;
  defaultDescription: string;
  organizationDescription: string;
  /** The site card's alt text: what the card shows, its headline and the brand. */
  siteOgAlt: (title: string) => string;
  rssTitle: string;
  /** The alt text of a post's social card. */
  postOgAlt: (title: string) => string;
  /** The same for a Morpho guide. */
  morphoPostOgAlt: (title: string) => string;
  /** The site card's headline, with the alert channels joined ("Signal and email"). */
  siteOgTitle: (channels: string) => string;
  /** The footer line of the site card and of a post's card. */
  siteOgFooter: string;
  postOgFooter: string;
  morphoPostOgFooter: string;
};

export const networks = SUPPORTED_NETWORKS.length;
export const minutes = NOTIFICATION_CHECK_INTERVAL_MINUTES;
