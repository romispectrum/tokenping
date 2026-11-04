import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: mga health factor alert para sa Aave at Morpho",
  defaultDescription: `Mga alerto kapag bumaba ang health factor mo sa Aave o Morpho sa threshold na pinili mo, sa ${networks} network, tinitingnan bawat ${minutes} minuto.`,
  organizationDescription:
    "Nagpapadala ang Tokenping ng mensahe kapag bumaba ang health factor ng isang posisyon sa Aave V3, Aave V4, Morpho Blue o Morpho Midnight sa threshold na itinakda ng may-ari nito.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog ng Tokenping (Filipino)",
  postOgAlt: title => `${title} (gabay ng Tokenping sa Aave V3)`,
  morphoPostOgAlt: title => `${title} (gabay ng Tokenping sa Morpho)`,
  siteOgTitle: channels => `Mga health factor alert para sa Aave at Morpho sa ${channels}`,
  siteOgFooter: "Tokenping · Aave at Morpho",
  postOgFooter: "Tokenping · mga gabay sa Aave V3",
  morphoPostOgFooter: "Tokenping · mga gabay sa Morpho",
};
