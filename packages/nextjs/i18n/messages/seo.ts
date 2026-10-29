import { SUPPORTED_NETWORKS } from "~~/config/networks";
import { NOTIFICATION_CHECK_INTERVAL_MINUTES } from "~~/constants/notifications";
import type { Localized } from "~~/i18n/locales";

// Site-wide metadata strings: the default title and description, the social card's alt text, the RSS title.

type SeoMessages = {
  defaultTitle: string;
  defaultDescription: string;
  organizationDescription: string;
  /** The site card's alt text: what the card shows, its headline and the brand. */
  siteOgAlt: (title: string) => string;
  rssTitle: string;
  /** The alt text of a post's social card. */
  postOgAlt: (title: string) => string;
  /** The same for a Morpho guide. */
  morphoPostOgAlt: (title: string) => string;
  /** The site card's headline, with the alert channels joined ("Signal and email"). */
  siteOgTitle: (channels: string) => string;
  /** The footer line of the site card and of a post's card. */
  siteOgFooter: string;
  postOgFooter: string;
  morphoPostOgFooter: string;
};

const networks = SUPPORTED_NETWORKS.length;
const minutes = NOTIFICATION_CHECK_INTERVAL_MINUTES;

export const SEO_MESSAGES: Localized<SeoMessages> = {
  en: {
    defaultTitle: "Tokenping: Aave and Morpho health factor alerts",
    defaultDescription: `Alerts when your Aave or Morpho health factor drops below a threshold you choose, on ${networks} networks, checked every ${minutes} minutes.`,
    organizationDescription:
      "Tokenping sends a message when an Aave V3, Aave V4, Morpho Blue or Morpho Midnight health factor drops below the threshold its owner set.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Tokenping blog",
    postOgAlt: title => `${title} (Tokenping Aave V3 guide)`,
    morphoPostOgAlt: title => `${title} (Tokenping Morpho guide)`,
    siteOgTitle: channels => `Aave and Morpho health factor alerts on ${channels}`,
    siteOgFooter: "Tokenping · Aave and Morpho",
    postOgFooter: "Tokenping · Aave V3 guides",
    morphoPostOgFooter: "Tokenping · Morpho guides",
  },
  cs: {
    defaultTitle: "Tokenping: upozornění na health factor na Aave a Morpho",
    defaultDescription: `Upozornění, když health factor vaší pozice na Aave či Morpho klesne pod zvolený práh, na ${networks} sítích, s kontrolou každých ${minutes} minut.`,
    organizationDescription:
      "Tokenping pošle zprávu, když health factor pozice na Aave V3, Aave V4, Morpho Blue nebo Morpho Midnight klesne pod práh, který si její majitel nastavil.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Tokenping blog (česky)",
    postOgAlt: title => `${title} (průvodce Aave V3 od Tokenpingu)`,
    morphoPostOgAlt: title => `${title} (průvodce Morpho od Tokenpingu)`,
    siteOgTitle: channels => `Upozornění na health factor na Aave a Morpho přes ${channels}`,
    siteOgFooter: "Tokenping · Aave a Morpho",
    postOgFooter: "Tokenping · průvodci Aave V3",
    morphoPostOgFooter: "Tokenping · průvodci Morpho",
  },
  es: {
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
  },
  hi: {
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
  },
  de: {
    defaultTitle: "Tokenping: Health-Factor-Alerts für Aave und Morpho",
    defaultDescription: `Alerts, wenn dein Health Factor auf Aave oder Morpho unter deinen Schwellenwert fällt, in ${networks} Netzwerken, alle ${minutes} Minuten geprüft.`,
    organizationDescription:
      "Tokenping sendet eine Nachricht, wenn der Health Factor einer Position auf Aave V3, Aave V4, Morpho Blue oder Morpho Midnight unter den Schwellenwert fällt, den ihr Inhaber festgelegt hat.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Tokenping-Blog (auf Deutsch)",
    postOgAlt: title => `${title} (Tokenping-Ratgeber zu Aave V3)`,
    morphoPostOgAlt: title => `${title} (Tokenping-Ratgeber zu Morpho)`,
    siteOgTitle: channels => `Health-Factor-Alerts für Aave und Morpho über ${channels}`,
    siteOgFooter: "Tokenping · Aave und Morpho",
    postOgFooter: "Tokenping · Ratgeber zu Aave V3",
    morphoPostOgFooter: "Tokenping · Ratgeber zu Morpho",
  },
  vi: {
    defaultTitle: "Tokenping: cảnh báo hệ số sức khỏe trên Aave và Morpho",
    defaultDescription: `Cảnh báo khi hệ số sức khỏe Aave hoặc Morpho của bạn giảm xuống dưới ngưỡng bạn chọn, trên ${networks} mạng, kiểm tra mỗi ${minutes} phút.`,
    organizationDescription:
      "Tokenping gửi tin nhắn khi hệ số sức khỏe của một vị thế trên Aave V3, Aave V4, Morpho Blue hoặc Morpho Midnight giảm xuống dưới ngưỡng mà chủ vị thế đã đặt.",
    siteOgAlt: title => `${title} (Tokenping)`,
    rssTitle: "Blog Tokenping (tiếng Việt)",
    postOgAlt: title => `${title} (bài hướng dẫn Aave V3 của Tokenping)`,
    morphoPostOgAlt: title => `${title} (bài hướng dẫn Morpho của Tokenping)`,
    siteOgTitle: channels => `Cảnh báo hệ số sức khỏe trên Aave và Morpho qua ${channels}`,
    siteOgFooter: "Tokenping · Aave và Morpho",
    postOgFooter: "Tokenping · bài hướng dẫn Aave V3",
    morphoPostOgFooter: "Tokenping · bài hướng dẫn Morpho",
  },
};
