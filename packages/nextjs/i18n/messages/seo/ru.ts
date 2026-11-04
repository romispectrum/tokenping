import { type SeoMessages, minutes, networks } from "./shared";
import { plural } from "~~/i18n/format";

const onNetworks = plural("ru", networks, { one: `в ${networks} сети`, other: `в ${networks} сетях` });
const everyMinutes = plural("ru", minutes, {
  one: `каждую ${minutes} минуту`,
  few: `каждые ${minutes} минуты`,
  many: `каждые ${minutes} минут`,
  other: `каждые ${minutes} минуты`,
});

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: оповещения о health factor в Aave и Morpho",
  defaultDescription: `Оповещение, когда health factor вашей позиции в Aave или Morpho опускается ниже выбранного порога, ${onNetworks}, проверка ${everyMinutes}.`,
  organizationDescription:
    "Tokenping отправляет сообщение, когда health factor позиции в Aave V3, Aave V4, Morpho Blue или Morpho Midnight опускается ниже порога, заданного её владельцем.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Блог Tokenping (на русском)",
  postOgAlt: title => `${title} (руководство Tokenping по Aave V3)`,
  morphoPostOgAlt: title => `${title} (руководство Tokenping по Morpho)`,
  siteOgTitle: channels => `Оповещения о health factor в Aave и Morpho через ${channels}`,
  siteOgFooter: "Tokenping · Aave и Morpho",
  postOgFooter: "Tokenping · руководства по Aave V3",
  morphoPostOgFooter: "Tokenping · руководства по Morpho",
};
