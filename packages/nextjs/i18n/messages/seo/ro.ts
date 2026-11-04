import { type SeoMessages, minutes, networks } from "./shared";
import { plural } from "~~/i18n/format";

const onNetworks = plural("ro", networks, {
  one: `pe ${networks} rețea`,
  few: `pe ${networks} rețele`,
  other: `pe ${networks} de rețele`,
});

const everyMinutes = plural("ro", minutes, {
  one: "în fiecare minut",
  few: `la fiecare ${minutes} minute`,
  other: `la fiecare ${minutes} de minute`,
});

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: alerte de health factor pentru Aave și Morpho",
  defaultDescription: `Alerte când health factor-ul tău pe Aave sau Morpho scade sub un prag ales de tine, ${onNetworks}, verificat ${everyMinutes}.`,
  organizationDescription:
    "Tokenping trimite un mesaj când health factor-ul unei poziții pe Aave V3, Aave V4, Morpho Blue sau Morpho Midnight scade sub pragul setat de proprietarul ei.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blogul Tokenping (în limba română)",
  postOgAlt: title => `${title} (ghid Tokenping despre Aave V3)`,
  morphoPostOgAlt: title => `${title} (ghid Tokenping despre Morpho)`,
  siteOgTitle: channels => `Alerte de health factor pentru Aave și Morpho prin ${channels}`,
  siteOgFooter: "Tokenping · Aave și Morpho",
  postOgFooter: "Tokenping · Ghiduri despre Aave V3",
  morphoPostOgFooter: "Tokenping · Ghiduri despre Morpho",
};
