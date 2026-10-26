import { SUPPORTED_NETWORKS } from "~~/config/networks";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Localized } from "~~/i18n/locales";

// Site-wide metadata strings: the default title and description, the social card's alt text, the RSS title.

type SeoMessages = {
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

const networks = SUPPORTED_NETWORKS.length;
const minutes = NOTIFICATION_CHECK_INTERVAL_MINUTES;

export const SEO_MESSAGES: Localized<SeoMessages> = {
  en: {
    defaultTitle: "Tokenping: Aave and Morpho health factor alerts",
    defaultDescription: `Alerts when your Aave or Morpho health factor drops below a threshold you choose, on ${networks} networks, checked every ${minutes} minutes.`,
    organizationDescription:
      "Tokenping sends a message when an Aave V3, Aave V4, Morpho Blue or Morpho Midnight health factor drops below the threshold its owner set.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Tokenping blog",
    postOgAlt: title => `${title} (Tokenping Aave V3 guide)`,
    morphoPostOgAlt: title => `${title} (Tokenping Morpho guide)`,
    siteOgTitle: channels => `Aave and Morpho health factor alerts on ${channels}`,
    siteOgFooter: "Tokenping · Aave and Morpho",
    postOgFooter: "Tokenping · Aave V3 guides",
    morphoPostOgFooter: "Tokenping · Morpho guides",
  },
  cs: {
    defaultTitle: "Tokenping: upozornění na health factor na Aave a Morpho",
    defaultDescription: `Upozornění, když health factor vaší pozice na Aave či Morpho klesne pod zvolený práh, na ${networks} sítích, s kontrolou každých ${minutes} minut.`,
    organizationDescription:
      "Tokenping pošle zprávu, když health factor pozice na Aave V3, Aave V4, Morpho Blue nebo Morpho Midnight klesne pod práh, který si její majitel nastavil.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Tokenping blog (česky)",
    postOgAlt: title => `${title} (průvodce Aave V3 od Tokenpingu)`,
    morphoPostOgAlt: title => `${title} (průvodce Morpho od Tokenpingu)`,
    siteOgTitle: channels => `Upozornění na health factor na Aave a Morpho přes ${channels}`,
    siteOgFooter: "Tokenping · Aave a Morpho",
    postOgFooter: "Tokenping · průvodci Aave V3",
    morphoPostOgFooter: "Tokenping · průvodci Morpho",
  },
};
