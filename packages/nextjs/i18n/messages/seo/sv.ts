import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: health factor-larm för Aave och Morpho",
  defaultDescription: `Larm när din health factor på Aave eller Morpho sjunker under ett tröskelvärde som du väljer, på ${networks} nätverk, kontrollerat var ${minutes} minuter.`,
  organizationDescription:
    "Tokenping skickar ett meddelande när health factor för en position på Aave V3, Aave V4, Morpho Blue eller Morpho Midnight sjunker under det tröskelvärde som ägaren har ställt in.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenpings blogg (på svenska)",
  postOgAlt: title => `${title} (Tokenpings guide om Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenpings guide om Morpho)`,
  siteOgTitle: channels => `Health factor-larm för Aave och Morpho via ${channels}`,
  siteOgFooter: "Tokenping · Aave och Morpho",
  postOgFooter: "Tokenping · Guider om Aave V3",
  morphoPostOgFooter: "Tokenping · Guider om Morpho",
};
