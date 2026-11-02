import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: alertes de facteur de santé Aave et Morpho",
  defaultDescription: `Des alertes quand votre facteur de santé Aave ou Morpho passe sous le seuil que vous choisissez, sur ${networks} réseaux, vérifié toutes les ${minutes} minutes.`,
  organizationDescription:
    "Tokenping envoie un message quand le facteur de santé d'une position Aave V3, Aave V4, Morpho Blue ou Morpho Midnight passe sous le seuil fixé par son titulaire.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog Tokenping (en français)",
  postOgAlt: title => `${title} (guide Aave V3 de Tokenping)`,
  morphoPostOgAlt: title => `${title} (guide Morpho de Tokenping)`,
  siteOgTitle: channels => `Alertes de facteur de santé Aave et Morpho par ${channels}`,
  siteOgFooter: "Tokenping · Aave et Morpho",
  postOgFooter: "Tokenping · Guides Aave V3",
  morphoPostOgFooter: "Tokenping · Guides Morpho",
};
