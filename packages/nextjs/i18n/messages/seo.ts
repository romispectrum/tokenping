import { AAVE_MARKETS } from "~~/config/aaveConfig";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Localized } from "~~/i18n/locales";

// Site-wide metadata strings: the default title and description, the social card's alt text, the RSS title.

type SeoMessages = {
  defaultTitle: string;
  defaultDescription: string;
  organizationDescription: string;
  siteOgAlt: string;
  rssTitle: string;
  /** The alt text of a post's social card. */
  postOgAlt: (title: string) => string;
  /** The site card's headline, with the alert channels joined ("Signal and email"). */
  siteOgTitle: (channels: string) => string;
  /** The footer line of the site card and of a post's card. */
  siteOgFooter: string;
  postOgFooter: string;
};

const networks = AAVE_MARKETS.length;
const minutes = NOTIFICATION_CHECK_INTERVAL_MINUTES;

export const SEO_MESSAGES: Localized<SeoMessages> = {
  en: {
    defaultTitle: "Tokenping: Aave health factor alerts",
    defaultDescription: `Alerts when your Aave V3 health factor drops below a threshold you choose, on ${networks} networks, checked every ${minutes} minutes. The dashboard is free.`,
    organizationDescription:
      "Tokenping sends a message when an Aave V3 health factor drops below the threshold its owner set.",
    siteOgAlt: "Tokenping: Aave health factor alerts",
    rssTitle: "Tokenping blog",
    postOgAlt: title => `${title} (Tokenping Aave V3 guide)`,
    siteOgTitle: channels => `Aave health factor alerts on ${channels}`,
    siteOgFooter: "Tokenping · Aave V3",
    postOgFooter: "Tokenping · Aave V3 guides",
  },
  cs: {
    defaultTitle: "Tokenping: upozornění na Aave health factor",
    defaultDescription: `Upozornění, když health factor vaší pozice na Aave V3 klesne pod zvolený práh, na ${networks} sítích, s kontrolou každých ${minutes} minut. Přehled je zdarma.`,
    organizationDescription:
      "Tokenping pošle zprávu, když health factor pozice na Aave V3 klesne pod práh, který si její majitel nastavil.",
    siteOgAlt: "Tokenping: upozornění na Aave health factor",
    rssTitle: "Tokenping blog (česky)",
    postOgAlt: title => `${title} (průvodce Aave V3 od Tokenpingu)`,
    siteOgTitle: channels => `Upozornění na Aave health factor přes ${channels}`,
    siteOgFooter: "Tokenping · Aave V3",
    postOgFooter: "Tokenping · průvodci Aave V3",
  },
};
