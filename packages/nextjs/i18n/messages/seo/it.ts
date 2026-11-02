import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: avvisi sul fattore di salute di Aave e Morpho",
  defaultDescription: `Avvisi quando il tuo fattore di salute su Aave o Morpho scende sotto una soglia che scegli tu, su ${networks} reti, controllato ogni ${minutes} minuti.`,
  organizationDescription:
    "Tokenping invia un messaggio quando il fattore di salute di una posizione su Aave V3, Aave V4, Morpho Blue o Morpho Midnight scende sotto la soglia impostata dal titolare.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog di Tokenping (in italiano)",
  postOgAlt: title => `${title} (guida di Tokenping su Aave V3)`,
  morphoPostOgAlt: title => `${title} (guida di Tokenping su Morpho)`,
  siteOgTitle: channels => `Avvisi sul fattore di salute di Aave e Morpho via ${channels}`,
  siteOgFooter: "Tokenping · Aave e Morpho",
  postOgFooter: "Tokenping · Guide su Aave V3",
  morphoPostOgFooter: "Tokenping · Guide su Morpho",
};
