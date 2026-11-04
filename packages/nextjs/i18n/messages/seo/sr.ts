import { type SeoMessages, minutes, networks } from "./shared";
import { hrSrChannelsGenitive } from "~~/i18n/format";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: Aave i Morpho upozorenja za health factor",
  defaultDescription: `Upozorenje kad health factor tvoje pozicije na protokolu Aave ili Morpho padne ispod praga koji izabereš, na ${networks} mreža, provera na svakih ${minutes} minuta.`,
  organizationDescription:
    "Tokenping šalje poruku kad health factor pozicije na protokolima Aave V3, Aave V4, Morpho Blue ili Morpho Midnight padne ispod praga koji je postavio njen vlasnik.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping blog (na srpskom)",
  postOgAlt: title => `${title} (Tokenping vodič za Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenping vodič za Morpho)`,
  siteOgTitle: channels => `Aave i Morpho upozorenja za health factor putem ${hrSrChannelsGenitive(channels)}`,
  siteOgFooter: "Tokenping · Aave i Morpho",
  postOgFooter: "Tokenping · vodiči za Aave V3",
  morphoPostOgFooter: "Tokenping · vodiči za Morpho",
};
