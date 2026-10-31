import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
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
};
