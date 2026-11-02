import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: alerty o współczynniku zdrowia w Aave i Morpho",
  defaultDescription: `Alert, gdy współczynnik zdrowia twojej pozycji w Aave lub Morpho spadnie poniżej wybranego progu, w ${networks} sieciach, sprawdzany co ${minutes} minut.`,
  organizationDescription:
    "Tokenping wysyła wiadomość, gdy współczynnik zdrowia pozycji w Aave V3, Aave V4, Morpho Blue lub Morpho Midnight spadnie poniżej progu ustawionego przez jej właściciela.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog Tokenping (po polsku)",
  postOgAlt: title => `${title} (poradnik Tokenping o Aave V3)`,
  morphoPostOgAlt: title => `${title} (poradnik Tokenping o Morpho)`,
  siteOgTitle: channels => `Alerty o współczynniku zdrowia w Aave i Morpho przez ${channels}`,
  siteOgFooter: "Tokenping · Aave i Morpho",
  postOgFooter: "Tokenping · poradniki o Aave V3",
  morphoPostOgFooter: "Tokenping · poradniki o Morpho",
};
