import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: alertas del factor de salud en Aave y Morpho",
  defaultDescription: `Alertas cuando tu factor de salud en Aave o Morpho cae por debajo del umbral que elijas, en ${networks} redes, con revisión cada ${minutes} minutos.`,
  organizationDescription:
    "Tokenping envía un mensaje cuando el factor de salud de una posición en Aave V3, Aave V4, Morpho Blue o Morpho Midnight cae por debajo del umbral que fijó su titular.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog de Tokenping (en español)",
  postOgAlt: title => `${title} (guía de Aave V3 de Tokenping)`,
  morphoPostOgAlt: title => `${title} (guía de Morpho de Tokenping)`,
  siteOgTitle: channels => `Alertas del factor de salud en Aave y Morpho por ${channels}`,
  siteOgFooter: "Tokenping · Aave y Morpho",
  postOgFooter: "Tokenping · guías de Aave V3",
  morphoPostOgFooter: "Tokenping · guías de Morpho",
};
