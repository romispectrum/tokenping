import { type SeoMessages, minutes, networks } from "./shared";

// The channels arrive joined ("Signal és e-mail") from a fixed set of names, so each gets its written-out suffix.
const ON_CHANNEL: Record<string, string> = { Signal: "Signalon", Telegram: "Telegramon", "e-mail": "e-mailben" };
const onChannels = (channels: string) => channels.replace(/Signal|Telegram|e-mail/g, name => ON_CHANNEL[name]);

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: Aave és Morpho health factor-riasztások",
  defaultDescription: `Riasztás, ha az Aave vagy Morpho health factorod az általad választott küszöbérték alá esik, ${networks} hálózaton, ${minutes} percenkénti ellenőrzéssel.`,
  organizationDescription:
    "A Tokenping üzenetet küld, ha egy Aave V3, Aave V4, Morpho Blue vagy Morpho Midnight health factor a tulajdonosa által beállított küszöbérték alá esik.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Tokenping blog (magyar)",
  postOgAlt: title => `${title} (Tokenping Aave V3 útmutató)`,
  morphoPostOgAlt: title => `${title} (Tokenping Morpho-útmutató)`,
  siteOgTitle: channels => `Aave és Morpho health factor-riasztások ${onChannels(channels)}`,
  siteOgFooter: "Tokenping · Aave és Morpho",
  postOgFooter: "Tokenping · Aave V3 útmutatók",
  morphoPostOgFooter: "Tokenping · Morpho-útmutatók",
};
