import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: alertas de fator de saúde do Aave e do Morpho",
  defaultDescription: `Alertas quando o seu fator de saúde no Aave ou no Morpho cai abaixo de um limite que você escolhe, em ${networks} redes, verificado a cada ${minutes} minutos.`,
  organizationDescription:
    "O Tokenping envia uma mensagem quando o fator de saúde de uma posição no Aave V3, Aave V4, Morpho Blue ou Morpho Midnight cai abaixo do limite definido pelo titular.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog do Tokenping (em português)",
  postOgAlt: title => `${title} (guia do Aave V3 do Tokenping)`,
  morphoPostOgAlt: title => `${title} (guia do Morpho do Tokenping)`,
  siteOgTitle: channels => `Alertas de fator de saúde do Aave e do Morpho por ${channels}`,
  siteOgFooter: "Tokenping · Aave e Morpho",
  postOgFooter: "Tokenping · Guias do Aave V3",
  morphoPostOgFooter: "Tokenping · Guias do Morpho",
};
