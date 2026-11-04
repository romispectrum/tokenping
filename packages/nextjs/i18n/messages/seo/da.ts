import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: health factor-alarmer for Aave og Morpho",
  defaultDescription: `Alarmer, når din health factor på Aave eller Morpho falder under en tærskel, du selv vælger, på ${networks} netværk, tjekket hvert ${minutes}. minut.`,
  organizationDescription:
    "Tokenping sender en besked, når health factor for en position på Aave V3, Aave V4, Morpho Blue eller Morpho Midnight falder under den tærskel, som ejeren har sat.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenpings blog (på dansk)",
  postOgAlt: title => `${title} (Tokenpings guide om Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenpings guide om Morpho)`,
  siteOgTitle: channels => `Health factor-alarmer for Aave og Morpho via ${channels}`,
  siteOgFooter: "Tokenping · Aave og Morpho",
  postOgFooter: "Tokenping · Guider om Aave V3",
  morphoPostOgFooter: "Tokenping · Guider om Morpho",
};
