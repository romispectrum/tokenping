import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: health factor-alerts voor Aave en Morpho",
  defaultDescription: `Alerts als je health factor op Aave of Morpho onder een drempel zakt die je zelf kiest, op ${networks} netwerken, elke ${minutes} minuten gecontroleerd.`,
  organizationDescription:
    "Tokenping stuurt een bericht als de health factor van een positie op Aave V3, Aave V4, Morpho Blue of Morpho Midnight onder de drempel zakt die de eigenaar heeft ingesteld.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping-blog (in het Nederlands)",
  postOgAlt: title => `${title} (Tokenping-gids over Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenping-gids over Morpho)`,
  siteOgTitle: channels => `Health factor-alerts voor Aave en Morpho via ${channels}`,
  siteOgFooter: "Tokenping · Aave en Morpho",
  postOgFooter: "Tokenping · Gidsen over Aave V3",
  morphoPostOgFooter: "Tokenping · Gidsen over Morpho",
};
