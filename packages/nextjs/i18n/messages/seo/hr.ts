import { type SeoMessages, minutes, networks } from "./shared";
import { hrSrChannelsGenitive } from "~~/i18n/format";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: upozorenja za health factor na Aaveu i Morphu",
  defaultDescription: `Upozorenje kad health factor tvoje pozicije na Aaveu ili Morphu padne ispod praga koji odabereš, na ${networks} mreža, provjera svakih ${minutes} minuta.`,
  organizationDescription:
    "Tokenping šalje poruku kad health factor pozicije na Aaveu V3, Aaveu V4, Morphu Blue ili Morphu Midnight padne ispod praga koji je postavio njezin vlasnik.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping blog (na hrvatskom)",
  postOgAlt: title => `${title} (Tokenpingov vodič za Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenpingov vodič za Morpho)`,
  siteOgTitle: channels => `Upozorenja za health factor na Aaveu i Morphu putem ${hrSrChannelsGenitive(channels)}`,
  siteOgFooter: "Tokenping · Aave i Morpho",
  postOgFooter: "Tokenping · vodiči za Aave V3",
  morphoPostOgFooter: "Tokenping · vodiči za Morpho",
};
