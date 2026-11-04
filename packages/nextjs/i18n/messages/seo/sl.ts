import { type SeoMessages, minutes, networks } from "./shared";
import { plural } from "~~/i18n/format";

/** "na 29 omrežjih", "na 1 omrežju". */
const onNetworks = plural("sl", networks, { one: `na ${networks} omrežju`, other: `na ${networks} omrežjih` });

/** "vsakih 5 minut", "vsaki 2 minuti". */
const everyMinutes = plural("sl", minutes, {
  one: `vsako ${minutes} minuto`,
  two: `vsaki ${minutes} minuti`,
  few: `vsake ${minutes} minute`,
  other: `vsakih ${minutes} minut`,
});

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: opozorila za health factor v Aave in Morpho",
  defaultDescription: `Opozorilo, ko tvoj health factor v Aave ali Morpho pade pod prag, ki ga izbereš, ${onNetworks}, s preverjanjem ${everyMinutes}.`,
  organizationDescription:
    "Tokenping pošlje sporočilo, ko health factor v Aave V3, Aave V4, Morpho Blue ali Morpho Midnight pade pod prag, ki ga je nastavil lastnik.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog Tokenping (slovenščina)",
  postOgAlt: title => `${title} (Tokenping, vodnik za Aave V3)`,
  morphoPostOgAlt: title => `${title} (Tokenping, vodnik za Morpho)`,
  siteOgTitle: channels => `Opozorila za health factor v Aave in Morpho: ${channels}`,
  siteOgFooter: "Tokenping · Aave in Morpho",
  postOgFooter: "Tokenping · vodniki za Aave V3",
  morphoPostOgFooter: "Tokenping · vodniki za Morpho",
};
