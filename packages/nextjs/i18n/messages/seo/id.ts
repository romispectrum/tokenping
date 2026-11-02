import { type SeoMessages, minutes, networks } from "./shared";

export const MESSAGES: SeoMessages = {
  defaultTitle: "Tokenping: peringatan faktor kesehatan Aave dan Morpho",
  defaultDescription: `Peringatan saat faktor kesehatan Aave atau Morpho Anda turun di bawah ambang batas pilihan Anda, di ${networks} jaringan, diperiksa setiap ${minutes} menit.`,
  organizationDescription:
    "Tokenping mengirim pesan saat faktor kesehatan Aave V3, Aave V4, Morpho Blue atau Morpho Midnight turun di bawah ambang batas yang ditetapkan pemiliknya.",
  siteOgAlt: title => `${title} (Tokenping)`,
  rssTitle: "Blog Tokenping (Bahasa Indonesia)",
  postOgAlt: title => `${title} (panduan Aave V3 Tokenping)`,
  morphoPostOgAlt: title => `${title} (panduan Morpho Tokenping)`,
  siteOgTitle: channels => `Peringatan faktor kesehatan Aave dan Morpho lewat ${channels}`,
  siteOgFooter: "Tokenping · Aave dan Morpho",
  postOgFooter: "Tokenping · panduan Aave V3",
  morphoPostOgFooter: "Tokenping · panduan Morpho",
};
