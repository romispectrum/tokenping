import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: Aave ve Morpho sağlık faktörü uyarıları",
  defaultDescription: `Aave veya Morpho sağlık faktörünüz seçtiğiniz eşiğin altına düştüğünde uyarı; ${networks} ağda, her ${minutes} dakikada bir kontrol edilir.`,
  organizationDescription:
    "Tokenping, bir Aave V3, Aave V4, Morpho Blue veya Morpho Midnight sağlık faktörü, sahibinin belirlediği eşiğin altına düştüğünde mesaj gönderir.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping blogu (Türkçe)",
  postOgAlt: title => `${title} (Tokenping Aave V3 rehberi)`,
  morphoPostOgAlt: title => `${title} (Tokenping Morpho rehberi)`,
  siteOgTitle: channels => `${channels} üzerinden Aave ve Morpho sağlık faktörü uyarıları`,
  siteOgFooter: "Tokenping · Aave ve Morpho",
  postOgFooter: "Tokenping · Aave V3 rehberleri",
  morphoPostOgFooter: "Tokenping · Morpho rehberleri",
};
