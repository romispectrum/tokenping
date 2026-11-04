import { type SeoMessages, minutes, networks } from "./shared";
import { plural } from "~~/i18n/format";

const inNetworks = plural("uk", networks, {
  one: `у ${networks} мережі`,
  few: `у ${networks} мережах`,
  many: `у ${networks} мережах`,
  other: `у ${networks} мережах`,
});

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: сповіщення про health factor в Aave і Morpho",
  defaultDescription: `Сповіщення, коли health factor вашої позиції в Aave або Morpho падає нижче обраного порогу, ${inNetworks}, перевірка кожні ${minutes} хвилин.`,
  organizationDescription:
    "Tokenping надсилає повідомлення, коли health factor позиції в Aave V3, Aave V4, Morpho Blue або Morpho Midnight падає нижче порогу, який встановив її власник.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Блог Tokenping (українською)",
  postOgAlt: title => `${title} (посібник Tokenping з Aave V3)`,
  morphoPostOgAlt: title => `${title} (посібник Tokenping з Morpho)`,
  siteOgTitle: channels => `Сповіщення про health factor в Aave і Morpho через ${channels}`,
  siteOgFooter: "Tokenping · Aave і Morpho",
  postOgFooter: "Tokenping · посібники з Aave V3",
  morphoPostOgFooter: "Tokenping · посібники з Morpho",
};
