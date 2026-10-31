import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
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
};
