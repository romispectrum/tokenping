import { type SeoMessages, minutes, networks } from "./shared";
import { plural } from "~~/i18n/format";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: health factor-varsler for Aave og Morpho",
  defaultDescription: `Varsler når health factor på Aave eller Morpho faller under en terskel du velger, på ${networks} nettverk, sjekket ${plural("nb", minutes, { one: "hvert minutt", other: `hvert ${minutes}. minutt` })}.`,
  organizationDescription:
    "Tokenping sender en melding når health factor for en posisjon på Aave V3, Aave V4, Morpho Blue eller Morpho Midnight faller under terskelen eieren har satt.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenpings blogg (på norsk)",
  postOgAlt: title => `${title} (Tokenpings guide om Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenpings guide om Morpho)`,
  siteOgTitle: channels => `Health factor-varsler for Aave og Morpho via ${channels}`,
  siteOgFooter: "Tokenping · Aave og Morpho",
  postOgFooter: "Tokenping · Guider om Aave V3",
  morphoPostOgFooter: "Tokenping · Guider om Morpho",
};
