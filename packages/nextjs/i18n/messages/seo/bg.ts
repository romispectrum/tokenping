import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: известия за health factor в Aave и Morpho",
  defaultDescription: `Известие, когато health factor на позицията ви в Aave или Morpho падне под избран от вас праг, в ${networks} мрежи, с проверка на всеки ${minutes} минути.`,
  organizationDescription:
    "Tokenping изпраща съобщение, когато health factor на позиция в Aave V3, Aave V4, Morpho Blue или Morpho Midnight падне под прага, зададен от нейния собственик.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Блогът на Tokenping (на български)",
  postOgAlt: title => `${title} (ръководство на Tokenping за Aave V3)`,
  morphoPostOgAlt: title => `${title} (ръководство на Tokenping за Morpho)`,
  siteOgTitle: channels => `Известия за health factor в Aave и Morpho чрез ${channels}`,
  siteOgFooter: "Tokenping · Aave и Morpho",
  postOgFooter: "Tokenping · ръководства за Aave V3",
  morphoPostOgFooter: "Tokenping · ръководства за Morpho",
};
