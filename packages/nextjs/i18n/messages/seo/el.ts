import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: ειδοποιήσεις health factor για Aave και Morpho",
  defaultDescription: `Ειδοποιήσεις όταν το health factor σας στο Aave ή στο Morpho πέσει κάτω από ένα όριο που επιλέγετε, σε ${networks} δίκτυα, με έλεγχο κάθε ${minutes} λεπτά.`,
  organizationDescription:
    "Το Tokenping στέλνει μήνυμα όταν το health factor μιας θέσης στο Aave V3, Aave V4, Morpho Blue ή Morpho Midnight πέσει κάτω από το όριο που όρισε ο κάτοχός της.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Ιστολόγιο Tokenping (στα ελληνικά)",
  postOgAlt: title => `${title} (οδηγός του Tokenping για το Aave V3)`,
  morphoPostOgAlt: title => `${title} (οδηγός του Tokenping για το Morpho)`,
  siteOgTitle: channels => `Ειδοποιήσεις health factor για Aave και Morpho μέσω ${channels}`,
  siteOgFooter: "Tokenping · Aave και Morpho",
  postOgFooter: "Tokenping · Οδηγοί για το Aave V3",
  morphoPostOgFooter: "Tokenping · Οδηγοί για το Morpho",
};
