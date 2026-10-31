import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: Aave और Morpho हेल्थ फ़ैक्टर अलर्ट",
  defaultDescription: `अलर्ट, जब आपका Aave या Morpho हेल्थ फ़ैक्टर आपकी चुनी हुई सीमा से नीचे गिरे, ${networks} नेटवर्क पर, हर ${minutes} मिनट में जांच।`,
  organizationDescription:
    "Tokenping तब संदेश भेजता है, जब Aave V3, Aave V4, Morpho Blue या Morpho Midnight का हेल्थ फ़ैक्टर उस सीमा से नीचे गिरता है, जो उसके मालिक ने तय की है।",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping ब्लॉग (हिन्दी में)",
  postOgAlt: title => `${title} (Tokenping की Aave V3 गाइड)`,
  morphoPostOgAlt: title => `${title} (Tokenping की Morpho गाइड)`,
  siteOgTitle: channels => `${channels} पर Aave और Morpho हेल्थ फ़ैक्टर अलर्ट`,
  siteOgFooter: "Tokenping · Aave और Morpho",
  postOgFooter: "Tokenping · Aave V3 गाइड",
  morphoPostOgFooter: "Tokenping · Morpho गाइड",
};
