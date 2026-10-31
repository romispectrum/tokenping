import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: Health-Factor-Alerts für Aave und Morpho",
  defaultDescription: `Alerts, wenn dein Health Factor auf Aave oder Morpho unter deinen Schwellenwert fällt, in ${networks} Netzwerken, alle ${minutes} Minuten geprüft.`,
  organizationDescription:
    "Tokenping sendet eine Nachricht, wenn der Health Factor einer Position auf Aave V3, Aave V4, Morpho Blue oder Morpho Midnight unter den Schwellenwert fällt, den ihr Inhaber festgelegt hat.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping-Blog (auf Deutsch)",
  postOgAlt: title => `${title} (Tokenping-Ratgeber zu Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenping-Ratgeber zu Morpho)`,
  siteOgTitle: channels => `Health-Factor-Alerts für Aave und Morpho über ${channels}`,
  siteOgFooter: "Tokenping · Aave und Morpho",
  postOgFooter: "Tokenping · Ratgeber zu Aave V3",
  morphoPostOgFooter: "Tokenping · Ratgeber zu Morpho",
};
